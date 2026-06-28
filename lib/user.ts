import { supabase, hasSupabase } from './supabase'

const DAILY_LIMIT = 10
const DAY_MS = 24 * 60 * 60 * 1000

// ====== 用户记录类型 ======
interface UserRecord {
  id: string
  vip: boolean
  daily_count: number
  last_reset: string // ISO timestamp
}

// ====== 本地降级模式（Supabase 未配置时使用） ======
const localUsers = new Map<string, UserRecord>()

function getLocalUser(userId: string): UserRecord {
  const existing = localUsers.get(userId)
  if (existing) return existing
  const user: UserRecord = {
    id: userId,
    vip: false,
    daily_count: 0,
    last_reset: new Date().toISOString(),
  }
  localUsers.set(userId, user)
  return user
}

// ====== 确保用户存在 ======
async function ensureUser(userId: string): Promise<UserRecord> {
  if (!hasSupabase) {
    return getLocalUser(userId)
  }

  const { data: existing } = await supabase!
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (existing) return existing as UserRecord

  const { data: created, error } = await supabase!
    .from('users')
    .insert({ id: userId })
    .select('*')
    .single()

  if (error) throw new Error(`用户创建失败: ${error.message}`)
  return created as UserRecord
}

// ====== 检查并扣减每日次数 ======
export async function checkDailyLimit(userId: string): Promise<{
  allowed: boolean
  user: UserRecord
  reason?: string
}> {
  // 本地降级模式：无限制
  if (!hasSupabase) {
    return { allowed: true, user: getLocalUser(userId) }
  }

  const user = await ensureUser(userId)

  // VIP 不限制
  if (user.vip) {
    return { allowed: true, user }
  }

  const now = new Date()
  const lastReset = new Date(user.last_reset)

  // 24h 窗口已过 → 重置计数
  if (now.getTime() - lastReset.getTime() >= DAY_MS) {
    const { data: updated } = await supabase!
      .from('users')
      .update({ daily_count: 1, last_reset: now.toISOString() })
      .eq('id', userId)
      .select('*')
      .single()

    return { allowed: true, user: updated as UserRecord }
  }

  // 当日次数已用完
  if (user.daily_count >= DAILY_LIMIT) {
    return {
      allowed: false,
      user,
      reason: '今日免费次数已用完，请明天再试或升级会员',
    }
  }

  // 扣减次数
  const { data: updated } = await supabase!
    .from('users')
    .update({ daily_count: user.daily_count + 1 })
    .eq('id', userId)
    .select('*')
    .single()

  return { allowed: true, user: updated as UserRecord }
}

// ====== 写入使用日志 ======
export async function logUsage(params: {
  userId: string
  scene: string
  success: boolean
}): Promise<void> {
  if (!hasSupabase) {
    console.log(`[ANALYTICS] user_id=${params.userId} scene=${params.scene} success=${params.success}`)
    return
  }

  const { error } = await supabase!.from('usage_logs').insert({
    user_id: params.userId,
    scene: params.scene,
    success: params.success,
  })

  if (error) {
    console.error(`[ANALYTICS] 写入失败: ${error.message}`)
  }
}