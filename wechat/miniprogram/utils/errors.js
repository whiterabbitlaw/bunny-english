const TEXT = {
  unauthenticated: '没有微信登录身份',
  forbidden: '没有权限做这件事',
  'not-found': '找不到内容',
  invalid: '内容还不符合要求',
  'invite-invalid': '邀请无效，或已经绑定给别的家长',
  'already-submitted': '已经提交过了',
  'consent-required': '需要勾选监护人同意',
  incomplete: '图片、示范音频或两段录音还没齐',
  limit: '超过了这个小程序自己的大小或格式限制',
  'file-unavailable': '暂时取不到文件',
  'already-bound': '小朋友已经绑定了家长',
  'already-recording': '正在录音',
  'not-recording': '还没有开始录音',
  'nothing-to-rerecord': '没有可以重录的录音',
  'not-preview': '请先听一遍再保存',
  'config-needed': '还没有填写 AppID 或云环境 ID',
}

function showError(error) {
  const code = error && (error.code || error.message)
  wx.showToast({ title: TEXT[code] || '没有完成', icon: 'none' })
}

module.exports = { TEXT, showError }
