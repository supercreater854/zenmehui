"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Suspense, useState, useCallback, useMemo } from "react"
import type { GenerateResponse } from "@/lib/types"
import ReplyCard, { SCENE_LABELS } from "@/components/ReplyCard"
import Toast from "@/components/Toast"

// 数据解析逻辑
function parseData(raw: string | null): GenerateResponse | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(raw))
    if (
      parsed &&
      Array.isArray(parsed.replies) &&
      parsed.replies.length > 0 &&
      typeof parsed.scene === "string"
    ) {
      return parsed as GenerateResponse
    }
    return null
  } catch {
    return null
  }
}

function ResultContent() {
  const searchParams = useSearchParams()
  const data = searchParams.get("data")

  // URL 长度安全校验：防止超长数据导致解析崩溃
  if (data && data.length > 2000) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5">
        <p className="text-gray-400 text-sm mb-6">结果数据过大，请重新生成</p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600"
        >
          返回首页
        </Link>
      </div>
    )
  }

  const result = useMemo(() => parseData(data), [data])

  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState("")

  const handleCopy = useCallback((text: string) => {
    setToastMessage(`已复制: ${text.length > 15 ? text.slice(0, 15) + "..." : text}`)
    setToastVisible(true)
  }, [])

  const handleToastDone = useCallback(() => {
    setToastVisible(false)
  }, [])

  // 解析失败
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5">
        <p className="text-gray-400 text-sm mb-6">暂无生成结果，请重新尝试</p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600"
        >
          再生成一次
        </Link>
        <p className="mt-2 text-xs text-gray-300">换个说法，可能效果更好</p>
      </div>
    )
  }

  const sceneLabel = SCENE_LABELS[result.scene]

  return (
    <div className="flex flex-col min-h-screen px-5 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">AI 生成 5 种回复</h2>
            <div className="text-right">
              <Link
                href="/"
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                再生成一次
              </Link>
              <p className="mt-0.5 text-xs text-gray-300">换个说法，可能效果更好</p>
            </div>
        </div>
        {sceneLabel && (
          <span className="inline-block mt-2 px-2.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
            {sceneLabel}场景
          </span>
        )}
      </div>

      {/* 回复卡片列表 */}
      <div className="flex-1 flex flex-col gap-3">
        {result.replies.map((reply, index) => (
          <ReplyCard key={index} reply={reply} onCopy={handleCopy} />
        ))}
      </div>

      {/* Toast */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onDone={handleToastDone}
      />
    </div>
  )
}

// 用 Suspense 包裹以支持 useSearchParams
export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-400 text-sm">加载中...</p>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  )
}