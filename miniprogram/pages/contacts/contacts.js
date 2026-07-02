const { loadContacts, deleteContact, getIntimacyLabel } = require('../../utils/intimacy')

Page({
  data: {
    contacts: [],
    showNew: false,
    newName: ''
  },

  onShow() {
    this.setData({ contacts: loadContacts() })
  },

  onShowNew() { this.setData({ showNew: true, newName: '' }) },
  onHideNew() { this.setData({ showNew: false }) },
  onNewNameInput(e) { this.setData({ newName: e.detail.value }) },

  onCreateContact() {
    const name = this.data.newName.trim()
    if (!name) return
    this.setData({ showNew: false })
    wx.navigateTo({ url: `/pages/contact-detail/contact-detail?new=${encodeURIComponent(name)}` })
  },

  onTapContact(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/contact-detail/contact-detail?id=${id}` })
  },

  onDelete(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复',
      success: (res) => {
        if (res.confirm) {
          deleteContact(id)
          this.setData({ contacts: loadContacts() })
        }
      }
    })
  }
})