import { NextRequest, NextResponse } from 'next/server'
import { getRemainingCredits } from '@/lib/credits'
import { API_ERR } from '@/lib/i18n'

const isEn = () => process.env.NEXT_PUBLIC_LOCALE === 'en'

export async function GET(request: NextRequest) {
  const en = isEn()
  const userId = request.nextUrl.searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: en ? API_ERR.noUserId.en : API_ERR.noUserId.zh }, { status: 400 })
  }

  try {
    const result = await getRemainingCredits(userId)
    return NextResponse.json(result)
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown'
    console.error(`[CREDITS] query failed: ${reason}`)
    return NextResponse.json({ credits: 0, unlimited: false, error: reason }, { status: 500 })
  }
}