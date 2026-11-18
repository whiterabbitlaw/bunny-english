const ALLOWED_SOURCES = new Set(['wx_client', 'wx_devtools', 'wx_localdebug'])

function assertDirectMiniProgramCall(wxContext) {
  const openid = wxContext && typeof wxContext.OPENID === 'string' ? wxContext.OPENID : ''
  const source = wxContext && typeof wxContext.SOURCE === 'string' ? wxContext.SOURCE : ''
  if (!openid || !ALLOWED_SOURCES.has(source)) return { ok: false, error: 'unauthenticated' }
  return { ok: true, openid }
}

module.exports = { ALLOWED_SOURCES, assertDirectMiniProgramCall }
