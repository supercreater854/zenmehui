"use client"

import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Suspense, useState, useEffect, useRef } from "react"
import ReplyCard from "@/components/ReplyCard"
import ScenarioChat from "@/components/ScenarioChat"
import type { ScenarioMessage, ScenarioResponse } from "@/lib/types"
import Toast from "@/components/Toast"
import { getIntimacyLabel } from "@/lib/intimacy"
import { RESULT } from "@/lib/i18n"
import { t } from "@/lib/t"
import { trackClient } from "@/lib/track-client"

interface QuickData { message: string; replies: string[]; intimacy?: number }
interface ScenarioData { scenario: string; result: any; intimacy?: number }

function parseQuickData(raw: string | null): QuickData | null {
  if (!raw) return null
  try {
    const p = JSON.parse(decodeURIComponent(raw))
    if (Array.isArray(p.replies) && p.replies.length > 0 && typeof p.message === 'string')
      return { message: p.message, replies: p.replies, intimacy: p.intimacy }
    return null
  } catch { return null }
}
function parseScenarioData(raw: string | null): ScenarioData | null {
  if (!raw) return null
  try {
    const p = JSON.parse(decodeURIComponent(raw))
    if (typeof p.scenario === 'string' && p.result) return { scenario: p.scenario, result: p.result, intimacy: p.intimacy }
    return null
  } catch { return null }
}

function getUserId() {
  if (typeof window === 'undefined') return ''
  const s = localStorage.getItem("zmh_user_id"); if (s) return s
  const id = crypto.randomUUID(); localStorage.setItem("zmh_user_id", id); return id
}

