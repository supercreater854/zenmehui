"use client"

import type { Reply } from "@/lib/types"
import { useState } from "react"

// type 标签的颜色映射
const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  standard: { label: "标准", color: "bg-blue-100 text-blue-700" },
  polite: { label: "礼貌", color: "bg-green-100 text-green-700" },
  short: { label: "简短", color: "bg-gray-100 text-gray-600" },
  funny: { label: "幽默", color: "bg-orange-100 text-orange-700" },
  strong: { label: "强硬", color: "bg-red-100 text-red-600" },
}

// 场景标签映射
const SCENE_LABELS: Record<string, string> = {
  work: "工作",
  love: "感情",
  social: "社交",
  unknown: "",
}

interface ReplyCardProps {
  reply: Reply
  onCopy: (text: string) => void
}

export default function ReplyCard({ reply, onCopy }: ReplyCardProps) {
  const [copied, setCopied] = useState(false)
  const config = TYPE_CONFIG[reply.type] || TYPE_CONFIG.standard

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reply.text)
      setCopied(true)
      onCopy(reply.text)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback for older browsers
      const textarea = document.createElement("textarea")
      textarea.value = reply.text
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      onCopy(reply.text)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col">
      {/* 左上 type 标签 */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
          {config.label}
        </span>
      </div>

      {/* 中间 text 内容 */}
      <p className="flex-1 text-sm leading-relaxed text-gray-700 mb-4">
        {reply.text}
      </p>

      {/* 右下 copy 按钮 */}
      <div className="flex justify-end">
        <button
          className={`
            px-3 py-1.5 rounded-lg text-xs font-medium
            transition-colors
            ${copied
              ? "bg-green-50 text-green-600"
              : "bg-gray-50 text-gray-500 hover:bg-gray-100 active:bg-gray-200"
            }
          `}
          onClick={handleCopy}
        >
          {copied ? "已复制" : "复制"}
        </button>
      </div>
    </div>
  )
}

// 导出配置供外部使用
export { TYPE_CONFIG, SCENE_LABELS }