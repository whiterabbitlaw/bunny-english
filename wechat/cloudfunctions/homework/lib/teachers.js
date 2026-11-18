function parseTeacherOpenIds(raw) {
  if (typeof raw !== 'string') return new Set()
  const ids = raw
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item && item !== '*')
  return new Set(ids)
}

module.exports = { parseTeacherOpenIds }
