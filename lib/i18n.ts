// ====== 翻译词条 ======
// 按页面/功能域组织。locale 由 NEXT_PUBLIC_LOCALE 环境变量控制。
// 默认 zh，海外部署设为 en。

// ---------- SEO / Meta ----------
export const META = {
  title: {
    zh: "怎么回 - AI聊天回复生成",
    en: "ReplyCraft - AI Text Reply Generator",
  },
  description: {
    zh: "不会回消息？一键生成可直接发送的聊天回复",
    en: "Stuck on what to text back? One tap to generate the perfect reply.",
  },
  shortTitle: {
    zh: "怎么回",
    en: "ReplyCraft",
  },
} as const

// ---------- 首页 ----------
export const HOME = {
  brandName: {
    zh: "怎么回",
    en: "ReplyCraft",
  },
  tagline: {
    zh: "AI 替你说出来",
    en: "AI says it for you",
  },
  placeholder: {
    zh: "把对方说的话粘贴到这里...",
    en: "Paste what they said...",
  },
  generating: {
    zh: "AI 正在想怎么回...",
    en: "AI is thinking...",
  },
  generateBtn: {
    zh: "帮 我 回",
    en: "Generate",
  },
  disclaimer: {
    zh: "仅供参考，建议根据实际情况调整",
    en: "For reference only — adjust to your situation",
  },
  contactsTab: {
    zh: "联系人",
    en: "Contacts",
  },
  meTab: {
    zh: "我的",
    en: "Me",
  },
  shareCta: {
    zh: "觉得好用？分享给朋友",
    en: "Loving it? Share with a friend",
  },
  loadMoreContacts: {
    zh: "加载中...",
    en: "Loading...",
  },
  // error messages
  enterContent: {
    zh: "请输入聊天内容",
    en: "Please enter a message",
  },
  tooLong: {
    zh: "内容过长，请控制在2000字以内",
    en: "Message too long — keep it under 2000 chars",
  },
  noCredits: {
    zh: "积分不足，请充值",
    en: "Not enough credits — top up",
  },
  generateFailed: {
    zh: "生成失败，请重试",
    en: "Generation failed, please retry",
  },
  aiSlow: {
    zh: "AI响应较慢，请稍后重试",
    en: "AI is slow, please try again",
  },
  networkError: {
    zh: "网络错误，请检查连接后重试",
    en: "Network error — check your connection",
  },
  paymentUnavailable: {
    zh: "支付系统暂不可用",
    en: "Payment unavailable",
  },
  networkRetry: {
    zh: "网络错误，请稍后重试",
    en: "Network error, please try later",
  },
  // scenes
  scenes: {
    zh: ["老板让我加班", "对象生气了", "不知道怎么拒绝", "朋友借钱", "被夸了怎么回", "想约人出来"],
    en: [
      "Boss wants overtime",
      "Partner is upset",
      "Don't know how to say no",
      "Friend asking for money",
      "Got a compliment",
      "Want to ask them out",
    ],
  },
  // pricing
  pricingTitle: {
    zh: "充值积分",
    en: "Top Up Credits",
  },
  recommended: {
    zh: "推荐",
    en: "Best Value",
  },
  redirecting: {
    zh: "跳转中...",
    en: "Redirecting...",
  },
  goPay: {
    zh: "去支付",
    en: "Pay",
  },
  paymentSuccess: {
    zh: "支付成功，积分已到账",
    en: "Payment successful — credits added",
  },
  gotIt: {
    zh: "知道了",
    en: "Got it",
  },
} as const

