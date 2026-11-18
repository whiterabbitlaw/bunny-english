const config = require('../config')

function configured() {
  return Boolean(config.appid && config.cloudEnv)
}

function call(action, payload) {
  if (!configured() || !wx.cloud) return Promise.reject(Object.assign(new Error('config-needed'), { code: 'config-needed' }))
  return wx.cloud.callFunction({
    name: 'homework',
    data: { action, payload: payload || {} },
  }).then((res) => {
    const result = res.result || { ok: false, error: 'file-unavailable' }
    if (!result.ok) {
      const error = new Error(result.error || 'invalid')
      error.code = result.error || 'invalid'
      throw error
    }
    return result.data
  })
}

module.exports = { configured, call }
