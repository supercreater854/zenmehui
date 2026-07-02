import { NextRequest, NextResponse } from 'next/server'

const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.deepseek.com'
const AI_MODEL = process.env.AI_MODEL || 'deepseek-chat'

export async function POST(request: NextRequest) {
  try {
    const { message, intimacy, previous_reply } = await request.clone().json()

    if (!message || !previous_reply) {
      return NextResponse.json(
        { success: false, error: '缺少参数' },
        { status: 400 }
      )
    }

    const system = `你是一个高情商表达助手。

你正在为用户重新生成一条回复。
对方发来的消息："${message}"
${intimacy != null ? `双方关系亲密度：${intimacy}（0-100）。` : ''}

上一版回复是：「${previous_reply}」，用户不满意，需要一条完全不同的。

要求：
- 换一种截然不同的高情商策略（如果上一版用了共情，这次试试幽默或降维；如果上一版比较软，这次试试更直接有力的）
- 思维方式参考：共情先行、降维化解、以退为进、温柔拒绝、幽默转场、共识重构、反客为主、留白
- 不要解释、不要引号包裹、只输出回复本身`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: 'system', content: system }],
        temperature: 0.9,
        max_tokens: 500,
      }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: 'AI 请求失败' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content?.trim() || previous_reply

    return NextResponse.json({ success: true, reply: text })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: '请求超时' },
        { status: 504 }
      )
    }
    return NextResponse.json(
      { success: false, error: '生成失败' },
      { status: 500 }
    )
  }
}