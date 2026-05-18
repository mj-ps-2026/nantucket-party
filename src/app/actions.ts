"use server"

import { getDb } from "@/db"
import { guests } from "@/db/schema"
import { sendConfirmationEmail } from "@/lib/email"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const rsvpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  partySize: z.coerce.number().int().min(1).max(100),
  message: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  inviteToken: z.string().optional(),
  website: z.string().optional(),
  loadedAt: z.string().optional(),
})

export type RSVPState = {
  success: boolean
  error: Record<string, string[]> | null
  guest: unknown
}

export async function submitRSVP(_prev: RSVPState, formData: FormData): Promise<RSVPState> {
  const raw = Object.fromEntries(formData)
  const parsed = rsvpSchema.safeParse(raw)

  if (!parsed.success) {
    return { success: false, error: parsed.error.flatten().fieldErrors, guest: null }
  }

  const { name, email, partySize, message, dietaryRestrictions, inviteToken, website, loadedAt } = parsed.data

  if (website) {
    return { success: true, error: null, guest: null }
  }

  if (loadedAt) {
    const elapsed = Date.now() - Number(loadedAt)
    if (elapsed < 3000) {
      return { success: true, error: null, guest: null }
    }
  }

  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY
  if (turnstileSecret) {
    const turnstileToken = formData.get("turnstileToken") as string
    if (!turnstileToken) {
      return { success: false, error: { turnstile: ["Please complete the security check"] }, guest: null }
    }
    const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: turnstileSecret, response: turnstileToken }),
    })
    const result = await verify.json()
    if (!result.success) {
      return { success: false, error: { turnstile: ["Security check failed. Try again."] }, guest: null }
    }
  }

  const db = getDb()

  let inviteId: string | null = null
  if (inviteToken) {
    const invites = (await import("@/db/schema")).invites
    const [invite] = await db
      .select()
      .from(invites)
      .where(
        (await import("drizzle-orm")).eq(invites.token, inviteToken),
      )
      .limit(1)
    if (invite) inviteId = invite.id
  }

  const [guest] = await db
    .insert(guests)
    .values({
      name,
      email,
      partySize,
      message: message || null,
      dietaryRestrictions: dietaryRestrictions || null,
      inviteId,
    })
    .returning()

  try {
    await sendConfirmationEmail({
      name,
      email,
      partySize,
      message: message || null,
      dietaryRestrictions: dietaryRestrictions || null,
    })
  } catch {
    // email failure shouldn't block the RSVP
  }

  revalidatePath("/admin/dashboard")

  return { success: true, error: null, guest }
}
