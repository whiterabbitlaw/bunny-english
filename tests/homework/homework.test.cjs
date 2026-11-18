const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const test = require('node:test')

const { normalizeAssignment } = require('../../wechat/cloudfunctions/homework/lib/assignment')
const { assertDirectMiniProgramCall } = require('../../wechat/cloudfunctions/homework/lib/caller')
const { buildCloudPath, parseOwnedFile } = require('../../wechat/cloudfunctions/homework/lib/files')
const { hashToken } = require('../../wechat/cloudfunctions/homework/lib/ids')
const { APP_LIMITS, validateAudioMeta, validateImageMeta } = require('../../wechat/cloudfunctions/homework/lib/limits')
const { createMemoryStore } = require('../../wechat/cloudfunctions/homework/lib/memory-store')
const { exclusiveStart, idle, lock, markSaved, rerecord, start, stop } = require('../../wechat/cloudfunctions/homework/lib/recording')
const { createService } = require('../../wechat/cloudfunctions/homework/lib/service')
const { parseTeacherOpenIds } = require('../../wechat/cloudfunctions/homework/lib/teachers')
const sample = require('../../wechat/miniprogram/sample/homework')

const teacher = 'teacherOpenA'
const otherTeacher = 'teacherOpenB'
const guardian = 'guardianOpenA'
const otherGuardian = 'guardianOpenB'
const stranger = 'strangerOpenA'

function hex(byte) {
  return Buffer.alloc(16, byte).toString('hex')
}

function fileId(openid, ext, byte = 1) {
  return `cloud://env-test.bucket/private/${openid}/${hex(byte)}.${ext}`
}

function harness(openIds = [teacher]) {
  const store = createMemoryStore()
  const signed = []
  let clock = 1_000
  const service = createService({
    store,
    signFiles: async (ids) => {
      signed.push(...ids)
      return ids.map((id) => ({ fileId: id, url: `https://temp.example/${hashToken(id)}` }))
    },
    now: () => clock++,
    teacherOpenIds: new Set(openIds),
  })
  return {
    store,
    signed,
    service,
    as(openid) {
      return (action, payload) => service.execute(action, payload, openid)
    },
  }
}

async function publishedHomework() {
  const env = harness([teacher, otherTeacher])
  const image = fileId(teacher, 'jpg', 1)
  const audio = fileId(teacher, 'mp3', 2)
  const blockId = hex(3)
  const audioId = hex(4)
  const teacherCall = env.as(teacher)
  assert.equal((await teacherCall('attachUpload', { fileId: image, kind: 'image', size: 1200, ext: 'jpg' })).ok, true)
  assert.equal((await teacherCall('attachUpload', { fileId: audio, kind: 'audio', size: 2200, source: 'file', ext: 'mp3' })).ok, true)
  const draft = await teacherCall('saveDraft', {
    title: '文具和字母',
    blocks: [{ id: blockId, title: '看图说句子', imageFileId: image, audios: [{ id: audioId, label: "It's a pencil.", fileId: audio }] }],
  })
  assert.equal(draft.ok, true)
  return { env, draft: draft.data, image, audio, blockId, audioId, teacherCall }
}

test('app limits reject oversized and unsupported files', () => {
  assert.equal(validateImageMeta({ size: 100, ext: 'png' }).ok, true)
  assert.equal(validateImageMeta({ size: APP_LIMITS.imageMaxBytes + 1, ext: 'jpg' }).error, 'limit')
  assert.equal(validateImageMeta({ size: 0, ext: 'jpg' }).error, 'limit')
  assert.equal(validateImageMeta({ size: 100, ext: 'gif' }).error, 'limit')
  assert.equal(validateAudioMeta({ size: 100, ext: 'aac', source: 'record', durationMs: 1500 }).ok, true)
  assert.equal(validateAudioMeta({ size: APP_LIMITS.audioMaxBytes + 1, ext: 'mp3', source: 'file' }).error, 'limit')
  assert.equal(validateAudioMeta({ size: 100, ext: 'mp3', source: 'record', durationMs: 999 }).error, 'limit')
  assert.equal(validateAudioMeta({ size: 100, ext: 'mp3', source: 'record', durationMs: APP_LIMITS.audioMaxDurationMs + 1 }).error, 'limit')
  assert.equal(validateAudioMeta({ size: 100, ext: 'exe', source: 'file' }).error, 'limit')
  assert.equal(buildCloudPath(teacher, hex(9), 'jpg'), `private/${teacher}/${hex(9)}.jpg`)
  assert.equal(parseOwnedFile(`cloud://env.bucket/private/other/${hex(9)}.jpg`, teacher), null)
})

