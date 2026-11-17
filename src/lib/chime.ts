let audioContext: AudioContext | null = null

function context(): AudioContext | null {
  const Ctx = window.AudioContext
  if (!Ctx) return null
  if (!audioContext) audioContext = new Ctx()
  return audioContext
}

export function playChime(kind: 'ok' | 'again', soundOn: boolean) {
  if (!soundOn) return
  try {
    const audio = context()
    if (!audio) return
    void audio.resume()
    const now = audio.currentTime
    const notes = kind === 'ok' ? [523.25, 783.99] : [494]
    notes.forEach((freq, index) => {
      const osc = audio.createOscillator()
      const gain = audio.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const start = now + index * 0.08
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.035, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2)
      osc.connect(gain)
      gain.connect(audio.destination)
      osc.start(start)
      osc.stop(start + 0.22)
    })
  } catch {
    // Chimes are optional decoration.
  }
}
