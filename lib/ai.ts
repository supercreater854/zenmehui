import type { GenerateResponse, Scene } from './types'

// 环境变量：通过 process.env 注入，兼容 OpenAI / DeepSeek
const AI_API_KEY = process.env.AI_API_KEY || ''
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.deepseek.com'
const AI_MODEL = process.env.AI_MODEL || 'deepseek-chat'

// 固定 System Prompt
const SYSTEM_PROMPT = `你是"聊天回复决策AI"，不是聊天机器人。
任务：根据用户聊天内容生成5种可直接发送回复。
规则：
- 不解释
- 不分析
- 不建议
- 只输出JSON
- 每条1-3句话
- 必须可直接发送
输出格式必须严格JSON：
{"replies":[{"type":"standard","text":""},{"type":"polite","text":""},{"type":"short","text":""},{"type":"funny","text":""},{"type":"strong","text":""}],"scene":"work|love|social"}`

// Fallback 兜底回复
const FALLBACK: GenerateResponse = {
  replies: [
    { type: 'standard', text: '好的' },
    { type: 'polite', text: '明白了，我处理一下' },
    { type: 'short', text: '好的' },
    { type: 'funny', text: '哈哈好的' },
    { type: 'strong', text: '这个我这边不太方便' },
  ],
  scene: 'unknown',
}

// 构建 Prompt
function buildPrompt(message: string, retryHint?: string): { system: string; user: string } {
  const user = retryHint
    ? `${message}\n\n${retryHint}`
    : message
  return { system: SYSTEM_PROMPT, user }
}

// 调用 AI API（兼容 OpenAI 格式）
// 内含 30 秒超时控制
async function callAI(message: string, retryHint?: string): Promise<string> {
  const { system, user } = buildPrompt(message, retryHint)

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
        temperature: 0.7,
        max_tokens: 2000,
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
      throw new Error("AI请求超时，请稍后重试")
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

// 从 AI 返回文本中提取并解析 JSON
function tryParseJSON(raw: string): GenerateResponse | null {
  let cleaned = raw.trim()

  // 去掉 markdown 代码块包裹
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim()
  }

  // 尝试提取第一个完整的 JSON 对象
  const jsonMatch = cleaned.match(/\{[\s\S]*"scene"[\s\S]*\}/)
  if (jsonMatch) {
    cleaned = jsonMatch[0]
  }

  try {
    const parsed = JSON.parse(cleaned)

    // 校验结构
    if (
      parsed &&
      Array.isArray(parsed.replies) &&
      parsed.replies.length > 0 &&
      typeof parsed.scene === 'string'
    ) {
      // 确保每条回复都有 type 和 text
      const validReplies = parsed.replies
        .filter((r: unknown): r is { type: string; text: string } => {
          if (typeof r !== 'object' || r === null) return false
          const obj = r as Record<string, unknown>
          return typeof obj.type === 'string' && typeof obj.text === 'string'
        })
        .map((r: { type: string; text: string }) => ({ type: r.type, text: r.text }))

      if (validReplies.length > 0) {
        return {
          replies: validReplies,
          scene: (['work', 'love', 'social'].includes(parsed.scene)
            ? parsed.scene
            : 'unknown') as Scene,
        }
      }
    }
    return null
  } catch {
    return null
  }
}

// 主入口：生成回复（含 retry + fallback）
export async function generateReplies(message: string): Promise<GenerateResponse> {
  // 一次尝试
  let raw = await callAI(message)
  let result = tryParseJSON(raw)
  if (result) return result

  // retry 前等待 300ms
  await new Promise(resolve => setTimeout(resolve, 300))

  // 二次请求修复（使用更简短的提示词降低成本）
  raw = await callAI(message, '请简短、直接输出JSON，不要解释')
  result = tryParseJSON(raw)
  if (result) return result

  // 兜底
  return FALLBACK
}