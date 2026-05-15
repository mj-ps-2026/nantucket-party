"use server"

import { getDb } from "@/db"
import { invites } from "@/db/schema"
import { sendInviteEmail } from "@/lib/email"
import { revalidatePath } from "next/cache"
import { v4 as uuid } from "uuid"
import { eq } from "drizzle-orm"

export async function createInvite(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string

  if (!name?.trim() || !email?.trim()) {
    return
  }

  const db = getDb()
  const token = uuid()

  await db.insert(invites).values({
    name: name.trim(),
    email: email.trim(),
    token,
  })

  revalidatePath("/admin/invites")
  revalidatePath("/admin/dashboard")
}

export async function sendInvite(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string } | null> {
  const id = formData.get("id") as string

  const db = getDb()
  const [invite] = await db
    .select()
    .from(invites)
    .where(eq(invites.id, id))
    .limit(1)

  if (!invite) return { error: "Invite not found" }

  const result = await sendInviteEmail(invite.name, invite.email, invite.token)

  if (!result) {
    console.error("Resend not configured (missing RESEND_API_KEY)")
    return { error: "Email service not configured" }
  }

  if (result.error) {
    console.error("Resend send failed:", result.error)
    return { error: result.error.message || "Failed to send email" }
  }

  if (!result.data?.id) {
    console.error("Resend: no confirmation ID returned")
    return { error: "Email sent but no confirmation received" }
  }

  await db.update(invites).set({ sentAt: new Date() }).where(eq(invites.id, id))

  revalidatePath("/admin/invites")
  revalidatePath("/admin/dashboard")
  return null
}

export async function deleteInvite(formData: FormData) {
  const id = formData.get("id") as string

  const db = getDb()
  await db.delete(invites).where(eq(invites.id, id))

  revalidatePath("/admin/invites")
  revalidatePath("/admin/dashboard")
}
