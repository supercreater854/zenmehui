"use client"

import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
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