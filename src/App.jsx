import { useEffect, useRef, useState } from 'react'
import { projects } from './data'

const hx = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16))
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t))
const STOPS = [[0, '#3d86c6', '#cfe9ec'], [0.35, '#4f78b4', '#f6b25a'], [0.65, '#3a3470', '#e9795c'], [1, '#070b1c', '#1c2a4a']]
const sky = (p, k) => {
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (p <= STOPS[i + 1][0]) return mix(hx(STOPS[i][k]), hx(STOPS[i + 1][k]), (p - STOPS[i][0]) / (STOPS[i + 1][0] - STOPS[i][0]))
  }
  return hx(STOPS[3][k])
}
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))

function Scene() {
  const r = useRef({})
  useEffect(() => {
    const { skyEl, sun, moon, cv, land, bar } = r.current
    const cx = cv.getContext('2d')
    const rm = matchMedia('(prefers-reduced-motion: reduce)').matches
    let W, H, tp = 0, pp = 0, mx = 0, my = 0, raf
    const stars = Array.from({ length: 120 }, () => ({ x: Math.random(), y: Math.random() * 0.6, r: Math.random() * 1.3 + 0.3, a: Math.random() * 6 }))
    let birds = [], flies = []
    const resize = () => {
      W = cv.width = innerWidth; H = cv.height = innerHeight
      const m = W < 600
      birds = Array.from({ length: m ? 3 : 6 }, () => ({ x: Math.random() * W, y: 80 + Math.random() * H * 0.3, v: 0.5 + Math.random() * 0.6, p: Math.random() * 6 }))
      flies = Array.from({ length: m ? 22 : 45 }, () => ({ x: Math.random(), y: 0.5 + Math.random() * 0.5, a: Math.random() * 6, v: Math.random() * 0.0004 + 0.0001 }))
    }
    const onScroll = () => {
      const m = document.documentElement.scrollHeight - innerHeight
      tp = m > 0 ? clamp(scrollY / m) : 0
    }
    const onMove = (e) => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5 }
    resize(); onScroll()
    addEventListener('resize', resize); addEventListener('scroll', onScroll, { passive: true }); addEventListener('pointermove', onMove)
    const frame = () => {
      pp += (tp - pp) * 0.07
      const p = pp, T = Date.now() / 1000
      skyEl.style.background = `linear-gradient(rgb(${sky(p, 1)}),rgb(${sky(p, 2)}))`
      const root = document.documentElement.style
      root.setProperty('--br', (1 - Math.max(0, p - 0.45) * 0.85).toFixed(2))
      root.setProperty('--win', `rgb(${mix(hx('#9fc0cc'), hx('#ffd27a'), clamp((p - 0.3) / 0.4))})`)
      sun.style.transform = `translate(${(8 + p * 95) * W / 100}px,${(12 + Math.pow(p, 1.6) * 110) * H / 100}px)`
      sun.style.opacity = Math.max(0, 1 - p * 1.25)
      moon.style.transform = `translate(${(78 - p * 40) * W / 100}px,${(34 - p * 22) * H / 100}px)`
      moon.style.opacity = clamp((p - 0.6) * 3)
      bar.style.transform = `scaleX(${p})`
      land.querySelectorAll('[data-s]').forEach((e) => {
        const s = +e.dataset.s
        e.style.transform = `translate(${-mx * s * 0.8}px,${-p * s - my * s * 0.3}px)`
      })
      cx.clearRect(0, 0, W, H)
      const sa = clamp((p - 0.55) * 3), da = Math.max(0, 1 - p * 1.6)
      if (sa > 0) stars.forEach((s) => { cx.fillStyle = `rgba(255,255,255,${sa * (0.5 + Math.sin(T * 2 + s.a) * 0.4)})`; cx.beginPath(); cx.arc(s.x * W, s.y * H, s.r, 0, 6.3); cx.fill() })
      if (da > 0 && !rm) birds.forEach((o) => {
        o.x += o.v; o.p += 0.12; if (o.x > W + 30) o.x = -30
        const f = Math.sin(o.p) * 6
        cx.strokeStyle = `rgba(20,40,50,${da * 0.7})`; cx.lineWidth = 1.6; cx.beginPath()
        cx.moveTo(o.x - 11, o.y - f); cx.quadraticCurveTo(o.x - 5, o.y - f - 4, o.x, o.y); cx.quadraticCurveTo(o.x + 5, o.y - f - 4, o.x + 11, o.y - f); cx.stroke()
      })
      if (sa > 0 && !rm) flies.forEach((f) => {
        f.a += 0.02; f.x += Math.sin(f.a) * 0.0006 + f.v; f.y += Math.cos(f.a * 0.8) * 0.0005; if (f.x > 1.02) f.x = -0.02
        cx.fillStyle = `rgba(200,255,140,${sa * (0.4 + Math.sin(f.a * 3) * 0.4)})`; cx.shadowColor = 'rgba(200,255,120,.9)'; cx.shadowBlur = 12
        cx.beginPath(); cx.arc(f.x * W, f.y * H, 2, 0, 6.3); cx.fill(); cx.shadowBlur = 0
      })
      raf = requestAnimationFrame(frame)
    }
    frame()
    return () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); removeEventListener('scroll', onScroll); removeEventListener('pointermove', onMove) }
  }, [])
  const set = (k) => (el) => { r.current[k] = el }
  return (
    <>
      <div id="sky" ref={set('skyEl')} />
      <div className="bar" ref={set('bar')} />
      <div className="orb sun" ref={set('sun')} />
      <div className="orb moon" ref={set('moon')} />
      <canvas id="fx" ref={set('cv')} aria-hidden="true" />
      <div className="land" ref={set('land')} aria-hidden="true">
        <div className="far" data-s="40" /><div className="h1" data-s="26" /><div className="h2" data-s="14" />
      </div>
    </>
  )
}

