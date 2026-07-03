import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { PRICING_TIER_LIST, type PricingTier } from '@/lib/credits'
import { API_ERR } from '@/lib/i18n'

function getStripe(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

const isEn = () => process.env.NEXT_PUBLIC_LOCALE === 'en'

// CNY → USD 汇率（固定，不对接实时汇率）
const CNY_TO_USD = 0.14

function findTier(tierParam: string | undefined): PricingTier {
  if (tierParam) {
    const found = PRICING_TIER_LIST.find(t => t.tier === tierParam)
    if (found) return found
  }
  return PRICING_TIER_LIST[0]
}

export async function POST(request: NextRequest) {
  const en = isEn()

  try {
    const stripe = getStripe()
    const { user_id, tier: tierParam } = await request.json()

    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json(
        { success: false, error: en ? API_ERR.noUser.en : API_ERR.noUser.zh },
        { status: 400 }
      )
    }

    const tier = findTier(tierParam)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const productName = en
      ? `ReplyCraft · ${tier.name}`
      : `怎么回 · ${tier.name}`

    const priceInMinorUnit = en
      ? Math.round(tier.price * CNY_TO_USD * 100) // USD cents
      : Math.round(tier.price * 100)               // CNY cents (分)

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      metadata: {
        user_id,
        tier: tier.tier,
        credits: String(tier.credits),
        price_yuan: String(tier.price),
      },
      line_items: [
        {
          price_data: {
            currency: en ? 'usd' : 'cny',
            product_data: {
              name: productName,
              description: tier.desc,
            },
            unit_amount: priceInMinorUnit,
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
    console.error(`[STRIPE] checkout session failed: ${reason}`)
    return NextResponse.json(
      { success: false, error: en ? API_ERR.paymentUnavailable.en : API_ERR.paymentUnavailable.zh },
      { status: 500 }
    )
  }
}