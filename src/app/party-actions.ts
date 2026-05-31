"use server"

import { getDb } from "@/db"
import { guests, invites, notes } from "@/db/schema"
import { sendConfirmationEmail, sendHostNotification } from "@/lib/email"
import { emojiFor, NOTE_TINTS, type GuestTile, type WallNote } from "@/lib/party"
import { clientIp, looksLikeSpam, rateLimit, verifyTurnstile } from "@/lib/spam"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// per-IP submission caps (sliding window)
const RSVP_LIMIT = { max: 5, windowSeconds: 5 * 60 }
const NOTE_LIMIT = { max: 5, windowSeconds: 5 * 60 }

/* ---------- RSVP ---------- */

const rsvpSchema = z.object({
  choice: z.enum(["in", "out"]),
  name: z.string().min(1, "Name is required").max(80),
  email: z.union([z.string().email(), z.literal("")]).optional(),
  guests: z.coerce.number().int().min(1).max(20),
  note: z.string().max(120).optional(),
  inviteToken: z.string().optional(),
  // honeypot + speed-check (carried over from the original form)
  website: z.string().optional(),
  loadedAt: z.string().optional(),
  // Cloudflare Turnstile token
  turnstileToken: z.string().optional(),
})

export type PartyRsvpResult =
  | { ok: true; guest: GuestTile | null; note: WallNote | null }
  | { ok: false; error: string }

export async function submitPartyRSVP(formData: FormData): Promise<PartyRsvpResult> {
  const parsed = rsvpSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: first?.message || "Something looked off — give it another go." }
  }

  const { choice, name, email, guests: headcount, note, inviteToken, website, loadedAt, turnstileToken } = parsed.data

  // honeypot: a bot filled the hidden field — pretend success, store nothing
  if (website) return { ok: true, guest: null, note: null }

  // speed-check: submitted impossibly fast — pretend success, store nothing
  if (loadedAt) {
    const elapsed = Date.now() - Number(loadedAt)
    if (Number.isFinite(elapsed) && elapsed < 3000) return { ok: true, guest: null, note: null }
  }

  // content filter: links/spam terms — silently dropped, like the honeypot
  if (looksLikeSpam(name, note)) return { ok: true, guest: null, note: null }

  const ip = await clientIp()

  // captcha: once Turnstile is configured, a missing/invalid token is rejected
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return { ok: false, error: "Couldn't verify you're human — give it a refresh and try again." }
  }

  // rate limit: stop a single source from flooding the guest list
  if (!(await rateLimit(`rsvp:${ip}`, RSVP_LIMIT.max, RSVP_LIMIT.windowSeconds))) {
    return { ok: false, error: "Whoa, slow down a sec — try again in a few minutes." }
  }

  const going = choice === "in"
  const partySize = going ? Math.max(1, headcount) : 1

  let db
  try {
    db = getDb()
  } catch {
    // no DB configured (e.g. local dev) — still drive the success animation,
    // returning the new guest/note so the client can show them optimistically.
    const id = crypto.randomUUID()
    return {
      ok: true,
      guest: going ? { id, name, guests: partySize, emoji: emojiFor(name) } : null,
      note: note ? { id: crypto.randomUUID(), name, text: note, tint: tintFor(name) } : null,
    }
  }

  // tie back to an invite when one was forwarded
  let inviteId: string | null = null
  if (inviteToken) {
    const [invite] = await db.select().from(invites).where(eq(invites.token, inviteToken)).limit(1)
    if (invite) inviteId = invite.id
  }

  const [row] = await db
    .insert(guests)
    .values({
      name,
      email: email || null,
      partySize,
      status: going ? "going" : "regret",
      message: note || null,
      inviteId,
    })
    .returning()

  // a wall note from the RSVP message
  let createdNote: WallNote | null = null
  if (note) {
    const tint = tintFor(name)
    const [n] = await db.insert(notes).values({ name, text: note, tint }).returning()
    createdNote = { id: n.id, name: n.name, text: n.text, tint: n.tint }
  }

  // confirmation email — only when an address was given
  if (email) {
    try {
      await sendConfirmationEmail({
        name,
        email,
        partySize,
        message: note || null,
        dietaryRestrictions: null,
      })
    } catch {
      // email failure shouldn't block the RSVP
    }
  }

  // host notification — fires on every RSVP, going or regret
  try {
    await sendHostNotification({
      name,
      email: email || null,
      going,
      partySize,
      message: note || null,
    })
  } catch {
    // notification failure shouldn't block the RSVP
  }

  revalidatePath("/")
  revalidatePath("/admin/dashboard")

  return {
    ok: true,
    guest: going ? { id: row.id, name: row.name, guests: row.partySize, emoji: emojiFor(row.name) } : null,
    note: createdNote,
  }
}

/* ---------- the wall ---------- */

const noteSchema = z.object({
  name: z.string().max(40).optional(),
  text: z.string().min(1).max(120),
  // honeypot + speed-check + captcha (mirrors the RSVP form's defenses)
  website: z.string().optional(),
  loadedAt: z.string().optional(),
  turnstileToken: z.string().optional(),
})

export async function postWallNote(input: {
  name?: string
  text: string
  website?: string
  loadedAt?: string
  turnstileToken?: string
}): Promise<WallNote | null> {
  const parsed = noteSchema.safeParse(input)
  if (!parsed.success) return null

  // honeypot: a bot filled the hidden field — silently drop it
  if (parsed.data.website) return null

  // speed-check: posted impossibly fast — silently drop it
  if (parsed.data.loadedAt) {
    const elapsed = Date.now() - Number(parsed.data.loadedAt)
    if (Number.isFinite(elapsed) && elapsed < 3000) return null
  }

  const name = parsed.data.name?.trim() || "Anonymous"
  const text = parsed.data.text.trim()

  // content filter: links/spam terms — silently dropped
  if (looksLikeSpam(name, text)) return null

  const ip = await clientIp()

  // captcha: once Turnstile is configured, a missing/invalid token is rejected
  if (!(await verifyTurnstile(parsed.data.turnstileToken, ip))) return null

  // rate limit: stop a single source from flooding the wall
  if (!(await rateLimit(`note:${ip}`, NOTE_LIMIT.max, NOTE_LIMIT.windowSeconds))) return null

  const tint = tintFor(name + text)

  try {
    const db = getDb()
    const [n] = await db.insert(notes).values({ name, text, tint }).returning()
    revalidatePath("/")
    return { id: n.id, name: n.name, text: n.text, tint: n.tint }
  } catch {
    return { id: crypto.randomUUID(), name, text, tint }
  }
}

// note moderation/deletion is admin-only — see deleteNote in the dashboard actions

// deterministic tint so a note keeps its color without storing randomness
function tintFor(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return h % NOTE_TINTS.length
}
