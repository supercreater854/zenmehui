"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

export function createClient(): SupabaseClient {
  // SSR 期间使用占位值避免 createBrowserClient 抛错
  // 所有 Supabase 调用（useEffect、事件处理器）仅在客户端运行，不会命中占位客户端
  if (typeof window === "undefined") {
    return createBrowserClient("https://placeholder.supabase.co", "placeholder-key")
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY")
  }
  return createBrowserClient(url, key)
}

// 获取当前有效用户 ID：优先登录用户，回退匿名
export function getAnonUserId(): string {
  if (typeof window === "undefined") return ""
  const stored = localStorage.getItem("zmh_user_id")
  if (stored) return stored
  const id = crypto.randomUUID()
  localStorage.setItem("zmh_user_id", id)
  return id
}