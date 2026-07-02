"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getContact, updateContact, deleteContact, getIntimacyLabel, type ContactMemory } from "@/lib/intimacy"
import IntimacySlider from "@/components/IntimacySlider"

const RELATION_OPTIONS = ["同事", "朋友", "家人", "恋爱", "同学", "网友", "自定义"]

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [contact, setContact] = useState<ContactMemory | null>(null)
  const [name, setName] = useState("")
  const [intimacy, setIntimacy] = useState(50)
  const [relation, setRelation] = useState("")
  const [avatar, setAvatar] = useState("")
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const c = getContact(id)
    if (c) {
      setContact(c)
      setName(c.name)
      setIntimacy(c.intimacy)
      setRelation(c.relation || "")
      setAvatar(c.avatar || "")
    }
  }, [id])

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 50 * 1024) {
      alert("头像不能超过 50KB")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const data = reader.result as string
      setAvatar(data)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (!name.trim()) return
    const updated = updateContact(id, {
      name: name.trim(),
      intimacy,
      relation: relation || undefined,
      avatar: avatar || undefined,
    })
    if (updated) {
      setContact(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  const handleDelete = () => {
    deleteContact(id)
    router.push("/contacts")
  }

  if (!contact) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400 text-sm">联系人不存在</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen px-5 py-6">
      {/* Header — emerald gradient brand bar */}
      <div className="mb-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl px-5 py-5 text-white shadow-lg shadow-emerald-200/50 animate-float-up">
        <div className="flex items-center justify-between">
          <Link href="/contacts" className="text-sm text-white/60 hover:text-white/90 transition-colors">
            ← 返回
          </Link>
          <h1 className="text-lg font-bold">编辑联系人</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* 头像 */}
      <div className="flex justify-center mb-5 animate-card-in">
        <button
          className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center overflow-hidden shadow-lg shadow-emerald-200/50 active:scale-95 transition-all"
          onClick={() => fileInputRef.current?.click()}
        >
          {avatar ? (
            <img src={avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-white">{name[0] || "?"}</span>
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-white text-xs font-medium">更换头像</span>
          </div>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
        />
      </div>

      {/* 昵称 */}
      <div className="mb-5 animate-card-in" style={{ animationDelay: "0.05s" }}>
        <label className="block text-xs font-medium text-gray-400 mb-1.5 ml-1">昵称</label>
        <input
          type="text"
          className="w-full px-4 py-3 text-sm bg-white rounded-xl border border-gray-200 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-gray-300"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入昵称"
        />
      </div>

      {/* 关系 */}
      <div className="mb-6 animate-card-in" style={{ animationDelay: "0.1s" }}>
        <label className="block text-xs font-medium text-gray-400 mb-2 ml-1">关系</label>
        <div className="flex flex-wrap gap-2">
          {RELATION_OPTIONS.map((opt) => (
            <button
              key={opt}
              className={`px-3.5 py-2 rounded-full text-xs font-medium transition-all active:scale-95
                ${relation === opt
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-300 shadow-sm"
                  : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                }`}
              onClick={() => setRelation(opt === "自定义" ? "" : opt)}
            >
              {opt}
            </button>
          ))}
        </div>
        {relation && !RELATION_OPTIONS.slice(0, -1).includes(relation) && (
          <input
            type="text"
            className="mt-2 w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-gray-200 outline-none focus:border-emerald-400 transition-all placeholder:text-gray-300"
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
            placeholder="自定义关系"
          />
        )}
      </div>

      {/* 亲密度滑块 */}
      <div className="mb-8 px-1 animate-card-in" style={{ animationDelay: "0.15s" }}>
        <IntimacySlider value={intimacy} onChange={setIntimacy} />
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 mb-4 animate-card-in" style={{ animationDelay: "0.2s" }}>
        <button
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95
            ${saved
              ? "bg-emerald-100 text-emerald-600"
              : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200/50 hover:shadow-xl"
            }`}
          onClick={handleSave}
        >
          {saved ? "✓ 已保存" : "保存"}
        </button>
        <button
          className="flex-1 py-3 rounded-xl text-sm font-medium text-red-400 bg-red-50 hover:bg-red-100 active:scale-95 transition-all"
          onClick={handleDelete}
        >
          删除联系人
        </button>
      </div>

      <Link
        href={`/contacts/${id}/chat`}
        className="py-3 text-center text-sm font-medium text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 active:scale-[0.98] transition-all animate-card-in"
        style={{ animationDelay: "0.25s" }}
      >
        开始对话
      </Link>
    </div>
  )
}