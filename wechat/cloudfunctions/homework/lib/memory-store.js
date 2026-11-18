function createMemoryStore() {
  const children = new Map()
  const assignments = new Map()
  const submissions = new Map()
  const files = new Map()

  return {
    async insertChild(doc) {
      if (children.has(doc._id)) return false
      children.set(doc._id, { ...doc })
      return true
    },
    async updateChild(id, patch) {
      const row = children.get(id)
      if (!row) return false
      children.set(id, { ...row, ...patch })
      return true
    },
    async findChild(id) {
      const row = children.get(id)
      return row ? { ...row } : null
    },
    async findChildByInviteHash(inviteHash) {
      for (const row of children.values()) {
        if (row.inviteHash === inviteHash) return { ...row }
      }
      return null
    },
    async listChildrenByTeacher(openid) {
      return [...children.values()].filter((row) => row.teacherOpenId === openid).map((row) => ({ ...row }))
    },
    async listChildrenByGuardian(openid) {
      return [...children.values()].filter((row) => row.guardianOpenId === openid).map((row) => ({ ...row }))
    },
    async countAssignmentsByTeacher(openid) {
      let count = 0
      for (const row of assignments.values()) if (row.ownerOpenId === openid) count += 1
      return count
    },
    async insertAssignment(doc) {
      if (assignments.has(doc._id)) return false
      assignments.set(doc._id, { ...doc, blocks: clone(doc.blocks) })
      return true
    },
    async updateAssignment(id, patch) {
      const row = assignments.get(id)
      if (!row) return false
      assignments.set(id, { ...row, ...patch, blocks: patch.blocks ? clone(patch.blocks) : row.blocks })
      return true
    },
    async findAssignment(id) {
      const row = assignments.get(id)
      return row ? { ...row, blocks: clone(row.blocks) } : null
    },
    async listAssignmentsByTeacher(openid) {
      return [...assignments.values()]
        .filter((row) => row.ownerOpenId === openid)
        .map((row) => ({ ...row, blocks: clone(row.blocks) }))
    },
    async insertSubmission(doc) {
      if (submissions.has(doc._id)) return false
      submissions.set(doc._id, { ...doc, sections: { ...doc.sections } })
      return true
    },
    async findSubmission(assignmentId, childId) {
      const row = submissions.get(`${assignmentId}_${childId}`)
      return row ? { ...row, sections: { ...row.sections } } : null
    },
    async updateSubmissionIf(id, status, patch) {
      const row = submissions.get(id)
      if (!row || row.status !== status) return false
      submissions.set(id, { ...row, ...patch, sections: patch.sections ? { ...patch.sections } : row.sections })
      return true
    },
    async listSubmissions(assignmentId) {
      return [...submissions.values()]
        .filter((row) => row.assignmentId === assignmentId)
        .map((row) => ({ ...row, sections: { ...row.sections } }))
    },
    async insertFile(doc) {
      if (files.has(doc.fileId)) return false
      files.set(doc.fileId, { ...doc })
      return true
    },
    async findFile(fileId) {
      const row = files.get(fileId)
      return row ? { ...row } : null
    },
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

module.exports = { createMemoryStore }
