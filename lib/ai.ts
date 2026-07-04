import type { GenerateResponse, ScenarioResponse, ScenarioMessage, ScenarioStrategy } from './types'
import { formatIntimacyForPrompt } from './intimacy'
import { EN_SYSTEM_PROMPT, EN_SHARP_PROMPT, EN_FALLBACK, EN_SHARP_FALLBACK, ZH_SCENARIO_PROMPT, EN_SCENARIO_PROMPT } from './prompts'

const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.deepseek.com'
const AI_MODEL = process.env.AI_MODEL || 'deepseek-chat'

// ====== Locale 判定 ======
function isEn(): boolean {
  if (process.env.NEXT_PUBLIC_LOCALE) return process.env.NEXT_PUBLIC_LOCALE === 'en'
  if (typeof process !== 'undefined' && process.env.VERCEL_URL) {
    return process.env.VERCEL_URL?.includes('replycraft') || false
  }
  return false
}

// ====== 精简禁用规则（节省 token） ======
const ZH_BANNED_PREFIX = `## 禁用
- 不要说"看起来"、"值得注意的是"、"希望这对你有所帮助"
- 不要用分点词（首先其次最后）和总结词（总的来说）
- 不要写"加油"结尾的假安慰
- 不要用英文双引号
- 不要写作文，1-2句够

`

const EN_BANNED_PREFIX = `## Banned
- No "I hope this helps", "It's worth noting", "It seems that"
- No numbered lists (firstly, secondly) or summary words
- No fake encouragement ("You've got this!")
- No quotation marks around sentences
- No essays, 1-2 sentences max

`

// ====== 中文主 prompt ======
const ZH_SYSTEM_PROMPT = `你就是一个正在帮朋友想怎么回微信的人。

核心：你不是客服，不是AI，你是他哥们/闺蜜。
说话方式：像微信聊天。短。直接。带语气。不要铺垫不要解释。

三条回复，风格拉开：

1. 走心挂 → 暖、真诚、说到点上。但别啰嗦，两句话够。
2. 幽默挂 → 巧、反转、让人笑。自嘲或打趣都行。
3. 直接挂 → 快、准、不绕弯。一句到位，像朋友在耳边说的。

每条1-2句话。多用"啊 吧 呢 哈 嘛 哎 哦"这些语气词。
不要写成作文。就是聊天。

${ZH_BANNED_PREFIX}
输出JSON：
{"replies":["走心短回复","幽默短回复","直接短回复"]}`

// ====== 中文 sharp 模式 ======
const ZH_SHARP_PROMPT = `你是阴阳怪气大师。

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
- 不带脏字。

## 内容边界（非常重要）
- 讽刺针对对方的具体**行为和言论**，不针对对方的身份特征。
- 不评价外貌、身体、家庭出身、地域、性别、年龄。
- 可以损对方的逻辑、双标、言行不一，但不能损对方这个人本身。

三条回复明显不同：
1. 客气型 → 表面客气周到，话外全是刀
2. 反讽型 → 用夸奖的方式嘲讽
3. 暴击型 → 极短，冷淡，一个字到一句话

${ZH_BANNED_PREFIX}
输出JSON：
{"replies":["客气型","反讽型","暴击型"]}`

// ====== Fallback ======
const ZH_FALLBACK: GenerateResponse = {
  replies: ['嗯明白', '哈哈哈好的', '收到'],
}

const ZH_SHARP_FALLBACK: GenerateResponse = {
  replies: ['嗯嗯你说得对', '那你很棒哦', '6'],
}

