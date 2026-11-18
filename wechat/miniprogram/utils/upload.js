const { call } = require('./api')
const { buildCloudPath } = require('./files')
const { randomHex } = require('./id')

function uploadLocal({ openid, tempFilePath, ext, kind, size, durationMs, source }) {
  return randomHex().then((id) => {
    const cloudPath = buildCloudPath(openid, id, ext)
    return wx.cloud.uploadFile({ cloudPath, filePath: tempFilePath }).then((res) => {
      return call('attachUpload', {
        fileId: res.fileID,
        kind,
        size,
        ext,
        durationMs: durationMs || 0,
        source,
      }).then(() => res.fileID)
    })
  })
}

module.exports = { uploadLocal }
