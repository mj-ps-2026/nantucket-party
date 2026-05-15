"use server"

import { verifyPassword, createSession } from "@/lib/auth"

export async function login(formData: FormData) {
  const password = formData.get("password") as string

  if (!password || !verifyPassword(password)) {
    return { error: "Invalid password" }
  }

  await createSession()
  return { success: true }
}