// ---------- 结果页 ----------
export const RESULT = {
  title: {
    zh: "AI 帮你想到了这些",
    en: "AI came up with these",
  },
  disclaimer: {
    zh: "仅供参考，建议根据实际情况调整",
    en: "For reference only — adjust to your situation",
  },
  regenerating: {
    zh: "正在重新生成...",
    en: "Regenerating...",
  },
  generating: {
    zh: "正在生成...",
    en: "Generating...",
  },
  anotherSet: {
    zh: "再来一组",
    en: "Another Set",
  },
  switchStyle: {
    zh: "换个画风",
    en: "Switch Style",
  },
  backToNormal: {
    zh: "回到高情商模式",
    en: "Back to High-EQ Mode",
  },
  dataTooLarge: {
    zh: "结果数据过大，请重新生成",
    en: "Result data too large — regenerate",
  },
  noResult: {
    zh: "暂无生成结果",
    en: "No results yet",
  },
  retry: {
    zh: "再试一次",
    en: "Try Again",
  },
  backHome: {
    zh: "返回首页",
    en: "Back to Home",
  },
  networkError: {
    zh: "网络异常，请重试",
    en: "Network error, please retry",
  },
  regenerateFailed: {
    zh: "换个说法失败，请重试",
    en: "Regenerate failed, please retry",
  },
  copied: {
    zh: "已复制: ",
    en: "Copied: ",
  },
  contactSaved: {
    zh: "已保存联系人：",
    en: "Contact saved: ",
  },
  saveContact: {
    zh: "加入联系人",
    en: "Add to Contacts",
  },
  contactPlaceholder: {
    zh: "输入昵称",
    en: "Enter nickname",
  },
  save: {
    zh: "保存",
    en: "Save",
  },
  cancel: {
    zh: "取消",
    en: "Cancel",
  },
  pressHoldMinus: {
    zh: "长按连续减",
    en: "Hold to decrease",
  },
  pressHoldPlus: {
    zh: "长按连续加",
    en: "Hold to increase",
  },
  clickEdit: {
    zh: "点击直接输入数字",
    en: "Tap to type a number",
  },
  loading: {
    zh: "加载中...",
    en: "Loading...",
  },
} as const

// ---------- "我的"页 ----------
export const ME = {
  title: {
    zh: "我的",
    en: "Me",
  },
  anonymous: {
    zh: "匿名用户",
    en: "Anonymous",
  },
  loggedIn: {
    zh: "已登录",
    en: "Logged in",
  },
  logout: {
    zh: "退出登录",
    en: "Log Out",
  },
  loggingOut: {
    zh: "退出中...",
    en: "Logging out...",
  },
  login: {
    zh: "登录",
    en: "Log In",
  },
  unlimitedCredits: {
    zh: "无限积分",
    en: "Unlimited",
  },
  credits: {
    zh: "积分",
    en: " credits",
  },
  loadingCredits: {
    zh: "加载中...",
    en: "Loading...",
  },
  vipStatus: {
    zh: "永久会员",
    en: "Lifetime Member",
  },
  lowCredits: {
    zh: "积分即将用尽",
    en: "Credits running low",
  },
  contactsCount: {
    zh: "联系人",
    en: "Contacts",
  },
  remainingCredits: {
    zh: "剩余积分",
    en: "Remaining",
  },
  contactsManage: {
    zh: "联系人管理",
    en: "Manage Contacts",
  },
  peopleCount: {
    zh: (n: number) => `${n}人 →`,
    en: (n: number) => `${n} →`,
  },
  universe: {
    zh: "人际圈",
    en: "Social Map",
  },
  viewDistribution: {
    zh: "查看关系分布 →",
    en: "View Distribution →",
  },
  exportData: {
    zh: "导出联系人数据",
    en: "Export Contact Data",
  },
  backup: {
    zh: "备份 →",
    en: "Backup →",
  },
  dataCopied: {
    zh: "联系人数据已复制到剪贴板",
    en: "Contact data copied to clipboard",
  },
} as const

