import { NextRequest, NextResponse } from 'next/server'
import { supabase, hasSupabase } from '@/lib/supabase'

// 简单的密码验证（生产环境建议用环境变量 + bcrypt）
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'zenmehui2024'

function checkAuth(request: NextRequest): boolean {
  const auth = request.headers.get('authorization')
  if (!auth) return false
  const token = auth.replace('Bearer ', '')
  return token === ADMIN_PASSWORD
}

export async function GET(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (!hasSupabase || !supabase) {
    return NextResponse.json({
      overview: { total_users: 0, total_generations: 0, today_generations: 0, total_revenue: 0 },
      daily_events: [],
      recent_events: [],
    })
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

    // ---- 概览 ----
    const [{ count: totalUsers }, { count: totalGenerations }, { count: todayGenerations }] =
      await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event', 'generate'),
        supabase.from('analytics_events').select('*', { count: 'exact', head: true })
          .eq('event', 'generate')
          .gte('created_at', today.toISOString()),
      ])

    // 估算收入（按 Stripe webhook 写入的 VIP 字段）
    const { count: vipCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('vip', true)

    // ---- 每日事件趋势（最近 7 天） ----
    const { data: dailyEvents } = await supabase
      .from('analytics_events')
      .select('event, created_at')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    const dailyMap: Record<string, Record<string, number>> = {}
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo)
      d.setDate(d.getDate() + i)
      const key = `${d.getMonth() + 1}/${d.getDate()}`
      dailyMap[key] = { generate: 0, regenerate: 0, copy: 0 }
    }

    if (dailyEvents) {
      for (const row of dailyEvents) {
        const d = new Date(row.created_at)
        const key = `${d.getMonth() + 1}/${d.getDate()}`
        if (dailyMap[key] && (row.event === 'generate' || row.event === 'regenerate' || row.event === 'copy')) {
          dailyMap[key][row.event] = (dailyMap[key][row.event] || 0) + 1
        }
      }
    }

    const dailyEventsChart = Object.entries(dailyMap).map(([date, counts]) => ({
      date,
      ...counts,
    }))

    // ---- 最近事件 ----
    const { data: recentEvents } = await supabase
      .from('analytics_events')
      .select('user_id, event, payload, created_at')
      .order('created_at', { ascending: false })
      .limit(50)

    return NextResponse.json({
      overview: {
        total_users: totalUsers || 0,
        total_generations: totalGenerations || 0,
        today_generations: todayGenerations || 0,
        total_revenue: (vipCount || 0) * 29.9, // 估算
        vip_users: vipCount || 0,
      },
      daily_events: dailyEventsChart,
      recent_events: recentEvents || [],
    })
  } catch (error) {
    console.error('[admin] stats query failed:', error)
    return NextResponse.json({ error: 'query failed' }, { status: 500 })
  }
}