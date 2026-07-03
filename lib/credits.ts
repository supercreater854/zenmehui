// ====== 积分档位常量 ======
// credits: -1 表示无限

export interface PricingTier {
  tier: string
  credits: number
  price: number
  name: string
  desc: string
  highlight: boolean // 是否推荐/高亮
}

export const PRICING_TIERS: Record<string, PricingTier> = {
  '100': { tier: '100', credits: 100,  price: 6.9,  name: '100 积分',  desc: '轻度使用', highlight: false },
  '300': { tier: '300', credits: 300,  price: 14.9, name: '300 积分',  desc: '中度使用', highlight: true  },
  '1000':{ tier: '1000',credits: 1000, price: 29.9, name: '1000 积分', desc: '重度使用', highlight: false },
  'lifetime': { tier: 'lifetime', credits: -1, price: 29.9, name: '永久无限', desc: '一次付费，终身畅用', highlight: false },
}

export const PRICING_TIER_LIST = Object.values(PRICING_TIERS)

// ====== Supabase 积分操作 ======

import { supabase, hasSupabase } from './supabase'

const INITIAL_FREE_CREDITS = -1 // 免费期间无限使用
const LOCAL_UNLIMITED = 999999

// 本地降级：无限积分
const localCredits = new Map<string, number>()

function getLocal(userId: string): number {
  const v = localCredits.get(userId)
  if (v !== undefined) return v
  localCredits.set(userId, INITIAL_FREE_CREDITS)
  return INITIAL_FREE_CREDITS
}

// ====== 获取剩余积分 ======
export async function getRemainingCredits(userId: string): Promise<{
  credits: number
  unlimited: boolean
}> {
  if (!hasSupabase) {
    return { credits: LOCAL_UNLIMITED, unlimited: true }
  }

  try {
    const { data } = await supabase!
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single()

    if (!data) {
      // 新用户：创建并给初始积分
      await supabase!
        .from('users')
        .insert({ id: userId, credits: INITIAL_FREE_CREDITS })

      return { credits: INITIAL_FREE_CREDITS, unlimited: false }
    }

    const c = data.credits ?? INITIAL_FREE_CREDITS
    return { credits: c, unlimited: c < 0 }
  } catch {
    console.error('[CREDITS] 查询失败，降级本地模式')
    const v = getLocal(userId)
    return { credits: v, unlimited: false }
  }
}

// ====== 消耗 1 积分（原子操作） ======
export async function consumeCredit(userId: string): Promise<{
  allowed: boolean
  remaining: number
  reason?: string
}> {
  if (!hasSupabase) {
    const v = getLocal(userId)
    localCredits.set(userId, v - 1)
    return { allowed: true, remaining: v - 1 }
  }

  try {
    const { data: user } = await supabase!
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single()

    if (!user) {
      // 新用户：创建 + 给初始积分
      await supabase!
        .from('users')
        .insert({ id: userId, credits: INITIAL_FREE_CREDITS - 1 })
      return { allowed: true, remaining: INITIAL_FREE_CREDITS - 1 }
    }

    const current = user.credits ?? INITIAL_FREE_CREDITS

    // lifetime (-1)：不扣
    if (current < 0) {
      return { allowed: true, remaining: -1 }
    }

    if (current <= 0) {
      return { allowed: false, remaining: 0, reason: '积分不足，请充值' }
    }

    const { data: updated } = await supabase!
      .from('users')
      .update({ credits: current - 1 })
      .eq('id', userId)
      .select('credits')
      .single()

    return { allowed: true, remaining: updated?.credits ?? current - 1 }
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown'
    console.error(`[CREDITS] 扣减失败: ${reason}`)
    return { allowed: true, remaining: LOCAL_UNLIMITED }
  }
}

// ====== 增加积分（webhook 调用） ======
export async function addCredits(userId: string, amount: number): Promise<{
  success: boolean
  remaining: number
  error?: string
}> {
  if (!hasSupabase) {
    const v = getLocal(userId)
    localCredits.set(userId, v + amount)
    return { success: true, remaining: v + amount }
  }

  try {
    // amount = -1 表示永久无限
    if (amount < 0) {
      const { error } = await supabase!
        .from('users')
        .upsert({ id: userId, credits: -1 }, { onConflict: 'id' })

      if (error) throw error
      return { success: true, remaining: -1 }
    }

    // 先查当前积分
    const { data: user } = await supabase!
      .from('users')
      .select('credits')
      .eq('id', userId)
      .single()

    const current = user?.credits ?? 0
    // 已经是 lifetime 则不变
    if (current < 0) {
      return { success: true, remaining: -1 }
    }

    const newCredits = current + amount

    const { error } = await supabase!
      .from('users')
      .upsert({ id: userId, credits: newCredits }, { onConflict: 'id' })

    if (error) throw error

    return { success: true, remaining: newCredits }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'unknown'
    console.error(`[CREDITS] 增加失败: ${msg}`)
    return { success: false, remaining: 0, error: msg }
  }
}