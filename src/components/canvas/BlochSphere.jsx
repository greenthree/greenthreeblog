import { useEffect, useRef } from 'react'

export function BlochSphere({ phase, onPhase, ariaLabel, paused = false }) {
  const canvasRef = useRef(null)
  const pointer = useRef({ x: 0.5, y: 0.38, targetX: 0.5, targetY: 0.38 })
  const phaseState = useRef({ current: phase, target: phase, reported: phase })
  const onPhaseRef = useRef(onPhase)

  useEffect(() => {
    onPhaseRef.current = onPhase
  }, [onPhase])

  useEffect(() => {
    phaseState.current.target = phase
  }, [phase])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    let raf = null
    let running = false
    let tick = 0
    let lastFrame = performance.now()
    let isIntersecting = true
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const points = Array.from({ length: 120 }, (_, i) => ({
      lat: -Math.PI / 2 + (i % 12) * Math.PI / 11,
      lon: (i / 120) * Math.PI * 2,
      drift: 0.4 + (i % 7) * 0.11
    }))

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      canvas.width = rect.width * ratio
      canvas.height = rect.height * ratio
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    const reportPhase = value => {
      const nextPhase = Math.round(Math.max(0, Math.min(1, value)) * 360)
      phaseState.current.target = nextPhase
      if (phaseState.current.reported !== nextPhase) {
        phaseState.current.reported = nextPhase
        onPhaseRef.current(nextPhase)
      }
    }

    const updateTarget = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect()
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
      pointer.current.targetX = x
      pointer.current.targetY = y
      reportPhase(x)
    }

    const move = event => {
      if (event.pointerType !== 'mouse' && !canvas.hasPointerCapture(event.pointerId)) return
      updateTarget(event.clientX, event.clientY)
    }

    const down = event => {
      canvas.setPointerCapture?.(event.pointerId)
      updateTarget(event.clientX, event.clientY)
    }

    const keyDown = event => {
      const phaseStep = event.shiftKey ? 18 : 6
      const positionStep = event.shiftKey ? 0.12 : 0.04
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        const direction = event.key === 'ArrowLeft' ? -1 : 1
        const nextPhase = Math.max(0, Math.min(360, phaseState.current.target + direction * phaseStep))
        pointer.current.targetX = nextPhase / 360
        reportPhase(pointer.current.targetX)
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault()
        const direction = event.key === 'ArrowUp' ? -1 : 1
        pointer.current.targetY = Math.max(0, Math.min(1, pointer.current.targetY + direction * positionStep))
      }
    }

    const render = now => {
      raf = null
      running = false
      if (!isIntersecting || document.hidden || paused) return

      const delta = Math.min(40, Math.max(0, now - lastFrame))
      const damping = 1 - Math.exp(-delta * 0.014)
      lastFrame = now
      pointer.current.x += (pointer.current.targetX - pointer.current.x) * damping
      pointer.current.y += (pointer.current.targetY - pointer.current.y) * damping
      phaseState.current.current += (phaseState.current.target - phaseState.current.current) * damping
      const { width, height } = canvas.getBoundingClientRect()
      const cx = width * 0.5
      const cy = height * 0.51
      const radius = Math.min(width, height) * 0.34
      const rot = tick * 0.0013 + pointer.current.x * 0.75
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = '#0a0c13'
      ctx.fillRect(0, 0, width, height)
      ctx.strokeStyle = 'rgba(255,255,255,.11)'
      ctx.lineWidth = 1
      ctx.setLineDash([2, 4])
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(cx, cy, radius, radius * 0.29, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(cx, cy, radius * 0.4, radius, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      for (const p of points) {
        const lon = p.lon + rot * p.drift
        const x3 = Math.cos(p.lat) * Math.cos(lon)
        const y3 = Math.sin(p.lat)
        const z3 = Math.cos(p.lat) * Math.sin(lon)
        const x = cx + x3 * radius
        const y = cy - y3 * radius * 0.96
        const alpha = 0.26 + (z3 + 1) * 0.33
        ctx.beginPath()
        ctx.fillStyle = z3 > 0.18 ? `rgba(0,240,255,${alpha})` : `rgba(123,44,191,${alpha})`
        ctx.arc(x, y, z3 > 0.3 ? 1.7 : 1.1, 0, Math.PI * 2)
        ctx.fill()
      }
      const polar = 0.22 + pointer.current.y * (Math.PI - 0.44)
      const azimuth = rot + (phaseState.current.current * Math.PI) / 180
      const tip = {
        x: cx + Math.sin(polar) * Math.cos(azimuth) * radius * 0.76,
        y: cy - Math.cos(polar) * radius * 0.76
      }
      const glow = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 40)
      glow.addColorStop(0, 'rgba(0,240,255,.75)')
      glow.addColorStop(1, 'rgba(0,240,255,0)')
      ctx.fillStyle = glow
      ctx.fillRect(tip.x - 40, tip.y - 40, 80, 80)
      ctx.beginPath()
      ctx.strokeStyle = '#00f0ff'
      ctx.lineWidth = 2
      ctx.moveTo(cx, cy)
      ctx.lineTo(tip.x, tip.y)
      ctx.stroke()
      ctx.beginPath()
      ctx.fillStyle = '#00f0ff'
      ctx.arc(tip.x, tip.y, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(0,240,255,.6)'
      ctx.lineWidth = 1
      ctx.arc(tip.x, tip.y, 11 + Math.sin(tick * 0.008) * 3, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,.8)'
      ctx.font = '10px JetBrains Mono, monospace'
      ctx.fillText('|ψ⟩', tip.x + 12, tip.y - 10)
      ctx.fillStyle = 'rgba(255,255,255,.35)'
      ctx.font = '9px JetBrains Mono, monospace'
      ctx.fillText('X', cx + radius + 8, cy + 3)
      ctx.fillText('Z', cx - 3, cy - radius - 12)
      ctx.fillText('Y', cx - radius - 14, cy + 5)
      tick += delta
      if (!reducedMotion) schedule()
    }

    const schedule = () => {
      if (running || !isIntersecting || document.hidden || paused) return
      running = true
      raf = requestAnimationFrame(render)
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
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('keydown', keyDown)

    return () => {
      observer.disconnect()
      stop()
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', visibilityChange)
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('keydown', keyDown)
    }
  }, [paused])

  return <canvas ref={canvasRef} className="bloch-canvas" aria-label={ariaLabel} tabIndex={0} />
}
