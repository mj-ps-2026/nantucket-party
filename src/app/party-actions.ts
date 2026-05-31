"use server"

import { getDb } from "@/db"
import { guests, invites, notes } from "@/db/schema"
import { sendConfirmationEmail } from "@/lib/email"
import { emojiFor, NOTE_TINTS, type GuestTile, type WallNote } from "@/lib/party"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

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

  const { choice, name, email, guests: headcount, note, inviteToken, website, loadedAt } = parsed.data

  // honeypot: a bot filled the hidden field — pretend success, store nothing
  if (website) return { ok: true, guest: null, note: null }

  // speed-check: submitted impossibly fast — pretend success, store nothing
  if (loadedAt) {
    const elapsed = Date.now() - Number(loadedAt)
    if (Number.isFinite(elapsed) && elapsed < 3000) return { ok: true, guest: null, note: null }
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

  revalidatePath("/")
  revalidatePath("/admin/dashboard")

  return {
    ok: true,
    guest: going ? { id: row.id, name: row.name, guests: row.partySize, emoji: emojiFor(row.name) } : null,
    note: createdNote,
  }
}

/* ---------- the wall ---------- */

const noteSchema = z.object({ name: z.string().max(40).optional(), text: z.string().min(1).max(120) })

export async function postWallNote(input: { name?: string; text: string }): Promise<WallNote | null> {
  const parsed = noteSchema.safeParse(input)
  if (!parsed.success) return null
  const name = parsed.data.name?.trim() || "Anonymous"
  const text = parsed.data.text.trim()
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