test('recording moves idle, preview, rerecord, and lock without two takes at once', () => {
  let sentences = idle()
  let letters = idle()
  const started = exclusiveStart({ sentences, letters }, 'sentences')
  assert.equal(started.ok, true)
  sentences = started.data.sentences
  assert.equal(exclusiveStart({ sentences, letters }, 'letters').error, 'already-recording')
  sentences = stop(sentences).data
  assert.equal(sentences.phase, 'preview')
  sentences = rerecord(sentences).data
  assert.equal(sentences.phase, 'recording')
  sentences = markSaved(stop(sentences).data).data
  assert.equal(sentences.phase, 'saved')
  sentences = lock()
  assert.equal(start(sentences).error, 'already-submitted')
  assert.equal(rerecord(sentences).error, 'already-submitted')
})

test('only an allowlisted openid is a teacher', async () => {
  const env = harness()
  assert.equal((await env.as(stranger)('session', { role: 'teacher' })).data.role, 'none')
  assert.equal((await env.as(stranger)('createChild', { displayName: '小明' })).error, 'forbidden')
  assert.equal(parseTeacherOpenIds(' teacherOpenA, * , ,teacherOpenB ').has('*'), false)
  assert.deepEqual([...parseTeacherOpenIds(' teacherOpenA, * , ,teacherOpenB ')], ['teacherOpenA', 'teacherOpenB'])
  assert.equal(assertDirectMiniProgramCall({ OPENID: teacher, SOURCE: 'wx_client' }).ok, true)
  assert.equal(assertDirectMiniProgramCall({ OPENID: teacher, SOURCE: 'wx_client,scf' }).error, 'unauthenticated')
  assert.equal(assertDirectMiniProgramCall({ OPENID: '', SOURCE: 'wx_devtools' }).error, 'unauthenticated')
  assert.equal(assertDirectMiniProgramCall({ OPENID: teacher, SOURCE: 'wx_http' }).error, 'unauthenticated')
})

test('invite is stored hashed and cannot bind a second guardian', async () => {
  const env = harness()
  const created = await env.as(teacher)('createChild', { displayName: ' 小明 ' })
  assert.equal(created.ok, true)
  const stored = await env.store.findChild(created.data.childId)
  assert.equal(stored.inviteToken, undefined)
  assert.equal(stored.inviteHash, hashToken(created.data.inviteToken))
  assert.equal(JSON.stringify(await env.as(teacher)('listChildren')).includes(created.data.inviteToken), false)
  assert.equal(JSON.stringify(await env.as(teacher)('listChildren')).includes('inviteHash'), false)
  const claim = await env.as(guardian)('claimInvite', { token: created.data.inviteToken })
  assert.equal(claim.ok, true)
  assert.equal((await env.as(guardian)('claimInvite', { token: created.data.inviteToken })).ok, true)
  assert.equal((await env.as(otherGuardian)('claimInvite', { token: created.data.inviteToken })).error, 'invite-invalid')
  assert.equal((await env.as(otherGuardian)('claimInvite', { token: 'not-a-real-invite-token' })).error, 'invite-invalid')
  assert.equal((await env.as(stranger)('rotateInvite', { childId: created.data.childId })).error, 'forbidden')
})

