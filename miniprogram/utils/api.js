// API 调用封装 — 指向 Next.js 后端
// 开发时用 localhost，生产替换为 edgeone 域名

const BASE_URL = 'https://supercreater-n3uz0jdp.edgeone.cool'
// const BASE_URL = 'http://localhost:3000' // 本地调试

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + path,
      method: options.method || 'GET',
      data: options.data,
      header: { 'Content-Type': 'application/json' },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(res.data)
        }
      },
      fail(err) {
        reject({ error: '网络请求失败', detail: err.errMsg })
      }
    })
  })
}

// 生成回复
function generate(data) {
  return request('/api/generate', { method: 'POST', data })
}

// 换个说法
function regenerate(data) {
  return request('/api/regenerate', { method: 'POST', data })
}

// 查询积分
function getCredits(userId) {
  return request('/api/credits?user_id=' + encodeURIComponent(userId))
}

module.exports = { request, generate, regenerate, getCredits, BASE_URL }