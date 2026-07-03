import { supabase, hasSupabase } from './supabase'

export type AnalyticsEvent =
  | 'generate'
  | 'regenerate'
  | 'copy'
  | 'style_switch'
  | 'intimacy_change'
  | 'page_view'

export interface AnalyticsPayload {
  // generate
  message_length?: number
  intimacy?: number
  style?: string
  reply_count?: number
  // regenerate
  reply_index?: number
  // copy
  copied_text?: string
  // style_switch
  from_style?: string
  to_style?: string
  // page_view
  page?: string
}

/**
 * 记录一条分析事件。无 Supabase 配置时静默跳过。
 */
export async function trackEvent(
  userId: string,
  event: AnalyticsEvent,
  payload: AnalyticsPayload = {}
): Promise<void> {
  if (!hasSupabase || !supabase) return

  try {
    await supabase.from('analytics_events').insert({
      user_id: userId,
      event,
      payload,
    })
  } catch {
    // 埋点失败不影响主流程
  }
}

/**
 * 批量记录（用于页面加载等场景，减少请求次数）
 */
export async function trackEvents(
  events: Array<{ userId: string; event: AnalyticsEvent; payload?: AnalyticsPayload }>
): Promise<void> {
  if (!hasSupabase || !supabase || events.length === 0) return

  try {
    await supabase.from('analytics_events').insert(
      events.map(e => ({
        user_id: e.userId,
        event: e.event,
        payload: e.payload || {},
      }))
    )
  } catch {
    // ignore
  }
}