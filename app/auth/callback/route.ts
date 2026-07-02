import { NextResponse } from "next/server"

// Supabase magic link / OTP 确认后回调到此路由
// 将 hash fragment 中的 token 转发到 /login 页面处理
export async function GET(request: Request) {
  const url = new URL(request.url)
  const loginUrl = new URL("/login", url.origin)

  // 保留 Supabase 传递的 hash fragment（access_token 等）
  if (url.hash) {
    loginUrl.hash = url.hash
  }

  return NextResponse.redirect(loginUrl)
}