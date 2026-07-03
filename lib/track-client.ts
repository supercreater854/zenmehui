// 客户端埋点 helper — 调用 /api/track 中转，不依赖 supabase 客户端
// 失败静默，不影响主流程
export type ClientEvent =
  | 'copy'
  | 'share'
  | 'style_switch'
  | 'intimacy_change'
  | 'page_view'

interface ClientPayload {
  copied_text?: string
  from_style?: string
  to_style?: string
  intimacy?: number
  page?: string
}

let _userId: string | null = null

function getUserId(): string {
  if (_userId) return _userId
  if (typeof window === 'undefined') return ''
  const stored = localStorage.getItem('zmh_user_id')
  if (stored) {
    _userId = stored
    return stored
  }
  const id = crypto.randomUUID()
  localStorage.setItem('zmh_user_id', id)
  _userId = id
  return id
}

export function trackClient(event: ClientEvent, payload: ClientPayload = {}) {
  const userId = getUserId()
  if (!userId) return

  fetch('/api/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, event, payload }),
    keepalive: true,
  }).catch(() => { /* 埋点失败静默 */ })
}