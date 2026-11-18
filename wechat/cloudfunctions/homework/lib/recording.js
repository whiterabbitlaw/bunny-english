const { fail, ok } = require('./limits')

function idle() {
  return { phase: 'idle' }
}

function start(state) {
  if (!state || state.phase === 'locked') return fail('already-submitted')
  if (state.phase === 'recording') return fail('already-recording')
  return ok({ phase: 'recording' })
}

function stop(state) {
  if (!state || state.phase !== 'recording') return fail('not-recording')
  return ok({ phase: 'preview' })
}

function rerecord(state) {
  if (!state || state.phase === 'locked') return fail('already-submitted')
  if (state.phase !== 'preview' && state.phase !== 'saved') return fail('nothing-to-rerecord')
  return ok({ phase: 'recording' })
}

function markSaved(state) {
  if (!state || state.phase !== 'preview') return fail('not-preview')
  return ok({ phase: 'saved' })
}

function lock() {
  return { phase: 'locked' }
}

function exclusiveStart(states, section) {
  const names = Object.keys(states)
  if (!names.includes(section)) return fail('invalid')
  if (names.some((name) => states[name].phase === 'recording')) return fail('already-recording')
  const next = start(states[section])
  if (!next.ok) return next
  return ok({ ...states, [section]: next.data })
}

module.exports = { idle, start, stop, rerecord, markSaved, lock, exclusiveStart }
