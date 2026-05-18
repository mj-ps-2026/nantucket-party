"use client"

import { useActionState, useState, useCallback, useRef } from "react"
import Script from "next/script"
import { submitRSVP, type RSVPState } from "@/app/actions"
import { Turnstile } from "@/components/turnstile"

const hasTurnstile = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

const initialState: RSVPState = { success: false, error: null, guest: null }

export function RSVPForm({ defaultName, inviteToken }: { defaultName?: string; inviteToken?: string }) {
  const [state, action, pending] = useActionState(submitRSVP, initialState)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const loadedAt = useRef(Date.now())

  const onToken = useCallback((token: string | null) => setTurnstileToken(token), [])

  if (state.success) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">&#10003;</div>
        <h2 className="text-2xl font-semibold mb-2">You&apos;re on the list!</h2>
        <p className="text-zinc-500">Check your email for a confirmation.</p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-5">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
      {inviteToken && <input type="hidden" name="inviteToken" value={inviteToken} />}
      <input type="hidden" name="turnstileToken" value={turnstileToken || ""} />
      <input type="hidden" name="loadedAt" value={loadedAt.current} />
      <div aria-hidden="true" className="absolute -left-[9999px] top-0 opacity-0 pointer-events-none">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultName || ""}
          className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
        {state.error?.name && (
          <p className="text-red-500 text-xs mt-1">{state.error.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
        {state.error?.email && (
          <p className="text-red-500 text-xs mt-1">{state.error.email}</p>
        )}
      </div>

      <div>
        <label htmlFor="partySize" className="block text-sm font-medium mb-1">
          Party Size
        </label>
        <input
          id="partySize"
          name="partySize"
          type="number"
          min={1}
          max={100}
          defaultValue={1}
          required
          className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="dietaryRestrictions" className="block text-sm font-medium mb-1">
          Dietary Restrictions
        </label>
        <input
          id="dietaryRestrictions"
          name="dietaryRestrictions"
          type="text"
          placeholder="Optional"
          className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-1">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          placeholder="Optional"
          className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
        />
      </div>

      <Turnstile onToken={onToken} />
      {state.error?.turnstile && (
        <p className="text-red-500 text-xs">{state.error.turnstile}</p>
      )}

      <button
        type="submit"
        disabled={pending || (hasTurnstile && !turnstileToken)}
        className="w-full py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
      >
        {pending ? "Sending..." : "Send RSVP"}
      </button>
    </form>
  )
}
