import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Activity,
  Atom,
  Binary,
  ChevronRight,
  CircleHelp,
  Code2,
  Compass,
  Cpu,
  GitBranch,
  Menu,
  Network,
  Orbit,
  Radio,
  Sigma,
  Sparkles,
  X,
  Zap
} from 'lucide-react'
import './styles.css'

const topics = ['Qiskit', 'Quantum Supremacy', 'Vector Cherminy', 'Asymptotic', 'Graph Theory', 'NISQ', 'Samlit Heuristics', 'Codeforces']

const achievements = [
  { title: 'Codeforces rating crossed 1925', date: '10 JUN 2024', tone: 'cyan' },
  { title: 'Paper presentation in scai lab', date: '17 MAY 2024', tone: 'violet' },
  { title: 'Codeforces round — 4 problems', date: '22 MAR 2024', tone: 'crimson' },
  { title: 'Research notebook v0.3', date: '25 FEB 2024', tone: 'amber' }
]

function BlochSphere({ phase, onPhase }) {
  const canvasRef = useRef(null)
  const pointer = useRef({ x: 0.5, y: 0.38 })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf
    let tick = 0
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
    const move = (event) => {
      const rect = canvas.getBoundingClientRect()
      pointer.current.x = (event.clientX - rect.left) / rect.width
      pointer.current.y = (event.clientY - rect.top) / rect.height
      onPhase(Math.round(pointer.current.x * 360))
    }
    const render = () => {
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
      ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.ellipse(cx, cy, radius, radius * 0.29, 0, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.ellipse(cx, cy, radius * 0.4, radius, 0, 0, Math.PI * 2); ctx.stroke()
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
      const tip = { x: cx + Math.cos(rot + phase * 0.017) * radius * 0.72, y: cy - Math.sin(0.82 + pointer.current.y) * radius * 0.7 }
      const glow = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 40)
      glow.addColorStop(0, 'rgba(0,240,255,.75)'); glow.addColorStop(1, 'rgba(0,240,255,0)')
      ctx.fillStyle = glow; ctx.fillRect(tip.x - 40, tip.y - 40, 80, 80)
      ctx.beginPath(); ctx.strokeStyle = '#00f0ff'; ctx.lineWidth = 2; ctx.moveTo(cx, cy); ctx.lineTo(tip.x, tip.y); ctx.stroke()
      ctx.beginPath(); ctx.fillStyle = '#00f0ff'; ctx.arc(tip.x, tip.y, 4, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.strokeStyle = 'rgba(0,240,255,.6)'; ctx.lineWidth = 1; ctx.arc(tip.x, tip.y, 11 + Math.sin(tick * 0.008) * 3, 0, Math.PI * 2); ctx.stroke()
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = '10px JetBrains Mono, monospace'; ctx.fillText('|ψ⟩', tip.x + 12, tip.y - 10)
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.font = '9px JetBrains Mono, monospace'; ctx.fillText('X', cx + radius + 8, cy + 3); ctx.fillText('Z', cx - 3, cy - radius - 12); ctx.fillText('Y', cx - radius - 14, cy + 5)
      tick += 16
      raf = requestAnimationFrame(render)
    }
    resize(); render(); window.addEventListener('resize', resize); canvas.addEventListener('pointermove', move)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); canvas.removeEventListener('pointermove', move) }
  }, [phase, onPhase])
  return <canvas ref={canvasRef} className="bloch-canvas" aria-label="Interactive Bloch sphere" />
}

