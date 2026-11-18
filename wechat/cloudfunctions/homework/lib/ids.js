const crypto = require('crypto')

function newId() {
  return crypto.randomBytes(16).toString('hex')
}

function newToken() {
  return crypto.randomBytes(32).toString('base64url')
}

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex')
}

function tokenMatches(storedHash, token) {
  if (typeof storedHash !== 'string' || typeof token !== 'string') return false
  if (token.length < 20 || token.length > 200) return false
  const actual = Buffer.from(hashToken(token), 'hex')
  const expected = Buffer.from(storedHash, 'hex')
  if (actual.length === 0 || actual.length !== expected.length) return false
  return crypto.timingSafeEqual(actual, expected)
}

module.exports = { newId, newToken, hashToken, tokenMatches }
