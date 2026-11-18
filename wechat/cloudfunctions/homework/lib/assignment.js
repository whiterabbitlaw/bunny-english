const { APP_LIMITS, cleanText, fail, ok } = require('./limits')

function normalizeBlocks(blocks, requireMedia) {
  if (!Array.isArray(blocks) || blocks.length > APP_LIMITS.maxBlocks) return fail('invalid')
  if (requireMedia && blocks.length < 1) return fail('incomplete')
  const ids = new Set()
  const clean = []
  for (const block of blocks) {
    if (!block || typeof block !== 'object') return fail('invalid')
    const title = cleanText(block.title, APP_LIMITS.maxTitleLength)
    if (!title) return fail('invalid')
    if (typeof block.id !== 'string' || !/^[a-f0-9]{32}$/.test(block.id) || ids.has(block.id)) return fail('invalid')
    ids.add(block.id)
    const imageFileId = block.imageFileId || null
    if (imageFileId !== null && typeof imageFileId !== 'string') return fail('invalid')
    if (requireMedia && !imageFileId) return fail('incomplete')
    if (!Array.isArray(block.audios) || block.audios.length > APP_LIMITS.maxAudiosPerBlock) return fail('invalid')
    if (requireMedia && block.audios.length < 1) return fail('incomplete')
    const audios = []
    const audioIds = new Set()
    for (const audio of block.audios) {
      if (!audio || typeof audio !== 'object') return fail('invalid')
      const label = cleanText(audio.label, APP_LIMITS.maxTitleLength)
      if (!label) return fail('invalid')
      if (typeof audio.id !== 'string' || !/^[a-f0-9]{32}$/.test(audio.id) || audioIds.has(audio.id)) return fail('invalid')
      audioIds.add(audio.id)
      const fileId = audio.fileId || null
      if (fileId !== null && typeof fileId !== 'string') return fail('invalid')
      if (requireMedia && !fileId) return fail('incomplete')
      audios.push({ id: audio.id, label, fileId })
    }
    clean.push({ id: block.id, title, imageFileId, audios })
  }
  return ok(clean)
}

function normalizeAssignment(input, requireMedia) {
  const title = cleanText(input && input.title, APP_LIMITS.maxTitleLength)
  if (!title) return fail('invalid')
  const blocks = normalizeBlocks(input.blocks || [], requireMedia)
  if (!blocks.ok) return blocks
  return ok({ title, blocks: blocks.data })
}

module.exports = { normalizeAssignment }
