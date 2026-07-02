"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { loadContacts, deleteContact, saveContact, getIntimacyLabel, type ContactMemory } from "@/lib/intimacy"

export default function ContactsPage() {
  const router = useRouter()
  const [contacts, setContacts] = useState<ContactMemory[]>([])
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState("")

  useEffect(() => {
    setContacts(loadContacts())
  }, [])

  const handleNew = () => {
    const name = newName.trim()
    if (!name) return
    const c = saveContact(name, 50)
    setShowNew(false)
    setNewName("")
    router.push(`/contacts/${c.id}`)
  }

  const handleDelete = (id: string) => {
    deleteContact(id)
    setContacts(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="flex flex-col min-h-screen px-5 py-6">
      {/* Header — emerald gradient brand bar */}
      <div className="mb-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl px-5 py-5 text-white shadow-lg shadow-emerald-200/50 animate-float-up">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-white/60 hover:text-white/90 transition-colors">
            ← 返回
          </Link>
          <h1 className="text-lg font-bold">联系人</h1>
          <button
            className="text-sm text-white/80 hover:text-white font-medium transition-colors"
            onClick={() => setShowNew(true)}
          >
            + 新建
          </button>
        </div>
      </div>

      {showNew && (
        <div className="mb-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm animate-float-up">
          <input
            type="text"
            className="w-full px-3 py-2.5 text-sm bg-gray-50 rounded-xl border border-gray-200 placeholder:text-gray-400 outline-none focus:border-emerald-400 transition-all"
            placeholder="输入昵称"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleNew() }}
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              className="flex-1 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-sm active:scale-95 transition-all"
              onClick={handleNew}
            >
              创建
            </button>
            <button
              className="flex-1 py-2.5 text-sm font-medium text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 active:scale-95 transition-all"
              onClick={() => { setShowNew(false); setNewName("") }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {contacts.length === 0 && !showNew ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <p className="text-gray-400 text-sm mb-4">还没有联系人</p>
          <button
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-medium shadow-md active:scale-95 transition-all"
            onClick={() => setShowNew(true)}
          >
            添加第一个联系人
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-2">
          {contacts.map((c, i) => (
            <div
              key={c.id}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer animate-card-in active:scale-[0.98]"
              style={{ animationDelay: `${i * 0.05}s` }}
              onClick={() => router.push(`/contacts/${c.id}`)}
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                {c.name[0]}
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800 truncate">
                  {c.name}
                  {c.relation && (
                    <span className="ml-2 text-xs text-gray-400 font-normal">{c.relation}</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {getIntimacyLabel(c.intimacy)} · {c.intimacy}
                </div>
              </div>

              <button
                className="p-1.5 rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 shrink-0 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(c.id)
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}