// ====== 亲密度量表（从 lib/intimacy.ts 移植） ======

const INTIMACY_SCALE = [
  { min: 0,  max: 10, label: '陌生人',   prompt: '极度正式、客套、保持社交距离' },
  { min: 11, max: 25, label: '泛泛之交', prompt: '有礼貌但不亲近，就事论事' },
  { min: 26, max: 40, label: '认识的人', prompt: '可以稍微放松，但也保持分寸' },
  { min: 41, max: 55, label: '普通朋友', prompt: '随和、轻松、可以有点随意' },
  { min: 56, max: 70, label: '好朋友',   prompt: '直接、温暖、可以开玩笑、不用太客套' },
  { min: 71, max: 85, label: '亲密好友', prompt: '很随意、默契、幽默、情感充沛' },
  { min: 86, max: 100,label: '家人/伴侣',prompt: '极度亲密、可以撒娇、情感自然流露' },
]

const DEFAULT_INTIMACY = 50
const CONTACTS_KEY = 'zmh_contacts'

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

function getIntimacyLabel(value) {
  const clamped = clamp(value, 0, 100)
  const item = INTIMACY_SCALE.find(s => clamped >= s.min && clamped <= s.max)
  return item ? item.label : '普通朋友'
}

function getIntimacyTier(value) {
  if (value <= 25) return { color: '#d1d5db', label: '正式' }
  if (value <= 55) return { color: '#93c5fd', label: '日常' }
  if (value <= 85) return { color: '#fdba74', label: '温暖' }
  return { color: '#f9a8d4', label: '亲密' }
}

// ====== 联系人存储 ======

function loadContacts() {
  try {
    const raw = wx.getStorageSync(CONTACTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.slice(0, 20) : []
  } catch (e) {
    return []
  }
}

function saveContacts(contacts) {
  wx.setStorageSync(CONTACTS_KEY, JSON.stringify(contacts.slice(0, 20)))
}

function saveContact(name, intimacy, relation) {
  const contacts = loadContacts()
  const existing = contacts.find(c => c.name === name)

  const contact = {
    id: existing ? existing.id : 'c_' + Date.now(),
    name: name.trim(),
    intimacy: clamp(intimacy, 0, 100),
    relation: relation || (existing ? existing.relation : ''),
    updatedAt: Date.now()
  }

  const updated = existing
    ? contacts.map(c => c.name === name ? contact : c)
    : [contact, ...contacts]

  saveContacts(updated)
  return contact
}

function updateContact(id, partial) {
  const contacts = loadContacts()
  const idx = contacts.findIndex(c => c.id === id)
  if (idx === -1) return null

  contacts[idx] = {
    ...contacts[idx],
    ...partial,
    intimacy: partial.intimacy != null ? clamp(partial.intimacy, 0, 100) : contacts[idx].intimacy,
    updatedAt: Date.now()
  }
  saveContacts(contacts)
  return contacts[idx]
}

function getContact(id) {
  return loadContacts().find(c => c.id === id)
}

function deleteContact(id) {
  saveContacts(loadContacts().filter(c => c.id !== id))
}

module.exports = {
  INTIMACY_SCALE,
  DEFAULT_INTIMACY,
  getIntimacyLabel,
  getIntimacyTier,
  loadContacts,
  saveContact,
  updateContact,
  getContact,
  deleteContact
}