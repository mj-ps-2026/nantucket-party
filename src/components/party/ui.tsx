"use client"

import { useMemo, type CSSProperties, type ReactNode } from "react"

/* Chunky pressable button with a "sticker" drop + press states */
export function PartyButton({
  children,
  variant = "primary",
  onClick,
  type = "button",
  disabled,
  big,
  full,
  style,
}: {
  children: ReactNode
  variant?: "primary" | "go" | "sunny" | "ghost"
  onClick?: () => void
  type?: "button" | "submit"
  disabled?: boolean
  big?: boolean
  full?: boolean
  style?: CSSProperties
}) {
  const palette = {
    primary: { bg: "var(--grass-deep)", fg: "#fff", bd: "var(--grass-deep)" },
    go: { bg: "var(--tomato)", fg: "#fff", bd: "#d83a28" },
    sunny: { bg: "var(--sunny)", fg: "var(--ink)", bd: "#e0a800" },
    ghost: { bg: "var(--cream)", fg: "var(--wood-deep)", bd: "var(--wood)" },
  }[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="pb"
      style={{
        fontFamily: "var(--display)",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: ".02em",
        fontSize: big ? "clamp(20px,4.6vw,30px)" : "clamp(15px,3.2vw,19px)",
        color: palette.fg,
        background: palette.bg,
        border: `var(--bord) solid ${palette.bd}`,
        borderRadius: "999px",
        padding: big ? "18px 34px" : "13px 24px",
        width: full ? "100%" : "auto",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.55 : 1,
        boxShadow: "var(--pop-shadow)",
        ...style,
      }}
    >
      {children}
    </button>
  )
}

/* Headcount stepper */
export function Stepper({
  value,
  onChange,
  min = 1,
  max = 20,
}: {
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
}) {
  const labels: Record<number, string> = { 1: "just me", 2: "+1", 3: "+2", 4: "+3" }
  const btn = (txt: string, fn: () => void, dim: boolean) => (
    <button
      type="button"
      onClick={fn}
      disabled={dim}
      style={{
        width: 52,
        height: 52,
        flex: "0 0 auto",
        borderRadius: 14,
        border: "3px solid var(--wood)",
        background: dim ? "#eee6d6" : "var(--cream)",
        color: "var(--wood-deep)",
        fontFamily: "var(--display)",
        fontWeight: 700,
        fontSize: 26,
        lineHeight: 1,
        cursor: dim ? "default" : "pointer",
        opacity: dim ? 0.5 : 1,
      }}
    >
      {txt}
    </button>
  )
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      {btn("−", () => onChange(Math.max(min, value - 1)), value <= min)}
      <div style={{ textAlign: "center", minWidth: 92 }}>
        <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: 30, lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 600 }}>
          {labels[value] || `party of ${value}`}
        </div>
      </div>
      {btn("+", () => onChange(Math.min(max, value + 1)), value >= max)}
    </div>
  )
}

/* Friendly labeled field */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 7 }}>
        <span style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 16, color: "var(--ink)" }}>
          {label}
        </span>
        {hint && <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>{hint}</span>}
      </div>
      {children}
    </label>
  )
}

export const inputStyle: CSSProperties = {
  width: "100%",
  fontFamily: "var(--body)",
  fontSize: 17,
  color: "var(--ink)",
  background: "#fff",
  border: "3px solid #e7ddca",
  borderRadius: 14,
  padding: "14px 16px",
  outline: "none",
  transition: "border-color .15s var(--ease), box-shadow .15s var(--ease)",
}

const BURST_COLORS = ["var(--tomato)", "var(--sunny)", "var(--pink)", "var(--teal)", "var(--grass)", "#fff"]

// deterministic 0..1 pseudo-random from a seed — keeps the confetti render pure
function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 4.1414) * 43758.5453
  return x - Math.floor(x)
}

