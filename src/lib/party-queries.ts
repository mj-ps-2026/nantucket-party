import "server-only"
import { getDb } from "@/db"
import { guests as guestsTable, notes as notesTable } from "@/db/schema"
import { desc } from "drizzle-orm"
import {
  emojiFor,
  SEED_GUESTS,
  SEED_REGRETS,
  SEED_NOTES,
  type GuestTile,
  type WallNote,
} from "@/lib/party"

export type InitialPartyData = {
  guests: GuestTile[]
  regrets: number
  notes: WallNote[]
  live: boolean // true when backed by the real DB, false when showing seed data
}

/**
 * Load the Going list, regret tally, and wall notes from the DB.
 * Falls back to the seed data when the database isn't configured (e.g. local
 * dev without STORAGE_POSTGRES_URL) so the page always renders.
 */
export async function getInitialPartyData(): Promise<InitialPartyData> {
  try {
    const db = getDb()

    const rows = await db.select().from(guestsTable).orderBy(desc(guestsTable.createdAt))
    const going: GuestTile[] = rows
      .filter((g) => g.status !== "regret")
      .map((g) => ({ id: g.id, name: g.name, guests: g.partySize, emoji: emojiFor(g.name) }))
    const regrets = rows.filter((g) => g.status === "regret").length

    const noteRows = await db.select().from(notesTable).orderBy(desc(notesTable.createdAt))
    const notes: WallNote[] = noteRows.map((n) => ({ id: n.id, name: n.name, text: n.text, tint: n.tint }))

    return { guests: going, regrets, notes, live: true }
  } catch {
    // no DB configured — render the prototype's seed data so the page still works
    return { guests: SEED_GUESTS, regrets: SEED_REGRETS, notes: SEED_NOTES, live: false }
  }
}
