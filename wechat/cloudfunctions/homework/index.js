const cloud = require('wx-server-sdk')
const { assertDirectMiniProgramCall } = require('./lib/caller')
const { createCloudStore } = require('./lib/cloud-store')
const { createService } = require('./lib/service')
const { APP_LIMITS } = require('./lib/limits')
const { parseTeacherOpenIds } = require('./lib/teachers')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async (event) => {
  const caller = assertDirectMiniProgramCall(cloud.getWXContext())
  if (!caller.ok) return { ok: false, error: caller.error }
  const service = createService({
    store: createCloudStore(cloud.database()),
    signFiles: (fileIds) => signFiles(fileIds),
    now: () => Date.now(),
    teacherOpenIds: parseTeacherOpenIds(process.env.TEACHER_OPENIDS),
  })
  try {
    return await service.execute(event && event.action, event && event.payload, caller.openid)
  } catch (error) {
    console.error(error && error.message ? error.message : 'homework-failed')
    return { ok: false, error: 'file-unavailable' }
  }
}

async function signFiles(fileIds) {
  const res = await cloud.getTempFileURL({
    fileList: fileIds.map((fileID) => ({ fileID, maxAge: APP_LIMITS.tempUrlSeconds })),
  })
  const list = (res && res.fileList) || []
  return fileIds.map((fileID) => {
    const item = list.find((entry) => entry.fileID === fileID)
    if (!item || item.status !== 0 || !item.tempFileURL) return null
    return { fileId: fileID, url: item.tempFileURL, expiresIn: APP_LIMITS.tempUrlSeconds }
  })
}
