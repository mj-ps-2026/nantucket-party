import { getDb } from "@/db"
import { invites } from "@/db/schema"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { PartyExperience } from "@/components/party/experience"
import { getInitialPartyData } from "@/lib/party-queries"

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const db = getDb()
  const [invite] = await db.select().from(invites).where(eq(invites.token, token)).limit(1)

  if (!invite) notFound()

  const { guests, regrets, notes } = await getInitialPartyData()

  return (
    <PartyExperience
      initialGuests={guests}
      initialRegrets={regrets}
      initialNotes={notes}
      inviteToken={token}
      invitedBy={invite.name}
      defaultName={invite.name}
    />
  )
}
