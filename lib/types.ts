// 聊天回复类型
export type ReplyType = 'standard' | 'polite' | 'short' | 'funny' | 'strong'

// 场景识别
export type Scene = 'work' | 'love' | 'social' | 'unknown'

// 单条回复
export interface Reply {
  type: ReplyType
  text: string
}

// API 返回结构
export interface GenerateResponse {
  replies: Reply[]
  scene: Scene
}

// API 请求结构
export interface GenerateRequest {
  message: string
}