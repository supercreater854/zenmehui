import { NextRequest, NextResponse } from 'next/server'
import { getRemainingCredits } from '@/lib/credits'

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json({ error: '缺少 user_id' }, { status: 400 })
  }

  try {
    const result = await getRemainingCredits(userId)
    return NextResponse.json(result)
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown'
    console.error(`[CREDITS] 查询失败: ${reason}`)
    return NextResponse.json({ credits: 0, unlimited: false, error: reason }, { status: 500 })
  }
}