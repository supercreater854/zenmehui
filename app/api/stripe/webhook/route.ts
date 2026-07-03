import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { addCredits } from '@/lib/credits'
import { API_ERR } from '@/lib/i18n'

const isEn = () => process.env.NEXT_PUBLIC_LOCALE === 'en'

// 禁用 body 解析，webhook 需要原始 body 做签名校验
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const en = isEn()
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: en ? API_ERR.missingSignature.en : API_ERR.missingSignature.zh }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const rawBody = await request.text()
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown'
    console.error(`[STRIPE] webhook signature verification failed: ${reason}`)
    return NextResponse.json({ error: en ? API_ERR.signatureFail.en : API_ERR.signatureFail.zh }, { status: 400 })
  }

  // 只处理支付完成事件
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const userId = session.metadata?.user_id
  const creditsStr = session.metadata?.credits

  if (!userId) {
    console.error('[STRIPE] webhook missing user_id metadata')
    return NextResponse.json({ error: en ? API_ERR.noUserId.en : API_ERR.noUserId.zh }, { status: 400 })
  }

  const credits = parseInt(creditsStr || '0', 10)

  if (isNaN(credits)) {
    console.error(`[STRIPE] webhook invalid credits: ${creditsStr}`)
    return NextResponse.json({ error: en ? API_ERR.creditsFormat.en : API_ERR.creditsFormat.zh }, { status: 400 })
  }

  console.log(`[STRIPE] top-up success: user_id=${userId} credits=${credits}`)

  const result = await addCredits(userId, credits)

  if (!result.success) {
    console.error(`[STRIPE] credits write failed: user_id=${userId} error=${result.error}`)
    return NextResponse.json({ error: en ? API_ERR.creditsWriteFailed.en : API_ERR.creditsWriteFailed.zh, detail: result.error }, { status: 500 })
  }

  console.log(`[STRIPE] credits added: user_id=${userId} remaining=${result.remaining}`)
  return NextResponse.json({ received: true })
}