function WaveCanvas() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let raf; let time = 0
    const resize = () => { const rect = canvas.getBoundingClientRect(); const ratio = window.devicePixelRatio || 1; canvas.width = rect.width * ratio; canvas.height = rect.height * ratio; ctx.setTransform(ratio, 0, 0, ratio, 0, 0) }
    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect(); ctx.clearRect(0, 0, width, height); ctx.fillStyle = '#0a0c13'; ctx.fillRect(0, 0, width, height)
      const layers = [{ color: '#00f0ff', offset: 0, amp: 0.24 }, { color: '#7b2cbf', offset: 1.9, amp: 0.19 }, { color: '#ff3366', offset: 3.4, amp: 0.11 }]
      layers.forEach((wave, layer) => {
        ctx.beginPath(); ctx.lineWidth = layer === 0 ? 1.7 : 1; ctx.strokeStyle = wave.color; ctx.globalAlpha = layer === 0 ? .95 : .72
        for (let x = 0; x <= width; x += 2) { const n = x / width; const envelope = Math.exp(-Math.pow((n - .52) / .23, 2)); const y = height * .51 + Math.sin(n * 44 + time * .002 + wave.offset) * height * wave.amp * envelope + Math.sin(n * 12 - time * .0015) * 2; if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y) }
        ctx.stroke()
      })
      ctx.globalAlpha = 1; ctx.font = '8px JetBrains Mono, monospace'; ctx.fillStyle = 'rgba(0,240,255,.8)'; ctx.fillText('probability amplitude', Math.max(12, width - 120), 18)
      time += 16; raf = requestAnimationFrame(draw)
    }
    resize(); draw(); window.addEventListener('resize', resize); return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} className="wave-canvas" aria-label="Probability amplitude waveform" />
}

function CircuitCard() {
  const [gate, setGate] = useState('H')
  const state = gate === 'H' ? ['0.71 + 0.00i', '0.71 + 0.00i'] : ['1.00 + 0.00i', '0.00 + 0.00i']
  return <section className="panel circuit-card"><PanelTitle icon={<Cpu size={14} />} title="QUANTUM CIRCUIT SIMULATOR" meta="LIVE STATE" tone="cyan" /><div className="circuit-wrap"><div className="qubit-label mono">q₀</div><div className="circuit-wire"><span className="gate gate-cyan">{gate}</span><span className="gate gate-violet">•</span><span className="gate gate-crimson">Z</span></div><div className="qubit-label mono">q₁</div><div className="circuit-wire"><span className="gate gate-cyan">{gate}</span><span className="gate gate-violet">⊕</span><span className="gate gate-crimson">Z</span></div></div><div className="circuit-controls"><span className="mono">GATE SET</span>{['H', 'X', 'Z'].map(item => <button key={item} className={`mini-gate ${gate === item ? 'selected' : ''}`} onClick={() => setGate(item)}>{item}</button>)}<span className="state-readout mono">|ψ⟩ = [{state[0]}, {state[1]}]</span></div></section>
}

function PanelTitle({ icon, title, meta, tone = 'cyan' }) { return <div className="panel-title"><span className={`panel-icon ${tone}`}>{icon}</span><span className="panel-title-text">{title}</span><span className="panel-meta mono">{meta}</span></div> }

function HudDock({ representation, setRepresentation }) {
  return <aside className="hud-dock" aria-label="Render telemetry"><div className="hud-head"><span className="hud-dot" /> RENDER CORE <span className="hud-close">×</span></div><div className="hud-stats"><div><span className="mono">FPS</span><strong>60</strong></div><div><span className="mono">GPU</span><strong>42%</strong></div><div><span className="mono">DT</span><strong>0.016</strong></div></div><div className="hud-toggle"><span className="mono">REPRESENTATION</span><button onClick={() => setRepresentation(representation === 'SCHR' ? 'HEIS' : 'SCHR')} aria-label="Toggle quantum representation"><span className={representation === 'SCHR' ? 'active' : ''}>SCHR</span><span className={representation === 'HEIS' ? 'active' : ''}>HEIS</span></button></div></aside>
}

