App({
  onLaunch() {
    const id = wx.getStorageSync('zmh_user_id')
    if (!id) {
      wx.setStorageSync('zmh_user_id', this.genUUID())
    }
  },

  genUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })
  },

  getUserId() {
    return wx.getStorageSync('zmh_user_id')
  }
})