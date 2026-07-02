const { generate } = require('../../utils/api')
const { DEFAULT_INTIMACY, getIntimacyLabel } = require('../../utils/intimacy')
const { SCENES, PRICING_TIERS } = require('../../utils/constants')

Page({
  data: {
    message: '',
    intimacy: DEFAULT_INTIMACY,
    intimacyLabel: getIntimacyLabel(DEFAULT_INTIMACY),
    scenes: SCENES,
    tiers: PRICING_TIERS,
    loading: false,
    error: '',
    showPricing: false,
    payingTier: null
  },

  onLoad() {
    const app = getApp()
    this.userId = app.getUserId()
  },

  // 输入
  onInput(e) {
    this.setData({ message: e.detail.value, error: '' })
  },

  // 场景标签点击
  onSceneTap(e) {
    const scene = e.currentTarget.dataset.scene
    this.setData({ message: scene, error: '' })
  },

  // 亲密度滑块
  onIntimacyChange(e) {
    const v = e.detail.value
    this.setData({ intimacy: v, intimacyLabel: getIntimacyLabel(v) })
  },

  // 打开充值弹窗
  onOpenPricing() {
    this.setData({ showPricing: true })
  },

  // 关闭充值弹窗
  onClosePricing() {
    this.setData({ showPricing: false })
  },

  // 选择档位支付 — 暂用提示，待微信支付接入
  onSelectTier(e) {
    const tier = e.currentTarget.dataset.tier
    this.setData({ payingTier: tier })

    wx.showModal({
      title: '支付功能开发中',
      content: `${tier.name} ¥${tier.price}，微信支付接入中，敬请期待`,
      showCancel: false,
      success: () => {
        this.setData({ payingTier: null })
      }
    })
  },

  // 生成回复
  async onGenerate() {
    const msg = this.data.message.trim()
    if (!msg) {
      this.setData({ error: '请输入聊天内容' })
      return
    }
    if (msg.length > 2000) {
      this.setData({ error: '内容过长，请控制在2000字以内' })
      return
    }

    this.setData({ loading: true, error: '' })

    try {
      const data = await generate({
        message: msg,
        user_id: this.userId,
        intimacy: this.data.intimacy
      })

      if (!data.success) {
        this.setData({ error: data.error || '生成失败' })
        return
      }

      // 跳转结果页
      wx.navigateTo({
        url: `/pages/result/result?data=${encodeURIComponent(JSON.stringify({
          message: msg,
          replies: data.replies,
          intimacy: this.data.intimacy
        }))}`
      })
    } catch (err) {
      this.setData({ error: (err && err.error) || '网络错误，请重试' })
    } finally {
      this.setData({ loading: false })
    }
  }
})