"use client"

import { useActionState } from "react"
import { sendInvite } from "@/app/admin/invites/actions"

export function InviteSendForm({ inviteId }: { inviteId: string }) {
  const [state, formAction, pending] = useActionState(sendInvite, null)

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={inviteId} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ color: state?.error ? "#dc2626" : undefined }}
      >
        {pending ? "Sending..." : state?.error ? "Retry" : "Send"}
      </button>
    </form>
  )
}
