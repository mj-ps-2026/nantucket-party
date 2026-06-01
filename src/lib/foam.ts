/* =====================================================================
   FOAM SUBMIT — low-resource soap-suds engine
   Adapted from the SUDSY design prototype (claude.ai/design) for the
   Nantucket party RSVP. Differs from the prototype in two ways:
     1. it fills the whole viewport, not a mocked browser window, and
     2. the blow-off is triggered externally (by the success message)
        rather than auto-firing after a fixed hold.

   - one pre-rendered bubble sprite, blitted via drawImage (cheap)
   - fixed particle pool, no allocations per frame
   - rAF runs ONLY during the effect, idle = 0 CPU
   ===================================================================== */

const TAU = Math.PI * 2
const rand = (a: number, b: number) => a + Math.random() * (b - a)
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v)
const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t)
const easeOutBack = (t: number) => {
  const c = 1.7
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}

/* ---- pre-render one soft soap bubble (transparent rim => bubbles blend) ---- */
function makeBubble(size: number) {
  const c = document.createElement("canvas")
  c.width = c.height = size
  const x = c.getContext("2d")!
  const m = size / 2
  const R = size / 2
  const g = x.createRadialGradient(m, m, R * 0.06, m, m, R)
  g.addColorStop(0.0, "rgba(255,255,255,0.95)")
  g.addColorStop(0.55, "rgba(244,250,255,0.82)")
  g.addColorStop(0.82, "rgba(214,233,250,0.62)")
  g.addColorStop(0.96, "rgba(196,221,245,0.18)")
  g.addColorStop(1.0, "rgba(196,221,245,0)")
  x.fillStyle = g
  x.beginPath()
  x.arc(m, m, R, 0, TAU)
  x.fill()
  // bright rim (foam edges catch light)
  x.lineWidth = R * 0.08
  x.strokeStyle = "rgba(255,255,255,0.55)"
  x.beginPath()
  x.arc(m, m, R * 0.86, 0, TAU)
  x.stroke()
  // specular highlight, top-left
  const h = x.createRadialGradient(m - R * 0.34, m - R * 0.38, 0, m - R * 0.34, m - R * 0.38, R * 0.42)
  h.addColorStop(0, "rgba(255,255,255,0.95)")
  h.addColorStop(1, "rgba(255,255,255,0)")
  x.fillStyle = h
  x.beginPath()
  x.arc(m - R * 0.34, m - R * 0.38, R * 0.42, 0, TAU)
  x.fill()
  return c
}

/* ---- pre-render a 4-point sparkle ---- */
function makeStar(size: number) {
  const c = document.createElement("canvas")
  c.width = c.height = size
  const x = c.getContext("2d")!
  const m = size / 2
  const g = x.createRadialGradient(m, m, 0, m, m, m * 0.5)
  g.addColorStop(0, "rgba(255,255,255,1)")
  g.addColorStop(1, "rgba(255,255,255,0)")
  x.fillStyle = g
  x.beginPath()
  x.arc(m, m, m * 0.5, 0, TAU)
  x.fill()
  x.globalCompositeOperation = "lighter"
  for (const a of [0, Math.PI / 2]) {
    x.save()
    x.translate(m, m)
    x.rotate(a)
    const lg = x.createLinearGradient(-m, 0, m, 0)
    lg.addColorStop(0, "rgba(255,255,255,0)")
    lg.addColorStop(0.5, "rgba(255,255,255,.95)")
    lg.addColorStop(1, "rgba(255,255,255,0)")
    x.fillStyle = lg
    x.fillRect(-m, -1.1, size, 2.2)
    x.restore()
  }
  return c
}

const FILL_MS = 920
const BLAST_MS = 950
const WASH_FADE = 430
const GRAV = 0.34

type Bubble = {
  hx: number
  hy: number
  x: number
  y: number
  r: number
  vx: number
  vy: number
  wob: number
  delay: number
  life: number
  alpha: number
}
type Spray = { x: number; y: number; vx: number; vy: number; r: number; delay: number; life: number; alpha: number; wob: number }
type Jet = { x: number; y: number; vx: number; vy: number; r: number; age: number; life: number; wob: number }
type Sparkle = { x: number; y: number; ph: number; sz: number }

type Phase = "idle" | "fill" | "full" | "blast" | "done"

export type FoamHandle = {
  /** Start the suds rising from the bottom to cover the screen. */
  fill: () => void
  /** Blow the foam off from the centre. Queues until the fill completes. */
  blast: () => void
  /** Clear everything immediately and go idle. */
  reset: () => void
  /** Tear down listeners and stop the loop. */
  destroy: () => void
}

