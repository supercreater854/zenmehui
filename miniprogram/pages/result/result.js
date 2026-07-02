const { generate, regenerate } = require('../../utils/api')
const { getIntimacyLabel, getIntimacyTier, saveContact } = require('../../utils/intimacy')

Page({
  data: {
    message: '',
    replies: [],
    intimacy: 50,
    intimacyLabel: '',
    tier: null,
    reloading: false,
    regeningIdx: null,
    showSave: false,
    contactName: '',
    copiedIdx: -1
  },

  onLoad(options) {
    const app = getApp()
    this.userId = app.getUserId()

    try {
      const data = JSON.parse(decodeURIComponent(options.data || '{}'))
      if (data.message && data.replies) {
        this.setData({
          message: data.message,
          replies: data.replies,
          intimacy: data.intimacy || 50,
          intimacyLabel: getIntimacyLabel(data.intimacy || 50),
          tier: getIntimacyTier(data.intimacy || 50)
        })
      }
    } catch (e) { /* ignore */ }
  },

  // 亲密度 +/-
  async adjustIntimacy(e) {
    const delta = parseInt(e.currentTarget.dataset.delta)
    const newVal = Math.max(0, Math.min(100, this.data.intimacy + delta))
    if (newVal === this.data.intimacy || this.data.reloading) return

    this.setData({
      intimacy: newVal,
      intimacyLabel: getIntimacyLabel(newVal),
      tier: getIntimacyTier(newVal),
      reloading: true
    })

    try {
      const data = await generate({
        message: this.data.message,
        user_id: this.userId,
        intimacy: newVal
      })
      if (data.replies) {
        this.setData({ replies: data.replies })
      }
    } catch (e) {
      wx.showToast({ title: '生成失败', icon: 'none' })
    } finally {
      this.setData({ reloading: false })
    }
  },

  // 再来一组
  async regenerateAll() {
    if (this.data.reloading) return
    this.setData({ reloading: true })

    try {
      const data = await generate({
        message: this.data.message,
        user_id: this.userId,
        intimacy: this.data.intimacy
      })
      if (data.replies) {
        this.setData({ replies: data.replies })
      }
    } catch (e) {
      wx.showToast({ title: '生成失败', icon: 'none' })
    } finally {
      this.setData({ reloading: false })
    }
  },

  // 单体换个说法
  async regenOne(e) {
    const idx = parseInt(e.currentTarget.dataset.idx)
    this.setData({ regeningIdx: idx })

    try {
      const data = await regenerate({
        message: this.data.message,
        intimacy: this.data.intimacy,
        previous_reply: this.data.replies[idx],
        user_id: this.userId
      })
      if (data.reply) {
        const replies = [...this.data.replies]
        replies[idx] = data.reply
        this.setData({ replies })
      }
    } catch (e) {
      wx.showToast({ title: '换个说法失败', icon: 'none' })
    } finally {
      this.setData({ regeningIdx: null })
    }
  },

  // 复制
  copyText(e) {
    const idx = parseInt(e.currentTarget.dataset.idx)
    const text = this.data.replies[idx]
    wx.setClipboardData({
      data: text,
      success: () => {
        this.setData({ copiedIdx: idx })
        setTimeout(() => this.setData({ copiedIdx: -1 }), 2000)
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  },

  // 继续聊 → 回首页
  onContinue() {
    wx.navigateBack()
  },

  // 加入联系人
  onShowSave() { this.setData({ showSave: true, contactName: '' }) },
  onHideSave() { this.setData({ showSave: false }) },
  onNameInput(e) { this.setData({ contactName: e.detail.value }) },
  onSaveContact() {
    const name = this.data.contactName.trim()
    if (!name) return
    saveContact(name, this.data.intimacy)
    this.setData({ showSave: false })
    wx.showToast({ title: `已保存: ${name}`, icon: 'success' })
  }
})