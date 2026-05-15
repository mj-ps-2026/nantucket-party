import { getDb } from "@/db"
import { invites } from "@/db/schema"
import { notFound } from "next/navigation"
import { RSVPForm } from "@/components/rsvp-form"

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const db = getDb()
  const [invite] = await db
    .select()
    .from(invites)
    .where(
      (await import("drizzle-orm")).eq(invites.token, token),
    )
    .limit(1)

  if (!invite) notFound()

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-zinc-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">You&apos;re Invited!</h1>
          <p className="text-zinc-500 mt-2">
            RSVP for the party{invite.name ? ` — you were invited by ${invite.name}` : ""}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <RSVPForm defaultName={invite.name} inviteToken={token} />
        </div>
      </div>
    </div>
  )
}