// ---------- 联系人页 ----------
export const CONTACTS = {
  title: {
    zh: "联系人",
    en: "Contacts",
  },
  back: {
    zh: "← 返回",
    en: "← Back",
  },
  newContact: {
    zh: "+ 新建",
    en: "+ New",
  },
  placeholder: {
    zh: "输入昵称",
    en: "Enter nickname",
  },
  create: {
    zh: "创建",
    en: "Create",
  },
  cancel: {
    zh: "取消",
    en: "Cancel",
  },
  empty: {
    zh: "还没有联系人",
    en: "No contacts yet",
  },
  addFirst: {
    zh: "添加第一个联系人",
    en: "Add your first contact",
  },
  editTitle: {
    zh: "编辑联系人",
    en: "Edit Contact",
  },
  changeAvatar: {
    zh: "更换头像",
    en: "Change Avatar",
  },
  nickname: {
    zh: "昵称",
    en: "Nickname",
  },
  relationship: {
    zh: "关系",
    en: "Relationship",
  },
  customRelation: {
    zh: "自定义关系",
    en: "Custom",
  },
  relationOptions: {
    zh: ["同事", "朋友", "家人", "恋爱", "同学", "网友", "自定义"],
    en: ["Coworker", "Friend", "Family", "Partner", "Classmate", "Online", "Custom"],
  },
  saved: {
    zh: "✓ 已保存",
    en: "✓ Saved",
  },
  saveBtn: {
    zh: "保存",
    en: "Save",
  },
  deleteContact: {
    zh: "删除联系人",
    en: "Delete Contact",
  },
  startChat: {
    zh: "开始对话",
    en: "Start Chat",
  },
  notFound: {
    zh: "联系人不存在",
    en: "Contact not found",
  },
  avatarTooLarge: {
    zh: "头像不能超过 50KB",
    en: "Avatar must be under 50KB",
  },
  // chat page
  backToContact: {
    zh: "返回联系人",
    en: "Back to Contact",
  },
  backNav: {
    zh: "返回",
    en: "Back",
  },
  collapseHistory: {
    zh: "收起记录",
    en: "Collapse",
  },
  expandHistory: {
    zh: "展开记录",
    en: "Expand",
  },
  chatHistoryTitle: {
    zh: "对话记录 · ",
    en: "Chat History · ",
  },
  rounds: {
    zh: "轮",
    en: " rounds",
  },
  deleteSelected: {
    zh: "删除选中(",
    en: "Delete (",
  },
  manage: {
    zh: "管理",
    en: "Manage",
  },
  selectedReply: {
    zh: (n: number) => `已选择第${n}条回复`,
    en: (n: number) => `Selected reply #${n}`,
  },
  them: {
    zh: "对方：",
    en: "Them: ",
  },
  generating: {
    zh: "AI 正在想怎么回...",
    en: "AI is thinking...",
  },
  generatingShort: {
    zh: "生成中...",
    en: "Generating...",
  },
  anotherSet: {
    zh: "再来一组",
    en: "Another Set",
  },
  whatTheySaid: {
    zh: "对方说了什么？",
    en: "What did they say?",
  },
  reply: {
    zh: "回复",
    en: "Reply",
  },
  disclaimer: {
    zh: "仅供参考，建议根据实际情况调整",
    en: "For reference only — adjust to your situation",
  },
  networkError: {
    zh: "网络异常，请重试",
    en: "Network error, please retry",
  },
  regenerateFailed: {
    zh: "换个说法失败，请重试",
    en: "Regenerate failed, please retry",
  },
  copied: {
    zh: "已复制: ",
    en: "Copied: ",
  },
} as const

// ---------- 人际圈 ----------
export const UNIVERSE = {
  title: {
    zh: "人际圈",
    en: "Social Map",
  },
  back: {
    zh: "← 返回",
    en: "← Back",
  },
  centerMe: {
    zh: "我",
    en: "Me",
  },
  orbits: {
    zh: ["家人/伴侣", "亲密好友", "好朋友", "普通朋友", "认识的人", "泛泛之交", "陌生人"],
    en: [
      "Family/Partner",
      "Close Friend",
      "Good Friend",
      "Casual Friend",
      "Acquaintance",
      "Loose Contact",
      "Stranger",
    ],
  },
  empty: {
    zh: "添加联系人后这里会看到人际圈分布",
    en: "Add contacts to see your social map",
  },
  addContact: {
    zh: "去添加联系人",
    en: "Add Contacts",
  },
} as const

