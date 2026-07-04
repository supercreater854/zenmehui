"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from "react"

export type ReplyMode = "quick" | "scenario"

const STORAGE_KEY = "zmh_reply_mode"

interface ReplyModeContextValue {
  mode: ReplyMode
  setMode: (mode: ReplyMode) => void
}

const ReplyModeContext = createContext<ReplyModeContextValue | null>(null)

function readMode(): ReplyMode {
  if (typeof window === "undefined") return "quick"
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "quick" || stored === "scenario") return stored
  return "quick"
}

export function ReplyModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ReplyMode>("quick")

  useEffect(() => {
    setModeState(readMode())
  }, [])

  const setMode = useCallback((next: ReplyMode) => {
    setModeState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }, [])

  return (
    <ReplyModeContext.Provider value={{ mode, setMode }}>
      {children}
    </ReplyModeContext.Provider>
  )
}

export function useReplyMode(): ReplyModeContextValue {
  const ctx = useContext(ReplyModeContext)
  if (!ctx) {
    throw new Error("useReplyMode must be used within ReplyModeProvider")
  }
  return ctx
}