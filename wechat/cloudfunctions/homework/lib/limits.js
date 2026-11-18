// Application limits for this homework mini program.
// They are not WeChat or CloudBase platform limits.

const APP_LIMITS = {
  imageMaxBytes: 4 * 1024 * 1024,
  audioMaxBytes: 8 * 1024 * 1024,
  audioMinDurationMs: 1000,
  audioMaxDurationMs: 120000,
  imageExtensions: ['jpg', 'jpeg', 'png'],
  audioExtensions: ['aac', 'mp3', 'm4a', 'wav', 'silk'],
  maxBlocks: 8,
  maxAudiosPerBlock: 8,
  maxTitleLength: 40,
  maxChildNameLength: 20,
  maxChildren: 100,
  maxAssignments: 50,
  tempUrlSeconds: 300,
}

const IMAGE_EXT = new Set(APP_LIMITS.imageExtensions)
const AUDIO_EXT = new Set(APP_LIMITS.audioExtensions)

function ok(data) {
  return { ok: true, data: data === undefined ? null : data }
}

function fail(error) {
  return { ok: false, error }
}

function cleanText(value, max) {
  if (typeof value !== 'string') return ''
  const text = value.replace(/\s+/g, ' ').trim()
  if (!text || text.length > max) return ''
  return text
}

function validateImageMeta({ size, ext }) {
  if (!IMAGE_EXT.has(ext)) return fail('limit')
  if (!Number.isInteger(size) || size < 1 || size > APP_LIMITS.imageMaxBytes) return fail('limit')
  return ok()
}

function validateAudioMeta({ size, ext, durationMs, source }) {
  if (!AUDIO_EXT.has(ext)) return fail('limit')
  if (!Number.isInteger(size) || size < 1 || size > APP_LIMITS.audioMaxBytes) return fail('limit')
  if (source !== 'file' && source !== 'record') return fail('invalid')
  if (source === 'record') {
    if (!Number.isInteger(durationMs) || durationMs < APP_LIMITS.audioMinDurationMs || durationMs > APP_LIMITS.audioMaxDurationMs) {
      return fail('limit')
    }
  }
  return ok()
}

module.exports = {
  APP_LIMITS,
  IMAGE_EXT,
  AUDIO_EXT,
  ok,
  fail,
  cleanText,
  validateImageMeta,
  validateAudioMeta,
}
