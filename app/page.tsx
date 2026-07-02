"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { DEFAULT_INTIMACY, getIntimacyLabel } from "@/lib/intimacy"
import IntimacySlider from "@/components/IntimacySlider"
import { PRICING_TIER_LIST, type PricingTier } from "@/lib/credits"

function getUserId(): string {
  const stored = localStorage.getItem("zmh_user_id")
  if (stored) return stored
  const id = crypto.randomUUID()
  localStorage.setItem("zmh_user_id", id)
  return id
}

// 首页场景快捷标签
const SCENES = [
  "老板让我加班",
  "对象生气了",
  "不知道怎么拒绝",
  "朋友借钱",
  "被夸了怎么回",
  "想约人出来",
]

function HomePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const abortRef = useRef<AbortController | null>(null)
  const [userId, setUserId] = useState<string>("")
  const [payingTier, setPayingTier] = useState<string | null>(null)
  const [pricingOpen, setPricingOpen] = useState(false)
  const [upgradeSuccess, setUpgradeSuccess] = useState(false)
  const [intimacy, setIntimacy] = useState(DEFAULT_INTIMACY)

  useEffect(() => {
    setUserId(getUserId())
  }, [])

  useEffect(() => {
    if (searchParams.get("upgrade") === "success") {
      setUpgradeSuccess(true)
      const url = new URL(window.location.href)
      url.searchParams.delete("upgrade")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams])

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

  const handlePay = async (tier: PricingTier) => {
    setPayingTier(tier.tier)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, tier: tier.tier }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || "支付系统暂不可用")
      }
    } catch {
      setError("网络错误，请稍后重试")
    } finally {
      setPayingTier(null)
    }
  }

  const handleGenerate = async () => {
    const trimmed = message.trim()
    if (!trimmed) {
      setError("请输入聊天内容")
      return
    }
    if (trimmed.length > 2000) {
      setError("内容过长，请控制在2000字以内")
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
          setError(data.error || "积分不足，请充值")
        } else {
          setError(data.error || "生成失败，请重试")
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
        setError("AI响应较慢，请稍后重试")
      } else {
        setError("网络错误，请检查连接后重试")
      }
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-5 py-6">
      {/* Brand Header — gradient card */}
      <div className="mb-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl px-5 py-8 text-white text-center shadow-lg shadow-emerald-200/50">
        <h1 className="text-3xl font-extrabold tracking-tight">怎么回</h1>
        <p className="mt-1.5 text-sm text-white/70">AI 替你说出来</p>
      </div>

      {upgradeSuccess && (
        <div className="mb-5 px-4 py-3 bg-emerald-50 text-emerald-600 text-sm rounded-xl text-center">
          支付成功，积分已到账
          <button
            className="ml-2 underline"
            onClick={() => setUpgradeSuccess(false)}
          >
            知道了
          </button>
        </div>
      )}

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
          placeholder="把对方说的话粘贴到这里..."
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
            联系人
          </Link>
          <Link
            href="/me"
            className="flex-1 py-2.5 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 hover:border-gray-200 transition-colors"
          >
            我的
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
          {loading ? "AI 正在想怎么回..." : "帮 我 回"}
        </button>

        <button
          className="mt-3 w-full py-3 rounded-2xl text-sm font-medium text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
          onClick={() => setPricingOpen(true)}
        >
          充值积分
        </button>
      </div>

      <p className="mt-8 text-center text-xs text-gray-300">
        仅供参考，建议根据实际情况调整
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
        觉得好用？分享给朋友
      </button>

      {/* ====== 积分充值弹窗 ====== */}
      {pricingOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
          onClick={() => setPricingOpen(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 shadow-xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">充值积分</h2>
              <button
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                onClick={() => setPricingOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>

            {/* 积分卡片 2x2 */}
            <div className="grid grid-cols-2 gap-3">
              {PRICING_TIER_LIST.map((tier) => (
                <button
                  key={tier.tier}
                  className={`
                    relative text-left p-4 rounded-xl border-2 transition-all
                    ${tier.highlight
                      ? "border-emerald-400 bg-emerald-50/50 shadow-sm"
                      : "border-gray-100 hover:border-emerald-200 bg-gray-50/50"
                    }
                    ${payingTier === tier.tier ? "opacity-60 pointer-events-none" : ""}
                  `}
                  onClick={() => handlePay(tier)}
                  disabled={payingTier !== null}
                >
                  {tier.highlight && (
                    <span className="absolute -top-2 left-2 px-1.5 py-0.5 text-[10px] font-bold text-white bg-emerald-500 rounded-full">
                      推荐
                    </span>
                  )}
                  <div className="text-sm font-bold text-gray-900">
                    {tier.name}
                  </div>
                  <div className="mt-1 text-lg font-extrabold text-emerald-600">
                    ¥{tier.price}
                  </div>
                  <div className="mt-0.5 text-[11px] text-gray-400">
                    {tier.desc}
                  </div>
                  <div className="mt-2 w-full py-1.5 text-center text-xs font-medium text-emerald-600 bg-white rounded-lg border border-emerald-200">
                    {payingTier === tier.tier ? "跳转中..." : "去支付"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-400 text-sm">加载中...</p>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  )
}