function App() {
  const [phase, setPhase] = useState(42)
  const [representation, setRepresentation] = useState('SCHR')
  const [menuOpen, setMenuOpen] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState(null)

  return <div className={`app-shell representation-${representation.toLowerCase()}`}>
    <div className="ambient-grid" aria-hidden="true" />
    <header id="top" className="topbar"><a className="brand" href="#top"><span className="brand-symbol">ψ</span><span>greenthree</span><em>blog</em><small>// QUANTUM_CORE</small></a><nav className="main-nav"><a className="active" href="#quantum">QUANTUM</a><a href="#algorithms">ALGORITHMS</a><a href="#research">RESEARCH</a><a href="#resources">RESOURCES</a></nav><div className="top-actions"><span className="mono">SYS.08 / 24</span><button className="icon-button menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={16} /></button></div></header>
    <main className="content-grid">
      <div className="primary-column">
        <section id="quantum" className="hero-grid"><div className="panel bloch-card"><PanelTitle icon={<Atom size={14} />} title="STATE VECTOR / BLOCH SPHERE" meta="INTERACTIVE" tone="cyan" /><div className="bloch-stage"><BlochSphere phase={phase} onPhase={setPhase} /><div className="axis-note mono">α = {Math.cos(phase * 0.017).toFixed(2)} + {Math.sin(phase * 0.017).toFixed(2)}i</div></div><div className="state-row"><button className="state-button">STATE |ψ₀⟩</button><span className="mono">θ {phase}° / φ 0.82π</span><button className="state-button">STATE |ψ₁⟩</button></div></div><div className="panel hero-copy"><span className="mono eyebrow">PHYSICS STUDENT BLOG / 001</span><h1>Quantum<br /><span>frontiers</span> &<br />algorithmic<br />odysseys</h1><p>Notes from the overlap of rigorous physics, elegant algorithms, and the code that lets ideas move.</p><button className="primary-button" onClick={() => document.getElementById('algorithms')?.scrollIntoView({ behavior: 'smooth' })}>EXPLORE THE NOTEBOOK <ChevronRight size={15} /></button><div className="hero-equation mono">⟨ ψ | Ĥ | ψ ⟩ = E · e<sup>−iEt/ℏ</sup></div></div></section>
        <div className="winner-strip"><span className="winner-mark"><Sparkles size={18} /></span><strong>WINNER / AWWWARDS SITE OF THE DAY /</strong><span>APPRECIATED FOR INNOVATIVE DESIGN & CODE</span><span className="winner-badge">W</span></div>
        <section id="algorithms" className="lower-grid"><div className="panel code-card"><PanelTitle icon={<Code2 size={14} />} title="IMPLEMENTING SHOR'S ALGORITHM" meta="PYTHON / 03:18" tone="amber" /><pre><code><span className="code-purple">def</span> quantum_factor(n):{`\n`}  <span className="code-blue">a</span> = random_coprime(n){`\n`}  r = <span className="code-cyan">find_period</span>(a, n){`\n`}  <span className="code-purple">return</span> gcd(a**(r//2) - 1, n)</code></pre><div className="code-foot mono"><span>Featured in / quantum algorithms</span><span>O(log³ N)</span></div></div><div className="panel equation-card"><PanelTitle icon={<Sigma size={14} />} title="VARIATIONAL EIGENVALUE" meta="DERIVATION / 07" tone="violet" /><div className="formula"><span>𝓔(θ) =</span><strong>⟨ψ(θ)| Ĥ |ψ(θ)⟩</strong><small>minimize over parameterized states</small></div><p>Quantum entanglement explains the unity of an approximation scheme. Small inputs, large questions.</p><div className="matrix-lines mono">[ 1  0  −β ]<br />[ 0  α   0 ]<br />[ β  0   1 ]</div></div><CircuitCard /><div id="research" className="panel topology-card"><PanelTitle icon={<GitBranch size={14} />} title="COMPETITIVE PROGRAMMING STRATEGIES" meta="GRAPH / 12 NODES" tone="crimson" /><div className="topology-body"><div className="graph-map"><span className="node n1">A</span><span className="node n2">B</span><span className="node n3">C</span><span className="node n4">D</span><span className="node n5">E</span><i className="edge e1" /><i className="edge e2" /><i className="edge e3" /><i className="edge e4" /></div><pre className="tiny-code"><code><span className="code-purple">struct</span> Edge {`{`}<br />  <span className="code-cyan">int</span> to, cost;<br />  <span className="code-cyan">bool</span> used;<br />{`}`}</code></pre></div><div className="topology-footer mono"><span>minimum cost maximum flow</span><span>O(V²E)</span></div></div><div className="panel tips-card"><PanelTitle icon={<CircleHelp size={14} />} title="QUICK TIPS" meta="FIELD NOTES" tone="cyan" /><div className="tips-list"><button onClick={() => setSelectedTopic('Complexity compass')}><Binary size={16} /> <span>Read the complexity first</span><ChevronRight size={14} /></button><button onClick={() => setSelectedTopic('Hilbert space')}><Orbit size={16} /> <span>Keep a Hilbert space</span><ChevronRight size={14} /></button><button onClick={() => setSelectedTopic('Ship the prototype')}><Zap size={16} /> <span>Ship the prototype</span><ChevronRight size={14} /></button></div></div></section>
      </div>
      <aside className="sidebar"><section className="panel wave-card"><PanelTitle icon={<Activity size={14} />} title="VECTOR WAVE" meta="Ψ(x,t)" tone="cyan" /><WaveCanvas /><div className="wave-formula mono">∫ Ψ(x,t) dx = 1</div><p>Visualizing vector wave mechanics. Follow interference patterns and probability amplitudes as they phase through a discrete lattice.</p></section><section className="panel topics-card"><PanelTitle icon={<Compass size={14} />} title="TRENDING TOPICS" meta="08 / 24" tone="violet" /><div className="topic-list">{topics.map(topic => <button key={topic} onClick={() => setSelectedTopic(topic)}>{topic}<ChevronRight size={12} /></button>)}</div></section><section className="panel achievements-card"><PanelTitle icon={<Radio size={14} />} title="LATEST ACHIEVEMENTS" meta="LOG / 04" tone="crimson" /><div className="achievement-list">{achievements.map(item => <div className="achievement" key={item.title}><span className={`achievement-dot ${item.tone}`} /><div><strong>{item.title}</strong><span className="mono">{item.date}</span></div></div>)}</div></section><section id="resources" className="sidebar-footer panel"><div><span className="mono">FOOTER</span><p>Site & lab journal by greenthree. Built from first principles.</p></div><div><span className="mono">SOCIAL</span><a href="https://github.com" target="_blank" rel="noreferrer">GitHub <ChevronRight size={12} /></a><a href="mailto:hello@greenthree.blog">Contact <ChevronRight size={12} /></a></div><div className="footer-atom"><Atom size={34} /></div></section></aside>
    </main>
    <HudDock representation={representation} setRepresentation={setRepresentation} />
    <footer className="bottom-line mono"><span>ψ(x,t) // QUANTUM_CORE</span><span>ALL SYSTEMS NOMINAL / 2024—∞</span></footer>
    {menuOpen && <div className="menu-overlay"><div className="menu-overlay-head"><a className="brand" href="#top"><span className="brand-symbol">ψ</span><span>greenthree</span><em>blog</em></a><button className="icon-button" onClick={() => setMenuOpen(false)} aria-label="Close navigation"><X size={17} /></button></div><nav><a href="#quantum" onClick={() => setMenuOpen(false)}>quantum <ChevronRight size={20} /></a><a href="#algorithms" onClick={() => setMenuOpen(false)}>algorithms <ChevronRight size={20} /></a><a href="#research" onClick={() => setMenuOpen(false)}>research <ChevronRight size={20} /></a></nav><span className="mono menu-overlay-foot">SYS.08 / 24 <span>STATE VECTOR ONLINE</span></span></div>}
    {selectedTopic && <div className="topic-modal" role="dialog" aria-modal="true" aria-label={selectedTopic}><div className="topic-modal-inner"><button className="icon-button" onClick={() => setSelectedTopic(null)} aria-label="Close topic"><X size={17} /></button><span className="mono">QUERY / {selectedTopic.toUpperCase()}</span><h2>{selectedTopic}</h2><p>This topic is queued in the notebook index. The next field note will connect the notation to a runnable experiment.</p><div className="modal-status"><span className="hud-dot" /> INDEXED / WAITING FOR OBSERVATION</div></div></div>}
  </div>
}

const rootElement = document.getElementById('root')
const root = rootElement._greenthreeRoot || createRoot(rootElement)
rootElement._greenthreeRoot = root
root.render(<App />)
