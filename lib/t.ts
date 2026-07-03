// ====== i18n 调用入口 ======
// 用法：import { t } from '@/lib/t'
//       t(HOME.brandName)              → "怎么回" 或 "ReplyCraft"
//       t(ME.peopleCount, n)           → "3人 →" 或 "3 →"  (函数型词条)
//       t(CONTACTS.relationOptions)    → ["同事",...] 或 ["Coworker",...]  (数组型词条)

type Locale = "zh" | "en"

function getLocale(): Locale {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_LOCALE) {
    return process.env.NEXT_PUBLIC_LOCALE === "en" ? "en" : "zh"
  }
  if (typeof window !== "undefined") {
    if (window.location.hostname.includes("replycraft")) return "en"
  }
  return "zh"
}

// 重载：字符串词条 → 返回字符串
export function t(entry: { zh: string; en: string }): string
// 重载：数组词条 → 返回数组
export function t(entry: { zh: readonly string[]; en: readonly string[] }): readonly string[]
// 重载：函数词条 → 调用并返回字符串
export function t<A extends any[]>(
  entry: { zh: (...args: A) => string; en: (...args: A) => string },
  ...args: A
): string

export function t(entry: Record<Locale, unknown>, ...args: any[]): string | readonly string[] {
  const locale = getLocale()
  const value = entry[locale]
  if (typeof value === "function") {
    return (value as (...a: any[]) => string)(...args)
  }
  return value as string | readonly string[]
}