// ---------- 登录页 ----------
export const LOGIN = {
  title: {
    zh: "邮箱登录",
    en: "Log In",
  },
  subtitle: {
    zh: "登录后可同步联系人数据",
    en: "Log in to sync your contacts",
  },
  email: {
    zh: "邮箱",
    en: "Email",
  },
  emailPlaceholder: {
    zh: "输入邮箱地址",
    en: "Enter your email",
  },
  sending: {
    zh: "发送中...",
    en: "Sending...",
  },
  sendCode: {
    zh: "发送验证码",
    en: "Send Code",
  },
  codeSent: {
    zh: "验证码已发送至 ",
    en: "Code sent to ",
  },
  checkInbox: {
    zh: "，请检查收件箱",
    en: " — check your inbox",
  },
  code: {
    zh: "验证码",
    en: "Verification Code",
  },
  codePlaceholder: {
    zh: "输入 6 位验证码",
    en: "Enter 6-digit code",
  },
  verifying: {
    zh: "验证中...",
    en: "Verifying...",
  },
  loginBtn: {
    zh: "登录",
    en: "Log In",
  },
  resend: {
    zh: "重新发送",
    en: "Resend",
  },
  back: {
    zh: "返回",
    en: "Back",
  },
  invalidEmail: {
    zh: "请输入正确的邮箱地址",
    en: "Please enter a valid email",
  },
  enterCode: {
    zh: "请输入验证码",
    en: "Please enter the code",
  },
} as const

// ---------- 后台 ----------
export const ADMIN = {
  title: {
    zh: "怎么回 · 数据后台",
    en: "ReplyCraft · Admin",
  },
  navTitle: {
    zh: "数据后台",
    en: "Admin Dashboard",
  },
  passwordPlaceholder: {
    zh: "输入密码",
    en: "Enter password",
  },
  enter: {
    zh: "进入后台",
    en: "Enter",
  },
  backHome: {
    zh: "← 返回首页",
    en: "← Back to Home",
  },
  back: {
    zh: "← 返回",
    en: "← Back",
  },
  loading: {
    zh: "加载中...",
    en: "Loading...",
  },
  wrongPassword: {
    zh: "密码错误",
    en: "Wrong password",
  },
  loadFailed: {
    zh: "数据加载失败",
    en: "Failed to load data",
  },
  logout: {
    zh: "退出",
    en: "Log Out",
  },
  totalUsers: {
    zh: "总用户数",
    en: "Total Users",
  },
  totalGenerations: {
    zh: "总生成次数",
    en: "Total Generations",
  },
  todayGenerations: {
    zh: "今日生成",
    en: "Today",
  },
  vipUsers: {
    zh: "VIP 用户",
    en: "VIP Users",
  },
  trendTitle: {
    zh: "最近 7 天趋势",
    en: "Last 7 Days",
  },
  distribution: {
    zh: "事件分布",
    en: "Event Distribution",
  },
  recentEvents: {
    zh: "最近 50 条事件",
    en: "Last 50 Events",
  },
  colTime: {
    zh: "时间",
    en: "Time",
  },
  colUser: {
    zh: "用户",
    en: "User",
  },
  colEvent: {
    zh: "事件",
    en: "Event",
  },
  colDetail: {
    zh: "详情",
    en: "Detail",
  },
  eventGenerate: {
    zh: "生成",
    en: "Generate",
  },
  eventRegenerate: {
    zh: "换说法",
    en: "Regenerate",
  },
  eventCopy: {
    zh: "复制",
    en: "Copy",
  },
} as const

