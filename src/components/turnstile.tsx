"use client"

import { useEffect, useRef } from "react"

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: {
        sitekey: string
        callback: (token: string) => void
        "expired-callback"?: () => void
      }) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

export function Turnstile({
  onToken,
  resetSignal = 0,
}: {
  onToken: (token: string | null) => void
  // bump this to force a fresh challenge — Turnstile tokens are single-use,
  // so a form that submits more than once (the wall) needs a new one each time
  resetSignal?: number
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  useEffect(() => {
    if (resetSignal === 0) return
    if (widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current)
      onToken(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal])

  useEffect(() => {
    if (!containerRef.current) return
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    if (!siteKey) return

    if (window.turnstile) {
      widgetId.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(null),
      })
    } else {
      const check = setInterval(() => {
        if (window.turnstile && containerRef.current) {
          widgetId.current = window.turnstile.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => onToken(token),
            "expired-callback": () => onToken(null),
          })
          clearInterval(check)
        }
      }, 200)
      return () => clearInterval(check)
    }

    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current)
      }
    }
  }, [onToken])

  return <div ref={containerRef} />
}
