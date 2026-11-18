const { APP_LIMITS, validateAudioMeta, validateImageMeta } = require('../../utils/limits')
const { call } = require('../../utils/api')
const { showError } = require('../../utils/errors')
const { extOf, randomHex } = require('../../utils/id')
const recording = require('../../utils/recording')
const { uploadLocal } = require('../../utils/upload')

Page({
  data: {
    openid: '',
    assignmentId: '',
    title: '',
    blocks: [],
    status: 'draft',
    recordingBlock: -1,
    recorderState: recording.idle(),
    preview: false,
  },
  onLoad(query) {
    this.recorder = wx.getRecorderManager()
    this.recorder.onStop((res) => this.finishTake(res))
    this.recorder.onError(() => showError({ code: 'invalid' }))
    call('session')
      .then((session) => {
        if (session.role !== 'teacher') throw Object.assign(new Error('forbidden'), { code: 'forbidden' })
        this.setData({ openid: session.openid })
        if (!query.id) return null
        return call('getAssignment', { assignmentId: query.id }).then((assignment) => {
          this.setData({
            assignmentId: assignment.id,
            title: assignment.title,
            status: assignment.status,
            blocks: assignment.blocks,
          })
        })
      })
      .catch(showError)
  },
  onTitle(event) {
    this.setData({ title: event.detail.value })
  },
  onBlockTitle(event) {
    const blocks = this.data.blocks
    blocks[event.currentTarget.dataset.index].title = event.detail.value
    this.setData({ blocks })
  },
  onAudioLabel(event) {
    const blocks = this.data.blocks
    blocks[event.currentTarget.dataset.index].audios[event.currentTarget.dataset.audio].label = event.detail.value
    this.setData({ blocks })
  },
  addBlock() {
    if (this.data.blocks.length >= APP_LIMITS.maxBlocks) return showError({ code: 'limit' })
    randomHex().then((id) => {
      const blocks = this.data.blocks.concat([{ id, title: '', imageFileId: '', imageUrl: '', audios: [] }])
      this.setData({ blocks })
    }).catch(showError)
  },
  moveBlock(event) {
    const index = Number(event.currentTarget.dataset.index)
    const next = index + Number(event.currentTarget.dataset.dir)
    const blocks = this.data.blocks.slice()
    if (next < 0 || next >= blocks.length) return
    const [item] = blocks.splice(index, 1)
    blocks.splice(next, 0, item)
    this.setData({ blocks })
  },
  chooseImage(event) {
    const index = Number(event.currentTarget.dataset.index)
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      sizeType: ['compressed'],
      success: (res) => {
        const file = res.tempFiles[0]
        const ext = extOf(file.tempFilePath)
        const check = validateImageMeta({ size: file.size, ext })
        if (!check.ok) return showError({ code: check.error })
        uploadLocal({
          openid: this.data.openid,
          tempFilePath: file.tempFilePath,
          ext,
          kind: 'image',
          size: file.size,
          source: 'file',
        }).then((fileId) => {
          const blocks = this.data.blocks
          blocks[index].imageFileId = fileId
          blocks[index].imageUrl = file.tempFilePath
          this.setData({ blocks })
        }).catch(showError)
      },
    })
  },
  chooseAudio(event) {
    const index = Number(event.currentTarget.dataset.index)
    if (this.data.blocks[index].audios.length >= APP_LIMITS.maxAudiosPerBlock) return showError({ code: 'limit' })
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: APP_LIMITS.audioExtensions,
      success: (res) => {
        const file = res.tempFiles[0]
        const ext = extOf(file.name || file.path)
        const check = validateAudioMeta({ size: file.size, ext, source: 'file' })
        if (!check.ok) return showError({ code: check.error })
        this.attachAudio(index, file.path, ext, file.size, 0, 'file').catch(showError)
      },
    })
  },
  startReference(event) {
    const next = recording.start(this.data.recorderState)
    if (!next.ok) return showError({ code: next.error })
    this.setData({ recorderState: next.data, recordingBlock: Number(event.currentTarget.dataset.index) })
    this.recorder.start({
      duration: APP_LIMITS.audioMaxDurationMs,
      sampleRate: 44100,
      numberOfChannels: 1,
      encodeBitRate: 192000,
      format: 'aac',
    })
  },
  stopReference() {
    const next = recording.stop(this.data.recorderState)
    if (!next.ok) return showError({ code: next.error })
    this.setData({ recorderState: next.data })
    this.recorder.stop()
  },
  finishTake(res) {
    const index = this.data.recordingBlock
    const check = validateAudioMeta({ size: res.fileSize, ext: 'aac', source: 'record', durationMs: res.duration })
    const saved = recording.markSaved(this.data.recorderState)
    if (!check.ok || !saved.ok || index < 0) return showError({ code: check.error || 'invalid' })
    const blocks = this.data.blocks
    blocks[index].pending = { path: res.tempFilePath, size: res.fileSize, durationMs: res.duration }
    this.setData({ blocks, recorderState: saved.data, recordingBlock: -1 })
  },
  playLocal(event) {
    const path = event.currentTarget.dataset.path
    if (!path) return
    if (!this.audio) this.audio = wx.createInnerAudioContext()
    this.audio.stop()
    this.audio.src = path
    this.audio.play()
  },
  useTake(event) {
    const index = Number(event.currentTarget.dataset.index)
    const pending = this.data.blocks[index].pending
    if (!pending) return
    this.attachAudio(index, pending.path, 'aac', pending.size, pending.durationMs, 'record')
      .then(() => {
        const blocks = this.data.blocks
        blocks[index].pending = null
        this.setData({ blocks, recorderState: recording.idle() })
      })
      .catch(showError)
  },
  attachAudio(index, path, ext, size, durationMs, source) {
    return randomHex().then((audioId) => uploadLocal({
      openid: this.data.openid,
      tempFilePath: path,
      ext,
      kind: 'audio',
      size,
      durationMs,
      source,
    }).then((fileId) => {
      const blocks = this.data.blocks
      blocks[index].audios = blocks[index].audios.concat([{ id: audioId, label: '', fileId, url: path }])
      this.setData({ blocks })
    }))
  },
  save() {
    const payload = {
      title: this.data.title,
      blocks: this.data.blocks.map((block) => ({
        id: block.id,
        title: block.title,
        imageFileId: block.imageFileId || null,
        audios: block.audios.map((audio) => ({ id: audio.id, label: audio.label, fileId: audio.fileId || null })),
      })),
    }
    if (this.data.assignmentId) payload.assignmentId = this.data.assignmentId
    return call('saveDraft', payload).then((saved) => {
      this.setData({ assignmentId: saved.assignmentId, status: 'draft' })
      wx.showToast({ title: '草稿已保存', icon: 'none' })
      return saved
    })
  },
  saveDraft() {
    this.save().catch(showError)
  },
  openPreview() {
    this.save().then(() => this.setData({ preview: true })).catch(showError)
  },
  publish() {
    if (!this.data.preview || !this.data.assignmentId) return showError({ code: 'incomplete' })
    call('publish', { assignmentId: this.data.assignmentId })
      .then(() => {
        wx.showToast({ title: '已发布', icon: 'none' })
        wx.redirectTo({ url: `/pages/teacher/submissions?id=${this.data.assignmentId}` })
      })
      .catch(showError)
  },
})
