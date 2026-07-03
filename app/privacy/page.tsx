import type { Metadata } from "next"
import Link from "next/link"

function getLocale(): 'zh' | 'en' {
  if (process.env.NEXT_PUBLIC_LOCALE) return process.env.NEXT_PUBLIC_LOCALE === 'en' ? 'en' : 'zh'
  return 'zh'
}

const locale = getLocale()

export const metadata: Metadata = {
  title: locale === 'en' ? 'Privacy Policy - ReplyCraft' : '隐私政策 - 怎么回',
}

const content = {
  title: { zh: '隐私政策', en: 'Privacy Policy' },
  lastUpdated: { zh: '最后更新：2025年1月', en: 'Last updated: January 2025' },
  intro: {
    zh: '本隐私政策说明"怎么回"（以下简称"我们"）如何收集、使用和保护您的个人信息。',
    en: 'This Privacy Policy describes how ReplyCraft ("we", "us", or "our") collects, uses, and protects your personal information.',
  },
  sections: [
    {
      title: { zh: '1. 我们收集的信息', en: '1. Information We Collect' },
      body: {
        zh: '当您使用我们的服务时，我们会自动收集以下信息：\n• 您输入的消息内容（用于生成AI回复）\n• 匿名用户标识符（浏览器本地生成，非个人身份信息）\n• 使用数据（生成次数、功能使用情况）\n\n我们不收集您的姓名、邮箱、手机号或其他个人身份信息，除非您主动提供。',
        en: 'When you use our service, we automatically collect:\n• Message content you input (used solely to generate AI replies)\n• Anonymous user identifier (generated locally in your browser, not personally identifiable)\n• Usage data (generation count, feature usage)\n\nWe do not collect your name, email, phone number, or other personally identifiable information unless you voluntarily provide it.',
      },
    },
    {
      title: { zh: '2. 信息的使用', en: '2. How We Use Information' },
      body: {
        zh: '我们使用收集的信息用于：\n• 生成AI回复并改进回复质量\n• 分析使用趋势以优化服务\n• 防止滥用和欺诈\n\n您的消息内容仅用于当次AI回复生成，我们不会存储您的对话内容。',
        en: 'We use collected information to:\n• Generate AI replies and improve response quality\n• Analyze usage trends to optimize the service\n• Prevent abuse and fraud\n\nYour message content is used only for the current AI reply generation. We do not store your conversation content.',
      },
    },
    {
      title: { zh: '3. AI服务提供商', en: '3. AI Service Provider' },
      body: {
        zh: '我们使用第三方AI服务（DeepSeek API）来处理您的消息并生成回复。您的消息会在加密连接下发送到AI服务提供商。AI服务提供商不存储您的消息内容用于模型训练。',
        en: 'We use a third-party AI service (DeepSeek API) to process your messages and generate replies. Your messages are sent to the AI service provider over encrypted connections. The AI service provider does not store your message content for model training.',
      },
    },
    {
      title: { zh: '4. Cookie与本地存储', en: '4. Cookies and Local Storage' },
      body: {
        zh: '我们使用浏览器的本地存储（localStorage）来保存您的匿名用户标识符和应用偏好。我们不使用追踪性Cookie或第三方分析Cookie。',
        en: 'We use browser local storage (localStorage) to save your anonymous user identifier and app preferences. We do not use tracking cookies or third-party analytics cookies.',
      },
    },
    {
      title: { zh: '5. 数据安全', en: '5. Data Security' },
      body: {
        zh: '我们采取合理的技术手段保护您的信息安全。所有数据传输均通过HTTPS加密。但我们无法保证互联网传输的绝对安全。',
        en: 'We implement reasonable technical measures to protect your information. All data transmission is encrypted via HTTPS. However, we cannot guarantee absolute security of internet transmission.',
      },
    },
    {
      title: { zh: '6. 联系我们', en: '6. Contact Us' },
      body: {
        zh: '如对本隐私政策有任何疑问，请通过以下方式联系我们：\n邮箱：supercreater854@gmail.com',
        en: 'If you have any questions about this Privacy Policy, please contact us at:\nEmail: supercreater854@gmail.com',
      },
    },
  ],
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen px-5 py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{content.title[locale]}</h1>
      <p className="text-sm text-gray-400 mb-8">{content.lastUpdated[locale]}</p>
      <p className="text-gray-700 mb-8 leading-relaxed">{content.intro[locale]}</p>

      {content.sections.map((section, i) => (
        <div key={i} className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{section.title[locale]}</h2>
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">{section.body[locale]}</p>
        </div>
      ))}

      <div className="mt-12 pt-6 border-t border-gray-100">
        <Link href="/" className="text-sm text-emerald-500 hover:text-emerald-600 transition-colors">
          {locale === 'en' ? '← Back to Home' : '← 返回首页'}
        </Link>
      </div>
    </div>
  )
}