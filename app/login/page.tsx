"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase-browser"
import { LOGIN } from "@/lib/i18n"
import { t } from "@/lib/t"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"email" | "code">("email")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // magic link 回调后自动检测登录态
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        localStorage.setItem("zmh_user_id", session.user.id)
        router.push("/me")
      }
    })
    return () => subscription.unsubscribe()
  }, [supabase, router])

  const handleSendCode = async () => {
    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes("@")) {
      setError(t(LOGIN.invalidEmail))
      return
    }
    setError("")
    setLoading(true)

    const redirectTo = `${window.location.origin}/login`

    const { error: e } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: redirectTo,
      },
    })

    setLoading(false)
    if (e) {
      setError(e.message)
    } else {
      setStep("code")
    }
  }

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      setError(t(LOGIN.enterCode))
      return
    }
    setError("")
    setLoading(true)

    const { data, error: e } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    })

    setLoading(false)
    if (e) {
      setError(e.message)
    } else {
      if (data.user) {
        localStorage.setItem("zmh_user_id", data.user.id)
      }
      router.push("/me")
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-5 py-8">
      <div className="mb-8">
        <Link href="/me" className="text-sm text-gray-400 hover:text-gray-600">
          {t(LOGIN.back)}
        </Link>
      </div>

      <h1 className="text-xl font-semibold text-gray-900 mb-2">{t(LOGIN.title)}</h1>
      <p className="text-sm text-gray-400 mb-6">{t(LOGIN.subtitle)}</p>

      {step === "email" ? (
        <>
          <label className="text-sm text-gray-500 mb-1">{t(LOGIN.email)}</label>
          <input
            type="email"
            className="w-full px-4 py-3 text-sm bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-emerald-400 mb-4"
            placeholder={t(LOGIN.emailPlaceholder)}
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError("") }}
            onKeyDown={(e) => { if (e.key === "Enter") handleSendCode() }}
          />

          {error && (
            <div className="mb-4 px-4 py-2 bg-red-50 text-red-500 text-sm rounded-lg">
              {error}
            </div>
          )}

          <button
            className="w-full py-3 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 disabled:opacity-50"
            onClick={handleSendCode}
            disabled={loading || !email.trim()}
          >
            {loading ? t(LOGIN.sending) : t(LOGIN.sendCode)}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-4">
            {t(LOGIN.codeSent)}{email}{t(LOGIN.checkInbox)}
          </p>
          <label className="text-sm text-gray-500 mb-1">{t(LOGIN.code)}</label>
          <input
            type="text"
            className="w-full px-4 py-3 text-sm bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-emerald-400 mb-4"
            placeholder={t(LOGIN.codePlaceholder)}
            value={code}
            onChange={(e) => { setCode(e.target.value); setError("") }}
            onKeyDown={(e) => { if (e.key === "Enter") handleVerifyCode() }}
            autoFocus
          />

          {error && (
            <div className="mb-4 px-4 py-2 bg-red-50 text-red-500 text-sm rounded-lg">
              {error}
            </div>
          )}

          <button
            className="w-full py-3 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 disabled:opacity-50"
            onClick={handleVerifyCode}
            disabled={loading || !code.trim()}
          >
            {loading ? t(LOGIN.verifying) : t(LOGIN.loginBtn)}
          </button>

          <button
            className="w-full mt-3 py-3 text-sm text-gray-400 hover:text-gray-600"
            onClick={() => { setStep("email"); setError(""); setCode("") }}
          >
            {t(LOGIN.resend)}
          </button>
        </>
      )}
    </div>
  )
}