import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { PRICING_TIER_LIST, type PricingTier } from '@/lib/credits'

function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

// 找对应档位（默认 100 积分）
function findTier(tierParam: string | undefined): PricingTier {
  if (tierParam) {
    const found = PRICING_TIER_LIST.find(t => t.tier === tierParam)
    if (found) return found
  }
  return PRICING_TIER_LIST[0]
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    const { user_id, tier: tierParam } = await request.json()

    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json(
        { success: false, error: '缺少用户标识' },
        { status: 400 }
      )
    }

    const tier = findTier(tierParam)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // 产品描述映射
    // lifetime 的 credits=-1，webhook 据此识别无限
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      metadata: {
        user_id,
        tier: tier.tier,
        credits: String(tier.credits), // -1 表示 lifetime
        price_yuan: String(tier.price),
      },
      line_items: [
        {
          price_data: {
            currency: 'cny',
            product_data: {
              name: `怎么回 · ${tier.name}`,
              description: tier.desc,
            },
            unit_amount: Math.round(tier.price * 100),
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