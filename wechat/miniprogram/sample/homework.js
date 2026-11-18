// Local preview only. There are no audio files and nothing here can be uploaded or submitted.

module.exports = {
  demo: true,
  persists: false,
  title: '示例作业：文具和字母',
  notice: '这是本地示例，没有录音文件，不能上传，也不能提交。',
  blocks: [
    {
      id: 'stationery',
      title: '看图说句子',
      art: 'stationery',
      audios: [
        { id: 'pencil', label: "It's a pencil.", unavailable: true },
        { id: 'eraser', label: "It's an eraser.", unavailable: true },
        { id: 'scissors', label: 'They are scissors.', unavailable: true },
      ],
    },
    {
      id: 'letters',
      title: '字母 Ll Mm Nn Oo',
      art: 'letters',
      audios: [
        { id: 'll-name', label: 'Ll 字母名', unavailable: true },
        { id: 'll-sound', label: 'Ll 字母音', unavailable: true },
        { id: 'mm-name', label: 'Mm 字母名', unavailable: true },
        { id: 'mm-sound', label: 'Mm 字母音', unavailable: true },
        { id: 'nn-name', label: 'Nn 字母名', unavailable: true },
        { id: 'nn-sound', label: 'Nn 字母音', unavailable: true },
        { id: 'oo-name', label: 'Oo 字母名', unavailable: true },
        { id: 'oo-sound', label: 'Oo 字母音', unavailable: true },
      ],
    },
  ],
}
