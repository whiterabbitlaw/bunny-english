const { AUDIO_EXT, IMAGE_EXT } = require('./limits')

function buildCloudPath(openid, id, ext) {
  if (typeof openid !== 'string' || !/^[A-Za-z0-9_-]{8,64}$/.test(openid)) {
    throw new Error('invalid-openid')
  }
  if (typeof id !== 'string' || !/^[a-f0-9]{32}$/.test(id)) throw new Error('invalid-id')
  if (!IMAGE_EXT.has(ext) && !AUDIO_EXT.has(ext)) throw new Error('invalid-ext')
  return `private/${openid}/${id}.${ext}`
}

function parseOwnedFile(fileId, openid) {
  if (typeof fileId !== 'string' || typeof openid !== 'string' || !openid) return null
  const match = /^cloud:\/\/[A-Za-z0-9._-]+\/private\/([^/]+)\/([a-f0-9]{32})\.(jpg|jpeg|png|aac|mp3|m4a|wav|silk)$/.exec(fileId)
  if (!match || match[1] !== openid) return null
  const ext = match[3]
  return {
    openid,
    id: match[2],
    ext,
    kind: IMAGE_EXT.has(ext) ? 'image' : 'audio',
    cloudPath: `private/${openid}/${match[2]}.${ext}`,
  }
}

module.exports = { buildCloudPath, parseOwnedFile }
