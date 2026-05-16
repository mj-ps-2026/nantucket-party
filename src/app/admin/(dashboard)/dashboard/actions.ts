"use server"

import { getDb } from "@/db"
import { guests } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

export async function deleteGuest(formData: FormData) {
  const id = formData.get("id") as string
  if (!id) return

  const db = getDb()
  await db.delete(guests).where(eq(guests.id, id))

  revalidatePath("/admin/dashboard")
}
