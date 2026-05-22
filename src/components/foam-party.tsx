"use client"

import { useEffect, useState } from "react"

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function Bubble({ id }: { id: number }) {
  const size = randomBetween(20, 80)
  const left = randomBetween(0, 100)
  const delay = randomBetween(0, 3)
  const duration = randomBetween(3, 7)
  const drift = randomBetween(-30, 30)
  const hue = Math.random() > 0.5 ? randomBetween(190, 220) : randomBetween(340, 360)
  const sat = randomBetween(60, 90)
  const light = randomBetween(60, 85)

  return (
    <div
      className="absolute rounded-full animate-foam"
      style={{
        width: size,
        height: size,
        left: `${left}%`,
        bottom: "-10%",
        opacity: 0,
        background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), hsla(${hue}, ${sat}%, ${light}%, 0.3))`,
        border: `1px solid rgba(255,255,255,0.3)`,
        boxShadow: `inset -2px -2px 4px rgba(0,0,0,0.05), inset 2px 2px 4px rgba(255,255,255,0.5)`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        "--drift": `${drift}px`,
      } as React.CSSProperties}
    />
  )
}

export function FoamParty() {
  const [bubbles, setBubbles] = useState<number[]>([])

  useEffect(() => {
    setBubbles(Array.from({ length: 40 }, (_, i) => i))
  }, [])

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {bubbles.map((i) => (
        <Bubble key={i} id={i} />
      ))}
    </div>
  )
}
