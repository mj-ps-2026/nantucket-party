import { PartyExperience } from "@/components/party/experience"
import { getInitialPartyData } from "@/lib/party-queries"

// always render the live Going list / wall on request
export const dynamic = "force-dynamic"

export default async function Home() {
  const { guests, regrets, notes } = await getInitialPartyData()
  return (
    <PartyExperience initialGuests={guests} initialRegrets={regrets} initialNotes={notes} />
  )
}
