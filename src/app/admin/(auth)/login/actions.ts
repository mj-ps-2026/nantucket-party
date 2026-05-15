"use server"

import { verifyPassword, createSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function login(formData: FormData) {
  const password = formData.get("password") as string

  if (!password || !verifyPassword(password)) {
    redirect("/admin/login?error=1")
  }

  await createSession()
  redirect("/admin/dashboard")
}
