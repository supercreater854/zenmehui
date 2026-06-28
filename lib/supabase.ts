import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || ''

// 检测是否配置了真实 Supabase
const isConfigured =
  supabaseUrl.length > 0 &&
  !supabaseUrl.includes('your-project') &&
  supabaseKey.length > 0 &&
  !supabaseKey.includes('your-service')

// 服务端 Supabase 客户端（未配置时为 null，触发本地降级模式）
export const supabase: SupabaseClient | null = isConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null

// 供外部判断当前是否处于 Supabase 模式
export const hasSupabase = isConfigured