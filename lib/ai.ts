import type { GenerateResponse } from './types'
import { formatIntimacyForPrompt } from './intimacy'

const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.deepseek.com'
const AI_MODEL = process.env.AI_MODEL || 'deepseek-chat'

// ====== 主 prompt：像人一样说话 ======
const SYSTEM_PROMPT = `你就是一个正在帮朋友想怎么回微信的人。

核心：你不是客服，不是AI，你是他哥们/闺蜜。
说话方式：像微信聊天。短。直接。带语气。不要铺垫不要解释。

三条回复，风格拉开：

1. 走心挂 → 暖、真诚、说到点上。但别啰嗦，两句话够。
2. 幽默挂 → 巧、反转、让人笑。自嘲或打趣都行。
3. 直接挂 → 快、准、不绕弯。一句到位，像朋友在耳边说的。

每条1-2句话。多用"啊 吧 呢 哈 嘛 哎 哦"这些语气词。
不要写成作文。不要"首先其次最后"。就是聊天。

输出JSON：
{"replies":["走心短回复","幽默短回复","直接短回复"]}`

// ====== sharp 模式：真正阴阳怪气 ======
const SHARP_PROMPT = `你是阴阳怪气大师。

风格参考：
- "啊对对对"
- "嗯嗯你说得都对"
- "好的呢亲"
- "那你很厉害哦"
- "你开心就好"
- "哦"
- "6"

要点：
- 短。极其短。几个字能解决就别写句子。
- 表面上顺着对方，实际上谁都听得出来你在反讽。
- 像网上那些经典阴阳怪气回复一样，又轻又毒。
- 不带脏字，不人身攻击。就是让人愣一下，然后想笑。

三条回复明显不同：
1. 客气型 → 表面客气周到，话外全是刀
2. 反讽型 → 用夸奖的方式嘲讽
3. 暴击型 → 极短，冷淡，一个字到一句话

输出JSON：
{"replies":["客气型","反讽型","暴击型"]}`

// ====== Fallback ======
const FALLBACK: GenerateResponse = {
  replies: ['嗯明白', '哈哈哈好的', '收到'],
}

const SHARP_FALLBACK: GenerateResponse = {
  replies: ['嗯嗯你说得对', '那你很棒哦', '6'],
}

// ====== 通用 AI 调用 ======
async function callAI(system: string, user: string): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.95,
        max_tokens: 800,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AI API 调用失败 (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI请求超时，请稍后重试')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

// ====== JSON 解析 ======
function parseResponse(raw: string): GenerateResponse | null {
  try {
    let cleaned = raw.trim()
    const codeBlock = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (codeBlock) cleaned = codeBlock[1].trim()

    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])

    if (Array.isArray(parsed.replies) && parsed.replies.length > 0) {
      const replies = parsed.replies
        .filter((r: unknown): r is string => typeof r === 'string' && r.trim().length > 0)
        .map((r: string) => r.trim())

      if (replies.length > 0) return { replies }
    }
    return null
  } catch {
    return null
  }
}

// ====== 主入口 ======
export async function generateReplies(
  message: string,
  intimacy?: number,
  style?: string,
): Promise<GenerateResponse> {
  const basePrompt = style === 'sharp' ? SHARP_PROMPT : SYSTEM_PROMPT

  const prompt = intimacy != null
    ? `${basePrompt}\n\n关系程度：${formatIntimacyForPrompt(intimacy)}`
    : basePrompt

  const userMessage = `对方发来："${message}"`

  let raw = await callAI(prompt + '\n\n别写作文。短。像真人。', userMessage)
  let result = parseResponse(raw)
  if (result) return result

  await new Promise(resolve => setTimeout(resolve, 300))
  raw = await callAI(prompt, `${userMessage}\n\n直接输出JSON，别啰嗦`)
  result = parseResponse(raw)
  if (result) return result

  return style === 'sharp' ? SHARP_FALLBACK : FALLBACK
}