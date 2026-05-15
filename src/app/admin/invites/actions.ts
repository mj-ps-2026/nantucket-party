"use server"

import { getDb } from "@/db"
import { invites } from "@/db/schema"
import { sendInviteEmail } from "@/lib/email"
import { revalidatePath } from "next/cache"
import { v4 as uuid } from "uuid"

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

export async function sendInvite(formData: FormData) {
  const id = formData.get("id") as string

  const db = getDb()
  const [invite] = await db
    .select()
    .from(invites)
    .where((await import("drizzle-orm")).eq(invites.id, id))
    .limit(1)

  if (!invite) return

  try {
    await sendInviteEmail(invite.name, invite.email, invite.token)
    await db
      .update(invites)
      .set({ sentAt: new Date() })
      .where((await import("drizzle-orm")).eq(invites.id, id))
  } catch {
    // email failure shouldn't block
  }

  revalidatePath("/admin/invites")
  revalidatePath("/admin/dashboard")
}

export async function deleteInvite(formData: FormData) {
  const id = formData.get("id") as string

  const db = getDb()
  await db
    .delete(invites)
    .where((await import("drizzle-orm")).eq(invites.id, id))

  revalidatePath("/admin/invites")
  revalidatePath("/admin/dashboard")
}
