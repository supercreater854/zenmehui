// ====== 首页 SCENES ======
const SCENES = [
  '老板让我加班',
  '对象生气了',
  '不知道怎么拒绝',
  '朋友借钱',
  '被夸了怎么回',
  '想约人出来'
]

// ====== 积分定价档 ======
const PRICING_TIERS = [
  { tier: '100', credits: 100,  price: 6.9,  name: '100 积分',  desc: '轻度使用', highlight: false },
  { tier: '300', credits: 300,  price: 14.9, name: '300 积分',  desc: '中度使用', highlight: true  },
  { tier: '1000',credits: 1000, price: 29.9, name: '1000 积分', desc: '重度使用', highlight: false },
  { tier: 'lifetime', credits: -1, price: 29.9, name: '永久无限', desc: '一次付费终身畅用', highlight: false }
]

// ====== 关系选项 ======
const RELATIONS = ['同事', '朋友', '家人', '恋爱', '同学', '网友', '自定义']

module.exports = { SCENES, PRICING_TIERS, RELATIONS }