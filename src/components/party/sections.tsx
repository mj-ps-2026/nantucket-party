"use client"

import Image from "next/image"
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react"
import { PARTY, NOTE_TINTS, AGENDA, type GuestTile, type WallNote } from "@/lib/party"
import { PartyButton, Stepper, Field, inputStyle } from "./ui"
import { Turnstile } from "../turnstile"

export type RsvpChoice = "in" | "out"
export type RsvpData = { name: string; email: string; guests: number; note: string; token: string | null }

/* ---------- weather call-out — slapped across the top of the hero like a sticker ---------- */
export function RainBanner() {
  if (!PARTY.rainPlan?.body) return null
  return (
    <div
      role="status"
      style={{
        position: "absolute",
        zIndex: 3,
        top: "50%",
        left: "50%",
        width: "min(760px, 94%)",
        transform: "translate(-50%, -50%) rotate(-1.6deg)",
        background: "var(--sunny)",
        color: "var(--ink)",
        border: "5px solid #fff",
        borderRadius: "var(--r-md)",
        boxShadow: "var(--sticker-shadow)",
        padding: "20px 30px 22px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--display)",
          fontWeight: 700,
          fontSize: "clamp(22px,4.6vw,32px)",
          lineHeight: 1.08,
        }}
      >
        {PARTY.rainPlan.headline}
      </div>
      <p
        style={{
          margin: "8px 0 0",
          fontFamily: "var(--display)",
          fontWeight: 500,
          fontSize: "clamp(15px,3.4vw,19px)",
          color: "var(--wood-deep)",
          lineHeight: 1.34,
        }}
      >
        {PARTY.rainPlan.body}
      </p>
      {PARTY.rainPlan.from && (
        <div
          style={{
            marginTop: 10,
            fontFamily: "var(--display)",
            fontWeight: 700,
            fontSize: "clamp(15px,3.2vw,18px)",
            color: "var(--ink)",
            transform: "rotate(-1.5deg)",
          }}
        >
          — {PARTY.rainPlan.from}
        </div>
      )}
    </div>
  )
}

/* ---------- PART 2 — the invitation card ---------- */
export function InvitationCard({
  revealed,
  onRsvp,
  reduced,
  titleTreatment = "napkin",
  woodTone = "#b07c49",
  invitedBy,
}: {
  revealed: boolean
  onRsvp: () => void
  reduced: boolean
  titleTreatment?: "napkin" | "sign" | "poster"
  woodTone?: string
  invitedBy?: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reduced) return
    const el = cardRef.current
    const wrap = wrapRef.current
    if (!el || !wrap) return
    let raf = 0
    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0
    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      tx = py * -7
      ty = px * 9
    }
    const onLeave = () => {
      tx = 0
      ty = 0
    }
    const loop = () => {
      cx += (tx - cx) * 0.08
      cy += (ty - cy) * 0.08
      el.style.transform = `perspective(1100px) rotateX(${cx}deg) rotateY(${cy}deg)`
      raf = requestAnimationFrame(loop)
    }
    wrap.addEventListener("pointermove", onMove)
    wrap.addEventListener("pointerleave", onLeave)
    loop()
    return () => {
      cancelAnimationFrame(raf)
      wrap.removeEventListener("pointermove", onMove)
      wrap.removeEventListener("pointerleave", onLeave)
    }
  }, [reduced])

  return (
    <section
      className="picnic"
      style={{
        position: "relative",
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 0 48px",
        textAlign: "center",
        overflow: "hidden",
        ["--wood-base" as string]: woodTone,
        opacity: revealed ? 1 : 0,
        transition: "opacity .3s var(--ease)",
      }}
    >
      <div
        className={revealed && !reduced ? "fade-up" : ""}
        style={{ position: "relative", zIndex: 1, animationDelay: "1s" }}
      >
        <span
          className="kicker"
          style={{
            color: "var(--ink)",
            background: "var(--sunny)",
            padding: "7px 16px",
            borderRadius: 999,
            border: "3px solid var(--ink)",
            display: "inline-block",
            boxShadow: "var(--pop-shadow)",
          }}
        >
          {invitedBy ? `${invitedBy} invited you 🎈` : "You're invited 🎈"}
        </span>
      </div>

      {/* the card = the hero illustration, tossed onto the table */}
      <div
        ref={wrapRef}
        className={revealed && !reduced ? "toss" : ""}
        style={{ position: "relative", zIndex: 1, margin: "26px 0 10px", width: "min(880px, 92vw)", perspective: 1100 }}
      >
        <RainBanner />
        <div
          ref={cardRef}
          style={{
            position: "relative",
            borderRadius: "var(--r-lg)",
            background: "#fff",
            border: "10px solid #fff",
            boxShadow: "0 2px 0 rgba(46,32,22,.06), 0 40px 70px -24px rgba(46,32,22,.5)",
            transform: "perspective(1100px) rotateX(0deg) rotateY(0deg)",
            transformStyle: "preserve-3d",
            overflow: "hidden",
          }}
        >
          <Image
            src="/hero-illustration.jpg"
            alt="Foam Party & Pig Roast — a sunny backyard with a foam cannon, pig on a spit, balloons and kids playing in the suds"
            width={1408}
            height={768}
            priority
            style={{ display: "block", width: "100%", height: "auto", borderRadius: "calc(var(--r-lg) - 8px)" }}
          />
        </div>
      </div>

      {/* party details */}
      <div
        className={revealed && !reduced ? "fade-up" : ""}
        style={{ position: "relative", zIndex: 1, animationDelay: "1.15s", marginTop: 30, width: "min(900px, 92vw)" }}
      >
        <TitleBlock treatment={titleTreatment} onRsvp={onRsvp} />
      </div>
    </section>
  )
}