test('draft stays hidden, publish is explicit, and another teacher cannot read it', async () => {
  const setup = await publishedHomework()
  const { env, teacherCall } = setup
  const draftOnly = await teacherCall('saveDraft', { title: '还没发', blocks: [] })
  assert.equal(draftOnly.ok, true)
  env.signed.length = 0
  const hidden = await env.as(guardian)('getAssignment', { assignmentId: draftOnly.data.assignmentId })
  assert.equal(hidden.error, 'not-found')
  assert.equal(env.signed.length, 0)
  assert.equal((await teacherCall('publish', { assignmentId: draftOnly.data.assignmentId })).error, 'incomplete')
  assert.equal((await env.store.findAssignment(draftOnly.data.assignmentId)).status, 'draft')
  const published = await teacherCall('publish', { assignmentId: setup.draft.assignmentId })
  assert.equal(published.data.status, 'published')
  assert.equal((await teacherCall('saveDraft', { assignmentId: setup.draft.assignmentId, title: '改标题', blocks: [] })).error, 'invalid')
  env.signed.length = 0
  assert.equal((await env.as(otherTeacher)('getAssignment', { assignmentId: setup.draft.assignmentId })).error, 'not-found')
  assert.equal(env.signed.length, 0)
  const guardianList = await env.as(guardian)('listAssignments')
  assert.equal(guardianList.ok, true)
  assert.equal(guardianList.data.some((item) => item.id === draftOnly.data.assignmentId), false)
})

