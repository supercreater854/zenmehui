import { supabase, hasSupabase } from './supabase'

// ====== 类型 ======

export interface Session {
  id: string
  user_id: string
  mode: 'quick' | 'scenario'
  title: string
  created_at: string
  updated_at: string
}

export interface SessionMessage {
  id: number
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata: Record<string, unknown>
  created_at: string
}

// ====== CRUD ======

/** 获取用户的所有会话（按更新时间倒序） */
export async function getSessions(userId: string): Promise<Session[]> {
  if (!hasSupabase || !supabase) return []

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[sessions] list error:', error.message)
    return []
  }

  return data as Session[]
}

/** 获取单个会话详情（含所有消息） */
export async function getSession(sessionId: string): Promise<{ session: Session; messages: SessionMessage[] } | null> {
  if (!hasSupabase || !supabase) return null

  const { data: session, error: sErr } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (sErr || !session) return null

  const { data: messages, error: mErr } = await supabase
    .from('session_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (mErr) return { session: session as Session, messages: [] }

  return { session: session as Session, messages: messages as SessionMessage[] }
}

/** 创建新会话 */
export async function createSession(params: {
  userId: string
  mode: 'quick' | 'scenario'
  title: string
  firstMessage: { role: 'user' | 'assistant'; content: string; metadata?: Record<string, unknown> }
}): Promise<Session | null> {
  if (!hasSupabase || !supabase) return null

  // 创建 session
  const { data: session, error: sErr } = await supabase
    .from('sessions')
    .insert({
      user_id: params.userId,
      mode: params.mode,
      title: params.title.slice(0, 100),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (sErr || !session) {
    console.error('[sessions] create error:', sErr?.message)
    return null
  }

  // 插入首条消息
  const { error: mErr } = await supabase
    .from('session_messages')
    .insert({
      session_id: session.id,
      role: params.firstMessage.role,
      content: params.firstMessage.content,
      metadata: params.firstMessage.metadata || {},
    })

  if (mErr) {
    console.error('[sessions] message insert error:', mErr.message)
  }

  return session as Session
}

/** 追加消息到会话 */
export async function appendMessage(params: {
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  metadata?: Record<string, unknown>
}): Promise<boolean> {
  if (!hasSupabase || !supabase) return false

  const { error: mErr } = await supabase
    .from('session_messages')
    .insert({
      session_id: params.sessionId,
      role: params.role,
      content: params.content,
      metadata: params.metadata || {},
    })

  if (mErr) {
    console.error('[sessions] append error:', mErr.message)
    return false
  }

  // 更新 session 的 updated_at
  await supabase
    .from('sessions')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', params.sessionId)

  return true
}

/** 删除会话 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  if (!hasSupabase || !supabase) return false

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)

  if (error) {
    console.error('[sessions] delete error:', error.message)
    return false
  }

  return true
}