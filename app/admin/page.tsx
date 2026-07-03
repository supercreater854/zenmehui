"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts"

const ADMIN_PASSWORD = "zenmehui2024" // 与 API 保持一致

interface StatsData {
  overview: {
    total_users: number
    total_generations: number
    today_generations: number
    total_revenue: number
    vip_users: number
  }
  daily_events: Array<{
    date: string
    generate: number
    regenerate: number
    copy: number
  }>
  recent_events: Array<{
    user_id: string
    event: string
    payload: Record<string, unknown>
    created_at: string
  }>
}

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [data, setData] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setAuthed(true)
      setError("")
      localStorage.setItem("zmh_admin_token", password)
    } else {
      setError("密码错误")
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem("zmh_admin_token")
    if (saved === ADMIN_PASSWORD) {
      setAuthed(true)
    }
  }, [])

  useEffect(() => {
    if (!authed) return
    setLoading(true)
    fetch("/api/admin/stats", {
      headers: { Authorization: `Bearer ${ADMIN_PASSWORD}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("数据加载失败"))
      .finally(() => setLoading(false))
  }, [authed])

  if (!authed) {
    return (
      <div className="flex items-center justify-center min-h-screen px-5">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-6">怎么回 · 数据后台</h1>
          <input
            type="password"
            className="w-full px-4 py-3 text-sm bg-white rounded-xl border border-gray-200 outline-none focus:border-emerald-400 mb-3"
            placeholder="输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleLogin() }}
          />
          {error && <p className="text-xs text-red-400 mb-3">{error}</p>}
          <button
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-semibold shadow-md active:scale-95 transition-all"
            onClick={handleLogin}
          >
            进入后台
          </button>
          <Link href="/" className="block mt-4 text-center text-xs text-gray-400 hover:text-gray-600">
            ← 返回首页
          </Link>
        </div>
      </div>
    )
  }

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400 text-sm">加载中...</p>
      </div>
    )
  }

  const { overview, daily_events, recent_events } = data

  const cards = [
    { label: "总用户数", value: overview.total_users, color: "from-emerald-500 to-teal-500" },
    { label: "总生成次数", value: overview.total_generations, color: "from-blue-500 to-cyan-500" },
    { label: "今日生成", value: overview.today_generations, color: "from-orange-500 to-amber-500" },
    { label: "VIP 用户", value: `${overview.vip_users} (¥${overview.total_revenue})`, color: "from-purple-500 to-pink-500" },
  ]

  const eventColorMap: Record<string, string> = {
    generate: "#10b981",
    regenerate: "#f59e0b",
    copy: "#3b82f6",
  }
  const eventLabelMap: Record<string, string> = {
    generate: "生成",
    regenerate: "换说法",
    copy: "复制",
  }

  return (
    <div className="flex flex-col min-h-screen px-5 py-6">
      {/* Header */}
      <div className="mb-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl px-5 py-5 text-white shadow-lg shadow-emerald-200/50">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-white/60 hover:text-white/90 transition-colors">
            ← 返回
          </Link>
          <h1 className="text-lg font-bold">数据后台</h1>
          <button
            className="text-sm text-white/60 hover:text-white/90 transition-colors"
            onClick={() => {
              localStorage.removeItem("zmh_admin_token")
              setAuthed(false)
              setPassword("")
            }}
          >
            退出
          </button>
        </div>
      </div>

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${card.color} rounded-2xl p-4 text-white shadow-lg`}
          >
            <div className="text-xs text-white/60 mb-1">{card.label}</div>
            <div className="text-xl font-bold">{card.value}</div>
          </div>
        ))}
      </div>

      {/* 每日趋势图 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">最近 7 天趋势</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={daily_events}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
            <Tooltip />
            {Object.entries(eventColorMap).map(([key, color]) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={color}
                strokeWidth={2}
                dot={false}
                name={eventLabelMap[key]}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 每日柱状图 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">事件分布</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={daily_events}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
            <Tooltip />
            {Object.entries(eventColorMap).map(([key, color]) => (
              <Bar key={key} dataKey={key} fill={color} stackId="a" name={eventLabelMap[key]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 最近事件 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">最近 50 条事件</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-400">
                <th className="pb-2 pr-3">时间</th>
                <th className="pb-2 pr-3">用户</th>
                <th className="pb-2 pr-3">事件</th>
                <th className="pb-2">详情</th>
              </tr>
            </thead>
            <tbody>
              {recent_events.map((ev, i) => (
                <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50">
                  <td className="py-2 pr-3 text-gray-400 whitespace-nowrap">
                    {new Date(ev.created_at).toLocaleString("zh-CN", {
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-2 pr-3 text-gray-500 font-mono text-[10px]">{ev.user_id.slice(0, 8)}</td>
                  <td className="py-2 pr-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                      {eventLabelMap[ev.event] || ev.event}
                    </span>
                  </td>
                  <td className="py-2 text-gray-400 text-[10px]">
                    {JSON.stringify(ev.payload).slice(0, 60)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}