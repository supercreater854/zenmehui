"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { loadContacts } from "@/lib/intimacy"
import { createClient, getAnonUserId } from "@/lib/supabase-browser"
import { ME, CONTACTS } from "@/lib/i18n"
import { t } from "@/lib/t"

export default function MePage() {
  const supabase = createClient()

  const [userId, setUserId] = useState("")
  const [email, setEmail] = useState("")
  const [authed, setAuthed] = useState(false)
  const [contactCount, setContactCount] = useState(0)
  const [loggingOut, setLoggingOut] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  const [creditsUnlimited, setCreditsUnlimited] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setAuthed(true)
        setUserId(data.user.id)
        setEmail(data.user.email || "")
      } else {
        setUserId(getAnonUserId())
      }
    })
    setContactCount(loadContacts().length)
  }, [])

  useEffect(() => {
    const id = userId || getAnonUserId()
    if (!id) return
    fetch(`/api/credits?user_id=${encodeURIComponent(id)}`)
      .then((res) => res.json())
      .then((data) => {
        setCredits(data.credits)
        setCreditsUnlimited(data.unlimited || false)
      })
      .catch(() => { /* ignore */ })
  }, [userId])

  const handleLogout = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    const newAnonId = crypto.randomUUID()
    localStorage.setItem("zmh_user_id", newAnonId)
    setUserId(newAnonId)
    setAuthed(false)
    setEmail("")
    setLoggingOut(false)
  }

  const creditsLabel = creditsUnlimited
    ? t(ME.unlimitedCredits)
    : credits !== null ? `${credits}${t(ME.credits)}` : t(ME.loadingCredits)
  const creditsSubLabel = creditsUnlimited
    ? t(ME.vipStatus)
    : credits !== null && credits <= 5 ? t(ME.lowCredits) : ""

  return (
    <div className="flex flex-col min-h-screen px-5 py-6">
      {/* Header */}
      <div className="mb-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl px-5 py-5 text-white shadow-lg shadow-emerald-200/50 animate-float-up">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-white/60 hover:text-white/90 transition-colors">
            {t(CONTACTS.back)}
          </Link>
          <h1 className="text-lg font-bold">{t(ME.title)}</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* 用户卡片 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-3 animate-card-in">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-lg font-bold shadow-sm">
            {authed ? (email.split("@")[0].slice(0, 2) || "我") : "匿"}
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold text-gray-800">
              {authed ? email : t(ME.anonymous)}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {authed ? t(ME.loggedIn) : `ID: ${userId.slice(0, 8)}...`}
            </div>
          </div>
          {authed ? (
            <button
              className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-50 rounded-lg hover:bg-red-100 active:scale-95 transition-all"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? t(ME.loggingOut) : t(ME.logout)}
            </button>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 active:scale-95 transition-all"
            >
              {t(ME.login)}
            </Link>
          )}
        </div>
        <div className="flex gap-4 text-center">
          <div className="flex-1 bg-gray-50 rounded-xl py-3">
            <div className="text-xl font-bold text-gray-800">{contactCount}</div>
            <div className="text-xs text-gray-400 mt-0.5">{t(ME.contactsCount)}</div>
          </div>
          <div className="flex-1 bg-emerald-50 rounded-xl py-3">
            <div className="text-xl font-bold text-emerald-600">{creditsLabel}</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {creditsSubLabel || t(ME.remainingCredits)}
            </div>
          </div>
        </div>
      </div>

      {/* 菜单 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-3 animate-card-in" style={{ animationDelay: "0.1s" }}>
        <Link
          href="/contacts"
          className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors active:bg-gray-100"
        >
          <span className="text-sm font-medium text-gray-700">{t(ME.contactsManage)}</span>
          <span className="text-xs text-gray-400">{t(ME.peopleCount, contactCount)}</span>
        </Link>
        <Link
          href="/universe"
          className="flex items-center justify-between px-5 py-4 border-t border-gray-50 hover:bg-gray-50 transition-colors active:bg-gray-100"
        >
          <span className="text-sm font-medium text-gray-700">{t(ME.universe)}</span>
          <span className="text-xs text-gray-400">{t(ME.viewDistribution)}</span>
        </Link>
        <button
          className="w-full flex items-center justify-between px-5 py-4 border-t border-gray-50 hover:bg-gray-50 transition-colors active:bg-gray-100 text-left"
          onClick={() => {
            const c = loadContacts()
            navigator.clipboard.writeText(JSON.stringify(c, null, 2))
            alert(t(ME.dataCopied))
          }}
        >
          <span className="text-sm font-medium text-gray-700">{t(ME.exportData)}</span>
          <span className="text-xs text-gray-400">{t(ME.backup)}</span>
        </button>
      </div>
    </div>
  )
}