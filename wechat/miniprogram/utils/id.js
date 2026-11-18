function randomHex() {
  return new Promise((resolve, reject) => {
    wx.getRandomValues({
      length: 16,
      success(res) {
        const bytes = new Uint8Array(res.randomValues)
        resolve(Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(''))
      },
      fail: reject,
    })
  })
}

function extOf(name) {
  const match = /\.([A-Za-z0-9]+)$/.exec(name || '')
  return match ? match[1].toLowerCase() : ''
}

module.exports = { randomHex, extOf }
