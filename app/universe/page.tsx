"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { loadContacts, getIntimacyLabel, getIntimacyTier, type ContactMemory } from "@/lib/intimacy"
import { UNIVERSE } from "@/lib/i18n"
import { t } from "@/lib/t"

export default function UniversePage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [contacts, setContacts] = useState<ContactMemory[]>([])

  useEffect(() => {
    setContacts(loadContacts())
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || contacts.length === 0) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = Math.min(rect.width, 400) * dpr
    canvas.style.height = `${Math.min(rect.width, 400)}px`

    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = Math.min(rect.width, 400)
    const cx = w / 2
    const cy = h / 2
    const maxR = Math.min(w, h) / 2 - 30

    ctx.clearRect(0, 0, w, h)

    // 背景氛围
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR)
    bgGrad.addColorStop(0, "#ecfdf5")
    bgGrad.addColorStop(0.7, "#f8fafc")
    bgGrad.addColorStop(1, "#f1f5f9")
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, w, h)

    // 环绕星点
    for (let i = 0; i < 30; i++) {
      const starR = Math.random() * maxR * 0.95
      const starA = Math.random() * Math.PI * 2
      ctx.beginPath()
      ctx.arc(cx + Math.cos(starA) * starR, cy + Math.sin(starA) * starR, 0.5, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(148, 163, 184, 0.3)"
      ctx.fill()
    }

    // 同心圆（内 = 亲密，外 = 疏远）
    const trackCount = 7
    const labels = t(UNIVERSE.orbits)
    for (let i = 0; i < trackCount; i++) {
      const r = ((i + 1) / trackCount) * maxR
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = i < 3 ? "rgba(34,197,94,0.12)" : "rgba(0,0,0,0.05)"
      ctx.lineWidth = i < 3 ? 1.5 : 1
      ctx.setLineDash(i < 3 ? [] : [4, 8])
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = "rgba(0,0,0,0.3)"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "right"
      ctx.fillText(labels[i], cx - r - 6, cy - r + 4)
    }

    // 中心
    ctx.beginPath()
    ctx.arc(cx, cy, 10, 0, Math.PI * 2)
    ctx.fillStyle = "#22c55e"
    ctx.fill()
    ctx.strokeStyle = "#fff"
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = "rgba(0,0,0,0.5)"
    ctx.font = "12px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(t(UNIVERSE.centerMe), cx, cy + 25)

    // 联系人分布在对应轨道
    const getOrbitColor = (v: number) => {
      if (v >= 86) return "#22c55e"
      if (v >= 71) return "#34d399"
      if (v >= 56) return "#fbbf24"
      if (v >= 41) return "#fb923c"
      if (v >= 26) return "#94a3b8"
      if (v >= 11) return "#cbd5e1"
      return "#e2e8f0"
    }

    const angleMap: Record<string, number> = {}
    contacts.forEach(c => {
      const idx = Math.floor(c.intimacy / (100 / trackCount))
      const trackIdx = trackCount - 1 - Math.min(idx, trackCount - 1)
      const r = ((trackIdx + 1) / trackCount) * maxR

      const key = String(trackIdx)
      if (!angleMap[key]) angleMap[key] = Math.random() * Math.PI * 2
      else angleMap[key] += (Math.PI * 2) / (contacts.filter(cc => {
        const ccIdx = Math.floor(cc.intimacy / (100 / trackCount))
        return trackCount - 1 - Math.min(ccIdx, trackCount - 1) === trackIdx
      }).length || 1)

      const angle = angleMap[key]
      const x = cx + Math.cos(angle) * r
      const y = cy + Math.sin(angle) * r
      const color = getOrbitColor(c.intimacy)

      ctx.beginPath()
      ctx.arc(x, y, 10, 0, Math.PI * 2)
      ctx.fillStyle = color + "30"
      ctx.fill()

      ctx.beginPath()
      ctx.arc(x, y, 7, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = "#fff"
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = "rgba(0,0,0,0.7)"
      ctx.font = "bold 11px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(`${c.name}`, x, y - 16)
      ctx.fillStyle = "rgba(0,0,0,0.45)"
      ctx.font = "10px sans-serif"
      ctx.fillText(`·${c.intimacy}`, x, y + 20)
    })
  }, [contacts])

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col min-h-screen px-5 py-6">
        {/* Header — emerald gradient brand bar */}
        <div className="mb-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl px-5 py-5 text-white shadow-lg shadow-emerald-200/50 animate-float-up">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-sm text-white/60 hover:text-white/90 transition-colors">
              {t(UNIVERSE.back)}
            </Link>
            <h1 className="text-lg font-bold">{t(UNIVERSE.title)}</h1>
            <div className="w-10" />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm mb-4">{t(UNIVERSE.empty)}</p>
          <Link
            href="/contacts"
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-medium shadow-md active:scale-95 transition-all"
          >
            {t(UNIVERSE.addContact)}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen px-5 py-6">
      {/* Header — emerald gradient brand bar */}
      <div className="mb-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl px-5 py-5 text-white shadow-lg shadow-emerald-200/50 animate-float-up">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-white/60 hover:text-white/90 transition-colors">
            {t(UNIVERSE.back)}
          </Link>
          <h1 className="text-lg font-bold">{t(UNIVERSE.title)}</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Canvas 人际圈图 */}
      <canvas
        ref={canvasRef}
        className="w-full rounded-2xl shadow-sm border border-gray-100 bg-white animate-card-in"
        onClick={() => router.push("/contacts")}
      />

      {/* 联系人列表 */}
      <div className="mt-5 flex flex-col gap-2">
        {contacts.map((c, i) => {
          const tier = getIntimacyTier(c.intimacy)
          const colorMap: Record<string, string> = {
            "border-gray-300": "bg-gray-300",
            "border-blue-300": "bg-blue-300",
            "border-orange-300": "bg-orange-300",
            "border-pink-300": "bg-pink-300",
          }
          const dotColor = colorMap[tier.color] || "bg-gray-300"

          return (
            <button
              key={c.id}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 text-left transition-all active:scale-[0.98] animate-card-in"
              style={{ animationDelay: `${i * 0.05}s` }}
              onClick={() => router.push(`/contacts/${c.id}`)}
            >
              <div className={`w-3 h-3 rounded-full shrink-0 ${dotColor}`} />
              <span className="text-sm font-medium text-gray-800">{c.name}</span>
              <span className="text-xs text-gray-400">
                {getIntimacyLabel(c.intimacy)} · {c.intimacy}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}