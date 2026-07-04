// ====== API 请求/返回 ======

export interface GenerateRequest {
  message: string
  user_id?: string
  scenario?: string
  mode?: "quick" | "scenario"
  intimacy?: number
  style?: string
}

// 收敛版：只返回纯文本回复数组
export interface GenerateResponse {
  replies: string[]
}

// ====== 参谋模式 ======

export interface ScenarioMessage {
  role: "user" | "assistant"
  content: string
}

export interface ScenarioResponse {
  /** 局势分析文本 */
  analysis: string
  /** 策略建议列表 */
  strategies: ScenarioStrategy[]
}

export interface ScenarioStrategy {
  /** 策略名称 */
  label: string
  /** 适用场景说明 */
  subtitle: string
  /** 策略思路说明 */
  approach: string
  /** 参考回复 */
  reply: string
}