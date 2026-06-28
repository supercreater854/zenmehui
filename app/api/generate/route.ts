import { NextRequest, NextResponse } from 'next/server'
import { generateReplies } from '@/lib/ai'
import { checkDailyLimit, logUsage } from '@/lib/user'

const DAILY_LIMIT = 10

// ====== API Handler ======
export async function POST(request: NextRequest) {
  // 从请求 body 中提取 user_id（前端 localStorage UUID）
  let userId: string | null = null

  try {
    const body = await request.clone().json()
    userId = body.user_id || null
  } catch {
    return NextResponse.json(
      { success: false, error: '请求格式错误', type: 'user' },
      { status: 400 }
    )
  }

  // 缺少 user_id → 拒绝
  if (!userId || typeof userId !== 'string') {
    return NextResponse.json(
      { success: false, error: '缺少用户标识', type: 'user' },
      { status: 400 }
    )
  }

  // ====== 每日限制检查（Supabase） ======
  const limit = await checkDailyLimit(userId)

  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: limit.reason || '今日免费次数已用完', type: 'limit' },
      { status: 429 }
    )
  }

  const isVIP = limit.user.vip

  try {
    const body = await request.json()
    const { message } = body

    // 用户错误：空输入
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      console.log(`[ANALYTICS] user_id=${userId} vip=${isVIP} success=false limited=false`)
      return NextResponse.json(
        { success: false, error: '请输入聊天内容', type: 'user' },
        { status: 400 }
      )
    }

    // 用户错误：超长输入
    if (message.trim().length > 2000) {
      console.log(`[ANALYTICS] user_id=${userId} vip=${isVIP} success=false limited=false`)
      return NextResponse.json(
        { success: false, error: '内容过长，请控制在2000字以内', type: 'user' },
        { status: 400 }
      )
    }

    // 调 AI 生成
    const result = await generateReplies(message.trim())

    // 写入使用日志
    await logUsage({ userId, scene: result.scene, success: true })

    console.log(
      `[ANALYTICS] user_id=${userId} vip=${isVIP} success=true scene=${result.scene} remaining=${DAILY_LIMIT - (isVIP ? 0 : limit.user.daily_count)}`
    )
    return NextResponse.json(result)
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown'

    // 失败也记录日志
    await logUsage({ userId, scene: 'unknown', success: false }).catch(() => {})

    console.log(`[ANALYTICS] user_id=${userId} vip=${isVIP} success=false reason=${reason}`)
    return NextResponse.json(
      { success: false, error: 'AI生成失败，请重试', type: 'system' },
      { status: 500 }
    )
  }
}