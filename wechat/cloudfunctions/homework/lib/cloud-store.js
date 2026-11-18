// Admin database adapter. Security rules do not apply here.
// This file is not run by the unit tests and has not been executed against a live env.

function createCloudStore(db) {
  const children = () => db.collection('children')
  const assignments = () => db.collection('assignments')
  const submissions = () => db.collection('submissions')
  const files = () => db.collection('files')

  return {
    async insertChild(doc) {
      const { _id, ...data } = doc
      await children().doc(_id).set({ data })
      return true
    },
    async updateChild(id, patch) {
      await children().doc(id).update({ data: patch })
      return true
    },
    async findChild(id) {
      return readDoc(children(), id)
    },
    async findChildByInviteHash(inviteHash) {
      const res = await children().where({ inviteHash }).limit(1).get()
      return first(res)
    },
    async listChildrenByTeacher(openid) {
      const res = await children().where({ teacherOpenId: openid }).limit(100).get()
      return res.data || []
    },
    async listChildrenByGuardian(openid) {
      const res = await children().where({ guardianOpenId: openid }).limit(100).get()
      return res.data || []
    },
    async countAssignmentsByTeacher(openid) {
      const res = await assignments().where({ ownerOpenId: openid }).count()
      return res.total || 0
    },
    async insertAssignment(doc) {
      const { _id, ...data } = doc
      await assignments().doc(_id).set({ data })
      return true
    },
    async updateAssignment(id, patch) {
      const res = await assignments().doc(id).update({ data: patch })
      return Boolean(res.stats && res.stats.updated === 1)
    },
    async findAssignment(id) {
      return readDoc(assignments(), id)
    },
    async listAssignmentsByTeacher(openid) {
      const res = await assignments().where({ ownerOpenId: openid }).limit(50).get()
      return res.data || []
    },
    async insertSubmission(doc) {
      try {
        const { _id, ...data } = doc
        await submissions().doc(_id).set({ data })
        return true
      } catch {
        return false
      }
    },
    async findSubmission(assignmentId, childId) {
      return readDoc(submissions(), `${assignmentId}_${childId}`)
    },
    async updateSubmissionIf(id, status, patch) {
      const res = await submissions().where({ _id: id, status }).update({ data: patch })
      return Boolean(res.stats && res.stats.updated === 1)
    },
    async listSubmissions(assignmentId) {
      const res = await submissions().where({ assignmentId }).limit(100).get()
      return res.data || []
    },
    async insertFile(doc) {
      const { _id, ...data } = doc
      await files().doc(_id).set({ data })
      return true
    },
    async findFile(fileId) {
      const res = await files().where({ fileId }).limit(1).get()
      return first(res)
    },
  }
}

async function readDoc(collection, id) {
  try {
    const res = await collection.doc(id).get()
    if (!res || !res.data) return null
    return { ...res.data, _id: id }
  } catch {
    return null
  }
}

function first(res) {
  const row = res && res.data && res.data[0]
  return row ? { ...row } : null
}

module.exports = { createCloudStore }
