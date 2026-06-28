import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase, hasSupabase } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// 禁用 body 解析，webhook 需要原始 body 做签名校验
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: '缺少签名' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const rawBody = await request.text()
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown'
    console.error(`[STRIPE] webhook 签名校验失败: ${reason}`)
    return NextResponse.json({ error: '签名校验失败' }, { status: 400 })
  }

  // 只处理支付完成事件
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const userId = session.metadata?.user_id

  if (!userId) {
    console.error('[STRIPE] webhook 缺少 user_id metadata')
    return NextResponse.json({ error: '缺少 user_id' }, { status: 400 })
  }

  // 更新用户 VIP 状态
  if (!hasSupabase) {
    console.error('[STRIPE] webhook 收到但 Supabase 未配置')
    return NextResponse.json({ error: '数据库未配置' }, { status: 500 })
  }

  const { error } = await supabase!
    .from('users')
    .update({ vip: true })
    .eq('id', userId)

  if (error) {
    console.error(`[STRIPE] 更新 VIP 失败: user_id=${userId} error=${error.message}`)
    return NextResponse.json({ error: '数据库更新失败' }, { status: 500 })
  }

  console.log(`[STRIPE] VIP 开通成功: user_id=${userId}`)
  return NextResponse.json({ received: true })
}