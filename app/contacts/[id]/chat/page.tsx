"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getContact, getIntimacyLabel } from "@/lib/intimacy"
import ReplyCard from "@/components/ReplyCard"
import Toast from "@/components/Toast"
import { CONTACTS } from "@/lib/i18n"
import { t } from "@/lib/t"

interface ChatRound {
  message: string
  replies: string[]
  intimacy: number
  chosen?: number    // 用户复制了哪条
  createdAt: number  // 时间戳
}

interface ChatHistory {
  contactId: string
  rounds: ChatRound[]
}

function loadHistory(contactId: string): ChatHistory {
  if (typeof window === 'undefined') return { contactId, rounds: [] }
  try {
    const raw = localStorage.getItem(`zmh_chat_${contactId}`)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { contactId, rounds: [] }
}

function saveHistory(history: ChatHistory) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`zmh_chat_${history.contactId}`, JSON.stringify(history))
  } catch { /* ignore */ }
}

function getUserId(): string {
  if (typeof window === 'undefined') return ''
  const stored = localStorage.getItem("zmh_user_id")
  if (stored) return stored
  const id = crypto.randomUUID()
  localStorage.setItem("zmh_user_id", id)
  return id
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  if (isToday) return `${hh}:${mm}`
  const M = d.getMonth() + 1
  const D = d.getDate()
  return `${M}/${D} ${hh}:${mm}`
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const contact = getContact(id)

  const [history, setHistory] = useState<ChatHistory>({ contactId: id, rounds: [] })
  const [message, setMessage] = useState("")
  const [intimacy, setIntimacy] = useState(contact?.intimacy || 50)
  const [replies, setReplies] = useState<string[]>([])
  const [chosenIdx, setChosenIdx] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [showHistory, setShowHistory] = useState(true)
  const [deleteMode, setDeleteMode] = useState(false)
  const [selectedRounds, setSelectedRounds] = useState<Set<number>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (contact) {
      setIntimacy(contact.intimacy)
      setHistory(loadHistory(id))
    }
  }, [id, contact])

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5">
        <p className="text-gray-400 text-sm mb-6">{t(CONTACTS.notFound)}</p>
        <Link href="/contacts" className="px-5 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium">
          {t(CONTACTS.backToContact)}
        </Link>
      </div>
    )
  }

  const label = getIntimacyLabel(intimacy)

  // ====== 标记已选回复 ======
  const markChosen = (idx: number) => {
    setChosenIdx(idx)
    const updated = { ...history }
    if (updated.rounds.length > 0) {
      const last = { ...updated.rounds[updated.rounds.length - 1], chosen: idx }
      updated.rounds[updated.rounds.length - 1] = last
      setHistory(updated)
      saveHistory(updated)
    }
  }

  // ====== 删除对话轮次 ======
  const deleteSelected = () => {
    const updated = {
      ...history,
      rounds: history.rounds.filter((_, i) => !selectedRounds.has(i)),
    }
    setHistory(updated)
    saveHistory(updated)
    setDeleteMode(false)
    setSelectedRounds(new Set())
  }

  const toggleRoundSelect = (idx: number) => {
    setSelectedRounds(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const deleteSingleRound = (idx: number) => {
    const updated = {
      ...history,
      rounds: history.rounds.filter((_, i) => i !== idx),
    }
    setHistory(updated)
    saveHistory(updated)
  }

  // ====== 生成 ======
  const handleGenerate = async () => {
    const trimmed = message.trim()
    if (!trimmed) return
    setLoading(true)
    setChosenIdx(null)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 35000)

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, user_id: getUserId(), intimacy }),
        signal: controller.signal,
      })

      const data = await res.json()
      if (res.ok && Array.isArray(data.replies)) {
        setReplies(data.replies)
        const newRound: ChatRound = {
          message: trimmed,
          replies: data.replies,
          intimacy,
          createdAt: Date.now(),
        }
        const updated = { ...history, rounds: [...history.rounds, newRound] }
        setHistory(updated)
        saveHistory(updated)
        setMessage("")
      }
    } catch {
      setToastMessage(t(CONTACTS.networkError))
      setToastVisible(true)
    } finally {
      clearTimeout(timeoutId)
      setLoading(false)
    }
  }

  const handleRegenerateAll = async () => {
    const lastMsg = history.rounds.length > 0
      ? history.rounds[history.rounds.length - 1].message
      : ""
    if (!lastMsg) return
    setLoading(true)
    setChosenIdx(null)
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: lastMsg, user_id: getUserId(), intimacy }),
      })
      const data = await res.json()
      if (res.ok && Array.isArray(data.replies)) {
        setReplies(data.replies)
        const updated = { ...history }
        if (updated.rounds.length > 0) {
          updated.rounds[updated.rounds.length - 1].replies = data.replies
          updated.rounds[updated.rounds.length - 1].chosen = undefined
        }
        setHistory(updated)
        saveHistory(updated)
      }
    } catch {
      setToastMessage(t(CONTACTS.networkError))
      setToastVisible(true)
    } finally { setLoading(false) }
  }

  const handleRegenerateOne = async (previousText: string) => {
    const lastMsg = history.rounds.length > 0
      ? history.rounds[history.rounds.length - 1].message
      : ""
    if (!lastMsg) return
    try {
      const res = await fetch("/api/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: lastMsg, intimacy, previous_reply: previousText }),
      })
      const json = await res.json()
      if (json.success && json.reply) {
        setReplies(prev => prev.map(r => r === previousText ? json.reply : r))
      }
    } catch {
      setToastMessage(t(CONTACTS.regenerateFailed))
      setToastVisible(true)
    }
  }

  const handleIntimacyChange = async (delta: number) => {
    const newVal = Math.max(0, Math.min(100, intimacy + delta))
    if (newVal === intimacy) return
    setIntimacy(newVal)

    const lastMsg = history.rounds.length > 0
      ? history.rounds[history.rounds.length - 1].message
      : ""
    if (!lastMsg) return

    setLoading(true)
    setChosenIdx(null)
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: lastMsg, user_id: getUserId(), intimacy: newVal }),
      })
      const data = await res.json()
      if (res.ok && Array.isArray(data.replies)) {
        setReplies(data.replies)
        const updated = { ...history }
        if (updated.rounds.length > 0) {
          updated.rounds[updated.rounds.length - 1].replies = data.replies
          updated.rounds[updated.rounds.length - 1].intimacy = newVal
          updated.rounds[updated.rounds.length - 1].chosen = undefined
        }
        setHistory(updated)
        saveHistory(updated)
      }
    } catch {
      setToastMessage(t(CONTACTS.networkError))
      setToastVisible(true)
    } finally { setLoading(false) }
  }

  const handleCopy = useCallback((text: string) => {
    const idx = replies.indexOf(text)
    if (idx >= 0) markChosen(idx)
    setToastMessage(t(CONTACTS.copied) + (text.length > 15 ? text.slice(0, 15) + "..." : text))
    setToastVisible(true)
  }, [replies])

  const handleToastDone = useCallback(() => setToastVisible(false), [])

  return (
    <div className="flex flex-col min-h-screen px-5 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600 shrink-0">{t(CONTACTS.backNav)}</button>
        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-sm font-bold overflow-hidden shrink-0">
          {contact.avatar ? <img src={contact.avatar} alt="" className="w-full h-full object-cover" /> : contact.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">{contact.name}</div>
          <div className="text-xs text-gray-400">{label} · {intimacy}</div>
        </div>
        {history.rounds.length > 0 && (
          <button
            className="text-xs text-gray-400 hover:text-gray-600"
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? t(CONTACTS.collapseHistory) : t(CONTACTS.expandHistory)}
          </button>
        )}
      </div>

      {/* 历史对话 */}
      {showHistory && history.rounds.length > 0 && (
        <div className="mb-5 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
            <span className="text-xs font-medium text-gray-500">{t(CONTACTS.chatHistoryTitle) + history.rounds.length + t(CONTACTS.rounds)}</span>
            {deleteMode ? (
              <div className="flex gap-2">
                <button
                  className="text-xs text-red-400 font-medium"
                  onClick={deleteSelected}
                  disabled={selectedRounds.size === 0}
                >
                  {t(CONTACTS.deleteSelected) + String(selectedRounds.size) + ")"}
                </button>
                <button className="text-xs text-gray-400" onClick={() => { setDeleteMode(false); setSelectedRounds(new Set()) }}>{t(CONTACTS.cancel)}</button>
              </div>
            ) : (
              <button className="text-xs text-gray-400 hover:text-red-400" onClick={() => setDeleteMode(true)}>{t(CONTACTS.manage)}</button>
            )}
          </div>
          <div className="max-h-[35vh] overflow-y-auto divide-y divide-gray-50">
            {history.rounds.map((round, i) => (
              <div key={i} className={`px-4 py-3 ${selectedRounds.has(i) ? "bg-red-50" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-300">{formatTime(round.createdAt)}</span>
                  <div className="flex items-center gap-2">
                    {round.chosen != null && (
                      <span className="text-xs text-green-500">{t(CONTACTS.selectedReply, round.chosen + 1)}</span>
                    )}
                    {!deleteMode ? (
                      <button
                        className="text-xs text-gray-300 hover:text-red-400"
                        onClick={() => deleteSingleRound(i)}
                      >x</button>
                    ) : (
                      <button
                        className={`w-4 h-4 rounded border ${selectedRounds.has(i) ? "bg-red-400 border-red-400" : "border-gray-300"}`}
                        onClick={() => toggleRoundSelect(i)}
                      />
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  {t(CONTACTS.them)}{round.message.slice(0, 60)}{round.message.length > 60 ? "..." : ""}
                </p>
                {round.chosen != null && (
                  <p className="text-xs text-green-600 mt-1 bg-green-50 rounded px-2 py-1 truncate">
                    {round.replies[round.chosen]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 当前回复 */}
      {replies.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 bg-gray-100 hover:bg-gray-200 text-sm disabled:opacity-30"
              onClick={() => handleIntimacyChange(-1)}
              disabled={loading || intimacy <= 0}
            >-</button>
            <span className="text-sm text-gray-600 font-medium">{label} · {intimacy}</span>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 bg-gray-100 hover:bg-gray-200 text-sm disabled:opacity-30"
              onClick={() => handleIntimacyChange(1)}
              disabled={loading || intimacy >= 100}
            >+</button>
          </div>
          <div className="space-y-2">
            {replies.map((text, i) => (
              <ReplyCard
                key={i}
                text={text}
                message={history.rounds.length > 0 ? history.rounds[history.rounds.length - 1].message : undefined}
                intimacy={intimacy}
                onCopy={handleCopy}
                onRegenerate={handleRegenerateOne}
                onContinue={() => inputRef.current?.focus()}
                chosen={chosenIdx === i}
              />
            ))}
          </div>
          <button
            className="w-full mt-3 py-2.5 text-sm text-green-600 font-medium bg-green-50 rounded-xl hover:bg-green-100 disabled:opacity-50"
            onClick={handleRegenerateAll}
            disabled={loading}
          >
            {loading ? t(CONTACTS.generatingShort) : t(CONTACTS.anotherSet)}
          </button>
        </div>
      )}

      {loading && replies.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-400">{t(CONTACTS.generating)}</p>
        </div>
      )}

      {/* 输入区 */}
      <div className="mt-auto pt-4 flex flex-col gap-2">
        <p className="text-center text-xs text-gray-300">{t(CONTACTS.disclaimer)}</p>
        <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          className="flex-1 px-4 py-3 text-sm bg-white rounded-xl border border-gray-200 placeholder:text-gray-400 outline-none focus:border-green-400 shadow-sm"
          placeholder={t(CONTACTS.whatTheySaid)}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate() }}
          disabled={loading}
        />
        <button
          className="px-5 py-3 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 disabled:opacity-50 shadow-sm"
          onClick={handleGenerate}
          disabled={loading || !message.trim()}
        >
          {t(CONTACTS.reply)}
        </button>
      </div>

      <Toast message={toastMessage} visible={toastVisible} onDone={handleToastDone} />
      </div>
    </div>
  )
}