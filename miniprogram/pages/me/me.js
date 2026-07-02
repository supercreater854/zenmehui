const { getCredits } = require('../../utils/api')
const { loadContacts } = require('../../utils/intimacy')

Page({
  data: {
    userId: '',
    contactCount: 0,
    credits: null,
    creditsUnlimited: false,
    creditsLabel: '加载中...'
  },

  onShow() {
    const app = getApp()
    const uid = app.getUserId()
    this.setData({
      userId: uid,
      contactCount: loadContacts().length
    })
    this.loadCredits(uid)
  },

  async loadCredits(uid) {
    try {
      const data = await getCredits(uid)
      const unlimited = data.unlimited || false
      this.setData({
        credits: data.credits,
        creditsUnlimited: unlimited,
        creditsLabel: unlimited ? '无限积分' : `${data.credits} 积分`
      })
    } catch (e) {
      this.setData({ creditsLabel: '查询失败' })
    }
  },

  onExportContacts() {
    const contacts = loadContacts()
    wx.setClipboardData({
      data: JSON.stringify(contacts, null, 2),
      success: () => {
        wx.showToast({ title: '数据已复制', icon: 'success' })
      }
    })
  },

  onClearData() {
    wx.showModal({
      title: '清除数据',
      content: '将清除所有联系人数据，不可恢复',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('zmh_contacts')
          this.setData({ contactCount: 0 })
          wx.showToast({ title: '已清除', icon: 'success' })
        }
      }
    })
  }
})