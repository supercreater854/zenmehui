// ====== API 请求/返回 ======

export interface GenerateRequest {
  message: string
  user_id?: string
}

// 收敛版：只返回纯文本回复数组
export interface GenerateResponse {
  replies: string[]
}