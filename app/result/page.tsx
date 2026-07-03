"use client"

import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Suspense, useState, useCallback, useEffect, useRef } from "react"
import ReplyCard from "@/components/ReplyCard"
import Toast from "@/components/Toast"
import { getIntimacyLabel, saveContact } from "@/lib/intimacy"
import { RESULT } from "@/lib/i18n"
import { t } from "@/lib/t"
import { trackClient } from "@/lib/track-client"

interface ResultData {
  message: string
  replies: string[]
  intimacy?: number
}

function parseData(raw: string | null): ResultData | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(raw))
    if (
      Array.isArray(parsed.replies) &&
      parsed.replies.length > 0 &&
      typeof parsed.message === 'string'
    ) {
      return {
        message: parsed.message,
        replies: parsed.replies,
        intimacy: parsed.intimacy,
      }
    }
    return null
  } catch {
    return null
  }
}

function getUserId(): string {
  if (typeof window === 'undefined') return ''
  const stored = localStorage.getItem("zmh_user_id")
  if (stored) return stored
  const id = crypto.randomUUID()
  localStorage.setItem("zmh_user_id", id)
  return id
}

function ResultContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const data = searchParams.get("data")
  const intimacyRaw = searchParams.get("intimacy")
  const labelRaw = searchParams.get("label")

  const [result, setResult] = useState<ResultData | null>(null)
  const [intimacy, setIntimacy] = useState<number>(50)
  const [label, setLabel] = useState<string>("")
  const [replies, setReplies] = useState<string[]>([])
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [reloading, setReloading] = useState(false)
  const [regeningIdx, setRegeningIdx] = useState<number | null>(null)
  const [showSaveContact, setShowSaveContact] = useState(false)
  const [contactName, setContactName] = useState("")
  const [editingIntimacy, setEditingIntimacy] = useState(false)
  const [editValue, setEditValue] = useState("")
  const [styleMode, setStyleMode] = useState<"normal" | "sharp">("normal")
  const longPressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (data && data.length > 3000) return
    const parsed = parseData(data)
    if (parsed) {
      setResult(parsed)
      setReplies(parsed.replies)
      setIntimacy(parsed.intimacy || 50)
      setLabel(labelRaw ? decodeURIComponent(labelRaw) : getIntimacyLabel(parsed.intimacy || 50))
    }
  }, [data, labelRaw])

  // ====== 亲密度调整（支持长按连续加减） ======
  const doAdjust = useCallback(async (newValue: number) => {
    if (!result || reloading) return
    setIntimacy(newValue)
    setLabel(getIntimacyLabel(newValue))
    setReloading(true)
    trackClient('intimacy_change', { intimacy: newValue })

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: result.message,
          user_id: getUserId(),
          intimacy: newValue,
          style: styleMode === "sharp" ? "sharp" : undefined,
        }),
      })

      const json = await res.json()
      if (res.ok && Array.isArray(json.replies)) {
        setReplies(json.replies)
      }
    } catch {
      setToastMessage(t(RESULT.networkError))
      setToastVisible(true)
    } finally {
      setReloading(false)
    }
  }, [result, reloading, styleMode])

  const handleAdjustIntimacy = useCallback((delta: number) => {
    const newIntimacy = Math.max(0, Math.min(100, intimacy + delta))
    if (newIntimacy === intimacy) return
    doAdjust(newIntimacy)
  }, [intimacy, doAdjust])

  // 长按状态机
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const isLongPressing = useRef(false)

  const startLongPress = useCallback((delta: number) => {
    isLongPressing.current = true
    longPressRef.current = setInterval(() => {
      setIntimacy(prev => {
        const next = Math.max(0, Math.min(100, prev + delta))
        if (next === prev) return prev
        doAdjust(next)
        return next
      })
    }, 100)
  }, [doAdjust])

  const stopLongPress = useCallback(() => {
    isLongPressing.current = false
    if (longPressRef.current) {
      clearInterval(longPressRef.current)
      longPressRef.current = null
    }
  }, [])

  // 按钮 press 事件处理
  const handlePressDown = useCallback((delta: number) => {
    longPressTimer.current = setTimeout(() => startLongPress(delta), 200)
  }, [startLongPress])

  const handlePressUp = useCallback((delta: number) => {
    clearTimeout(longPressTimer.current)
    if (isLongPressing.current) {
      stopLongPress()
    } else {
      handleAdjustIntimacy(delta)
    }
  }, [handleAdjustIntimacy, stopLongPress])

  const handlePressLeave = useCallback(() => {
    clearTimeout(longPressTimer.current)
    if (isLongPressing.current) {
      stopLongPress()
    }
  }, [stopLongPress])

  // 直接输入数字
  const handleIntimacySubmit = useCallback(() => {
    const num = parseInt(editValue, 10)
    if (!isNaN(num) && num >= 0 && num <= 100 && num !== intimacy) {
      doAdjust(num)
    }
    setEditingIntimacy(false)
  }, [editValue, intimacy, doAdjust])

  // ====== 再来一组 / 切换风格 ======
  const handleRegenerateAll = async () => {
    if (!result || reloading) return
    setReloading(true)

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: result.message,
          user_id: getUserId(),
          intimacy,
          style: styleMode === "sharp" ? "sharp" : undefined,
        }),
      })

      const json = await res.json()
      if (res.ok && Array.isArray(json.replies)) {
        setReplies(json.replies)
      }
    } catch {
      setToastMessage(t(RESULT.networkError))
      setToastVisible(true)
    } finally {
      setReloading(false)
    }
  }

  // ====== 切换画风（normal ↔ sharp） ======
  const handleSwitchStyle = async () => {
    if (!result || reloading) return
    const newMode = styleMode === "normal" ? "sharp" : "normal"
    setStyleMode(newMode)
    setReloading(true)
    trackClient('style_switch', { from_style: styleMode, to_style: newMode })

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: result.message,
          user_id: getUserId(),
          intimacy,
          style: newMode === "sharp" ? "sharp" : undefined,
        }),
      })

      const json = await res.json()
      if (res.ok && Array.isArray(json.replies)) {
        setReplies(json.replies)
      }
    } catch {
      setStyleMode(styleMode) // rollback
      setToastMessage(t(RESULT.networkError))
      setToastVisible(true)
    } finally {
      setReloading(false)
    }
  }

  // ====== 单体换个说法 ======
  const handleRegenerateOne = async (previousText: string) => {
    if (!result) return
    const idx = replies.indexOf(previousText)
    if (idx >= 0) setRegeningIdx(idx)

    try {
      const res = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: result.message,
          intimacy,
          previous_reply: previousText,
          reply_index: idx,
          style: styleMode,
        }),
      })

      const json = await res.json()
      if (json.success && json.reply) {
        setReplies(prev => {
          const next = [...prev]
          if (idx >= 0) next[idx] = json.reply
          return next
        })
      }
    } catch {
      setToastMessage(t(RESULT.regenerateFailed))
      setToastVisible(true)
    } finally {
      setRegeningIdx(null)
    }
  }

  // ====== 保存联系人 ======
  const handleSaveContact = () => {
    const name = contactName.trim()
    if (!name) return
    saveContact(name, intimacy)
    setShowSaveContact(false)
    setContactName("")
    setToastMessage(t(RESULT.contactSaved) + name)
    setToastVisible(true)
  }

  const handleCopy = useCallback((text: string) => {
    setToastMessage(t(RESULT.copied) + (text.length > 15 ? text.slice(0, 15) + "..." : text))
    setToastVisible(true)
  }, [])

  const handleContinue = useCallback(() => {
    if (!result) return
    router.push("/?msg=" + encodeURIComponent(result.message))
  }, [result, router])

  const handleToastDone = useCallback(() => {
    setToastVisible(false)
  }, [])

  if (data && data.length > 3000) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5">
        <p className="text-gray-400 text-sm mb-6">{t(RESULT.dataTooLarge)}</p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600"
        >
          {t(RESULT.backHome)}
        </Link>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5">
        <p className="text-gray-400 text-sm mb-6">{t(RESULT.noResult)}</p>
        <Link
          href="/"
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl text-sm font-semibold shadow-lg shadow-emerald-200/50"
        >
          {t(RESULT.retry)}
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen px-5 py-6">
      {/* Brand Header */}
      <div className="mb-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl px-5 py-5 text-white shadow-lg shadow-emerald-200/50 animate-float-up">
        <h2 className="text-lg font-bold">{t(RESULT.title)}</h2>
        <p className="mt-0.5 text-xs text-white/60">{t(RESULT.disclaimer)}</p>

        {/* 亲密度内联调节：长按加减 + 点击数字直输 */}
        <div className="mt-3 flex items-center justify-between bg-white/15 rounded-xl px-4 py-2 backdrop-blur-sm select-none">
          <button
            className="w-9 h-9 flex items-center justify-center rounded-lg text-white/80 hover:bg-white/20 text-lg font-medium disabled:opacity-30 transition-all active:scale-90"
            onPointerDown={() => handlePressDown(-1)}
            onPointerUp={() => handlePressUp(-1)}
            onPointerLeave={handlePressLeave}
            disabled={reloading || intimacy <= 0}
            title={t(RESULT.pressHoldMinus)}
          >
            −
          </button>

          {/* 点击可编辑数字 */}
          {editingIntimacy ? (
            <input
              type="number"
              className="w-16 text-center text-sm text-white font-medium bg-white/20 rounded-lg py-1 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleIntimacySubmit}
              onKeyDown={(e) => { if (e.key === 'Enter') handleIntimacySubmit() }}
              autoFocus
              min={0}
              max={100}
            />
          ) : (
            <span
              className="text-sm text-white font-medium cursor-pointer hover:bg-white/10 rounded-lg px-2 py-1 transition-colors"
              onClick={() => { setEditingIntimacy(true); setEditValue(String(intimacy)) }}
              title={t(RESULT.clickEdit)}
            >
              {label} · {intimacy}
            </span>
          )}

          <button
            className="w-9 h-9 flex items-center justify-center rounded-lg text-white/80 hover:bg-white/20 text-lg font-medium disabled:opacity-30 transition-all active:scale-90"
            onPointerDown={() => handlePressDown(1)}
            onPointerUp={() => handlePressUp(1)}
            onPointerLeave={handlePressLeave}
            disabled={reloading || intimacy >= 100}
            title={t(RESULT.pressHoldPlus)}
          >
            +
          </button>
        </div>
      </div>

      {/* 回复卡片列表 */}
      <div className="flex-1 flex flex-col gap-3">
        {reloading && (
          <div className="text-center py-2">
            <span className="text-sm text-gray-400">{t(RESULT.regenerating)}</span>
          </div>
        )}
        {replies.map((text, index) => (
          <ReplyCard
            key={index}
            text={text}
            message={result.message}
            intimacy={intimacy}
            onCopy={handleCopy}
            onRegenerate={handleRegenerateOne}
            onContinue={handleContinue}
            regening={regeningIdx === index}
          />
        ))}
      </div>

      {/* 画风切换 */}
      <div className="mt-4 flex justify-center">
        <button
          className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 active:scale-95 flex items-center gap-2 ${
            styleMode === "sharp"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-200/50"
              : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 hover:text-gray-700"
          }`}
          onClick={handleSwitchStyle}
          disabled={reloading}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styleMode === "sharp" ? "animate-spin-slow" : ""}>
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z" />
          </svg>
          {styleMode === "sharp" ? t(RESULT.backToNormal) : t(RESULT.switchStyle)}
        </button>
      </div>

      {/* 底部操作 */}
      <div className="mt-6 flex flex-col gap-3">
        {showSaveContact ? (
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 px-4 py-2.5 text-sm bg-gray-50 rounded-xl border border-gray-200 placeholder:text-gray-400 outline-none focus:border-emerald-400 shadow-sm"
              placeholder={t(RESULT.contactPlaceholder)}
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveContact() }}
              autoFocus
            />
            <button
              className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-md"
              onClick={handleSaveContact}
            >
              {t(RESULT.save)}
            </button>
            <button
              className="px-4 py-2.5 text-sm font-medium text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
              onClick={() => setShowSaveContact(false)}
            >
              {t(RESULT.cancel)}
            </button>
          </div>
        ) : (
          <button
            className="w-full py-3 rounded-2xl text-sm font-medium text-gray-500 bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors"
            onClick={() => setShowSaveContact(true)}
          >
            {t(RESULT.saveContact)}
          </button>
        )}

        <button
          className="w-full py-3 rounded-2xl text-sm font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
          onClick={handleRegenerateAll}
          disabled={reloading}
        >
          {reloading ? t(RESULT.generating) : t(RESULT.anotherSet)}
        </button>

        <Link
          href="/"
          className="py-3 text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          {t(RESULT.backHome)}
        </Link>
      </div>

      <Toast
        message={toastMessage}
        visible={toastVisible}
        onDone={handleToastDone}
      />
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-400 text-sm">{t(RESULT.loading)}</p>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  )
}