// ====== 通用 AI 调用 ======
async function callAI(system: string, user: string, maxTokens = 400): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 45000)

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
        temperature: 0.85,
        max_tokens: maxTokens,
        stream: false,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AI API call failed (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(isEn() ? 'AI request timed out' : 'AI请求超时，请稍后重试')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

// ====== 流式 AI 调用（SSE） ======
async function* callAIStream(system: string, user: string): AsyncGenerator<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 45000)

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
        temperature: 0.85,
        max_tokens: 400,
        stream: true,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AI API stream failed (${response.status}): ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6).trim()
        if (data === '[DONE]') return

        try {
          const parsed = JSON.parse(data)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) yield content
        } catch { /* skip malformed SSE chunks */ }
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(isEn() ? 'AI request timed out' : 'AI请求超时，请稍后重试')
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
  scenario?: string,
): Promise<GenerateResponse> {
  const en = isEn()

  // ====== 场景上下文注入 ======
  const scenarioPrefix = scenario?.trim()
    ? (en
      ? `## Context (use this to understand the situation)\n${scenario}\n\nBased on the context above, craft replies that fit the full situation.\n\n`
      : `## 背景信息（理解语境用）\n${scenario}\n\n请基于以上背景理解对话语境，生成合适的回复。\n\n`)
    : ''

  const basePrompt = style === 'sharp'
    ? (en ? EN_SHARP_PROMPT : ZH_SHARP_PROMPT)
    : (en ? EN_SYSTEM_PROMPT : ZH_SYSTEM_PROMPT)
  const fallback = style === 'sharp'
    ? (en ? EN_SHARP_FALLBACK : ZH_SHARP_FALLBACK)
    : (en ? EN_FALLBACK : ZH_FALLBACK)

  const prompt = intimacy != null
    ? `${scenarioPrefix}${basePrompt}\n\n${formatIntimacyForPrompt(intimacy)}`
    : `${scenarioPrefix}${basePrompt}`

  const userMessage = en
    ? `They sent: "${message}"`
    : `对方发来："${message}"`

  const postfix = en
    ? 'No essays. Short. Like a real person.'
    : '别写作文。短。像真人。'

  let raw = await callAI(prompt + '\n\n' + postfix, userMessage)
  let result = parseResponse(raw)
  if (result) return result

  // 立即重试，不等延迟
  raw = await callAI(prompt, `${userMessage}\n\n${en ? 'Output JSON directly, no filler' : '直接输出JSON，别啰嗦'}`)
  result = parseResponse(raw)
  if (result) return result

  return fallback
}

// ====== 流式快速回复 ======
export async function* generateRepliesStream(
  message: string,
  intimacy?: number,
  style?: string,
  scenario?: string,
): AsyncGenerator<{ type: 'chunk'; text: string } | { type: 'done'; result: GenerateResponse }> {
  const en = isEn()

  const scenarioPrefix = scenario?.trim()
    ? (en
      ? `## Context\n${scenario}\n\nBased on the context above, craft replies.\n\n`
      : `## 背景信息\n${scenario}\n\n请基于以上背景生成回复。\n\n`)
    : ''

  const basePrompt = style === 'sharp'
    ? (en ? EN_SHARP_PROMPT : ZH_SHARP_PROMPT)
    : (en ? EN_SYSTEM_PROMPT : ZH_SYSTEM_PROMPT)
  const fallback = style === 'sharp'
    ? (en ? EN_SHARP_FALLBACK : ZH_SHARP_FALLBACK)
    : (en ? EN_FALLBACK : ZH_FALLBACK)

  const prompt = intimacy != null
    ? `${scenarioPrefix}${basePrompt}\n\n${formatIntimacyForPrompt(intimacy)}`
    : `${scenarioPrefix}${basePrompt}`

  const userMessage = en
    ? `They sent: "${message}"`
    : `对方发来："${message}"`

  // 第一轮流式
  let fullText = ''
  for await (const chunk of callAIStream(prompt, userMessage)) {
    fullText += chunk
    yield { type: 'chunk', text: chunk }
  }

  let result = parseResponse(fullText)
  if (result) {
    yield { type: 'done', result }
    return
  }

  // 立即重试
  fullText = ''
  for await (const chunk of callAIStream(prompt, `${userMessage}\n\n直接输出JSON，别啰嗦`)) {
    fullText += chunk
    yield { type: 'chunk', text: chunk }
  }

  result = parseResponse(fullText)
  yield { type: 'done', result: result || fallback }
}

