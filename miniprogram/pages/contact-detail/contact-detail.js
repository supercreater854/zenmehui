const { getContact, updateContact, deleteContact, saveContact, getIntimacyLabel, DEFAULT_INTIMACY } = require('../../utils/intimacy')
const { RELATIONS } = require('../../utils/constants')

Page({
  data: {
    id: '',
    name: '',
    intimacy: DEFAULT_INTIMACY,
    intimacyLabel: getIntimacyLabel(DEFAULT_INTIMACY),
    relation: '',
    relations: RELATIONS,
    isNew: false,
    saved: false
  },

  onLoad(options) {
    if (options.new) {
      this.setData({ name: decodeURIComponent(options.new), isNew: true })
      return
    }

    const contact = getContact(options.id)
    if (contact) {
      this.setData({
        id: contact.id,
        name: contact.name,
        intimacy: contact.intimacy,
        intimacyLabel: getIntimacyLabel(contact.intimacy),
        relation: contact.relation || ''
      })
    }
  },

  onNameInput(e) { this.setData({ name: e.detail.value }) },

  onRelationTap(e) {
    const rel = e.currentTarget.dataset.rel
    this.setData({ relation: this.data.relation === rel ? '' : rel })
  },

  onIntimacyChange(e) {
    const v = e.detail.value
    this.setData({ intimacy: v, intimacyLabel: getIntimacyLabel(v) })
  },

  onSave() {
    if (!this.data.name.trim()) return

    if (this.data.isNew) {
      saveContact(this.data.name, this.data.intimacy, this.data.relation)
    } else {
      updateContact(this.data.id, {
        name: this.data.name,
        intimacy: this.data.intimacy,
        relation: this.data.relation || undefined
      })
    }

    this.setData({ saved: true })
    setTimeout(() => this.setData({ saved: false }), 2000)
    wx.showToast({ title: '已保存', icon: 'success' })
  },

  onDelete() {
    wx.showModal({
      title: '确认删除',
      content: '删除后不可恢复',
      success: (res) => {
        if (res.confirm) {
          deleteContact(this.data.id)
          wx.navigateBack()
        }
      }
    })
  }
})