// ====== 快速回复追问流组件 ======
// 与场景参谋对齐：发送消息 → AI 返回多条回复卡片 → 用户选择 → 可继续
function QuickFollowChat({ message, chosenReply, intimacy, onBack, sessionId }: {
  message: string; chosenReply: string; intimacy: number; onBack: () => void; sessionId: string | null
}) {
  const [rounds, setRounds] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'user', content: message },
    { role: 'assistant', content: chosenReply },
  ])
  const [followReplies, setFollowReplies] = useState<string[]>([])
  const [selectedFollow, setSelectedFollow] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [rounds, followReplies])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMsg = { role: 'user' as const, content: trimmed }
    setRounds(prev => [...prev, userMsg])
    setInput("")
    setFollowReplies([])
    setSelectedFollow(null)
    setLoading(true)

    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, user_id: getUserId(), intimacy, mode: "quick", stream: true }),
      })

      if (!res.ok) { setLoading(false); return }

      const reader = res.body?.getReader()
      if (!reader) { setLoading(false); return }

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
            if (event.type === 'done') result = event.result
          } catch { /* skip */ }
        }
      }

      if (result?.replies && Array.isArray(result.replies) && result.replies.length > 0) {
        setFollowReplies(result.replies)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  const handleSelectFollow = async (text: string) => {
    if (selectedFollow) return
    setSelectedFollow(text)
    // 保存追问回复到历史
    try {
      await navigator.clipboard.writeText(text)
    } catch { /* ignore */ }
    // 追加 assistant 消息到 rounds
    setRounds(prev => [...prev, { role: 'assistant', content: text }])

    // 保存到 session
    try {
      if (sessionId) {
        await fetch(`/api/sessions/${sessionId}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "assistant", content: text, metadata: { followUp: true } }),
        })
      }
    } catch { /* silent */ }
  }

  const handleRegenerateFollow = async () => {
    if (!followReplies.length || regenerating) return
    setRegenerating(true)
    setSelectedFollow(null)
    try {
      const lastUserMsg = [...rounds].reverse().find(r => r.role === 'user')
      if (!lastUserMsg) return
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: lastUserMsg.content, user_id: getUserId(), intimacy, mode: "quick", stream: true }),
      })
      if (!res.ok) return
      const reader = res.body?.getReader()
      if (!reader) return
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
            if (event.type === 'done') result = event.result
          } catch { /* skip */ }
        }
      }
      if (result?.replies && Array.isArray(result.replies) && result.replies.length > 0) {
        setFollowReplies(result.replies)
      }
    } catch { /* ignore */ }
    finally { setRegenerating(false) }
  }

  return (
    <div className="flex flex-col min-h-screen px-5 py-6">
      {/* Header — 与主页面统一样式 */}
      <div className="mb-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl px-5 py-5 text-white shadow-lg shadow-emerald-200/50">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-sm text-white/60 hover:text-white/90 transition-colors">← 返回</button>
          <span className="text-xs text-white/60">继续聊</span>
          <div className="w-10" />
        </div>
        <p className="mt-2 text-xs text-white/50">选择一条回复 · 自动复制</p>
        {intimacy != null && (
          <div className="mt-2 flex items-center bg-white/15 rounded-xl px-4 py-2 backdrop-blur-sm w-fit">
            <span className="text-sm text-white font-medium">亲密度 · {intimacy}</span>
          </div>
        )}
      </div>

      {/* 对话历史 — 紧凑气泡 */}
      <div className="mb-4 space-y-2 max-h-48 overflow-y-auto">
        {rounds.map((r, i) => (
          <div key={i} className={`flex ${r.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
              r.role === 'user' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600'
            }`}>
              {r.content}
            </div>
          </div>
        ))}
        {loading && <div className="flex gap-1 px-4"><span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" /><span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} /><span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} /></div>}
        <div ref={chatEndRef} />
      </div>

      {/* 回复卡片区 */}
      {followReplies.length > 0 && (
        <div className="flex-1 flex flex-col gap-3">
          {regenerating && <div className="text-center py-2"><span className="text-sm text-gray-400">换一组中...</span></div>}
          {followReplies.map((text, i) => (
            <ReplyCard
              key={i}
              text={text}
              message={rounds[rounds.length - 1]?.role === 'user' ? rounds[rounds.length - 1].content : undefined}
              intimacy={intimacy}
              onCopy={() => {}}
              onSelect={handleSelectFollow}
              selected={selectedFollow === text}
              dimmed={selectedFollow !== null && selectedFollow !== text}
              regening={false}
            />
          ))}
        </div>
      )}

      {/* 追问入口 */}
      {selectedFollow && (
        <div className="mt-3 animate-fade-in">
          <p className="text-center text-xs text-gray-400 mb-1">
            回复已自动复制并保存到<Link href="/me#history" className="text-indigo-500 underline font-medium">历史记录</Link>
          </p>
        </div>
      )}

      {/* 换一组 */}
      {followReplies.length > 0 && !selectedFollow && (
        <div className="mt-3">
          <button
            className="w-full py-3 rounded-2xl text-sm font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
            onClick={handleRegenerateFollow} disabled={regenerating}
          >
            {regenerating ? "换一组中..." : "不满意？换一组"}
          </button>
        </div>
      )}

      {/* 输入框 */}
      <div className="mt-3 flex gap-2">
        <input type="text" className="flex-1 px-4 py-2.5 text-sm bg-gray-50 rounded-xl border border-gray-100 placeholder:text-gray-400 outline-none focus:border-emerald-300 transition-colors"
          placeholder="继续聊..." value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend() }} disabled={loading} />
        <button className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
          input.trim() && !loading ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white active:scale-95 shadow-md' : 'bg-gray-100 text-gray-400'
        }`}
          onClick={handleSend} disabled={!input.trim() || loading}>发送</button>
      </div>
    </div>
  )
}

// ====== 主组件 ======
function ResultContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const dataParam = searchParams.get("data")
  const mode = searchParams.get("mode") as "scenario" | null
  const intimacyRaw = searchParams.get("intimacy")
  const labelRaw = searchParams.get("label")

  // Quick
  const [quick, setQuick] = useState<QuickData | null>(null)
  const [replies, setReplies] = useState<string[]>([])
  const [selectedReply, setSelectedReply] = useState<string | null>(null)
  const [showFollowChat, setShowFollowChat] = useState(false)
  const [reloading, setReloading] = useState(false)

  // Scenario
  const [scenarioData, setScenarioData] = useState<ScenarioData | null>(null)

  // Shared
  const [intimacy, setIntimacy] = useState(50)
  const [label, setLabel] = useState("")
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [savingSession, setSavingSession] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    if (!dataParam) return
    if (mode === "scenario") {
      const p = parseScenarioData(dataParam)
      if (p) { setScenarioData(p); setIntimacy(p.intimacy || 50); setLabel(getIntimacyLabel(p.intimacy || 50)) }
    } else {
      const p = parseQuickData(dataParam)
      if (p) { setQuick(p); setReplies(p.replies); setIntimacy(p.intimacy || 50); setLabel(labelRaw ? decodeURIComponent(labelRaw) : getIntimacyLabel(p.intimacy || 50)) }
    }
  }, [dataParam, mode, labelRaw])

  // ====== 选择回复 → 自动保存到 Supabase ======
  const handleSelectReply = async (text: string) => {
    if (selectedReply || !quick) return
    setSelectedReply(text)
    setToastMessage("已复制 — 3 秒后自动保存到历史")
    setToastVisible(true)

    // 延迟保存 session
    setSavingSession(true)
    try {
      const userId = getUserId()
      const res = await fetch("/api/sessions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          mode: "quick",
          title: quick.message.slice(0, 40),
          first_message: {
            role: "user",
            content: quick.message,
            metadata: { replies: quick.replies, chosenIndex: quick.replies.indexOf(text), intimacy },
          },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setSessionId(data.session.id)
        // 保存 assistant 回复
        await fetch(`/api/sessions/${data.session.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: "assistant", content: text, metadata: { chosen: true } }),
        })
      }
    } catch { /* silent */ }
    finally { setSavingSession(false) }
  }

  // ====== 换一组 ======
  const handleRegenerateAll = async () => {
    if (!quick || reloading) return
    setSelectedReply(null)
    setReloading(true)
    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: quick.message, user_id: getUserId(), intimacy, stream: true }),
      })

      if (!res.ok) { setToastMessage(t(RESULT.regenerateFailed)); setToastVisible(true); return }

      const reader = res.body?.getReader()
      if (!reader) return
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
            if (event.type === 'done') result = event.result
          } catch { /* skip */ }
        }
      }

      if (result?.replies && Array.isArray(result.replies)) setReplies(result.replies)
    } catch { setToastMessage(t(RESULT.networkError)); setToastVisible(true) }
    finally { setReloading(false) }
  }

  // ====== 单条换说法 ======
  const handleRegenerateOne = async (oldText: string) => {
    if (!quick) return
    try {
      const res = await fetch("/api/regenerate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: quick.message, intimacy, previous_reply: oldText, reply_index: replies.indexOf(oldText) }),
      })
      const json = await res.json()
      if (json.success && json.reply) {
        setReplies(prev => { const n = [...prev]; const i = n.indexOf(oldText); if (i >= 0) n[i] = json.reply; return n })
      }
    } catch { setToastMessage(t(RESULT.regenerateFailed)); setToastVisible(true) }
  }

  const handleCopy = () => {} // 选择模式下自动复制，这里空实现保持接口兼容
  const handleToastDone = () => setToastVisible(false)

  // ====== 数据过大 / 无数据 ======
  if (dataParam && dataParam.length > 5000) {
    return <div className="flex flex-col items-center justify-center min-h-screen px-5"><p className="text-gray-400 text-sm mb-6">{t(RESULT.dataTooLarge)}</p><Link href="/" className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-medium">{t(RESULT.backHome)}</Link></div>
  }
  if (!quick && !scenarioData) {
    return <div className="flex flex-col items-center justify-center min-h-screen px-5"><p className="text-gray-400 text-sm mb-6">{t(RESULT.noResult)}</p><Link href="/" className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl text-sm font-semibold shadow-lg">{t(RESULT.retry)}</Link></div>
  }

  // ====== 追问模式 ======
  if (showFollowChat && quick && selectedReply) {
    return <QuickFollowChat message={quick.message} chosenReply={selectedReply} intimacy={intimacy} sessionId={sessionId} onBack={() => setShowFollowChat(false)} />
  }

  // ====== 参谋模式 — ScenarioChat ======
  if (mode === "scenario" && scenarioData) {
    const handleFollowUp = async (
      history: ScenarioMessage[],
      newMessage: string,
    ): Promise<ScenarioResponse | null> => {
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: newMessage,
            user_id: getUserId(),
            intimacy,
            mode: "scenario",
            history,
          }),
        })
        const data = await res.json()
        if (res.ok && data.scenario_result) return data.scenario_result
        return null
      } catch {
        return null
      }
    }

    return (
      <div className="flex flex-col min-h-screen">
        <div className="shrink-0 px-5 pt-6 pb-3">
          <div className="mb-4 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl px-5 py-5 text-white shadow-lg shadow-indigo-300/40">
            <h2 className="text-lg font-bold">场景参谋</h2>
            <p className="mt-0.5 text-xs text-white/60">基于你的描述分析局势，提供策略建议</p>
            <div className="mt-3 flex items-center gap-2 bg-white/15 rounded-xl px-4 py-2 backdrop-blur-sm">
              <span className="text-xs text-white/70">亲密度</span>
              <span className="text-sm text-white font-medium">{intimacy}</span>
            </div>
          </div>
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← {t(RESULT.backHome)}</Link>
        </div>
        <div className="flex-1">
          <ScenarioChat
            initialResult={scenarioData.result}
            scenario={scenarioData.scenario}
            intimacy={intimacy}
            onFollowUp={handleFollowUp}
          />
        </div>
      </div>
    )
  }

  if (!quick) return null

  return (
    <div className="flex flex-col min-h-screen px-5 py-6">
      {/* Header */}
      <div className="mb-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl px-5 py-5 text-white shadow-lg shadow-emerald-200/50">
        <h2 className="text-lg font-bold">{t(RESULT.title)}</h2>
        <p className="mt-0.5 text-xs text-white/60">
          {selectedReply
            ? "已选择回复 — 其余已粉碎"
            : `点一张卡片选中它，其余会自动消失`}
        </p>
        <div className="mt-3 flex items-center justify-between bg-white/15 rounded-xl px-4 py-2 backdrop-blur-sm">
          <span className="text-sm text-white font-medium">{label} · {intimacy}</span>
          <span className="text-xs text-white/60">{savingSession ? "保存中..." : selectedReply ? "已保存到历史" : ""}</span>
        </div>
      </div>

      {/* Reply cards */}
      <div className="flex-1 flex flex-col gap-3">
        {reloading && <div className="text-center py-2"><span className="text-sm text-gray-400">{t(RESULT.regenerating)}</span></div>}
        {replies.map((text, index) => (
          <ReplyCard
            key={index}
            text={text}
            message={quick.message}
            intimacy={intimacy}
            onCopy={handleCopy}
            onSelect={handleSelectReply}
            onRegenerate={handleRegenerateOne}
            selected={selectedReply === text}
            dimmed={selectedReply !== null && selectedReply !== text}
            regening={false}
          />
        ))}

        {/* 追问入口 — 选中后浮现 */}
        {selectedReply && (
          <div className="mt-2 animate-fade-in">
            <button
              className="w-full py-3 rounded-2xl text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200/50 hover:shadow-xl active:scale-[0.98] transition-all"
              onClick={() => setShowFollowChat(true)}
            >
              继续聊 →
            </button>
            <p className="mt-2 text-center text-xs text-gray-400">回复已自动复制并保存到<Link href="/me#history" className="text-indigo-500 underline font-medium">历史记录</Link></p>
          </div>
        )}
      </div>

      {/* 换一组 */}
      <div className="mt-4">
        <button
          className="w-full py-3 rounded-2xl text-sm font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors disabled:opacity-50"
          onClick={handleRegenerateAll} disabled={reloading}
        >
          {reloading ? t(RESULT.generating) : "不满意？换一组"}
        </button>
        <Link href="/" className="block mt-3 py-3 text-center text-sm text-gray-400 hover:text-gray-600 transition-colors">{t(RESULT.backHome)}</Link>
      </div>

      <Toast message={toastMessage} visible={toastVisible} onDone={handleToastDone} />
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><p className="text-gray-400 text-sm">{t(RESULT.loading)}</p></div>}>
      <ResultContent />
    </Suspense>
  )
}