// ---------- 组件 ----------
export const COMPONENTS = {
  intimacyLabel: {
    zh: "你俩的关系有多近？",
    en: "How close are you two?",
  },
  stranger: {
    zh: "陌生人",
    en: "Stranger",
  },
  family: {
    zh: "家人/伴侣",
    en: "Family/Partner",
  },
  regenerate: {
    zh: "换说法",
    en: "New Suggestion",
  },
  continueChat: {
    zh: "继续聊 →",
    en: "Continue Chat →",
  },
  copy: {
    zh: "复制",
    en: "Copy",
  },
  swipeHint: {
    zh: "换说法（也可左滑卡片）",
    en: "New suggestion (swipe left)",
  },
  sharePreview: {
    zh: "分享预览",
    en: "Share Preview",
  },
  close: {
    zh: "关闭",
    en: "Close",
  },
  saveImage: {
    zh: "保存图片",
    en: "Save Image",
  },
  generateShareImage: {
    zh: "生成分享图",
    en: "Share as Image",
  },
} as const

// ---------- API 错误 ----------
export const API_ERR = {
  badRequest: {
    zh: "请求格式错误",
    en: "Invalid request format",
  },
  noUser: {
    zh: "缺少用户标识",
    en: "Missing user ID",
  },
  noCredits: {
    zh: "积分不足，请充值",
    en: "Insufficient credits — top up",
  },
  emptyContent: {
    zh: "请输入聊天内容",
    en: "Please enter a message",
  },
  tooLong: {
    zh: "内容过长，请控制在2000字以内",
    en: "Message too long — keep it under 2000 chars",
  },
  aiFailed: {
    zh: "AI生成失败，请重试",
    en: "AI generation failed, please retry",
  },
  missingParams: {
    zh: "缺少参数",
    en: "Missing parameters",
  },
  aiRequestFailed: {
    zh: "AI 请求失败",
    en: "AI request failed",
  },
  timeout: {
    zh: "请求超时",
    en: "Request timed out",
  },
  generationFailed: {
    zh: "生成失败",
    en: "Generation failed",
  },
  paymentUnavailable: {
    zh: "支付系统暂不可用，请稍后再试",
    en: "Payment unavailable, please try later",
  },
  missingSignature: {
    zh: "缺少签名",
    en: "Missing signature",
  },
  signatureFail: {
    zh: "签名校验失败",
    en: "Signature verification failed",
  },
  noUserId: {
    zh: "缺少 user_id",
    en: "Missing user_id",
  },
  creditsFormat: {
    zh: "credits 格式错误",
    en: "Invalid credits format",
  },
  creditsWriteFailed: {
    zh: "积分写入失败",
    en: "Failed to write credits",
  },
} as const

// ---------- 亲密度量表 ----------
export const INTIMACY_I18N = {
  labels: {
    zh: ["陌生人", "泛泛之交", "认识的人", "普通朋友", "好朋友", "亲密好友", "家人/伴侣"],
    en: [
      "Stranger",
      "Loose Contact",
      "Acquaintance",
      "Casual Friend",
      "Good Friend",
      "Close Friend",
      "Family/Partner",
    ],
  },
  prompts: {
    zh: [
      "极度正式、客套、保持社交距离。不要用表情符号。",
      "有礼貌但不亲近，就事论事。不要用表情符号。",
      "可以稍微放松，但也保持分寸。可以用0-1个表情符号，保持克制。",
      "随和、轻松、可以有点随意。可以用0-1个表情符号。",
      "直接、温暖、可以开玩笑、不用太客套。适当用1个表情符号更有温度。",
      "很随意、默契、幽默、情感充沛。可以自然用1个表情符号。",
      "极度亲密、可以撒娇、情感自然流露。可以自然用1-2个表情符号。",
    ],
    en: [
      "Extremely formal and polite, keep social distance. No emojis.",
      "Polite but not close, stick to the point. No emojis.",
      "Slightly relaxed, but still appropriate. 0–1 emojis, restrained.",
      "Easygoing and casual, can be a bit informal. 0–1 emojis.",
      "Direct, warm, can joke around. 1 emoji for warmth is fine.",
      "Very casual, inside-joke level, emotionally expressive. 1 emoji naturally.",
      "Extremely intimate — affectionate, playful, emotionally open. 1–2 emojis naturally.",
    ],
  },
} as const