/* one-shot confetti / bubble burst on the success screen */
export function Burst({ go }: { go: boolean }) {
  const bits = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        x: 50 + (rand(i + 1) - 0.5) * 16,
        y: 52 + (rand(i + 2) - 0.5) * 10,
        dx: (rand(i + 3) - 0.5) * 150,
        dy: -rand(i + 4) * 150 - 30,
        rot: rand(i + 5) * 360,
        kind: rand(i + 6),
        c: BURST_COLORS[Math.floor(rand(i + 7) * BURST_COLORS.length)],
        d: rand(i + 8) * 0.12,
      })),
    [],
  )
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {bits.map((b, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: b.kind > 0.5 ? 12 : 16,
            height: b.kind > 0.5 ? 12 : 16,
            borderRadius: b.kind > 0.5 ? "50%" : 4,
            background:
              b.kind > 0.5 ? "radial-gradient(circle at 35% 35%, #fff, rgba(255,255,255,.2))" : b.c,
            transform: go
              ? `translate(${b.dx}px, ${b.dy * 2.4}px) rotate(${b.rot * 2}deg)`
              : "translate(0,0) rotate(0)",
            opacity: go ? 0 : 1,
            transition: `transform 1.1s cubic-bezier(.2,.7,.3,1) ${b.d}s, opacity 1.1s ease ${b.d + 0.25}s`,
          }}
        />
      ))}
    </div>
  )
}

/* The die-cut vinyl YOU'RE IN! sticker */
export function DieCutSticker({ shown, going }: { shown: boolean; going: boolean }) {
  const text = going ? "YOU’RE IN!" : "AW, NEXT TIME"
  const sub = going ? "🫧 see you in the suds" : "you’ll be missed — door’s open if plans change"
  const ring = going ? "var(--tomato)" : "var(--sky-deep)"
  const fill = going ? "var(--sunny)" : "#EAF6FF"
  return (
    <div
      style={{
        position: "relative",
        transform: shown ? "scale(1) rotate(-6deg)" : "scale(1.7) rotate(-6deg)",
        opacity: shown ? 1 : 0,
        transition: "transform .48s var(--spring), opacity .22s ease",
        filter: "drop-shadow(0 18px 26px rgba(46,32,22,.4))",
      }}
    >
      {/* peeling corner */}
      <div
        style={{
          position: "absolute",
          top: -2,
          right: -2,
          width: 54,
          height: 54,
          background: "linear-gradient(135deg, rgba(255,255,255,.95), #e9e3d3)",
          borderRadius: "0 22px 0 70%",
          transformOrigin: "top right",
          boxShadow: "-6px 8px 12px rgba(46,32,22,.22)",
          zIndex: 3,
        }}
      />
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          background: fill,
          border: "8px solid #fff",
          outline: `4px solid ${ring}`,
          outlineOffset: -12,
          borderRadius: 34,
          padding: "clamp(26px,5vw,48px) clamp(34px,7vw,72px)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--display)",
            fontWeight: 700,
            fontSize: going ? "clamp(40px,10vw,80px)" : "clamp(30px,7vw,52px)",
            lineHeight: 1.0,
            whiteSpace: "nowrap",
            color: going ? "var(--tomato)" : "var(--sky-deep)",
            textTransform: "uppercase",
            letterSpacing: "-.01em",
            WebkitTextStroke: "2px #fff",
            textShadow: "0 3px 0 rgba(46,32,22,.12)",
          }}
        >
          {text}
        </div>
        <div
          style={{
            fontFamily: "var(--display)",
            fontWeight: 600,
            fontSize: "clamp(14px,3vw,20px)",
            color: "var(--ink)",
            marginTop: 12,
            maxWidth: 360,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {sub}
        </div>
        {/* glossy specular sweep */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 26,
            pointerEvents: "none",
            background:
              "linear-gradient(115deg, rgba(255,255,255,.65) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 62%, rgba(255,255,255,.28) 100%)",
          }}
        />
      </div>
    </div>
  )
}