test('guardian sees media urls only after binding, and cannot read another child recording', async () => {
  const setup = await publishedHomework()
  const { env, teacherCall } = setup
  await teacherCall('publish', { assignmentId: setup.draft.assignmentId })
  const first = await teacherCall('createChild', { displayName: '小明' })
  const second = await teacherCall('createChild', { displayName: '小华' })
  assert.equal((await env.as(stranger)('getAssignment', { assignmentId: setup.draft.assignmentId })).error, 'not-found')
  await env.as(guardian)('claimInvite', { token: first.data.inviteToken })
  await env.as(otherGuardian)('claimInvite', { token: second.data.inviteToken })
  env.signed.length = 0
  const viewed = await env.as(guardian)('getAssignment', { assignmentId: setup.draft.assignmentId })
  assert.equal(viewed.ok, true)
  assert.equal(JSON.stringify(viewed).includes('cloud://'), false)
  assert.equal(JSON.stringify(viewed).includes('fileId'), false)
  assert.ok(env.signed.includes(setup.image))
  assert.ok(env.signed.includes(setup.audio))

  const recording = fileId(guardian, 'aac', 8)
  assert.equal((await env.as(guardian)('attachUpload', {
    fileId: recording, kind: 'audio', size: 3000, source: 'record', durationMs: 2000, ext: 'aac',
  })).ok, true)
  assert.equal((await env.as(otherGuardian)('saveSection', {
    assignmentId: setup.draft.assignmentId, childId: first.data.childId, section: 'sentences', fileId: recording,
  })).error, 'forbidden')
  env.signed.length = 0
  assert.equal((await env.as(otherGuardian)('listSubmissions', { assignmentId: setup.draft.assignmentId })).error, 'forbidden')
  assert.equal(env.signed.length, 0)
  assert.equal((await env.as(otherTeacher)('listSubmissions', { assignmentId: setup.draft.assignmentId })).error, 'not-found')

  await env.as(guardian)('saveSection', {
    assignmentId: setup.draft.assignmentId, childId: first.data.childId, section: 'sentences', fileId: recording,
  })
  const letters = fileId(guardian, 'aac', 9)
  await env.as(guardian)('attachUpload', { fileId: letters, kind: 'audio', size: 3000, source: 'record', durationMs: 2000, ext: 'aac' })
  await env.as(guardian)('saveSection', {
    assignmentId: setup.draft.assignmentId, childId: first.data.childId, section: 'letters', fileId: letters,
  })
  assert.equal((await env.as(guardian)('submitHomework', { assignmentId: setup.draft.assignmentId, childId: first.data.childId })).error, 'consent-required')
  assert.equal((await env.as(guardian)('submitHomework', {
    assignmentId: setup.draft.assignmentId, childId: first.data.childId, consent: true,
  })).data.status, 'submitted')
  assert.equal((await env.as(guardian)('submitHomework', {
    assignmentId: setup.draft.assignmentId, childId: first.data.childId, consent: true,
  })).error, 'already-submitted')
  assert.equal((await env.as(guardian)('saveSection', {
    assignmentId: setup.draft.assignmentId, childId: first.data.childId, section: 'sentences', fileId: recording,
  })).error, 'already-submitted')
  assert.equal((await env.store.findSubmission(setup.draft.assignmentId, first.data.childId)).status, 'submitted')

  env.signed.length = 0
  const teacherView = await teacherCall('listSubmissions', { assignmentId: setup.draft.assignmentId })
  assert.equal(teacherView.ok, true)
  const child = teacherView.data.children.find((item) => item.childId === first.data.childId)
  assert.equal(child.status, 'submitted')
  assert.match(child.sentencesUrl, /^https:\/\/temp\.example\//)
  assert.equal(JSON.stringify(teacherView).includes(guardian), false)
  assert.ok(env.signed.includes(recording))
})

test('a guardian cannot attach another person file or publish', async () => {
  const setup = await publishedHomework()
  const stolen = fileId(teacher, 'jpg', 1)
  assert.equal((await setup.env.as(guardian)('attachUpload', { fileId: stolen, kind: 'image', size: 100, ext: 'jpg' })).error, 'forbidden')
  assert.equal((await setup.env.as(guardian)('publish', { assignmentId: setup.draft.assignmentId })).error, 'forbidden')
  assert.equal(normalizeAssignment({ title: '   ', blocks: [] }, false).error, 'invalid')
})

test('sample homework is labeled and has no uploadable media', () => {
  assert.equal(sample.demo, true)
  assert.equal(sample.persists, false)
  assert.match(sample.notice, /不能上传/)
  for (const block of sample.blocks) {
    assert.equal(block.fileId, undefined)
    assert.ok(block.audios.length >= 1)
    for (const audio of block.audios) {
      assert.equal(audio.unavailable, true)
      assert.equal(audio.fileId, undefined)
    }
  }
})

test('shipped rules deny client reads and the repo has no invented app or env id', () => {
  const rules = JSON.parse(fs.readFileSync('wechat/security-rules.json', 'utf8'))
  for (const name of ['children', 'assignments', 'submissions', 'files']) {
    assert.equal(rules.database[name].read, false)
    assert.equal(rules.database[name].write, false)
  }
  assert.equal(rules.storage.read, false)
  assert.equal(rules.storage.write, 'auth.openid == resource.openid')
  assert.notEqual(rules.functionInvoke['*'].invoke, true)
  const config = require('../../wechat/miniprogram/config')
  const project = JSON.parse(fs.readFileSync('wechat/project.config.json', 'utf8'))
  assert.equal(config.appid, '')
  assert.equal(config.cloudEnv, '')
  assert.equal(project.appid, '')
  const tree = [
    'wechat/cloudfunctions/homework/index.js',
    'wechat/miniprogram/config.js',
    'wechat/project.config.json',
  ].map((file) => fs.readFileSync(file, 'utf8')).join('\n')
  assert.doesNotMatch(tree, /wx[0-9a-f]{16}/)
  assert.match(fs.readFileSync('wechat/cloudfunctions/homework/index.js', 'utf8'), /process\.env\.TEACHER_OPENIDS/)
  assert.equal(fs.readFileSync('wechat/cloudfunctions/homework/lib/limits.js', 'utf8'), fs.readFileSync('wechat/miniprogram/utils/limits.js', 'utf8'))
  assert.equal(fs.readFileSync('wechat/cloudfunctions/homework/lib/recording.js', 'utf8'), fs.readFileSync('wechat/miniprogram/utils/recording.js', 'utf8'))
  assert.equal(fs.readFileSync('wechat/cloudfunctions/homework/lib/files.js', 'utf8'), fs.readFileSync('wechat/miniprogram/utils/files.js', 'utf8'))
  assert.equal(crypto.randomBytes(1).length, 1)
})
