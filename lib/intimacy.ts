// ====== 亲密度量表 ======
import { INTIMACY_I18N } from './i18n'

export interface IntimacyScaleItem {
  min: number
  max: number
  label: string
  prompt: string
}

// ====== Locale 判定 ======
function getLocale(): 'zh' | 'en' {
  // 服务端
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_LOCALE) {
    return process.env.NEXT_PUBLIC_LOCALE === 'en' ? 'en' : 'zh'
  }
  // 客户端
  if (typeof window !== 'undefined' && window.location.hostname.includes('replycraft')) return 'en'
  return 'zh'
}

// ====== 动态量表生成 ======
function buildScale(): IntimacyScaleItem[] {
  const locale = getLocale()
  const labels = INTIMACY_I18N.labels[locale]
  const prompts = INTIMACY_I18N.prompts[locale]
  const bounds = [
    { min: 0, max: 10 },
    { min: 11, max: 25 },
    { min: 26, max: 40 },
    { min: 41, max: 55 },
    { min: 56, max: 70 },
    { min: 71, max: 85 },
    { min: 86, max: 100 },
  ]
  return bounds.map((b, i) => ({ ...b, label: labels[i], prompt: prompts[i] }))
}

export const INTIMACY_SCALE: IntimacyScaleItem[] = buildScale()

export const DEFAULT_INTIMACY = 50

export function getIntimacyLabel(value: number): string {
  const scale = buildScale()
  const clamped = clamp(value, 0, 100)
  const item = scale.find(s => clamped >= s.min && clamped <= s.max)
  const fallback = getLocale() === 'en' ? 'Casual Friend' : '普通朋友'
  return item ? item.label : fallback
}

export function formatIntimacyForPrompt(value: number): string {
  const locale = getLocale()
  const scale = buildScale()
  const clamped = clamp(value, 0, 100)
  const item = scale.find(s => clamped >= s.min && clamped <= s.max)
  if (!item) return ''
  return locale === 'en'
    ? `Your relationship with this person: ${item.label}. Tone should be: ${item.prompt}`
    : `你和对方的关系是：${item.label}。表达应该${item.prompt}。`
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

// ====== 亲密度视觉色阶 ======

export interface IntimacyTier {
  color: string    // Tailwind border class
}

export function getIntimacyTier(value: number): IntimacyTier {
  if (value <= 25) return { color: "border-gray-300" }      // 正式/客套
  if (value <= 55) return { color: "border-blue-300" }       // 普通/日常
  if (value <= 85) return { color: "border-orange-300" }     // 轻松/温暖
  return { color: "border-pink-300" }                         // 亲密/甜蜜
}

// ====== 联系人记忆 ======

export interface ContactMemory {
  id: string
  name: string
  intimacy: number
  relation?: string   // "同事" | "朋友" | "家人" | "恋爱" | 自定义
  avatar?: string     // base64 头像数据
  updatedAt: number
}

const CONTACTS_KEY = 'zmh_contacts'

export function loadContacts(): ContactMemory[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CONTACTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch { /* ignore */ }
  return []
}

export function saveContact(
  name: string,
  intimacy: number,
  relation?: string,
  avatar?: string
): ContactMemory {
  const contacts = loadContacts()
  const existing = contacts.find(c => c.name === name)

  const contact: ContactMemory = {
    id: existing?.id || crypto.randomUUID(),
    name: name.trim(),
    intimacy: clamp(intimacy, 0, 100),
    relation: relation || existing?.relation,
    avatar: avatar ?? existing?.avatar,
    updatedAt: Date.now(),
  }

  const updated = existing
    ? contacts.map(c => c.name === name ? contact : c)
    : [contact, ...contacts]

  saveContacts(updated)
  return contact
}

export function updateContact(
  id: string,
  partial: Partial<Omit<ContactMemory, 'id' | 'updatedAt'>>
): ContactMemory | null {
  const contacts = loadContacts()
  const idx = contacts.findIndex(c => c.id === id)
  if (idx === -1) return null

  const updated: ContactMemory = {
    ...contacts[idx],
    ...partial,
    intimacy: partial.intimacy != null ? clamp(partial.intimacy, 0, 100) : contacts[idx].intimacy,
    updatedAt: Date.now(),
  }
  contacts[idx] = updated
  saveContacts(contacts)
  return updated
}

export function getContact(id: string): ContactMemory | undefined {
  return loadContacts().find(c => c.id === id)
}

export function deleteContact(id: string): void {
  const contacts = loadContacts().filter(c => c.id !== id)
  saveContacts(contacts)
}

function saveContacts(contacts: ContactMemory[]): void {
  if (typeof window === 'undefined') return
  try {
    // 最多保留 20 个联系人
    const trimmed = contacts.slice(0, 20)
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(trimmed))
  } catch { /* ignore */ }
}