"use client"

import { useEffect, useState } from "react"

interface ToastProps {
  message: string
  visible: boolean
  onDone: () => void
}

export default function Toast({ message, visible, onDone }: ToastProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
      const timer = setTimeout(() => {
        setShow(false)
        onDone()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [visible, onDone])

  if (!show) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[fadeInUp_0.2s_ease-out]">
      <div className="px-5 py-2.5 bg-gray-800 text-white text-sm rounded-full shadow-lg whitespace-nowrap">
        {message}
      </div>
    </div>
  )
}