function useCount(n) {
  const [v, setV] = useState(0)
  useEffect(() => { if (v >= n) return; const t = setTimeout(() => setV(v + 1), 170); return () => clearTimeout(t) }, [v, n])
  return v
}

function Hero() {
  const count = useCount(projects.length)
  const words = [['I', 'build'], ['digital', 'cities.']]
  let k = 0
  return (
    <section className="hero">
      <h1 aria-label="I build digital cities.">
        {words.map((row, a) => (
          <span key={a} className="row-w">
            {row.map((w) => (
              <span key={w} className={'w' + (w === 'cities.' ? ' g' : '')} aria-hidden="true">
                <span style={{ '--k': k++ }}>{w}</span>
              </span>
            ))}
          </span>
        ))}
      </h1>
      <p className="lead">I’m Naim, founder of Syntrix IT in Dhaka. I design, build and run full-stack products: ordering systems, admin panels, payment sites and company platforms that real people use every day.</p>
      <div className="row">
        <a className="cta" href="#city">Explore the districts</a>
        <div className="st"><strong>{count}</strong>projects shipped</div>
        <div className="st"><strong>Full stack</strong>React, Supabase, Node.js</div>
      </div>
      <div className="scroll" aria-hidden="true" />
    </section>
  )
}

function City() {
  const [cur, setCur] = useState(2)
  const sk = useRef(null)
  const btns = useRef([])
  const touch = useRef(false)
  useEffect(() => { touch.current = matchMedia('(hover: none)').matches }, [])
  useEffect(() => {
    const el = sk.current
    let raf
    const onScroll = () => {
      if (!touch.current) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const mid = el.scrollLeft + el.clientWidth / 2
        let best = 0, bd = 1e9
        btns.current.forEach((b, i) => { const d = Math.abs(b.offsetLeft + b.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i } })
        setCur(best)
      })
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => { el.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [])
  const go = (i) => {
    const n = (i + projects.length) % projects.length
    setCur(n)
    const b = btns.current[n], el = sk.current
    el.scrollTo({ left: b.offsetLeft - el.clientWidth / 2 + b.offsetWidth / 2, behavior: 'smooth' })
  }
  const p = projects[cur]
  return (
    <section className="city" id="city">
      <h2>Seven districts, built and running</h2>
      <p>Scroll and the day turns to night. Hover or swipe through the buildings, then visit the live site.</p>
      <div className="scene">
        <div className="sk" ref={sk} role="list">
          {projects.map((x, i) => (
            <button key={x.t} role="listitem" aria-label={x.t} ref={(e) => (btns.current[i] = e)}
              className={'b' + (i === cur ? ' on' : '')} style={{ '--c': x.c, '--i': i, '--w': x.w, '--h': x.h }}
              onMouseEnter={() => !touch.current && setCur(i)} onFocus={() => setCur(i)} onClick={() => go(i)}>
              <i>{x.t}</i>
            </button>
          ))}
        </div>
        <div className="road" aria-hidden="true">
          <span className="car" style={{ '--cc': '#e8e3d8', '--d': '11s', '--dl': '0s' }} />
          <span className="car" style={{ '--cc': '#3e8a6a', '--d': '15s', '--dl': '-6s' }} />
          <span className="car r" style={{ '--cc': '#d9a441', '--d': '13s', '--dl': '-3s' }} />
          <span className="car r" style={{ '--cc': '#6b8fc6', '--d': '17s', '--dl': '-10s' }} />
        </div>
      </div>
      <div className="panel" aria-live="polite">
        <div className="fd" key={cur}>
          <div className="count">{String(cur + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</div>
          <h3>{p.t}</h3><p className="k">{p.k}</p><p>{p.d}</p>
          <div className="acts">
            <a className="cta" href={p.u} target="_blank" rel="noopener noreferrer">Visit live site</a>
            <button className="ic" onClick={() => go(cur - 1)} aria-label="Previous project">←</button>
            <button className="ic" onClick={() => go(cur + 1)} aria-label="Next project">→</button>
          </div>
        </div>
        <ul className="tg" key={'t' + cur}>{p.g.map((x) => <li key={x}>{x}</li>)}</ul>
      </div>
    </section>
  )
}

export default function App() {
  return (
    <>
      <Scene />
      <nav><b>Naim</b><a href="https://www.syntrixit.com/" target="_blank" rel="noopener noreferrer">Syntrix IT</a></nav>
      <main>
        <Hero />
        <City />
        <section className="about"><div><h2>How I work</h2><p>I take a product from the first sketch to a deployed, maintained system: interface, database, admin tools and hosting.</p><p>Several of these projects take real orders from real customers today.</p></div></section>
      </main>
      <footer>Naim, Syntrix IT, Dhaka.</footer>
    </>
  )
}
