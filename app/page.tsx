"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { DEFAULT_INTIMACY, getIntimacyLabel } from "@/lib/intimacy"
import IntimacySlider from "@/components/IntimacySlider"
import { HOME } from "@/lib/i18n"
import { t } from "@/lib/t"

function getUserId(): string {
  const stored = localStorage.getItem("zmh_user_id")
  if (stored) return stored
  const id = crypto.randomUUID()
  localStorage.setItem("zmh_user_id", id)
  return id
}

// 首页场景快捷标签
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

  useEffect(() => {
    setUserId(getUserId())
  }, [])

  // 从 URL 参数预填消息（「继续聊」跳转回来）
  useEffect(() => {
    const msg = searchParams.get("msg")
    if (msg) {
      setMessage(msg)
      const url = new URL(window.location.href)
      url.searchParams.delete("msg")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams])

  const handleGenerate = async () => {
    const trimmed = message.trim()
    if (!trimmed) {
      setError(t(HOME.enterContent))
      return
    }
    if (trimmed.length > 2000) {
      setError(t(HOME.tooLong))
      return
    }

    setError("")
    setLoading(true)

    const controller = new AbortController()
    abortRef.current = controller
    const timeoutId = setTimeout(() => controller.abort(), 35000)

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, user_id: userId, intimacy }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await res.json()

      if (!res.ok) {
        if (data.type === "limit") {
          setError(data.error || t(HOME.noCredits))
        } else {
          setError(data.error || t(HOME.generateFailed))
        }
        return
      }

      const payload = { message: trimmed, replies: data.replies, intimacy }
      const encoded = encodeURIComponent(JSON.stringify(payload))
      const label = encodeURIComponent(getIntimacyLabel(intimacy))
      router.push(`/result?data=${encoded}&intimacy=${intimacy}&label=${label}`)
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

  return (
    <div className="flex flex-col min-h-screen px-5 py-6">
      {/* Brand Header — 差异化定位：多场景关系感知 */}
      <div className="mb-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl px-5 py-8 text-white text-center shadow-lg shadow-emerald-200/50">
        <h1 className="text-3xl font-extrabold tracking-tight">{t(HOME.brandName)}</h1>
        <p className="mt-2 text-lg font-semibold text-white/95">{t(HOME.tagline)}</p>
        <p className="mt-2 text-sm text-white/70 leading-relaxed max-w-xs mx-auto">{t(HOME.heroDescription)}</p>

        {/* 三种回复风格徽章 */}
        <div className="mt-4 flex justify-center gap-2">
          <span className="px-3 py-1.5 text-xs font-medium bg-white/20 rounded-full backdrop-blur-sm">{t(HOME.styleWarm)}</span>
          <span className="px-3 py-1.5 text-xs font-medium bg-white/20 rounded-full backdrop-blur-sm">{t(HOME.styleFunny)}</span>
          <span className="px-3 py-1.5 text-xs font-medium bg-white/20 rounded-full backdrop-blur-sm">{t(HOME.styleDirect)}</span>
        </div>
      </div>

      {/* 输入区域 */}
      <div className="flex-1 flex flex-col">

        {/* 场景快捷标签 */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
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

        <textarea
          className="mt-3 w-full flex-1 min-h-[200px] p-5 text-base text-gray-800 bg-white rounded-2xl resize-none placeholder:text-gray-300 border border-gray-100 shadow-md focus:shadow-lg focus:border-emerald-200 outline-none transition-shadow"
          placeholder={t(HOME.placeholder)}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            if (error) setError("")
          }}
          disabled={loading}
        />

        {/* ====== 亲密度滑块 ====== */}
        <div className="mt-4 px-1">
          <IntimacySlider value={intimacy} onChange={setIntimacy} />
        </div>

        {/* ====== 入口按钮 ====== */}
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
          <div className="mt-3 px-4 py-2.5 bg-red-50 text-red-500 text-sm rounded-xl whitespace-pre-line">
            {error}
          </div>
        )}

        <button
          className={`
            mt-5 w-full py-3.5 rounded-2xl text-base font-semibold
            transition-all
            ${loading || !message.trim()
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200/50 hover:shadow-xl hover:shadow-emerald-200/50 active:scale-[0.98]"
            }
          `}
          onClick={handleGenerate}
          disabled={loading || !message.trim()}
        >
          {loading ? t(HOME.generating) : t(HOME.generateBtn)}
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-gray-300">
        {t(HOME.disclaimer)}
      </p>

      {/* 分享给朋友入口 */}
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

      {/* ====== 付费计划即将推出 ====== */}
      <p className="mt-6 text-center text-xs text-gray-300">
        Premium plans coming soon — currently free during beta
      </p>

      {/* ====== 法律链接 ====== */}
      <div className="mt-4 flex justify-center gap-4 text-xs text-gray-300">
        <Link href="/privacy" className="hover:text-gray-500 underline">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:text-gray-500 underline">
          Terms of Service
        </Link>
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