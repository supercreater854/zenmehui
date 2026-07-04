import { NextRequest, NextResponse } from 'next/server'
import { getSessions, createSession } from '@/lib/session'
import { API_ERR } from '@/lib/i18n'

const isEn = () => process.env.NEXT_PUBLIC_LOCALE === 'en'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')

  if (!userId) {
    return NextResponse.json(
      { success: false, error: isEn() ? API_ERR.noUser.en : API_ERR.noUser.zh },
      { status: 400 }
    )
  }

  const sessions = await getSessions(userId)
  return NextResponse.json({ success: true, sessions })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, mode, title, first_message } = body

    if (!user_id || !mode || !title || !first_message) {
      return NextResponse.json(
        { success: false, error: isEn() ? API_ERR.badRequest.en : API_ERR.badRequest.zh },
        { status: 400 }
      )
    }

    const session = await createSession({
      userId: user_id,
      mode,
      title,
      firstMessage: first_message,
    })

    if (!session) {
      return NextResponse.json(
        { success: false, error: isEn() ? 'Failed to create session' : '创建会话失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, session })
  } catch {
    return NextResponse.json(
      { success: false, error: isEn() ? API_ERR.badRequest.en : API_ERR.badRequest.zh },
      { status: 400 }
    )
  }
}