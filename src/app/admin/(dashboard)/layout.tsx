import { isAuthenticated, destroySession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (!(await isAuthenticated())) {
    redirect("/admin/login")
  }

  return (
    <div className="min-h-dvh bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <a href="/admin/dashboard" className="font-semibold text-sm">
              Nantucket Party Admin
            </a>
            <a href="/admin/invites" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
              Invites
            </a>
            <a href="/admin/dashboard" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
              Dashboard
            </a>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              Logout
            </button>
          </form>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}

async function logoutAction() {
  "use server"
  await destroySession()
  redirect("/admin/login")
}
