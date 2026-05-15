"use client"

import { useActionState } from "react"
import { useRouter } from "next/navigation"
import { login } from "./actions"

type LoginState = { error: string } | { success: boolean }

export default function LoginPage() {
  const router = useRouter()
  const [state, action, pending] = useActionState(
    async (_prev: LoginState, formData: FormData) => {
      const result = await login(formData)
      if ("success" in result) {
        router.push("/admin/dashboard")
      }
      return result
    },
    { error: "" } as LoginState,
  )

  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-center mb-6">Admin Login</h1>
        <form action={action} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          {"error" in state && state.error && (
            <p className="text-red-500 text-sm">{state.error}</p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            {pending ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  )
}
