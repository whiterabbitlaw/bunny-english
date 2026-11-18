const { normalizeAssignment } = require('./assignment')
const { parseOwnedFile } = require('./files')
const { newId, newToken, hashToken, tokenMatches } = require('./ids')
const { APP_LIMITS, cleanText, fail, ok, validateAudioMeta, validateImageMeta } = require('./limits')

const SECTIONS = new Set(['sentences', 'letters'])

function createService({ store, signFiles, now, teacherOpenIds }) {
  const teachers = teacherOpenIds instanceof Set ? teacherOpenIds : new Set(teacherOpenIds || [])

  function isTeacher(openid) {
    return teachers.has(openid)
  }

  async function ownedFile(fileId, openid, kind) {
    const parsed = parseOwnedFile(fileId, openid)
    if (!parsed || parsed.kind !== kind) return null
    const row = await store.findFile(fileId)
    if (!row || row.ownerOpenId !== openid || row.kind !== kind) return null
    return row
  }

  async function urlsFor(fileIds) {
    const unique = [...new Set(fileIds.filter(Boolean))]
    if (unique.length === 0) return new Map()
    const signed = await signFiles(unique)
    if (!Array.isArray(signed) || signed.length !== unique.length) return null
    const urls = new Map()
    for (const item of signed) {
      if (!item || typeof item.url !== 'string' || !item.url || item.url.startsWith('cloud://')) return null
      if (!unique.includes(item.fileId)) return null
      urls.set(item.fileId, item.url)
    }
    return urls
  }

  function teacherBlock(block, urls) {
    return {
      id: block.id,
      title: block.title,
      imageFileId: block.imageFileId,
      imageUrl: block.imageFileId ? urls.get(block.imageFileId) || '' : '',
      audios: block.audios.map((audio) => ({
        id: audio.id,
        label: audio.label,
        fileId: audio.fileId,
        url: audio.fileId ? urls.get(audio.fileId) || '' : '',
      })),
    }
  }

  function guardianBlock(block, urls) {
    return {
      id: block.id,
      title: block.title,
      imageUrl: urls.get(block.imageFileId) || '',
      audios: block.audios.map((audio) => ({
        id: audio.id,
        label: audio.label,
        url: urls.get(audio.fileId) || '',
      })),
    }
  }

  async function filesOf(blocks) {
    const ids = []
    for (const block of blocks) {
      if (block.imageFileId) ids.push(block.imageFileId)
      for (const audio of block.audios) if (audio.fileId) ids.push(audio.fileId)
    }
    return ids
  }

  return {
    async execute(action, payload, openid) {
      const body = payload && typeof payload === 'object' ? payload : {}
      if (!openid || typeof openid !== 'string') return fail('unauthenticated')
      switch (action) {
        case 'session':
          return session()
        case 'createChild':
          return createChild()
        case 'listChildren':
          return listChildren()
        case 'rotateInvite':
          return rotateInvite()
        case 'unbindChild':
          return unbindChild()
        case 'claimInvite':
          return claimInvite()
        case 'attachUpload':
          return attachUpload()
        case 'saveDraft':
          return saveDraft()
        case 'publish':
          return publish()
        case 'listAssignments':
          return listAssignments()
        case 'getAssignment':
          return getAssignment()
        case 'saveSection':
          return saveSection()
        case 'submitHomework':
          return submitHomework()
        case 'listSubmissions':
          return listSubmissions()
        default:
          return fail('not-found')
      }

      async function session() {
        const guardianChildren = await store.listChildrenByGuardian(openid)
        return ok({
          openid,
          role: isTeacher(openid) ? 'teacher' : guardianChildren.length ? 'guardian' : 'none',
          children: guardianChildren.map(publicChild),
        })
      }

      async function createChild() {
        if (!isTeacher(openid)) return fail('forbidden')
        const displayName = cleanText(body.displayName, APP_LIMITS.maxChildNameLength)
        if (!displayName) return fail('invalid')
        const existing = await store.listChildrenByTeacher(openid)
        if (existing.length >= APP_LIMITS.maxChildren) return fail('limit')
        const inviteToken = newToken()
        const child = {
          _id: newId(),
          teacherOpenId: openid,
          displayName,
          guardianOpenId: null,
          inviteHash: hashToken(inviteToken),
          createdAt: now(),
        }
        await store.insertChild(child)
        return ok({ childId: child._id, displayName, inviteToken })
      }

      async function listChildren() {
        if (!isTeacher(openid)) return fail('forbidden')
        const rows = await store.listChildrenByTeacher(openid)
        return ok(rows.map((row) => ({ id: row._id, displayName: row.displayName, bound: Boolean(row.guardianOpenId) })))
      }

      async function rotateInvite() {
        if (!isTeacher(openid)) return fail('forbidden')
        const child = await store.findChild(body.childId)
        if (!child || child.teacherOpenId !== openid) return fail('not-found')
        if (child.guardianOpenId) return fail('already-bound')
        const inviteToken = newToken()
        await store.updateChild(child._id, { inviteHash: hashToken(inviteToken) })
        return ok({ childId: child._id, displayName: child.displayName, inviteToken })
      }

      async function unbindChild() {
        if (!isTeacher(openid)) return fail('forbidden')
        const child = await store.findChild(body.childId)
        if (!child || child.teacherOpenId !== openid) return fail('not-found')
        await store.updateChild(child._id, { guardianOpenId: null, inviteHash: hashToken(newToken()) })
        return ok({ childId: child._id, bound: false })
      }

      async function claimInvite() {
        const hash = typeof body.token === 'string' ? hashToken(body.token) : ''
        const child = hash ? await store.findChildByInviteHash(hash) : null
        if (!child || !tokenMatches(child.inviteHash, body.token)) return fail('invite-invalid')
        if (child.guardianOpenId && child.guardianOpenId !== openid) return fail('invite-invalid')
        if (!child.guardianOpenId) await store.updateChild(child._id, { guardianOpenId: openid, boundAt: now() })
        return ok({ childId: child._id, displayName: child.displayName })
      }

      async function attachUpload() {
        const parsed = parseOwnedFile(body.fileId, openid)
        if (!parsed || parsed.kind !== body.kind) return fail('forbidden')
        const meta = parsed.kind === 'image'
          ? validateImageMeta({ size: body.size, ext: parsed.ext })
          : validateAudioMeta({ size: body.size, ext: parsed.ext, durationMs: body.durationMs, source: body.source })
        if (!meta.ok) return meta
        if (parsed.kind === 'image' && !isTeacher(openid)) return fail('forbidden')
        if (!isTeacher(openid)) {
          const mine = await store.listChildrenByGuardian(openid)
          if (mine.length === 0) return fail('forbidden')
        }
        const existing = await store.findFile(body.fileId)
        if (existing) {
          if (existing.ownerOpenId !== openid || existing.kind !== parsed.kind) return fail('forbidden')
          return ok({ fileId: body.fileId, kind: parsed.kind })
        }
        await store.insertFile({
          _id: hashToken(body.fileId),
          fileId: body.fileId,
          ownerOpenId: openid,
          kind: parsed.kind,
          ext: parsed.ext,
          size: body.size,
          createdAt: now(),
        })
        return ok({ fileId: body.fileId, kind: parsed.kind })
      }

      async function saveDraft() {
        if (!isTeacher(openid)) return fail('forbidden')
        const normalized = normalizeAssignment(body, false)
        if (!normalized.ok) return normalized
        const media = await assertTeacherMedia(normalized.data.blocks)
        if (!media.ok) return media
        const stamp = now()
        if (!body.assignmentId) {
          const count = await store.countAssignmentsByTeacher(openid)
          if (count >= APP_LIMITS.maxAssignments) return fail('limit')
          const assignment = {
            _id: newId(),
            ownerOpenId: openid,
            status: 'draft',
            title: normalized.data.title,
            blocks: normalized.data.blocks,
            createdAt: stamp,
            updatedAt: stamp,
            publishedAt: null,
          }
          await store.insertAssignment(assignment)
          return ok({ assignmentId: assignment._id, status: 'draft' })
        }
        const current = await store.findAssignment(body.assignmentId)
        if (!current || current.ownerOpenId !== openid) return fail('not-found')
        if (current.status !== 'draft') return fail('invalid')
        await store.updateAssignment(current._id, {
          title: normalized.data.title,
          blocks: normalized.data.blocks,
          updatedAt: stamp,
        })
        return ok({ assignmentId: current._id, status: 'draft' })
      }

      async function publish() {
        if (!isTeacher(openid)) return fail('forbidden')
        const current = await store.findAssignment(body.assignmentId)
        if (!current || current.ownerOpenId !== openid) return fail('not-found')
        if (current.status !== 'draft') return fail('invalid')
        const ready = normalizeAssignment(current, true)
        if (!ready.ok) return ready
        const media = await assertTeacherMedia(ready.data.blocks)
        if (!media.ok) return media
        const publishedAt = now()
        const updated = await store.updateAssignment(current._id, { status: 'published', publishedAt, updatedAt: publishedAt })
        if (!updated) return fail('invalid')
        return ok({ assignmentId: current._id, status: 'published' })
      }

      async function listAssignments() {
        if (isTeacher(openid)) {
          const rows = await store.listAssignmentsByTeacher(openid)
          return ok(rows.map(summary))
        }
        const mine = await store.listChildrenByGuardian(openid)
        const teacherIds = [...new Set(mine.map((child) => child.teacherOpenId))]
        const rows = []
        for (const teacherId of teacherIds) {
          const list = await store.listAssignmentsByTeacher(teacherId)
          for (const row of list) if (row.status === 'published') rows.push(summary(row))
        }
        return ok(rows)
      }

      async function getAssignment() {
        const assignment = await store.findAssignment(body.assignmentId)
        if (!assignment) return fail('not-found')
        if (assignment.ownerOpenId === openid && isTeacher(openid)) {
          const urls = await urlsFor(await filesOf(assignment.blocks))
          if (!urls) return fail('file-unavailable')
          return ok({
            id: assignment._id,
            title: assignment.title,
            status: assignment.status,
            blocks: assignment.blocks.map((block) => teacherBlock(block, urls)),
          })
        }
        if (assignment.status !== 'published') return fail('not-found')
        const mine = await guardianChildrenFor(assignment.ownerOpenId)
        if (mine.length === 0) return fail('not-found')
        const mediaIds = await filesOf(assignment.blocks)
        const submissions = []
        for (const child of mine) {
          const row = await store.findSubmission(assignment._id, child._id)
          submissions.push(row)
          if (row && row.sections.sentences) mediaIds.push(row.sections.sentences.fileId)
          if (row && row.sections.letters) mediaIds.push(row.sections.letters.fileId)
        }
        const urls = await urlsFor(mediaIds)
        if (!urls) return fail('file-unavailable')
        return ok({
          id: assignment._id,
          title: assignment.title,
          status: 'published',
          children: mine.map((child, index) => {
            const row = submissions[index]
            return {
              id: child._id,
              displayName: child.displayName,
              status: row ? row.status : 'none',
              sentencesUrl: row && row.sections.sentences ? urls.get(row.sections.sentences.fileId) || '' : '',
              lettersUrl: row && row.sections.letters ? urls.get(row.sections.letters.fileId) || '' : '',
            }
          }),
          blocks: assignment.blocks.map((block) => guardianBlock(block, urls)),
        })
      }

      async function saveSection() {
        if (!SECTIONS.has(body.section)) return fail('invalid')
        const child = await store.findChild(body.childId)
        if (!child || child.guardianOpenId !== openid) return fail('forbidden')
        const assignment = await store.findAssignment(body.assignmentId)
        if (!assignment || assignment.status !== 'published' || assignment.ownerOpenId !== child.teacherOpenId) return fail('not-found')
        const file = await ownedFile(body.fileId, openid, 'audio')
        if (!file) return fail('forbidden')
        const submission = await draftSubmission(assignment._id, child)
        if (!submission.ok) return submission
        if (submission.data.status !== 'draft') return fail('already-submitted')
        const sections = {
          ...submission.data.sections,
          [body.section]: { fileId: body.fileId, updatedAt: now() },
        }
        const saved = await store.updateSubmissionIf(submission.data._id, 'draft', { sections, updatedAt: now() })
        if (!saved) return fail('already-submitted')
        return ok({ section: body.section, status: 'draft' })
      }

      async function submitHomework() {
        if (body.consent !== true) return fail('consent-required')
        const child = await store.findChild(body.childId)
        if (!child || child.guardianOpenId !== openid) return fail('forbidden')
        const assignment = await store.findAssignment(body.assignmentId)
        if (!assignment || assignment.status !== 'published' || assignment.ownerOpenId !== child.teacherOpenId) return fail('not-found')
        const submission = await store.findSubmission(assignment._id, child._id)
        if (!submission) return fail('incomplete')
        if (submission.status === 'submitted') return fail('already-submitted')
        if (!submission.sections.sentences || !submission.sections.letters) return fail('incomplete')
        const submittedAt = now()
        const saved = await store.updateSubmissionIf(submission._id, 'draft', {
          status: 'submitted',
          consentAt: submittedAt,
          submittedAt,
          updatedAt: submittedAt,
        })
        if (!saved) return fail('already-submitted')
        return ok({ status: 'submitted' })
      }

      async function listSubmissions() {
        if (!isTeacher(openid)) return fail('forbidden')
        const assignment = await store.findAssignment(body.assignmentId)
        if (!assignment || assignment.ownerOpenId !== openid) return fail('not-found')
        const children = await store.listChildrenByTeacher(openid)
        const submissions = await store.listSubmissions(assignment._id)
        const byChild = new Map(submissions.map((row) => [row.childId, row]))
        const fileIds = []
        for (const row of submissions) {
          if (row.sections.sentences) fileIds.push(row.sections.sentences.fileId)
          if (row.sections.letters) fileIds.push(row.sections.letters.fileId)
        }
        const urls = await urlsFor(fileIds)
        if (!urls) return fail('file-unavailable')
        return ok({
          assignmentId: assignment._id,
          title: assignment.title,
          children: children.map((child) => {
            const row = byChild.get(child._id)
            return {
              childId: child._id,
              displayName: child.displayName,
              bound: Boolean(child.guardianOpenId),
              status: row ? row.status : 'none',
              sentencesUrl: row && row.sections.sentences ? urls.get(row.sections.sentences.fileId) || '' : '',
              lettersUrl: row && row.sections.letters ? urls.get(row.sections.letters.fileId) || '' : '',
            }
          }),
        })
      }

      async function assertTeacherMedia(blocks) {
        for (const block of blocks) {
          if (block.imageFileId) {
            const image = await ownedFile(block.imageFileId, openid, 'image')
            if (!image) return fail('forbidden')
          }
          for (const audio of block.audios) {
            if (!audio.fileId) continue
            const file = await ownedFile(audio.fileId, openid, 'audio')
            if (!file) return fail('forbidden')
          }
        }
        return ok()
      }

      async function guardianChildrenFor(teacherOpenId) {
        const mine = await store.listChildrenByGuardian(openid)
        return mine.filter((child) => child.teacherOpenId === teacherOpenId)
      }

      async function draftSubmission(assignmentId, child) {
        const id = `${assignmentId}_${child._id}`
        const existing = await store.findSubmission(assignmentId, child._id)
        if (existing) return ok(existing)
        const created = {
          _id: id,
          assignmentId,
          childId: child._id,
          status: 'draft',
          sections: { sentences: null, letters: null },
          consentAt: null,
          submittedAt: null,
          updatedAt: now(),
        }
        const inserted = await store.insertSubmission(created)
        if (inserted) return ok(created)
        const raced = await store.findSubmission(assignmentId, child._id)
        return raced ? ok(raced) : fail('invalid')
      }

      function publicChild(child) {
        return { id: child._id, displayName: child.displayName }
      }

      function summary(row) {
        return { id: row._id, title: row.title, status: row.status, blockCount: row.blocks.length }
      }
    },
  }
}

module.exports = { createService, SECTIONS }