// ====== 多轮对话 AI 调用 ======
async function callAIWithHistory(
  system: string,
  history: ScenarioMessage[],
  newMessage: string,
): Promise<string> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 40000)

  const messages: { role: string; content: string }[] = [
    { role: 'system', content: system },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: 'user', content: newMessage },
  ]

  try {
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        temperature: 0.8,
        max_tokens: 600,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AI API call failed (${response.status}): ${errorText}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(isEn() ? 'AI request timed out' : 'AI请求超时，请稍后重试')
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

// ====== 参谋模式：局势分析 + 策略建议 ======
export async function analyzeScenario(
  scenario: string,
  intimacy?: number,
  history?: ScenarioMessage[],
): Promise<ScenarioResponse> {
  const en = isEn()
  const systemPrompt = en ? EN_SCENARIO_PROMPT : ZH_SCENARIO_PROMPT

  // 亲密度注入
  let fullPrompt = systemPrompt
  if (intimacy != null) {
    fullPrompt += '\n\n' + formatIntimacyForPrompt(intimacy)
  }

  const userMessage = en
    ? `Here's the situation I need help with:\n\n${scenario}`
    : `我遇到的场景：\n\n${scenario}`

  // 第一轮：初始分析
  if (!history || history.length === 0) {
    let raw = await callAI(fullPrompt, userMessage, 1200)
    const result = parseScenarioResponse(raw, en)
    if (result) return result

    // 立即重试，不等延迟
    raw = await callAI(fullPrompt, `${userMessage}\n\n${en ? 'Structure your response with Situation Analysis and Strategic Approaches.' : '请按照局势分析和策略方向的结构回复。'}`, 1200)
    const retry = parseScenarioResponse(raw, en)
    if (retry) return retry

    return fallbackScenarioResponse(en)
  }

  // 追问轮次
  const raw = await callAIWithHistory(fullPrompt, history, userMessage)
  const result = parseScenarioResponse(raw, en)
  if (result) return result

  return fallbackScenarioResponse(en)
}

// ====== 解析参谋模式返回 ======
function parseScenarioResponse(raw: string, en: boolean): ScenarioResponse | null {
  const text = raw.trim()
  if (!text) return null

  // 优先尝试 JSON 解析（新 prompt 输出纯 JSON）
  const jsonMatch = text.match(/\{[\s\S]*"analysis"[\s\S]*"strategies"[\s\S]*\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.analysis && Array.isArray(parsed.strategies)) {
        return {
          analysis: parsed.analysis,
          strategies: parsed.strategies.map((s: any) => ({
            label: s.title || s.label || '',
            subtitle: s.subtitle || '',
            approach: s.approach || '',
            reply: s.sample_reply || s.reply || '',
          })),
        }
      }
    } catch { /* JSON parse failed, fall through to heuristic */ }
  }

  // 启发式后备解析（兼容旧 prompt 的 markdown 格式）
  const strategies: ScenarioStrategy[] = []
  const strategyBlocks = text.split(/(?:###?\s*)?策略[A-C一二三]?[：:]\s*|(?:###?\s*)?(?:Strategy|Approach)\s*[A-C]?[：:]\s*/i).filter(Boolean)

  if (strategyBlocks.length <= 1) {
    const parts = text.split(/\n(?=思路[：:]|参考回复[：:]|Approach[：:]|Sample reply[：:])/i)
    if (parts.length >= 2) {
      return {
        analysis: parts[0].trim(),
        strategies: [{
          label: en ? 'Suggested approach' : '建议策略',
          subtitle: '',
          approach: '',
          reply: parts.slice(1).join('\n').trim(),
        }],
      }
    }
    return { analysis: text, strategies: [] }
  }

  const analysis = strategyBlocks[0].trim()
  for (let i = 1; i < strategyBlocks.length && i <= 3; i++) {
    const block = strategyBlocks[i].trim()
    const approachMatch = block.match(/思路[：:]\s*([\s\S]+?)(?=\n参考回复|$)/)
    const replyMatch = block.match(/参考回复[：:]\s*([\s\S]+?)$/)
    const enApproachMatch = block.match(/(?:Approach|Core logic)[：:]\s*([\s\S]+?)(?=\n(?:Sample|What)|$)/i)
    const enReplyMatch = block.match(/(?:Sample reply|What to say)[：:]\s*([\s\S]+?)$/i)
    const approach = (approachMatch?.[1] || enApproachMatch?.[1] || '').trim()
    const reply = (replyMatch?.[1] || enReplyMatch?.[1] || '').trim()
    if (approach || reply) {
      strategies.push({
        label: en ? `Strategy ${String.fromCharCode(64 + i)}` : `策略${['一','二','三'][i-1] || i}`,
        subtitle: '',
        approach: approach || reply,
        reply: reply || approach,
      })
    }
  }

  return { analysis, strategies: strategies.slice(0, 3) }
}

// ====== 参谋模式 fallback ======
function fallbackScenarioResponse(en: boolean): ScenarioResponse {
  return {
    analysis: en
      ? 'This is a complex situation. Let me break it down: there are multiple factors at play — the relationship dynamic, what\'s at stake, and what outcome you want. The key is to be clear on your goal first, then choose the approach that fits.'
      : '这个情况确实复杂，涉及几层关系。关键先想清楚你最想要什么结果，再选策略。一般来说，坦诚但不冲动、给对方台阶但不委屈自己，是最稳的路线。',
    strategies: [
      {
        label: en ? 'Direct approach' : '坦诚沟通',
        subtitle: en ? 'When you want honest communication' : '适合你想真诚沟通',
        approach: en ? 'Be straightforward and honest' : '把自己的真实想法说清楚，不带情绪',
        reply: en ? 'I want to be upfront with you about this...' : '我想跟你直说，这件事我的想法是...',
      },
      {
        label: en ? 'Meet halfway' : '各退一步',
        subtitle: en ? 'When you want to preserve harmony' : '适合你想维持关系、不伤和气',
        approach: en ? 'Find a middle ground that works for both' : '找一个双方都能接受的点，不伤和气',
        reply: en ? 'I see where you\'re coming from. How about we...' : '我理解你的角度，要不我们这样...',
      },
    ],
  }
}