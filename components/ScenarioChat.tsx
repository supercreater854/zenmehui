"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import ReplyCard from "@/components/ReplyCard"
import type { ScenarioResponse, ScenarioMessage } from "@/lib/types"
import { SCENARIO } from "@/lib/i18n"
import { t } from "@/lib/t"

/* ====== 主组件 ====== */
interface Props {
  initialResult: ScenarioResponse | null
  scenario: string
  intimacy?: number
  onFollowUp: (history: ScenarioMessage[], newMessage: string) => Promise<ScenarioResponse | null>
  onSelectStrategy?: (reply: string, label: string, approach: string) => void
  sessionId?: string | null
}

function getUserId() {
  if (typeof window === 'undefined') return ''
  const s = localStorage.getItem("zmh_user_id"); if (s) return s
  const id = crypto.randomUUID(); localStorage.setItem("zmh_user_id", id); return id
}

export default function ScenarioChat({ initialResult, scenario, intimacy, onFollowUp, onSelectStrategy, sessionId: initialSessionId }: Props) {
  const [result, setResult] = useState<ScenarioResponse | null>(initialResult)
  const [selectedReply, setSelectedReply] = useState<string | null>(null)
  const [showFollowChat, setShowFollowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<ScenarioMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [regening, setRegening] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [chatMessages, result])

  // ====== 选择策略 → ReplyCard 自动复制，这里只需保存 session ======
  const handleSelect = async (text: string) => {
    if (selectedReply || !result) return
    setSelectedReply(text)

    // 找到对应的 strategy 用于 session 保存
    const idx = result.strategies.findIndex(s => s.reply === text)
    const strategy = idx >= 0 ? result.strategies[idx] : null
    if (strategy) onSelectStrategy?.(strategy.reply, strategy.label, strategy.approach)

    // 保存到 session
    try {
      const userId = getUserId()
      if (!sessionId) {
        const res = await fetch("/api/sessions", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            mode: "scenario",
            title: scenario.slice(0, 40),
            first_message: {
              role: "user",
              content: scenario,
              metadata: {
                strategies: result.strategies.map(s => ({ label: s.label, subtitle: s.subtitle, approach: s.approach, reply: s.reply })),
                chosenIndex: idx,
                intimacy,
              },
            },
          }),
        })
        if (res.ok) {
          const data = await res.json()
          const sid = data.session.id
          setSessionId(sid)
          await fetch(`/api/sessions/${sid}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: "assistant", content: text, metadata: { mode: "scenario", chosen: true } }),
          })
        }
      } else {
        await fetch(`/api/sessions/${sessionId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "assistant", content: text, metadata: { mode: "scenario", chosen: true } }),
        })
      }
    } catch { /* silent */ }
  }

  // ====== 单条策略换说法 ======
  const handleRegenerateOne = async (oldReply: string) => {
    const idx = result?.strategies.findIndex(s => s.reply === oldReply)
    if (!result || idx == null || idx < 0) return

    setRegening(true)
    try {
      const history: ScenarioMessage[] = [
        { role: "user", content: scenario },
        ...chatMessages,
      ]
      const msg = `请替换第${idx + 1}条策略「${result.strategies[idx].label}」，保持策略方向一致，给出新的参考回复`
      const newResult = await onFollowUp(history, msg)
      if (newResult?.strategies?.[0]) {
        setResult({
          ...result,
          strategies: result.strategies.map((s, i) => i === idx ? newResult.strategies[0] : s),
        })
      }
    } catch { /* ignore */ }
    finally { setRegening(false) }
  }

  // ====== 追问 ======
  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const history: ScenarioMessage[] = [
      { role: "user", content: scenario },
      ...chatMessages,
    ]
    setChatMessages(prev => [...prev, { role: "user", content: trimmed }])
    setInput("")
    setLoading(true)

    if (sessionId) {
      fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "user", content: trimmed, metadata: { followUp: true } }),
      }).catch(() => {})
    }

    const newResult = await onFollowUp(history, trimmed)
    if (newResult) {
      setResult(newResult)
      setSelectedReply(null)
    }
    setLoading(false)
  }

  // ====== 换一组策略 ======
  const handleRegenerateAll = async () => {
    if (!result || regening) return
    setRegening(true)
    setSelectedReply(null)
    try {
      const history: ScenarioMessage[] = [
        { role: "user", content: scenario },
        ...chatMessages,
      ]
      const newResult = await onFollowUp(history, "请从不同角度重新分析，提供新的策略方向")
      if (newResult) setResult(newResult)
    } catch { /* ignore */ }
    finally { setRegening(false) }
  }

  if (!result) return <div className="p-5 text-center text-sm text-gray-400">{t(SCENARIO.analyzing)}...</div>

  return (
    <div className="flex flex-col min-h-screen px-5 py-6">
      {/* Header */}
      <div className="mb-5 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl px-5 py-5 text-white shadow-lg shadow-indigo-300/40">
        <h2 className="text-lg font-bold">场景参谋</h2>
        <p className="mt-0.5 text-xs text-white/60">
          {selectedReply ? "已选择策略 — 参考回复已复制" : "点一张卡片选中策略，其余会自动消失"}
        </p>
        {intimacy != null && (
          <div className="mt-3 flex items-center bg-white/15 rounded-xl px-4 py-2 backdrop-blur-sm w-fit">
            <span className="text-sm text-white font-medium">亲密度 · {intimacy}</span>
          </div>
        )}
      </div>

      {/* 局势分析 */}
      {result.analysis && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">局势分析</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{result.analysis}</p>
        </div>
      )}

      {/* ====== 策略卡片 — 复用 ReplyCard ====== */}
      {result.strategies.length > 0 && (
        <div className="flex-1 flex flex-col gap-3">
          {regening && <div className="text-center py-2"><span className="text-sm text-gray-400">重新分析中...</span></div>}
          {result.strategies.map((s, i) => (
            <ReplyCard
              key={i}
              text={s.reply}
              message={scenario}
              intimacy={intimacy}
              onCopy={() => {}}
              onSelect={handleSelect}
              onRegenerate={handleRegenerateOne}
              selected={selectedReply === s.reply}
              dimmed={selectedReply !== null && selectedReply !== s.reply}
              replyTitle={s.label}
              replySubtitle={s.subtitle}
              approachText={s.approach}
              regening={false}
            />
          ))}
        </div>
      )}

      {/* ====== 追问入口 ====== */}
      {selectedReply && !showFollowChat && (
        <div className="mt-3 animate-fade-in">
          <button
            className="w-full py-3 rounded-2xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200/50 hover:shadow-xl active:scale-[0.98] transition-all"
            onClick={() => setShowFollowChat(true)}
          >
            继续聊 →
          </button>
          <p className="mt-2 text-center text-xs text-gray-400">
            回复已自动复制并保存到<Link href="/me#history" className="text-indigo-500 underline font-medium">历史记录</Link>
          </p>
        </div>
      )}

      {/* 追问对话区 */}
      {showFollowChat && chatMessages.length > 0 && (
        <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                msg.role === "user" ? "bg-indigo-100 text-indigo-800" : "bg-gray-100 text-gray-600"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      )}

      {/* 追问输入框 */}
      {showFollowChat && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-2.5 text-sm bg-gray-50 rounded-xl border border-gray-100 placeholder:text-gray-400 outline-none focus:border-indigo-300 transition-colors"
            placeholder={t(SCENARIO.inputPlaceholder)}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSend() }}
            disabled={loading}
          />
          <button
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              input.trim() && !loading ? "bg-indigo-600 text-white active:scale-95" : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
            onClick={handleSend}
            disabled={!input.trim() || loading}
          >
            {t(SCENARIO.sendBtn)}
          </button>
        </div>
      )}

      {/* 换一组 */}
      <div className="mt-4">
        <button
          className="w-full py-3 rounded-2xl text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors disabled:opacity-50"
          onClick={handleRegenerateAll} disabled={regening}
        >
          {regening ? "重新分析中..." : "不满意？换一组策略"}
        </button>
        <Link href="/" className="block mt-3 py-3 text-center text-sm text-gray-400 hover:text-gray-600 transition-colors">
          返回首页
        </Link>
      </div>
    </div>
  )
}