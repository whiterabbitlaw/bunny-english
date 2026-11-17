import { useEffect, useRef, useState } from 'react'
import { classifyMicError, micCapability, type MicSupport } from '../lib/capabilities.ts'

export type RecorderPhase = MicSupport | 'idle' | 'recording' | 'saved' | 'denied' | 'missing' | 'failed' | 'too-short'

function chooseMime() {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return ''
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
  return types.find((type) => MediaRecorder.isTypeSupported(type)) ?? ''
}

export function useRecorder() {
  const support = micCapability()
  const [phase, setPhase] = useState<RecorderPhase>(support === 'ok' ? 'idle' : support)
  const [url, setUrl] = useState<string | null>(null)
  const [seconds, setSeconds] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const urlRef = useRef<string | null>(null)
  const startedAt = useRef(0)
  const tickRef = useRef(0)
  const mounted = useRef(true)

  function replaceUrl(next: string | null) {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    urlRef.current = next
    if (mounted.current) setUrl(next)
  }

  function stop() {
    window.clearInterval(tickRef.current)
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') recorder.stop()
  }

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      window.clearInterval(tickRef.current)
      const recorder = recorderRef.current
      if (recorder && recorder.state !== 'inactive') recorder.stop()
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [])

  async function start() {
    const capability = micCapability()
    if (capability !== 'ok') {
      setPhase(capability)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const mime = chooseMime()
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      recorderRef.current = recorder
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop())
        const elapsed = (Date.now() - startedAt.current) / 1000
        if (!mounted.current) return
        if (elapsed < 0.35 || chunksRef.current.length === 0) {
          setPhase('too-short')
          replaceUrl(null)
          return
        }
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        replaceUrl(URL.createObjectURL(blob))
        setPhase('saved')
      }
      recorder.start()
      startedAt.current = Date.now()
      setSeconds(0)
      setPhase('recording')
      window.clearInterval(tickRef.current)
      tickRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startedAt.current) / 1000
        if (mounted.current) setSeconds(elapsed)
        if (elapsed >= 8) {
          window.clearInterval(tickRef.current)
          const active = recorderRef.current
          if (active && active.state !== 'inactive') active.stop()
        }
      }, 200)
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      if (mounted.current) setPhase(classifyMicError(error))
    }
  }

  return { support, phase, url, seconds, start, stop }
}
