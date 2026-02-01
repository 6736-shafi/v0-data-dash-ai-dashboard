"use client"

import { useCallback, useRef, useEffect } from "react"

// Web Audio API based sound effects
class SoundEffects {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    return this.audioContext
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  isEnabled() {
    return this.enabled
  }

  // Soft pop sound for successful upload
  playPop() {
    if (!this.enabled) return
    try {
      const ctx = this.getContext()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.setValueAtTime(600, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1)

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.1)
    } catch {
      // Audio context not available
    }
  }

  // Gentle whoosh for page transitions
  playWhoosh() {
    if (!this.enabled) return
    try {
      const ctx = this.getContext()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      const filterNode = ctx.createBiquadFilter()

      oscillator.type = "sawtooth"
      filterNode.type = "lowpass"
      filterNode.frequency.setValueAtTime(1000, ctx.currentTime)
      filterNode.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15)

      oscillator.connect(filterNode)
      filterNode.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.setValueAtTime(150, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.15)

      gainNode.gain.setValueAtTime(0.05, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.15)
    } catch {
      // Audio context not available
    }
  }

  // Soft click for buttons
  playClick() {
    if (!this.enabled) return
    try {
      const ctx = this.getContext()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.frequency.setValueAtTime(800, ctx.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05)

      gainNode.gain.setValueAtTime(0.05, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.05)
    } catch {
      // Audio context not available
    }
  }

  // Success chime
  playSuccess() {
    if (!this.enabled) return
    try {
      const ctx = this.getContext()
      
      const playNote = (freq: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)
        
        oscillator.frequency.setValueAtTime(freq, startTime)
        oscillator.type = "sine"
        
        gainNode.gain.setValueAtTime(0.08, startTime)
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
        
        oscillator.start(startTime)
        oscillator.stop(startTime + duration)
      }

      // Play a simple ascending arpeggio
      playNote(523.25, ctx.currentTime, 0.15) // C5
      playNote(659.25, ctx.currentTime + 0.1, 0.15) // E5
      playNote(783.99, ctx.currentTime + 0.2, 0.2) // G5
    } catch {
      // Audio context not available
    }
  }

  // Error sound
  playError() {
    if (!this.enabled) return
    try {
      const ctx = this.getContext()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)

      oscillator.type = "square"
      oscillator.frequency.setValueAtTime(200, ctx.currentTime)
      oscillator.frequency.setValueAtTime(150, ctx.currentTime + 0.1)

      gainNode.gain.setValueAtTime(0.05, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.2)
    } catch {
      // Audio context not available
    }
  }
}

const soundEffects = typeof window !== "undefined" ? new SoundEffects() : null

export function useSoundEffects() {
  const enabled = useRef(true)

  useEffect(() => {
    // Load preference from localStorage
    const stored = localStorage.getItem("datadash-sounds")
    if (stored !== null) {
      enabled.current = stored === "true"
      soundEffects?.setEnabled(enabled.current)
    }
  }, [])

  const setEnabled = useCallback((value: boolean) => {
    enabled.current = value
    soundEffects?.setEnabled(value)
    localStorage.setItem("datadash-sounds", String(value))
  }, [])

  const playPop = useCallback(() => soundEffects?.playPop(), [])
  const playWhoosh = useCallback(() => soundEffects?.playWhoosh(), [])
  const playClick = useCallback(() => soundEffects?.playClick(), [])
  const playSuccess = useCallback(() => soundEffects?.playSuccess(), [])
  const playError = useCallback(() => soundEffects?.playError(), [])

  return {
    enabled: enabled.current,
    setEnabled,
    playPop,
    playWhoosh,
    playClick,
    playSuccess,
    playError,
  }
}
