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

  const { name, email, partySize, message, dietaryRestrictions, inviteToken, website } = parsed.data

  if (website) {
    return { success: true, error: null, guest: null }
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
