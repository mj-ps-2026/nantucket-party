"use server"

import { getDb } from "@/db"
import { guests, notes } from "@/db/schema"
import { isAuthenticated } from "@/lib/auth"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function deleteGuest(formData: FormData) {
  if (!(await isAuthenticated())) return
  const id = formData.get("id") as string
  if (!id) return

  const db = getDb()
  await db.delete(guests).where(eq(guests.id, id))

  revalidatePath("/admin/dashboard")
}

// admin-only wall moderation — removes a note from the public guestbook
export async function deleteNote(formData: FormData) {
  if (!(await isAuthenticated())) return
  const id = formData.get("id") as string
  if (!id) return

  const db = getDb()
  await db.delete(notes).where(eq(notes.id, id))

  revalidatePath("/admin/dashboard")
  revalidatePath("/")
}
