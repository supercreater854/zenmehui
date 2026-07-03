import type { Metadata } from "next"
import Link from "next/link"

function getLocale(): 'zh' | 'en' {
  if (process.env.NEXT_PUBLIC_LOCALE) return process.env.NEXT_PUBLIC_LOCALE === 'en' ? 'en' : 'zh'
  return 'zh'
}

const locale = getLocale()

export const metadata: Metadata = {
  title: locale === 'en' ? 'Terms of Service - ReplyCraft' : '服务条款 - 怎么回',
}

const content = {
  title: { zh: '服务条款', en: 'Terms of Service' },
  lastUpdated: { zh: '最后更新：2025年1月', en: 'Last updated: January 2025' },
  intro: {
    zh: '使用"怎么回"（以下简称"本服务"）即表示您同意以下服务条款。如不同意，请停止使用本服务。',
    en: 'By using ReplyCraft ("the Service"), you agree to the following Terms of Service. If you do not agree, please discontinue use of the Service.',
  },
  sections: [
    {
      title: { zh: '1. 服务描述', en: '1. Service Description' },
      body: {
        zh: '本服务是一个基于AI的聊天回复生成工具。用户输入消息内容，系统生成多种风格的回复建议。本服务按"现状"提供，我们不保证回复的准确性、适当性或可用性。',
        en: 'The Service is an AI-powered chat reply generator. Users input message content and the system generates reply suggestions in various styles. The Service is provided "as is" without warranty of accuracy, appropriateness, or fitness for any particular purpose.',
      },
    },
    {
      title: { zh: '2. 用户责任', en: '2. User Responsibilities' },
      body: {
        zh: '您同意：\n• 不会利用本服务生成违法、侵权、骚扰、仇恨或淫秽内容\n• 不会对服务进行反向工程、自动化爬取或压力测试\n• 您对使用生成回复所产生的后果自行负责\n• 本服务生成的AI回复仅供参考，不代表专业建议',
        en: 'You agree to:\n• Not use the Service to generate illegal, infringing, harassing, hateful, or obscene content\n• Not reverse engineer, automate scraping, or stress test the Service\n• Take full responsibility for consequences of using generated replies\n• Understand that AI-generated replies are for reference only and do not constitute professional advice',
      },
    },
    {
      title: { zh: '3. 知识产权', en: '3. Intellectual Property' },
      body: {
        zh: '本服务的代码、设计、品牌标识和界面元素归我们所有。AI生成回复的版权归您所有，您可自由使用。但我们对回复内容的原创性或唯一性不作保证。',
        en: 'The Service\'s code, design, branding, and interface elements are owned by us. Copyright of AI-generated replies belongs to you, and you may use them freely. However, we do not guarantee the originality or uniqueness of generated content.',
      },
    },
    {
      title: { zh: '4. 服务可用性', en: '4. Service Availability' },
      body: {
        zh: '我们尽力保持服务稳定运行，但不对服务中断、延迟或数据丢失承担责任。我们保留随时修改或终止服务的权利，恕不另行通知。',
        en: 'We strive to maintain stable service operation but are not liable for service interruptions, delays, or data loss. We reserve the right to modify or discontinue the Service at any time without prior notice.',
      },
    },
    {
      title: { zh: '5. 责任限制', en: '5. Limitation of Liability' },
      body: {
        zh: '在法律允许的最大范围内，我们对因使用或无法使用本服务而产生的任何直接、间接、附带或后果性损害不承担责任。',
        en: 'To the maximum extent permitted by law, we shall not be liable for any direct, indirect, incidental, or consequential damages arising from use or inability to use the Service.',
      },
    },
    {
      title: { zh: '6. 条款变更', en: '6. Changes to Terms' },
      body: {
        zh: '我们保留随时修改本服务条款的权利。修改后的条款将在网站上发布后立即生效。继续使用本服务即表示您接受修改后的条款。',
        en: 'We reserve the right to modify these Terms at any time. Modified terms take effect immediately upon posting on the website. Continued use of the Service constitutes acceptance of the modified terms.',
      },
    },
    {
      title: { zh: '7. 联系我们', en: '7. Contact Us' },
      body: {
        zh: '如对本服务条款有任何疑问，请通过以下方式联系我们：\n邮箱：supercreater854@gmail.com',
        en: 'If you have any questions about these Terms, please contact us at:\nEmail: supercreater854@gmail.com',
      },
    },
  ],
}

export default function TermsPage() {
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