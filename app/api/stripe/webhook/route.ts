import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { addCredits } from '@/lib/credits'

// 禁用 body 解析，webhook 需要原始 body 做签名校验
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: '缺少签名' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const rawBody = await request.text()
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!)
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
  const creditsStr = session.metadata?.credits

  if (!userId) {
    console.error('[STRIPE] webhook 缺少 user_id metadata')
    return NextResponse.json({ error: '缺少 user_id' }, { status: 400 })
  }

  const credits = parseInt(creditsStr || '0', 10)

  if (isNaN(credits)) {
    console.error(`[STRIPE] webhook credits 无效: ${creditsStr}`)
    return NextResponse.json({ error: 'credits 格式错误' }, { status: 400 })
  }

  console.log(`[STRIPE] 充值成功: user_id=${userId} credits=${credits}`)

  const result = await addCredits(userId, credits)

  if (!result.success) {
    console.error(`[STRIPE] 积分写入失败: user_id=${userId} error=${result.error}`)
    return NextResponse.json({ error: '积分写入失败', detail: result.error }, { status: 500 })
  }

  console.log(`[STRIPE] 积分已到账: user_id=${userId} remaining=${result.remaining}`)
  return NextResponse.json({ received: true })
}