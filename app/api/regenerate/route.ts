import { NextRequest, NextResponse } from 'next/server'
import { trackEvent } from '@/lib/analytics'
import { API_ERR } from '@/lib/i18n'

const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.deepseek.com'
const AI_MODEL = process.env.AI_MODEL || 'deepseek-chat'

const isEn = () => process.env.NEXT_PUBLIC_LOCALE === 'en'

// ====== 风格标签映射 ======
type ReplyStyle =
  | '走心' | '幽默' | '犀利'
  | 'Warm' | 'Funny' | 'Direct'
  | '阴阳怪气·客气型' | '阴阳怪气·反讽型' | '阴阳怪气·暴击型'
  | 'Polite Shade' | 'Ironic Praise' | 'Absolute Shutdown'

function getStyleLabel(replyIndex: number, mode: 'normal' | 'sharp', en: boolean): ReplyStyle {
  if (mode === 'sharp') {
    if (en) {
      const labels: ReplyStyle[] = ['Polite Shade', 'Ironic Praise', 'Absolute Shutdown']
      return labels[replyIndex] || 'Ironic Praise'
    }
    const labels: ReplyStyle[] = ['阴阳怪气·客气型', '阴阳怪气·反讽型', '阴阳怪气·暴击型']
    return labels[replyIndex] || '阴阳怪气·反讽型'
  }
  if (en) {
    const labels: ReplyStyle[] = ['Warm', 'Funny', 'Direct']
    return labels[replyIndex] || 'Direct'
  }
  const labels: ReplyStyle[] = ['走心', '幽默', '犀利']
  return labels[replyIndex] || '犀利'
}

function buildRegeneratePrompt(
  message: string,
  intimacy: number | undefined,
  previousReply: string,
  replyStyle: ReplyStyle,
  en: boolean
): string {
  if (en) {
    const intimacyHint = intimacy != null
      ? `Closeness level: ${intimacy}/100.`
      : ''

    return `You are a high-EQ reply assistant.

They sent: "${message}"
${intimacyHint}

The user hit "New Suggestion" on a reply that was originally in the 【${replyStyle}】 style.
Generate a completely different reply in the same 【${replyStyle}】 style.

Requirements:
- Keep the 【${replyStyle}】 tone and vibe — don't drift styles
- Use a different angle or strategy from: "${previousReply}"
- Max 2 sentences, like real text messages
- No quotation marks around your reply, no explanations, just the reply
- FORBIDDEN: "I hope this helps", "It's worth noting", "Firstly... Secondly...", "To sum up", "I understand how you feel"

Output just one reply as JSON:
{"reply": "your new reply"}`
  }

  const intimacyHint = intimacy != null
    ? `双方关系亲密度：${intimacy}（0-100）。`
    : ''

  return `你是一个高情商表达助手。

对方发来：「${message}」
${intimacyHint}

用户点击"换说法"的这条回复，原本是【${replyStyle}】风格。
请生成一条同样是【${replyStyle}】风格、但说法完全不同的新回复。

要求：
- 保持【${replyStyle}】的语气和调性，不要跑风格
- 换一种策略或角度，不要说和旧回复类似的话
- 旧回复是：「${previousReply}」——请和这句话有明显差异
- 最多2句话，像真人微信聊天
- 不要引号包裹，不要解释，直接输出回复内容
- 绝对禁止用语：看起来、值得注意的是、希望这有帮助、首先其次最后、总的来说、我理解你的感受、这确实是个问题

仅输出一条回复，JSON 格式：
{"reply": "你的新回复"}`
}

export async function POST(request: NextRequest) {
  const en = isEn()

  try {
    const body = await request.clone().json()
    const {
      message,
      intimacy,
      previous_reply,
      reply_index = 0,
      style = 'normal',
    } = body

    if (!message || !previous_reply) {
      return NextResponse.json(
        { success: false, error: en ? API_ERR.missingParams.en : API_ERR.missingParams.zh },
        { status: 400 }
      )
    }

    const userId = body.user_id || ''
    trackEvent(userId, 'regenerate', {
      reply_index: reply_index ?? undefined,
      style: style ?? 'normal',
    }).catch(() => {})

    const replyStyle = getStyleLabel(reply_index as number, style as 'normal' | 'sharp', en)
    const system = buildRegeneratePrompt(message, intimacy, previous_reply, replyStyle, en)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    let response: Response
    try {
      response = await fetch(`${AI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [{ role: 'system', content: system }],
          temperature: 0.85,
          max_tokens: 300,
        }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error(`[regenerate] AI API failed: ${response.status} ${errorText}`)
      return NextResponse.json(
        { success: false, error: en ? API_ERR.aiRequestFailed.en : API_ERR.aiRequestFailed.zh },
        { status: 500 }
      )
    }

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content?.trim() || ''

    // 尝试 JSON 解析
    try {
      const parsed = JSON.parse(raw)
      if (typeof parsed.reply === 'string' && parsed.reply.trim()) {
        return NextResponse.json({ success: true, reply: parsed.reply.trim() })
      }
    } catch {
      // JSON 解析失败，尝试用原始文本（去掉可能的引号包裹）
    }

    // 兜底：去掉首尾引号后直接当回复
    const fallback = raw.replace(/^["'「」]|["'「」]$/g, '').trim()
    if (fallback && fallback !== previous_reply) {
      return NextResponse.json({ success: true, reply: fallback })
    }

    // 最终兜底：返回旧回复
    return NextResponse.json({ success: true, reply: previous_reply })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: en ? API_ERR.timeout.en : API_ERR.timeout.zh },
        { status: 504 }
      )
    }
    console.error(`[regenerate] unexpected error:`, error)
    return NextResponse.json(
      { success: false, error: en ? API_ERR.generationFailed.en : API_ERR.generationFailed.zh },
      { status: 500 }
    )
  }
}