import { NextRequest, NextResponse } from 'next/server'
import { trackEvent, AnalyticsEvent, AnalyticsPayload } from '@/lib/analytics'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, event, payload } = body

    if (!userId || !event) {
      return NextResponse.json({ success: false, error: 'Missing userId or event' }, { status: 400 })
    }

    await trackEvent(userId as string, event as AnalyticsEvent, (payload || {}) as AnalyticsPayload)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[TRACK] failed:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}