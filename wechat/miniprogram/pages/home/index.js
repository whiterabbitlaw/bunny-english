const { call, configured } = require('../../utils/api')
const { showError } = require('../../utils/errors')

Page({
  data: {
    configNeeded: false,
    role: '',
    openid: '',
    children: [],
    assignments: [],
    childName: '',
    shareToken: '',
    shareName: '',
  },
  onShow() {
    if (!configured()) {
      this.setData({ configNeeded: true })
      return
    }
    this.reload().catch(showError)
  },
  reload() {
    return call('session').then((session) => {
      this.setData({ configNeeded: false, role: session.role, openid: session.openid })
      if (session.role !== 'teacher') return call('listAssignments')
      return Promise.all([call('listChildren'), call('listAssignments')]).then(([children, assignments]) => {
        this.setData({ children, assignments })
      })
    }).then((assignments) => {
      if (Array.isArray(assignments)) this.setData({ assignments })
    })
  },
  onName(event) {
    this.setData({ childName: event.detail.value })
  },
  rotateInvite(event) {
    call('rotateInvite', { childId: event.currentTarget.dataset.id })
      .then((created) => this.setData({ shareToken: created.inviteToken, shareName: created.displayName }))
      .catch(showError)
  },
  unbind(event) {
    wx.showModal({
      title: '解除绑定',
      content: '原来的家长不能再打开这个小朋友的作业。已经提交的录音还在。',
      success: (res) => {
        if (!res.confirm) return
        call('unbindChild', { childId: event.currentTarget.dataset.id }).then(() => this.reload()).catch(showError)
      },
    })
  },
  createChild() {
    call('createChild', { displayName: this.data.childName })
      .then((created) => {
        this.setData({ childName: '', shareToken: created.inviteToken, shareName: created.displayName })
        return this.reload()
      })
      .catch(showError)
  },
  copyOpenid() {
    wx.setClipboardData({ data: this.data.openid })
  },
  openSample() {
    wx.navigateTo({ url: '/pages/child/homework?sample=1' })
  },
  newAssignment() {
    wx.navigateTo({ url: '/pages/teacher/edit' })
  },
  openAssignment(event) {
    const { id, status } = event.currentTarget.dataset
    const url = status === 'published' ? `/pages/teacher/submissions?id=${id}` : `/pages/teacher/edit?id=${id}`
    wx.navigateTo({ url })
  },
  openHomework(event) {
    wx.navigateTo({ url: `/pages/child/homework?assignmentId=${event.currentTarget.dataset.id}` })
  },
  onShareAppMessage() {
    if (!this.data.shareToken) return { title: '兔兔作业', path: '/pages/home/index' }
    return {
      title: `${this.data.shareName}的英语作业`,
      path: `/pages/child/homework?invite=${this.data.shareToken}`,
    }
  },
})