/* shared detail chips */
function ChipsRow() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
      <DetailChip c="var(--tomato)">{PARTY.date}</DetailChip>
      <DetailChip c="var(--teal)">{PARTY.time}</DetailChip>
      <DetailChip c="var(--pink)">{PARTY.address}</DetailChip>
    </div>
  )
}

/* cream pill (legible on any surface) with the bouncing arrow detached
   below it, so the arrow animates on its own — not inside the button */
function CuePill({ onRsvp }: { onRsvp: () => void }) {
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        marginTop: 26,
      }}
    >
      <button
        type="button"
        onClick={onRsvp}
        className="cue"
        style={{
          fontFamily: "var(--display)",
          fontWeight: 600,
          fontSize: "clamp(13px,3vw,15px)",
          textTransform: "uppercase",
          letterSpacing: ".1em",
          color: "var(--ink)",
          background: "var(--cream)",
          borderRadius: 999,
          border: "3px solid #fff",
          padding: "13px 30px",
          boxShadow: "var(--pop-shadow)",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        RSVP — it takes 10 seconds
      </button>
      <svg
        width="34"
        height="34"
        viewBox="0 0 24 24"
        fill="none"
        className="cue-arrow"
        aria-hidden="true"
        style={{ color: "var(--ink)", filter: "drop-shadow(0 1px 1px rgba(255,255,255,.7))" }}
      >
        <path
          d="M12 4v14M6 13l6 6 6-6"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

/* THE TITLE TREATMENTS — "napkin" is the locked default; sign/poster kept as options */
function TitleBlock({ treatment, onRsvp }: { treatment: "napkin" | "sign" | "poster"; onRsvp: () => void }) {
  const titleBase = {
    fontFamily: "var(--display)",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "-.01em",
    textWrap: "balance" as const,
    margin: 0,
    fontSize: "clamp(26px,5vw,46px)",
    lineHeight: 1.04,
  }

  /* ---- ENAMEL SIGN ---- */
  if (treatment === "sign") {
    const screw = {
      position: "absolute" as const,
      width: 12,
      height: 12,
      borderRadius: "50%",
      background: "radial-gradient(circle at 35% 30%, #fff, #b9ad95)",
      boxShadow: "inset 0 -1px 2px rgba(0,0,0,.3)",
    }
    return (
      <div>
        <div
          style={{
            display: "inline-block",
            position: "relative",
            maxWidth: "min(660px,92vw)",
            background: "var(--cream)",
            borderRadius: 22,
            border: "6px solid #fff",
            boxShadow: "var(--sticker-shadow)",
            padding: "clamp(22px,4vw,36px) clamp(28px,5vw,52px)",
            transform: "rotate(-1deg)",
          }}
        >
          <span style={{ ...screw, top: 12, left: 14 }} />
          <span style={{ ...screw, top: 12, right: 14 }} />
          <span style={{ ...screw, bottom: 12, left: 14 }} />
          <span style={{ ...screw, bottom: 12, right: 14 }} />
          <h1 style={{ ...titleBase, color: "var(--ink)", textShadow: "0 2px 0 rgba(255,255,255,.7)" }}>
            {PARTY.title}
          </h1>
          <div style={{ marginTop: 22 }}>
            <ChipsRow />
          </div>
          <p
            style={{
              fontFamily: "var(--display)",
              fontWeight: 500,
              fontSize: "clamp(16px,3.4vw,22px)",
              color: "var(--wood-deep)",
              margin: "20px auto 0",
              maxWidth: 480,
            }}
          >
            “{PARTY.note}”
          </p>
        </div>
        <div>
          <CuePill onRsvp={onRsvp} />
        </div>
      </div>
    )
  }

  /* ---- POSTER ---- */
  if (treatment === "poster") {
    return (
      <div>
        <h1
          style={{
            ...titleBase,
            fontSize: "clamp(28px,5vw,50px)",
            color: "#FFFAEF",
            maxWidth: "min(760px, 92vw)",
            marginLeft: "auto",
            marginRight: "auto",
            WebkitTextStroke: "2.5px #44280f",
            textShadow: "0 4px 0 rgba(46,27,12,.5), 0 12px 22px rgba(0,0,0,.45)",
            paintOrder: "stroke fill",
          }}
        >
          {PARTY.title}
        </h1>
        <div style={{ marginTop: 24 }}>
          <ChipsRow />
        </div>
        <p
          style={{
            display: "inline-block",
            marginTop: 22,
            fontFamily: "var(--display)",
            fontWeight: 600,
            fontSize: "clamp(15px,3.2vw,21px)",
            color: "var(--ink)",
            background: "#EDDBBE",
            border: "3px solid #fff",
            borderRadius: 10,
            padding: "10px 20px",
            transform: "rotate(-1.2deg)",
            boxShadow: "var(--pop-shadow)",
          }}
        >
          “{PARTY.note}”
        </p>
        <div>
          <CuePill onRsvp={onRsvp} />
        </div>
      </div>
    )
  }

  /* ---- PICNIC NAPKIN (default) ---- */
  const gingham = {
    backgroundColor: "#fff",
    backgroundImage:
      "repeating-linear-gradient(0deg, rgba(208,42,38,.55) 0 26px, rgba(208,42,38,0) 26px 52px)," +
      "repeating-linear-gradient(90deg, rgba(208,42,38,.55) 0 26px, rgba(208,42,38,0) 26px 52px)",
  }
  return (
    <div>
      <div
        style={{
          display: "inline-block",
          position: "relative",
          ...gingham,
          borderRadius: 10,
          padding: "clamp(22px,4vw,34px) clamp(30px,6vw,56px)",
          boxShadow: "0 16px 34px -12px rgba(46,32,22,.55)",
          transform: "rotate(-1.2deg)",
          outline: "2px dashed rgba(255,255,255,.85)",
          outlineOffset: -12,
        }}
      >
        <h1
          style={{
            ...titleBase,
            fontSize: "clamp(28px,5.4vw,52px)",
            color: "#fff",
            WebkitTextStroke: "2.5px #8d1c16",
            paintOrder: "stroke fill",
            textShadow: "0 3px 0 rgba(80,16,12,.45)",
          }}
        >
          {PARTY.title}
        </h1>
      </div>
      <div style={{ marginTop: 22 }}>
        <ChipsRow />
      </div>
      <p
        style={{
          display: "inline-block",
          marginTop: 20,
          fontFamily: "var(--display)",
          fontWeight: 600,
          fontSize: "clamp(15px,3.2vw,21px)",
          color: "var(--ink)",
          background: "#fff",
          borderRadius: 6,
          padding: "9px 20px",
          transform: "rotate(1deg)",
          boxShadow: "0 8px 16px -6px rgba(46,32,22,.4)",
        }}
      >
        “{PARTY.note}”
      </p>
      <div>
        <CuePill onRsvp={onRsvp} />
      </div>
    </div>
  )
}

function DetailChip({ children, c }: { children: ReactNode; c: string }) {
  return (
    <span
      style={{
        fontFamily: "var(--display)",
        fontWeight: 600,
        fontSize: "clamp(15px,3.4vw,21px)",
        color: "var(--ink)",
        background: "#fff",
        border: `3px solid ${c}`,
        borderRadius: 999,
        padding: "9px 20px",
        boxShadow: "var(--pop-shadow)",
      }}
    >
      {children}
    </span>
  )
}

function SectionHead({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <div style={{ position: "relative", display: "inline-block", marginBottom: 26 }}>
      <h2
        style={{
          fontSize: "clamp(30px,7vw,52px)",
          textTransform: "uppercase",
          color: color || "var(--ink)",
          letterSpacing: "-.01em",
          textShadow: "0 3px 0 rgba(255,255,255,.6)",
        }}
      >
        {children}
      </h2>
    </div>
  )
}

/* ---------- PART 2.5 — the agenda / "Suds & Swine" timeline ---------- */
export function Agenda({ reduced }: { reduced: boolean }) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const rows = Array.from(list.querySelectorAll<HTMLElement>(".agenda-row"))

    // reduced motion (or no observer support) → reveal everything up front
    if (reduced || typeof IntersectionObserver === "undefined") {
      rows.forEach((r) => r.classList.add("is-in"))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in")
            io.unobserve(e.target) // one-shot — it stays revealed
          }
        }
      },
      { threshold: 0.35, rootMargin: "0px 0px -8% 0px" },
    )
    rows.forEach((r) => io.observe(r))
    return () => io.disconnect()
  }, [reduced])

  return (
    <section id="the-plan" style={{ padding: "18px 0 40px", scrollMarginTop: 16 }}>
      <div className="wrap">
        <div style={{ textAlign: "center" }}>
          <SectionHead color="var(--sky-deep)">The Plan</SectionHead>
          <p style={{ marginTop: -10, marginBottom: 20, fontWeight: 600, color: "var(--wood-deep)" }}>
            Our Suds &amp; Swine timeline — show up whenever, stay as long as you like 🫧
          </p>
        </div>

        <div ref={listRef} className="agenda-list">
          {AGENDA.map((item) => (
            <div key={item.time} className="agenda-row" style={{ ["--accent" as string]: item.accent }}>
              <div className="agenda-node" aria-hidden="true">
                <span className="h">{item.time}</span>
                <span className="m">{item.meridiem}</span>
              </div>
              <div className="agenda-card">
                <span className="agenda-emoji" aria-hidden="true">
                  {item.emoji}
                </span>
                <div className="agenda-title">
                  <span className="sr-time">{`${item.time} ${item.meridiem} — `}</span>
                  {item.title}
                </div>
                <p className="agenda-body">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- PART 2.6 — where to park ---------- */
export function Parking() {
  return (
    <section id="parking" style={{ padding: "18px 0 40px", scrollMarginTop: 16 }}>
      <div className="wrap" style={{ maxWidth: 640 }}>
        <div
          style={{
            position: "relative",
            background: "var(--cream)",
            borderRadius: "var(--r-lg)",
            border: "var(--bord) solid #fff",
            padding: "clamp(24px,5vw,40px)",
            boxShadow: "var(--sticker-shadow)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 44, lineHeight: 1 }} aria-hidden="true">
            🅿️
          </div>
          <div style={{ marginTop: 10 }}>
            <SectionHead color="var(--sky-deep)">Parking</SectionHead>
          </div>
          <p
            style={{
              marginTop: -8,
              fontFamily: "var(--display)",
              fontWeight: 500,
              fontSize: "clamp(16px,3.4vw,20px)",
              color: "var(--wood-deep)",
              lineHeight: 1.4,
              maxWidth: 460,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Grab a spot right on <strong style={{ color: "var(--ink)" }}>Nantucket Dr</strong>. If it&apos;s
            filling up, loop on around to <strong style={{ color: "var(--ink)" }}>Waterford</strong>{" "}
            and stroll over — it&apos;s just a short walk. 🚗
          </p>
        </div>
      </div>
    </section>
  )
}

/* ---------- PART 3 — the RSVP ---------- */
export function Rsvp({
  onSubmit,
  reduced,
  pending,
  defaultName,
}: {
  onSubmit: (choice: RsvpChoice, data: RsvpData) => void
  reduced: boolean
  pending: boolean
  defaultName?: string
}) {
  const [choice, setChoice] = useState<RsvpChoice | null>(null)
  const [name, setName] = useState(defaultName || "")
  const [email, setEmail] = useState("")
  const [guests, setGuests] = useState(1)
  const [note, setNote] = useState("")
  const [err, setErr] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [tsReset, setTsReset] = useState(0)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErr(true)
      return
    }
    onSubmit(choice!, {
      name: name.trim(),
      email: email.trim(),
      guests: choice === "in" ? guests : 0,
      note: note.trim(),
      token,
    })
    // the token is single-use — fetch a fresh one in case they submit again
    setToken(null)
    setTsReset((n) => n + 1)
  }

  return (
    <section id="rsvp" style={{ padding: "30px 0 70px" }}>
      <div className="wrap" style={{ maxWidth: 640 }}>
        <div
          style={{
            position: "relative",
            background: "var(--cream)",
            borderRadius: "var(--r-lg)",
            border: "var(--bord) solid #fff",
            padding: "clamp(26px,5vw,44px)",
            boxShadow: "var(--sticker-shadow)",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <SectionHead color="var(--ink)">Are you coming?</SectionHead>
            <p
              style={{
                marginTop: -14,
                marginBottom: 24,
                fontFamily: "var(--display)",
                fontWeight: 600,
                fontSize: "clamp(14px,3vw,17px)",
                color: "var(--wood-deep)",
              }}
            >
              Kindly RSVP by <span style={{ color: "var(--tomato)" }}>{PARTY.rsvpBy}</span> 🫧
            </p>
          </div>

          {/* two big choices */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <PartyButton
              variant="go"
              big
              onClick={() => {
                setChoice("in")
                setErr(false)
              }}
              style={choice === "in" ? { outline: "4px solid var(--ink)", outlineOffset: 3 } : {}}
            >
              I&apos;m in! 🙌
            </PartyButton>
            <PartyButton
              variant="ghost"
              onClick={() => {
                setChoice("out")
                setErr(false)
              }}
              style={choice === "out" ? { outline: "4px solid var(--ink)", outlineOffset: 3 } : {}}
            >
              Can&apos;t make it
            </PartyButton>
          </div>

          {/* progressive reveal */}
          {choice && (
            <form
              onSubmit={submit}
              className={reduced ? "" : "fade-up"}
              style={{ marginTop: 30, display: "grid", gap: 20 }}
            >
              <Field label="Your name" hint="required">
                <input
                  style={{ ...inputStyle, borderColor: err ? "var(--tomato)" : "#e7ddca" }}
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setErr(false)
                  }}
                  placeholder="e.g. Jordan"
                  autoComplete="name"
                />
                {err && (
                  <span style={{ color: "var(--tomato)", fontWeight: 600, fontSize: 14 }}>
                    We need a name to put you on the wall!
                  </span>
                )}
              </Field>

              {choice === "in" && (
                <Field label="How many of you?">
                  <Stepper value={guests} onChange={setGuests} />
                </Field>
              )}

              <Field label="Email" hint="optional — for a confirmation">
                <input
                  style={inputStyle}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  autoComplete="email"
                />
              </Field>

              <Field label="Anything to say?" hint="optional">
                <input
                  style={inputStyle}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={choice === "in" ? "bringing a watermelon 🍉" : "next time for sure!"}
                  maxLength={90}
                />
              </Field>

              <Turnstile onToken={setToken} resetSignal={tsReset} />

              <PartyButton type="submit" variant={choice === "in" ? "primary" : "sunny"} big full disabled={pending}>
                {pending ? "One sec…" : choice === "in" ? "Lock it in 🫧" : "Send my regrets"}
              </PartyButton>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

/* ---------- PART 4 — who's going ---------- */
export function Going({
  guests,
  newId,
  listRef,
}: {
  guests: GuestTile[]
  newId: string | null
  listRef: RefObject<HTMLElement | null>
}) {
  const total = guests.reduce((s, g) => s + g.guests, 0)
  return (
    <section ref={listRef} style={{ padding: "20px 0 60px" }}>
      <div className="wrap">
        <div style={{ textAlign: "center" }}>
          <SectionHead color="var(--grass-deep)">
            Going (<span style={{ color: "var(--tomato)" }}>{total}</span>)
          </SectionHead>
          <p style={{ marginTop: -10, marginBottom: 24, fontWeight: 600, color: "var(--wood-deep)" }}>
            {`${guests.length} crews and counting · the backyard's filling up 🎉`}
          </p>
        </div>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
          {guests.map((g, i) => (
            <div
              key={g.id}
              className={g.id === newId ? "pop" : ""}
              style={{
                position: "relative",
                background: "#fff",
                borderRadius: "var(--r-md)",
                border: g.id === newId ? "3px solid var(--tomato)" : "3px solid #fff",
                boxShadow: "var(--pop-shadow)",
                padding: "18px 16px",
                textAlign: "center",
                transform: `rotate(${((i * 7) % 5) - 2}deg)`,
              }}
            >
              <div style={{ fontSize: 38, lineHeight: 1 }}>{g.emoji}</div>
              <div
                style={{
                  fontFamily: "var(--display)",
                  fontWeight: 600,
                  fontSize: 17,
                  color: "var(--ink)",
                  marginTop: 8,
                  wordBreak: "break-word",
                }}
              >
                {g.name}
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 600, marginTop: 2 }}>
                {g.guests === 1 ? "just them" : `party of ${g.guests}`}
              </div>
              {g.id === newId && (
                <div
                  style={{
                    position: "absolute",
                    top: -12,
                    right: -8,
                    background: "var(--tomato)",
                    color: "#fff",
                    fontFamily: "var(--display)",
                    fontWeight: 700,
                    fontSize: 12,
                    padding: "4px 9px",
                    borderRadius: 999,
                    transform: "rotate(8deg)",
                    boxShadow: "var(--pop-shadow)",
                  }}
                >
                  that&apos;s you!
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ---------- PART 5 — the comment wall ---------- */
export function Wall({
  notes,
  onPost,
  newNoteId,
}: {
  notes: WallNote[]
  onPost: (n: { name: string; text: string; token: string | null }) => void
  newNoteId: string | null
}) {
  const [name, setName] = useState("")
  const [text, setText] = useState("")
  const [err, setErr] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [tsReset, setTsReset] = useState(0)
  const post = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setErr(true)
      return
    }
    if (!text.trim()) return
    onPost({ name: name.trim(), text: text.trim(), token })
    setText("")
    // the token is single-use — the wall takes repeat posts, so refresh it
    setToken(null)
    setTsReset((n) => n + 1)
  }
  return (
    <section style={{ padding: "20px 0 120px" }}>
      <div className="wrap">
        <div style={{ textAlign: "center" }}>
          <SectionHead color="var(--pink)">The Wall</SectionHead>
          <p style={{ marginTop: -10, marginBottom: 24, fontWeight: 600, color: "var(--wood-deep)" }}>
            Drop a note — countdown&apos;s on 🫧
          </p>
        </div>

        {/* post box */}
        <form
          onSubmit={post}
          style={{
            background: "#fff",
            borderRadius: "var(--r-md)",
            border: "var(--bord) solid #fff",
            boxShadow: "var(--pop-shadow)",
            padding: 16,
            display: "grid",
            gap: 12,
            gridTemplateColumns: "1fr",
            maxWidth: 620,
            margin: "0 auto 32px",
          }}
        >
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input
              style={{ ...inputStyle, flex: "1 1 140px", borderColor: err ? "var(--tomato)" : "#e7ddca" }}
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setErr(false)
              }}
              placeholder="your name"
              maxLength={40}
              autoComplete="name"
            />
            <input
              style={{ ...inputStyle, flex: "3 1 220px" }}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="leave a note…"
              maxLength={120}
            />
          </div>
          {err && (
            <span style={{ color: "var(--tomato)", fontWeight: 600, fontSize: 14 }}>
              Add your name so we know who left it!
            </span>
          )}
          <Turnstile onToken={setToken} resetSignal={tsReset} />
          <PartyButton type="submit" variant="sunny" full>
            Stick it on the wall 📌
          </PartyButton>
        </form>

        {/* sticky note wall */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18, justifyContent: "center" }}>
          {notes.map((n, i) => {
            const tint = NOTE_TINTS[n.tint % NOTE_TINTS.length]
            const rot = ((i * 11) % 7) - 3
            return (
              <div
                key={n.id}
                className={n.id === newNoteId ? "note" : ""}
                style={{
                  ["--rot" as string]: `${rot}deg`,
                  position: "relative",
                  transform: `rotate(${rot}deg)`,
                  width: "min(260px, 78vw)",
                  background: tint.bg,
                  borderRadius: 8,
                  padding: "18px 18px 20px",
                  boxShadow: "0 10px 22px -8px rgba(46,32,22,.35)",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: -9,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: tint.pin,
                    boxShadow: "inset -2px -2px 3px rgba(0,0,0,.25), 0 3px 5px rgba(0,0,0,.25)",
                  }}
                />
                <p style={{ margin: "4px 0 10px", fontSize: 17, color: "var(--ink)", lineHeight: 1.32, fontWeight: 500 }}>
                  {n.text}
                </p>
                <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 14, color: "var(--wood-deep)" }}>
                  — {n.name}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
