const sample = require('../../sample/homework')
const { APP_LIMITS, validateAudioMeta } = require('../../utils/limits')
const { call, configured } = require('../../utils/api')
const { showError } = require('../../utils/errors')
const recording = require('../../utils/recording')
const { uploadLocal } = require('../../utils/upload')

Page({
  data: {
    configNeeded: false,
    demo: false,
    preview: false,
    assignment: null,
    assignments: [],
    children: [],
    childId: '',
    submitted: false,
    consent: false,
    sentences: recording.idle(),
    letters: recording.idle(),
    activeSection: '',
    openid: '',
  },
  onLoad(query) {
    this.audio = wx.createInnerAudioContext()
    this.recorder = wx.getRecorderManager()
    this.recorder.onStop((res) => this.finishTake(res))
    this.recorder.onError(() => showError({ code: 'invalid' }))
    if (query.sample === '1') {
      this.setData({ demo: true, assignment: presentSample() })
      return
    }
    if (!configured()) {
      this.setData({ configNeeded: true })
      return
    }
    this.boot(query).catch(showError)
  },
  onUnload() {
    if (this.audio) this.audio.destroy()
  },
  boot(query) {
    const claim = query.invite ? call('claimInvite', { token: query.invite }) : Promise.resolve()
    return claim.then(() => call('session')).then((session) => {
      this.setData({ openid: session.openid })
      if (query.assignmentId) return call('getAssignment', { assignmentId: query.assignmentId }).then((assignment) => this.showCloud(assignment))
      return call('listAssignments').then((assignments) => {
        if (assignments.length === 1) return call('getAssignment', { assignmentId: assignments[0].id }).then((assignment) => this.showCloud(assignment))
        this.setData({ assignments })
      })
    })
  },
  showCloud(assignment) {
    const children = assignment.children || []
    const child = children[0] || { id: '', status: 'none' }
    this.setData({
      demo: false,
      preview: assignment.status !== 'published',
      assignment,
      assignments: [],
      children,
      childId: child.id || '',
      submitted: child.status === 'submitted',
      consent: child.status === 'submitted',
      sentences: phaseFor(child.status, child.sentencesUrl),
      letters: phaseFor(child.status, child.lettersUrl),
    })
  },
  openListed(event) {
    call('getAssignment', { assignmentId: event.currentTarget.dataset.id }).then((assignment) => this.showCloud(assignment)).catch(showError)
  },
  pickChild(event) {
    const child = this.data.children[Number(event.detail.value)]
    if (!child) return
    this.setData({
      childId: child.id,
      submitted: child.status === 'submitted',
      consent: child.status === 'submitted',
      sentences: phaseFor(child.status, child.sentencesUrl),
      letters: phaseFor(child.status, child.lettersUrl),
    })
  },
  play(event) {
    const unavailable = event.currentTarget.dataset.unavailable
    if (unavailable === true || unavailable === 'true') {
      wx.showToast({ title: '示例没有录音文件', icon: 'none' })
      return
    }
    const url = event.currentTarget.dataset.url || event.currentTarget.dataset.path
    if (!url) return showError({ code: 'file-unavailable' })
    this.audio.stop()
    this.audio.src = url
    this.audio.play()
  },
  startSection(event) {
    if (this.data.demo || this.data.preview || this.data.submitted) return
    const section = event.currentTarget.dataset.section
    const next = recording.exclusiveStart({ sentences: this.data.sentences, letters: this.data.letters }, section)
    if (!next.ok) return showError({ code: next.error })
    this.setData({ sentences: next.data.sentences, letters: next.data.letters, activeSection: section })
    this.recorder.start({
      duration: APP_LIMITS.audioMaxDurationMs,
      sampleRate: 44100,
      numberOfChannels: 1,
      encodeBitRate: 192000,
      format: 'aac',
    })
  },
  stopSection() {
    const section = this.data.activeSection
    const next = recording.stop(this.data[section])
    if (!next.ok) return showError({ code: next.error })
    this.setData({ [section]: next.data })
    this.recorder.stop()
  },
  finishTake(res) {
    const section = this.data.activeSection
    const check = validateAudioMeta({ size: res.fileSize, ext: 'aac', source: 'record', durationMs: res.duration })
    if (!check.ok) {
      this.setData({ [section]: recording.idle() })
      return showError({ code: check.error })
    }
    this.setData({
      [`${section}Pending`]: { path: res.tempFilePath, size: res.fileSize, durationMs: res.duration },
    })
  },
  useTake(event) {
    if (this.data.demo) {
      wx.showToast({ title: '示例不会提交', icon: 'none' })
      return
    }
    const section = event.currentTarget.dataset.section
    const pending = this.data[`${section}Pending`]
    if (!pending || !this.data.childId) return
    uploadLocal({
      openid: this.data.openid,
      tempFilePath: pending.path,
      ext: 'aac',
      kind: 'audio',
      size: pending.size,
      durationMs: pending.durationMs,
      source: 'record',
    }).then((fileId) => call('saveSection', {
      assignmentId: this.data.assignment.id,
      childId: this.data.childId,
      section,
      fileId,
    })).then(() => {
      const saved = recording.markSaved(this.data[section])
      if (!saved.ok) throw Object.assign(new Error(saved.error), { code: saved.error })
      this.setData({ [section]: saved.data, [`${section}Pending`]: null })
      wx.showToast({ title: '这段已保存，还没提交', icon: 'none' })
    }).catch(showError)
  },
  rerecord(event) {
    const section = event.currentTarget.dataset.section
    const other = section === 'sentences' ? this.data.letters : this.data.sentences
    if (other.phase === 'recording') return showError({ code: 'already-recording' })
    const next = recording.rerecord(this.data[section])
    if (!next.ok) return showError({ code: next.error })
    this.setData({ [section]: next.data, [`${section}Pending`]: null })
    this.setData({ activeSection: section })
    this.recorder.start({
      duration: APP_LIMITS.audioMaxDurationMs,
      sampleRate: 44100,
      numberOfChannels: 1,
      encodeBitRate: 192000,
      format: 'aac',
    })
  },
  toggleConsent() {
    if (this.data.submitted || this.data.demo) return
    this.setData({ consent: !this.data.consent })
  },
  submit() {
    if (this.data.demo) {
      wx.showToast({ title: '示例不会提交', icon: 'none' })
      return
    }
    if (!this.data.consent) return showError({ code: 'consent-required' })
    call('submitHomework', {
      assignmentId: this.data.assignment.id,
      childId: this.data.childId,
      consent: true,
    }).then(() => {
      this.setData({
        submitted: true,
        sentences: recording.lock(),
        letters: recording.lock(),
      })
      wx.showToast({ title: '已提交给老师', icon: 'none' })
    }).catch(showError)
  },
  onShareAppMessage() {
    return { title: '兔兔作业', path: '/pages/home/index' }
  },
})

function presentSample() {
  return {
    title: sample.title,
    notice: sample.notice,
    blocks: sample.blocks.map((block) => ({
      id: block.id,
      title: block.title,
      art: block.art,
      audios: block.audios.map((audio) => ({
        id: audio.id,
        label: audio.label,
        unavailable: true,
        url: '',
      })),
    })),
  }
}

function phaseFor(status, url) {
  if (status === 'submitted') return recording.lock()
  if (url) return { phase: 'saved' }
  return recording.idle()
}
