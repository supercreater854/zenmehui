"use client"

import { useState, useRef, useCallback } from "react"
import { drawShareImage } from "@/lib/share-image"
import { getIntimacyTier } from "@/lib/intimacy"
import { COMPONENTS } from "@/lib/i18n"
import { t } from "@/lib/t"
import { trackClient } from "@/lib/track-client"

/* ====== SVG 图标组件 ====== */
const IconCopy = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const IconRefresh = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
)

const IconShare = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
)

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// ============================================================

interface ReplyCardProps {
  text: string
  message?: string
  intimacy?: number
  onCopy: (text: string) => void
  onRegenerate?: (text: string) => void
  onContinue?: () => void
  regening?: boolean
  chosen?: boolean
}

const SWIPE_THRESHOLD = 60

export default function ReplyCard({
  text,
  message,
  intimacy,
  onCopy,
  onRegenerate,
  onContinue,
  regening,
  chosen,
}: ReplyCardProps) {
  const [copied, setCopied] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareDataUrl, setShareDataUrl] = useState("")

  // Swipe state
  const [swipeOffset, setSwipeOffset] = useState(0)
  const touchStartX = useRef(0)
  const touchCurrentX = useRef(0)
  const isSwiping = useRef(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const tier = intimacy != null ? getIntimacyTier(intimacy) : null

  // ====== 复制 ======
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = text
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    }
    setCopied(true)
    onCopy(text)
    trackClient('copy', { copied_text: text })
    setTimeout(() => setCopied(false), 2000)
  }

  // ====== 分享 ======
  const handleShare = () => {
    const dataUrl = drawShareImage(message || "", text)
    setShareDataUrl(dataUrl)
    setShareOpen(true)
    trackClient('share', {})
  }

  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = shareDataUrl
    a.download = "replycraft.png"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // ====== 滑动手势 ======
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchCurrentX.current = e.touches[0].clientX
    isSwiping.current = true
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isSwiping.current) return
    touchCurrentX.current = e.touches[0].clientX
    const dx = touchCurrentX.current - touchStartX.current
    // 只响应左滑
    if (dx < 0) {
      setSwipeOffset(Math.max(dx, -120))
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    isSwiping.current = false
    const dx = touchCurrentX.current - touchStartX.current
    setSwipeOffset(0)

    if (dx < -SWIPE_THRESHOLD && onRegenerate && !regening) {
      onRegenerate(text)
    }
  }, [onRegenerate, regening, text])

  return (
    <>
      {/* 滑动容器 */}
      <div className="relative overflow-hidden rounded-2xl animate-card-in">
        {/* 滑动提示背景 */}
        {onRegenerate && (
          <div
            className="absolute inset-y-0 right-0 flex items-center justify-end pr-5 bg-gradient-to-l from-emerald-50 to-transparent rounded-2xl pointer-events-none transition-opacity"
            style={{ opacity: swipeOffset < -20 ? Math.min(Math.abs(swipeOffset) / 60, 1) : 0 }}
          >
            <span className="text-xs text-emerald-500 font-medium flex items-center gap-1">
              <IconRefresh />
              {t(COMPONENTS.regenerate)}
            </span>
          </div>
        )}

        {/* 卡片主体 */}
        <div
          ref={cardRef}
          className={`relative bg-white border-l-4 p-4 flex items-start gap-3 transition-all duration-200 active:scale-[0.98] select-none
            ${chosen
              ? "border-emerald-300 bg-emerald-50/50 shadow-md"
              : tier
                ? `${tier.color} border-r-gray-100 border-t-gray-100 border-b-gray-100 shadow-sm`
                : "border-gray-100 shadow-sm"
            }
          `}
          style={{
            transform: `translateX(${swipeOffset}px)`,
            transition: swipeOffset === 0 ? "transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1.2)" : "none",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* 回复正文 */}
          <div className="flex-1 min-w-0">
            <p className="text-[15px] leading-relaxed text-gray-800 select-text">
              {text}
            </p>

            {/* 复制后引导「继续聊」 */}
            {copied && onContinue && (
              <button
                className="mt-2 text-xs text-emerald-500 hover:text-emerald-600 font-medium transition-colors animate-fade-in"
                onClick={onContinue}
              >
                {t(COMPONENTS.continueChat)}
              </button>
            )}
          </div>

          {/* 操作按钮 —— 全部图标化 */}
          <div className="shrink-0 flex flex-col gap-2 items-center">
            {/* 复制 */}
            <button
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90
                ${copied
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                }
              `}
              onClick={handleCopy}
              title={t(COMPONENTS.copy)}
            >
              {copied ? <IconCheck /> : <IconCopy />}
            </button>

            {/* 换说法（左滑也能触发） */}
            {onRegenerate && (
              <button
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90
                  ${regening ? "opacity-30" : ""}
                  bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50
                `}
                onClick={() => onRegenerate(text)}
                disabled={regening}
                title={t(COMPONENTS.swipeHint)}
              >
                <div className={regening ? "animate-spin" : ""}>
                  <IconRefresh />
                </div>
              </button>
            )}

            {/* 分享 */}
            {message && (
              <button
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90
                  bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                onClick={handleShare}
                title={t(COMPONENTS.generateShareImage)}
              >
                <IconShare />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 分享预览弹窗 */}
      {shareOpen && shareDataUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShareOpen(false)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-xs w-full shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3">
              <img
                src={shareDataUrl}
                alt={t(COMPONENTS.sharePreview)}
                className="w-full rounded-lg"
              />
            </div>
            <div className="flex border-t border-gray-100">
              <button
                className="flex-1 py-3 text-sm text-gray-500 hover:bg-gray-50 transition-colors active:bg-gray-100"
                onClick={() => setShareOpen(false)}
              >
                {t(COMPONENTS.close)}
              </button>
              <button
                className="flex-1 py-3 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors active:bg-emerald-100 border-l border-gray-100"
                onClick={handleDownload}
              >
                {t(COMPONENTS.saveImage)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}