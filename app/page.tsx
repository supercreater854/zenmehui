"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

// 获取或生成匿名用户 ID（localStorage 持久化）
function getUserId(): string {
  const stored = localStorage.getItem("zmh_user_id")
  if (stored) return stored
  const id = crypto.randomUUID()
  localStorage.setItem("zmh_user_id", id)
  return id
}

function HomePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const abortRef = useRef<AbortController | null>(null)
  const [userId, setUserId] = useState<string>("")
  const [upgrading, setUpgrading] = useState(false)
  const [upgradeSuccess, setUpgradeSuccess] = useState(false)

  // 客户端初始化用户 ID
  useEffect(() => {
    setUserId(getUserId())
  }, [])

  // 检测支付成功回调
  useEffect(() => {
    if (searchParams.get("upgrade") === "success") {
      setUpgradeSuccess(true)
      // 清除 URL 参数（保留视觉效果）
      const url = new URL(window.location.href)
      url.searchParams.delete("upgrade")
      window.history.replaceState({}, "", url.toString())
    }
  }, [searchParams])

  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
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
      setUpgrading(false)
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

    // 前端 35s 兜底超时，只影响 UI，不干涉后端
    const controller = new AbortController()
    abortRef.current = controller
    const timeoutId = setTimeout(() => controller.abort(), 35000)

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, user_id: userId }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const data = await res.json()

      if (!res.ok) {
        if (data.type === "limit") {
          setError("今日免费次数已用完\n升级会员可无限使用")
        } else {
          setError(data.error || "生成失败，请重试")
        }
        return
      }

      // 跳转结果页，data 编码到 URL
      const encoded = encodeURIComponent(JSON.stringify(data))
      router.push(`/result?data=${encoded}`)
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
    <div className="flex flex-col min-h-screen px-5 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">怎么回</h1>
        <p className="mt-1 text-sm text-gray-400">AI 聊天回复生成工具</p>
      </div>

      {/* 支付成功提示 */}
      {upgradeSuccess && (
        <div className="mb-5 px-4 py-3 bg-green-50 text-green-600 text-sm rounded-xl text-center">
          会员开通成功，已解锁无限使用
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
        <textarea
          className="w-full flex-1 min-h-[200px] p-4 text-base text-gray-900 bg-gray-50 rounded-xl resize-none placeholder:text-gray-400"
          placeholder="粘贴聊天内容..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value)
            if (error) setError("")
          }}
          disabled={loading}
        />

        {/* 错误提示 */}
        {error && (
          <div className="mt-3 px-4 py-2 bg-red-50 text-red-500 text-sm rounded-lg whitespace-pre-line">
            {error}
          </div>
        )}

        {/* 生成按钮 */}
        <button
          className={`
            mt-5 w-full py-3.5 rounded-xl text-base font-medium
            transition-colors
            ${
              loading || !message.trim()
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-green-500 text-white hover:bg-green-600 active:bg-green-700"
            }
          `}
          onClick={handleGenerate}
          disabled={loading || !message.trim()}
        >
          {loading ? "正在生成 5 种高质量回复..." : "生成回复"}
        </button>

        {/* 升级会员入口 */}
        <button
          className="mt-3 w-full py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-green-500 hover:bg-green-50 transition-colors"
          onClick={handleUpgrade}
          disabled={upgrading}
        >
          {upgrading ? "跳转中..." : "解锁无限使用 · ¥9.9 永久会员"}
        </button>
      </div>

      {/* Footer */}
      <p className="mt-8 text-center text-xs text-gray-300">
        不会回消息？打开 → 一键生成可发送回复
      </p>
    </div>
  )
}

// Suspense 包裹以支持 useSearchParams
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