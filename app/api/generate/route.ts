import { NextRequest, NextResponse } from 'next/server'
import { generateReplies, generateRepliesStream, analyzeScenario } from '@/lib/ai'
import { logUsage } from '@/lib/user'
import { consumeCredit, getRemainingCredits } from '@/lib/credits'
import { trackEvent } from '@/lib/analytics'
import { API_ERR } from '@/lib/i18n'

const isEn = () => process.env.NEXT_PUBLIC_LOCALE === 'en'

export async function POST(request: NextRequest) {
  let userId: string | null = null

  try {
    const body = await request.clone().json()
    userId = body.user_id || null
  } catch {
    return NextResponse.json(
      { success: false, error: isEn() ? API_ERR.badRequest.en : API_ERR.badRequest.zh, type: 'user' },
      { status: 400 }
    )
  }

  if (!userId || typeof userId !== 'string') {
    return NextResponse.json(
      { success: false, error: isEn() ? API_ERR.noUser.en : API_ERR.noUser.zh, type: 'user' },
      { status: 400 }
    )
  }

  try {
    // ====== 积分检查 ======
    const creditCheck = await consumeCredit(userId)

    if (!creditCheck.allowed) {
      return NextResponse.json(
        { success: false, error: creditCheck.reason || (isEn() ? API_ERR.noCredits.en : API_ERR.noCredits.zh), type: 'limit', remaining: creditCheck.remaining },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { message, intimacy, style, mode, scenario, history, stream } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      console.log(`[ANALYTICS] user_id=${userId} success=false reason=empty_input remaining=${creditCheck.remaining}`)
      return NextResponse.json(
        { success: false, error: isEn() ? API_ERR.emptyContent.en : API_ERR.emptyContent.zh, type: 'user' },
        { status: 400 }
      )
    }

    if (message.trim().length > 2000) {
      console.log(`[ANALYTICS] user_id=${userId} success=false reason=too_long remaining=${creditCheck.remaining}`)
      return NextResponse.json(
        { success: false, error: isEn() ? API_ERR.tooLong.en : API_ERR.tooLong.zh, type: 'user' },
        { status: 400 }
      )
    }

    // ====== 模式分支 ======
    if (mode === 'scenario') {
      // 参谋模式：message 是场景描述或追问
      // history 是之前的对话记录（追问时传入）
      const result = await analyzeScenario(message.trim(), intimacy, history)
      await logUsage({ userId, scene: 'scenario_analyzed', success: true })
      trackEvent(userId, 'scenario_analyze', {
        message_length: message.trim().length,
        intimacy: intimacy ?? undefined,
      }).catch(() => {})

      console.log(
        `[ANALYTICS] user_id=${userId} mode=scenario success=true remaining=${creditCheck.remaining}`
      )
      return NextResponse.json({ success: true, scenario_result: result, remaining: creditCheck.remaining })
    }

    // ====== 快速回复 + 流式 ======
    if (stream) {
      const encoder = new TextEncoder()
      const readable = new ReadableStream({
        async start(controller) {
          try {
            const gen = generateRepliesStream(message.trim(), intimacy, style, scenario)
            for await (const event of gen) {
              controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'))
            }
            controller.close()

            await logUsage({ userId, scene: 'generated', success: true })
            trackEvent(userId, 'generate', {
              message_length: message.trim().length,
              intimacy: intimacy ?? undefined,
              style: style ?? 'normal',
            }).catch(() => {})
          } catch (error) {
            const errMsg = error instanceof Error ? error.message : 'unknown'
            controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', error: errMsg }) + '\n'))
            controller.close()
            await logUsage({ userId, scene: 'unknown', success: false }).catch(() => {})
          }
        },
      })

      return new Response(readable, {
        headers: {
          'Content-Type': 'application/x-ndjson',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      })
    }

    // 快速回复模式（非流式）
    const result = await generateReplies(message.trim(), intimacy, style, scenario)

    await logUsage({ userId, scene: 'generated', success: true })
    trackEvent(userId, 'generate', {
      message_length: message.trim().length,
      intimacy: intimacy ?? undefined,
      style: style ?? 'normal',
      reply_count: result.replies.length,
    }).catch(() => {})

    console.log(
      `[ANALYTICS] user_id=${userId} mode=quick success=true replies=${result.replies.length} remaining=${creditCheck.remaining}`
    )
    return NextResponse.json({ success: true, ...result, remaining: creditCheck.remaining })
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown'
    console.error(`[ERROR] generate route failed: ${reason}`)
    if (error instanceof Error && error.stack) {
      console.error(`[ERROR] stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`)
    }

    await logUsage({ userId, scene: 'unknown', success: false }).catch(() => {})

    // 查询剩余积分（用于错误响应）
    let remaining = -1
    try {
      const info = await getRemainingCredits(userId)
      remaining = info.credits
    } catch { /* ignore */ }

    console.error(`[ANALYTICS] user_id=${userId} error=${reason}`)
    return NextResponse.json(
      { success: false, error: isEn() ? API_ERR.aiFailed.en : API_ERR.aiFailed.zh, type: 'system', remaining },
      { status: 500 }
    )
  }
}