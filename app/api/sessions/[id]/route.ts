import { NextRequest, NextResponse } from 'next/server'
import { getSession, appendMessage, deleteSession } from '@/lib/session'
import { API_ERR } from '@/lib/i18n'

const isEn = () => process.env.NEXT_PUBLIC_LOCALE === 'en'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const result = await getSession(id)

  if (!result) {
    return NextResponse.json(
      { success: false, error: isEn() ? 'Session not found' : '会话不存在' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, session: result.session, messages: result.messages })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const body = await request.json()
    const { role, content, metadata } = body

    if (!role || !content) {
      return NextResponse.json(
        { success: false, error: isEn() ? API_ERR.badRequest.en : API_ERR.badRequest.zh },
        { status: 400 }
      )
    }

    const ok = await appendMessage({ sessionId: id, role, content, metadata })
    if (!ok) {
      return NextResponse.json(
        { success: false, error: isEn() ? 'Failed to append' : '追加失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { success: false, error: isEn() ? API_ERR.badRequest.en : API_ERR.badRequest.zh },
      { status: 400 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const ok = await deleteSession(id)

  if (!ok) {
    return NextResponse.json(
      { success: false, error: isEn() ? 'Failed to delete' : '删除失败' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}