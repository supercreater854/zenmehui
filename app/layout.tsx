import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "怎么回 - AI聊天回复生成",
  description: "不会回消息？一键生成可直接发送的聊天回复",
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
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full bg-gray-50 text-gray-900 antialiased">
        <div className="mx-auto max-w-md min-h-screen bg-white shadow-sm">
          {children}
        </div>
      </body>
    </html>
  )
}