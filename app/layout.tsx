import type { Metadata, Viewport } from "next"
import "./globals.css"
import PWAProvider from "@/components/PWAProvider"
import { META } from "@/lib/i18n"

function getLocale(): 'zh' | 'en' {
  if (process.env.NEXT_PUBLIC_LOCALE) return process.env.NEXT_PUBLIC_LOCALE === 'en' ? 'en' : 'zh'
  if (process.env.VERCEL_URL?.includes('replycraft')) return 'en'
  return 'zh'
}

const locale = getLocale()

export const metadata: Metadata = {
  title: META.title[locale],
  description: META.description[locale],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: META.shortTitle[locale],
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang={locale === 'en' ? 'en' : 'zh-CN'} className="h-full">
      <body className="min-h-full bg-gray-50 text-gray-900 antialiased">
        <PWAProvider />
        <div className="mx-auto max-w-md min-h-screen bg-white shadow-sm">
          {children}
        </div>
      </body>
    </html>
  )
}