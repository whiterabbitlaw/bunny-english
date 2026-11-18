const { configured } = require('./utils/api')

App({
  globalData: {
    configured: configured(),
  },
  onLaunch() {
    if (!configured()) return
    wx.cloud.init({
      env: require('./config').cloudEnv,
      traceUser: false,
    })
  },
})
