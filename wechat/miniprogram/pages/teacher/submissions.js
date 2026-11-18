const { call } = require('../../utils/api')
const { showError } = require('../../utils/errors')

Page({
  data: { title: '', children: [] },
  onLoad(query) {
    this.audio = wx.createInnerAudioContext()
    call('listSubmissions', { assignmentId: query.id })
      .then((result) => this.setData({ title: result.title, children: result.children }))
      .catch(showError)
  },
  onUnload() {
    if (this.audio) this.audio.destroy()
  },
  play(event) {
    const url = event.currentTarget.dataset.url
    if (!url) return
    this.audio.stop()
    this.audio.src = url
    this.audio.play()
  },
})
