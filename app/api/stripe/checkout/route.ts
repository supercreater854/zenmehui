import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PRICE_YUAN = 9.9

export async function POST(request: NextRequest) {
  try {
    const { user_id } = await request.json()

    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json(
        { success: false, error: '缺少用户标识' },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      metadata: { user_id },
      line_items: [
        {
          price_data: {
            currency: 'cny',
            product_data: {
              name: '怎么回 - 永久会员',
              description: '解锁无限次数，畅享 AI 聊天回复生成',
            },
            unit_amount: Math.round(PRICE_YUAN * 100), // Stripe 以分为单位
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}?upgrade=success`,
      cancel_url: `${appUrl}`,
    })

    return NextResponse.json({ success: true, url: session.url })
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown'
    console.error(`[STRIPE] 创建 checkout session 失败: ${reason}`)
    return NextResponse.json(
      { success: false, error: '支付系统暂不可用，请稍后再试' },
      { status: 500 }
    )
  }
}