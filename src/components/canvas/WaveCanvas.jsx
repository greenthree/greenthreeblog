import { useEffect, useRef } from 'react'

export function WaveCanvas({ ariaLabel, amplitudeLabel, paused = false }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    let raf = null
    let running = false
    let time = 0
    let isIntersecting = true
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      canvas.width = rect.width * ratio
      canvas.height = rect.height * ratio
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    const draw = () => {
      raf = null
      running = false
      if (!isIntersecting || document.hidden || paused) return

      const { width, height } = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = '#0a0c13'
      ctx.fillRect(0, 0, width, height)
      const layers = [
        { color: '#00f0ff', offset: 0, amp: 0.24 },
        { color: '#7b2cbf', offset: 1.9, amp: 0.19 },
        { color: '#ff3366', offset: 3.4, amp: 0.11 }
      ]
      layers.forEach((wave, layer) => {
        ctx.beginPath()
        ctx.lineWidth = layer === 0 ? 1.7 : 1
        ctx.strokeStyle = wave.color
        ctx.globalAlpha = layer === 0 ? 0.95 : 0.72
        for (let x = 0; x <= width; x += 2) {
          const n = x / width
          const envelope = Math.exp(-Math.pow((n - 0.52) / 0.23, 2))
          const y =
            height * 0.51 +
            Math.sin(n * 44 + time * 0.002 + wave.offset) * height * wave.amp * envelope +
            Math.sin(n * 12 - time * 0.0015) * 2
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      })
      ctx.globalAlpha = 1
      ctx.font = '8px JetBrains Mono, monospace'
      ctx.fillStyle = 'rgba(0,240,255,.8)'
      ctx.fillText(amplitudeLabel, Math.max(12, width - 120), 18)
      time += 16
      if (!reducedMotion) schedule()
    }

    const schedule = () => {
      if (running || !isIntersecting || document.hidden || paused) return
      running = true
      raf = requestAnimationFrame(draw)
    }

    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf)
      raf = null
      running = false
    }

    const observer = new IntersectionObserver(([entry]) => {
      isIntersecting = entry.isIntersecting
      if (isIntersecting) schedule()
      else stop()
    })
    observer.observe(canvas)

    const visibilityChange = () => {
      if (document.hidden) stop()
      else schedule()
    }

    resize()
    schedule()
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', visibilityChange)

    return () => {
      observer.disconnect()
      stop()
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', visibilityChange)
    }
  }, [amplitudeLabel, paused])

  return <canvas ref={canvasRef} className="wave-canvas" aria-label={ariaLabel} />
}