export function createFoam(canvas: HTMLCanvasElement): FoamHandle {
  const ctx = canvas.getContext("2d")!
  const SPRITE = makeBubble(176)
  const STAR = makeStar(40)

  let W = 0
  let H = 0
  let DPR = 1
  const bubbles: Bubble[] = []
  const sprays: Spray[] = []
  const sparkles: Sparkle[] = []
  const jets: Jet[] = []
  let phase: Phase = "idle"
  let raf: number | null = null
  let cover = 0
  let washA = 0
  let maxDist = 1
  let pendingBlast = false
  const center = { x: 0, y: 0 }
  let tStart = 0
  let blastStart = 0

  function resize() {
    W = window.innerWidth
    H = window.innerHeight
    DPR = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(W * DPR)
    canvas.height = Math.round(H * DPR)
    canvas.style.width = W + "px"
    canvas.style.height = H + "px"
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
  }

  function onResize() {
    if (phase === "idle") resize()
  }
  window.addEventListener("resize", onResize)
  resize()

  function seed() {
    bubbles.length = 0
    sprays.length = 0
    sparkles.length = 0
    jets.length = 0
    const n = 280
    for (let i = 0; i < n; i++) {
      const x = rand(-40, W + 40)
      const y = rand(-40, H + 40)
      const big = Math.random() < 0.22
      const r = rand(7, 24) * (big ? 1.7 : 1)
      bubbles.push({ hx: x, hy: y, x, y, r, vx: 0, vy: 0, wob: rand(0, TAU), delay: 0, life: 1, alpha: 1 })
    }
    bubbles.sort((a, b) => b.y - a.y) // bottom-most first (rises from the floor)
    const ns = 24
    for (let i = 0; i < ns; i++) {
      sparkles.push({ x: rand(0, W), y: rand(0, H), ph: rand(0, TAU), sz: rand(0.55, 1.25) })
    }
  }

  /* ---------------- drawing ---------------- */
  function drawBubble(b: Bubble, s: number, now: number) {
    const wob = 1 + 0.05 * Math.sin(now / 280 + b.wob)
    const rr = b.r * s * wob
    ctx.drawImage(SPRITE, b.x - rr, b.y - rr, rr * 2, rr * 2)
  }

  function drawSparkles(now: number, gate: boolean) {
    const lineY = H * (1 - cover)
    for (const s of sparkles) {
      if (gate && s.y < lineY) continue
      const tw = Math.sin(now / 230 + s.ph) * 0.5 + 0.5
      const sz = s.sz * (7 + tw * 11)
      ctx.globalAlpha = (0.25 + tw * 0.75) * (washA > 0 ? clamp(washA / 0.9, 0, 1) : 1)
      ctx.drawImage(STAR, s.x - sz / 2, s.y - sz / 2, sz, sz)
    }
    ctx.globalAlpha = 1
  }

  /* airborne suds jetting up off the rising crest -> the "spray" */
  function updateAndDrawJets(now: number) {
    if (cover < 0.95 && jets.length < 230) {
      const lineY = H * (1 - cover)
      const n = 2 + (Math.random() < 0.6 ? 1 : 0) + (Math.random() < 0.3 ? 1 : 0)
      for (let i = 0; i < n; i++) {
        const x0 = rand(0, W)
        jets.push({
          x: x0,
          y: lineY + rand(-4, 30),
          vx: rand(-3.4, 3.4),
          vy: -rand(5, 13),
          r: rand(5, 14) * (Math.random() < 0.2 ? 1.6 : 1),
          age: 0,
          life: rand(26, 46),
          wob: rand(0, TAU),
        })
      }
    }
    for (let i = jets.length - 1; i >= 0; i--) {
      const j = jets[i]
      j.x += j.vx
      j.y += j.vy
      j.vy += GRAV * 1.15
      j.vx *= 0.99
      j.age++
      if (j.age >= j.life) {
        jets.splice(i, 1)
        continue
      }
      const t = j.age / j.life
      const sc = t < 0.18 ? easeOutBack(t / 0.18) : 1
      ctx.globalAlpha = t < 0.7 ? 1 : Math.max(0, 1 - (t - 0.7) / 0.3)
      const rr = j.r * sc * (1 + 0.06 * Math.sin(now / 180 + j.wob))
      ctx.drawImage(SPRITE, j.x - rr, j.y - rr, rr * 2, rr * 2)
    }
    ctx.globalAlpha = 1
  }

  function drawFill(now: number) {
    ctx.clearRect(0, 0, W, H)
    const lineY = H * (1 - cover) // settled foam surface
    const feather = Math.min(H * 0.22, 170) // tall soft crest, no hard wipe edge
    ctx.fillStyle = "rgba(247,251,255,0.97)"
    ctx.fillRect(0, lineY + feather, W, H - (lineY + feather))
    const g = ctx.createLinearGradient(0, lineY - feather * 0.3, 0, lineY + feather)
    g.addColorStop(0, "rgba(247,251,255,0)")
    g.addColorStop(1, "rgba(247,251,255,0.97)")
    ctx.fillStyle = g
    ctx.fillRect(0, lineY - feather * 0.3, W, feather * 1.3)
    // settled texture bubbles, pop in as the surface passes them
    const pop = H * 0.16
    for (const b of bubbles) {
      const local = (b.y - lineY) / pop
      if (local <= 0) break
      drawBubble(b, easeOutBack(Math.min(1, local)), now)
    }
    updateAndDrawJets(now) // the spray
    drawSparkles(now, true)
  }

  function drawFull(now: number) {
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = "rgba(247,251,255,0.97)"
    ctx.fillRect(0, 0, W, H)
    for (const b of bubbles) drawBubble(b, 1, now)
    drawSparkles(now, false)
  }

  function startBlast(now: number) {
    phase = "blast"
    blastStart = now
    washA = 0.97
    jets.length = 0
    for (const b of bubbles) {
      const a = Math.atan2(b.hy - center.y, b.hx - center.x) + rand(-0.18, 0.18)
      const d = Math.hypot(b.hx - center.x, b.hy - center.y)
      const spd = rand(6, 13) * (0.55 + (d / maxDist) * 0.9)
      b.x = b.hx
      b.y = b.hy
      b.vx = Math.cos(a) * spd
      b.vy = Math.sin(a) * spd - rand(1.5, 4)
      b.delay = rand(0, 80)
      b.life = rand(360, 620)
      b.alpha = 1
    }
    // extra fast spray from the very center for the pop
    const ns = 54
    for (let i = 0; i < ns; i++) {
      const a = rand(0, TAU)
      const spd = rand(11, 22)
      sprays.push({
        x: center.x,
        y: center.y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - rand(2, 6),
        r: rand(4, 11),
        delay: rand(0, 40),
        life: rand(300, 520),
        alpha: 1,
        wob: rand(0, TAU),
      })
    }
  }

  function step(p: Bubble | Spray, now: number) {
    const age = now - blastStart - p.delay
    if (age < 0) return
    p.x += p.vx
    p.y += p.vy
    p.vy += GRAV
    p.vx *= 0.992
    p.vy *= 0.996
    p.alpha = clamp(1 - age / p.life, 0, 1)
  }

  function drawBlast(now: number) {
    ctx.clearRect(0, 0, W, H)
    washA = 0.97 * clamp(1 - (now - blastStart) / WASH_FADE, 0, 1)
    if (washA > 0.01) {
      ctx.fillStyle = "rgba(247,251,255," + washA.toFixed(3) + ")"
      ctx.fillRect(0, 0, W, H)
    }
    // shockwave ring
    const rr = ((now - blastStart) / 290) * maxDist
    if (rr < maxDist * 1.25) {
      ctx.globalAlpha = clamp(0.55 * (1 - rr / (maxDist * 1.25)), 0, 1)
      ctx.lineWidth = rr * 0.045 + 2
      ctx.strokeStyle = "rgba(255,255,255,0.9)"
      ctx.beginPath()
      ctx.arc(center.x, center.y, rr, 0, TAU)
      ctx.stroke()
      ctx.globalAlpha = 1
    }
    for (const b of bubbles) {
      step(b, now)
      ctx.globalAlpha = b.alpha
      drawBubble(b, b.alpha * 0.4 + 0.6, now)
    }
    for (const p of sprays) {
      step(p, now)
      ctx.globalAlpha = p.alpha
      const wob = 1 + 0.06 * Math.sin(now / 200 + p.wob)
      const rr2 = p.r * wob
      ctx.drawImage(SPRITE, p.x - rr2, p.y - rr2, rr2 * 2, rr2 * 2)
    }
    ctx.globalAlpha = 1
    drawSparkles(now, false)
  }

  function frame(now: number) {
    if (phase === "fill") {
      cover = easeOutQuad(Math.min(1, (now - tStart) / FILL_MS))
      drawFill(now)
      if (cover >= 1) {
        phase = "full"
        if (pendingBlast) {
          pendingBlast = false
          startBlast(now)
        }
      }
    } else if (phase === "full") {
      drawFull(now)
      // hold the full screen of suds until the success message blasts it off
    } else if (phase === "blast") {
      drawBlast(now)
      if (now - blastStart > BLAST_MS && washA <= 0.01) {
        phase = "done"
        ctx.clearRect(0, 0, W, H)
        if (raf) cancelAnimationFrame(raf)
        raf = null
        return
      }
    }
    raf = requestAnimationFrame(frame)
  }

  function fill() {
    if (phase === "fill" || phase === "full") return
    resize()
    center.x = W / 2
    center.y = H / 2
    maxDist = Math.hypot(W / 2, H / 2) // center -> corner, drives blast speed + shockwave
    seed()
    cover = 0
    washA = 0
    pendingBlast = false
    phase = "fill"
    tStart = performance.now()
    if (!raf) raf = requestAnimationFrame(frame)
  }

  function blast() {
    if (phase === "fill") {
      // not yet fully covered — fire the moment it is
      pendingBlast = true
    } else if (phase === "full") {
      startBlast(performance.now())
    }
  }

  function reset() {
    phase = "idle"
    cover = 0
    washA = 0
    pendingBlast = false
    if (raf) {
      cancelAnimationFrame(raf)
      raf = null
    }
    ctx.clearRect(0, 0, W, H)
  }

  function destroy() {
    reset()
    window.removeEventListener("resize", onResize)
  }

  return { fill, blast, reset, destroy }
}
