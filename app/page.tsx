"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { DEFAULT_INTIMACY, getIntimacyLabel } from "@/lib/intimacy"
import IntimacySlider from "@/components/IntimacySlider"
import { useReplyMode } from "@/lib/reply-mode"
import { HOME } from "@/lib/i18n"
import { t } from "@/lib/t"

function getUserId(): string {
  const stored = localStorage.getItem("zmh_user_id")
  if (stored) return stored
  const id = crypto.randomUUID()
  localStorage.setItem("zmh_user_id", id)
  return id
}

const SCENES = t(HOME.scenes)

function HomePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const abortRef = useRef<AbortController | null>(null)
  const [userId, setUserId] = useState<string>("")
  const [intimacy, setIntimacy] = useState(DEFAULT_INTIMACY)
  const { mode, setMode } = useReplyMode()

  // 切换动画状态
  const [transitioning, setTransitioning] = useState(false)
  const animRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    setUserId(getUserId())
  }, [])

  useEffect(() => {
    const msg = searchParams.get("msg")
    if (msg) {
      setMessage(msg)
      const url = new URL(window.location.href)
      url.searchParams.delete("msg")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams])

  // ====== 模式切换动画 ======
  const handleSwitchMode = (next: "quick" | "scenario") => {
    if (next === mode || transitioning) return
    setTransitioning(true)
    clearTimeout(animRef.current)
    animRef.current = setTimeout(() => {
      setMode(next)
      setTransitioning(false)
    }, 250)
  }

  const [streamingText, setStreamingText] = useState("")

  // ====== 提交处理 ======
  const handleGenerate = async () => {
    const trimmed = message.trim()
    if (!trimmed) {
      setError(mode === "scenario" ? t(HOME.scenarioRequired) : t(HOME.enterContent))
      return
    }
    if (trimmed.length > 2000) {
      setError(t(HOME.tooLong))
      return
    }

    setError("")
    setLoading(true)
    setStreamingText("")

    const controller = new AbortController()
    abortRef.current = controller
    const timeoutId = setTimeout(() => controller.abort(), mode === "scenario" ? 60000 : 45000)

    try {
      // 快速回复：流式
      if (mode === "quick") {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            user_id: userId,
            intimacy,
            mode: "quick",
            stream: true,
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!res.ok) {
          const data = await res.json()
          if (data.type === "limit") setError(data.error || t(HOME.noCredits))
          else setError(data.error || t(HOME.generateFailed))
          return
        }

        // 读 NDJSON 流
        const reader = res.body?.getReader()
        if (!reader) { setError(t(HOME.networkError)); return }

        const decoder = new TextDecoder()
        let buffer = ""
        let result: { replies?: string[] } | null = null

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (!line.trim()) continue
            try {
              const event = JSON.parse(line)
              if (event.type === 'chunk') {
                setStreamingText(prev => prev + event.text)
              } else if (event.type === 'done') {
                result = event.result
              } else if (event.type === 'error') {
                setError(event.error || t(HOME.generateFailed))
                return
              }
            } catch { /* skip malformed NDJSON */ }
          }
        }

        if (result?.replies && result.replies.length > 0) {
          const payload = { message: trimmed, replies: result.replies, intimacy }
          const encoded = encodeURIComponent(JSON.stringify(payload))
          const label = encodeURIComponent(getIntimacyLabel(intimacy))
          router.push(`/result?data=${encoded}&intimacy=${intimacy}&label=${label}`)
          return
        }
        setError(t(HOME.generateFailed))
        return
      }

      // 参谋模式：非流式
      if (mode === "scenario") {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            user_id: userId,
            intimacy,
            mode: "scenario",
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)
        const data = await res.json()

        if (!res.ok) {
          if (data.type === "limit") setError(data.error || t(HOME.noCredits))
          else setError(data.error || t(HOME.generateFailed))
          return
        }

        if (data.scenario_result) {
          const payload = {
            scenario: trimmed,
            result: data.scenario_result,
            intimacy,
          }
          const encoded = encodeURIComponent(JSON.stringify(payload))
          router.push(`/result?mode=scenario&data=${encoded}&intimacy=${intimacy}`)
          return
        }
        setError(t(HOME.generateFailed))
        return
      }

      setError(t(HOME.generateFailed))
    } catch (err) {
      clearTimeout(timeoutId)
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(t(HOME.aiSlow))
      } else {
        setError(t(HOME.networkError))
      }
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  // ====== 主题样式 ======
  const isQuick = mode === "quick"
  const headerGradient = isQuick
    ? "from-emerald-500 to-teal-600"
    : "from-indigo-600 to-purple-700"
  const headerShadow = isQuick
    ? "shadow-emerald-200/50"
    : "shadow-indigo-300/40"
  const btnGradient = isQuick
    ? "from-emerald-500 to-teal-500"
    : "from-indigo-600 to-purple-600"
  const btnShadow = isQuick
    ? "shadow-emerald-200/50"
    : "shadow-indigo-200/50"

  return (
    <div className="flex flex-col min-h-screen px-5 py-6">
      {/* ====== Brand Header — 两种模式两种氛围 ====== */}
      <div
        className={`mb-6 rounded-2xl px-5 py-8 text-white text-center shadow-lg transition-all duration-500 ${transitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
        style={{ background: isQuick
          ? "linear-gradient(135deg, #10b981, #0d9488)"
          : "linear-gradient(135deg, #4f46e5, #7c3aed)"
        }}
      >
        <h1 className="text-3xl font-extrabold tracking-tight transition-all duration-300">
          {t(HOME.brandName)}
        </h1>
        <p className="mt-2 text-lg font-semibold text-white/95 transition-all duration-300">
          {isQuick ? t(HOME.tagline) : "把困局说清楚，我帮你理思路"}
        </p>
        <p className="mt-2 text-sm text-white/70 leading-relaxed max-w-xs mx-auto transition-all duration-300">
          {isQuick
            ? t(HOME.heroDescription)
            : "不只是回消息——分析关系、权衡利弊、给你多个策略方向。像有个懂人情世故的朋友在帮你参谋。"}
        </p>

        {/* 风格徽章 — 快速模式专属 */}
        {isQuick && (
          <div className="mt-4 flex justify-center gap-2 animate-fade-in">
            <span className="px-3 py-1.5 text-xs font-medium bg-white/20 rounded-full backdrop-blur-sm">
              {t(HOME.styleWarm)}
            </span>
            <span className="px-3 py-1.5 text-xs font-medium bg-white/20 rounded-full backdrop-blur-sm">
              {t(HOME.styleFunny)}
            </span>
            <span className="px-3 py-1.5 text-xs font-medium bg-white/20 rounded-full backdrop-blur-sm">
              {t(HOME.styleDirect)}
            </span>
          </div>
        )}
      </div>

      {/* ====== 模式切换 Toggle ====== */}
      <div className="mb-4 flex items-center justify-center gap-3 select-none">
        <span
          className={`text-xs font-medium transition-colors duration-300 ${isQuick ? "text-emerald-600" : "text-gray-400 cursor-pointer hover:text-gray-600"}`}
          onClick={() => handleSwitchMode("quick")}
        >
          {t(HOME.modeQuick)}
        </span>
        <button
          className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
            isQuick ? "bg-emerald-500" : "bg-indigo-600"
          }`}
          onClick={() => handleSwitchMode(isQuick ? "scenario" : "quick")}
          aria-label="切换模式"
        >
          <span
            className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-300 ${
              isQuick ? "left-0.5" : "left-[calc(100%-26px)]"
            }`}
          />
        </button>
        <span
          className={`text-xs font-medium transition-colors duration-300 ${!isQuick ? "text-indigo-600" : "text-gray-400 cursor-pointer hover:text-gray-600"}`}
          onClick={() => handleSwitchMode("scenario")}
        >
          {t(HOME.modeScenario)}
        </span>
      </div>

      {/* ====== 输入区域 ====== */}
      <div
        className={`flex-1 flex flex-col transition-all duration-500 ${transitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}
      >
        {/* 快速模式：场景快捷标签 */}
        {isQuick && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none animate-fade-in">
            {SCENES.map((scene) => (
              <button
                key={scene}
                className="shrink-0 px-3.5 py-2 text-xs text-gray-500 bg-gray-100 rounded-full hover:bg-emerald-50 hover:text-emerald-600 active:bg-emerald-100 transition-colors"
                onClick={() => {
                  setMessage(scene)
                  if (error) setError("")
                }}
              >
                {scene}
              </button>
            ))}
          </div>
        )}

        {/* 参谋模式：场景提示 */}
        {!isQuick && (
          <p className="mb-2 text-xs text-gray-400 text-center animate-fade-in">
            {t(HOME.scenarioHint)}
          </p>
        )}

        <textarea
          className={`w-full p-5 text-base rounded-2xl resize-none outline-none transition-all duration-300 ${
            isQuick
              ? "flex-1 min-h-[200px] text-gray-800 bg-white placeholder:text-gray-300 border border-gray-100 shadow-md focus:shadow-lg focus:border-emerald-200"
              : "h-56 text-gray-800 bg-white placeholder:text-gray-300 border border-gray-100 shadow-md focus:shadow-lg focus:border-indigo-300"
          }`}
          placeholder={isQuick ? t(HOME.placeholder) : t(HOME.scenarioPlaceholder)}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            if (error) setError("")
          }}
          disabled={loading}
        />

        {/* 亲密度滑块 */}
        <div className="mt-4 px-1">
          <IntimacySlider value={intimacy} onChange={setIntimacy} />
        </div>

        {/* 底部导航 */}
        <div className="mt-3 flex gap-2">
          <Link
            href="/contacts"
            className="flex-1 py-2.5 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-colors"
          >
            {t(HOME.contactsTab)}
          </Link>
          <Link
            href="/me"
            className="flex-1 py-2.5 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-colors"
          >
            {t(HOME.meTab)}
          </Link>
        </div>

        {error && (
          <div className="mt-3 px-4 py-2.5 bg-red-50 text-red-500 text-sm rounded-xl whitespace-pre-line animate-fade-in">
            {error}
          </div>
        )}

        <button
          className={`mt-5 w-full py-3.5 rounded-2xl text-base font-semibold transition-all duration-300 ${
            loading || !message.trim()
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : `bg-gradient-to-r ${btnGradient} text-white shadow-lg ${btnShadow} hover:shadow-xl active:scale-[0.98]`
          }`}
          onClick={handleGenerate}
          disabled={loading || !message.trim()}
        >
          {loading ? t(HOME.generating) : isQuick ? t(HOME.generateBtn) : t(HOME.scenarioGenerateBtn)}
        </button>

        {/* 流式响应实时预览 */}
        {loading && streamingText && (
          <div className="mt-4 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 max-h-32 overflow-y-auto">
            <p className="text-xs text-gray-400 font-mono whitespace-pre-wrap break-words leading-relaxed">
              {streamingText}
            </p>
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-xs text-gray-300">
        {t(HOME.disclaimer)}
      </p>

      {/* 分享入口 */}
      <button
        className="mt-3 w-full py-3 text-center text-sm text-gray-400 hover:text-emerald-500 transition-colors"
        onClick={() => {
          if (typeof navigator !== "undefined" && navigator.share) {
            navigator.share({ url: window.location.origin }).catch(() => {})
          } else {
            navigator.clipboard.writeText(window.location.origin).catch(() => {})
          }
        }}
      >
        {t(HOME.shareCta)}
      </button>

      <p className="mt-6 text-center text-xs text-gray-300">
        Premium plans coming soon — currently free during beta
      </p>

      <div className="mt-4 flex justify-center gap-4 text-xs text-gray-300">
        <Link href="/privacy" className="hover:text-gray-500 underline">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-gray-500 underline">Terms of Service</Link>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-400 text-sm">{t(HOME.loadMoreContacts)}</p>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  )
}