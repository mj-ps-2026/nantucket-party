import { getDb } from "@/db"
import { guests } from "@/db/schema"
import { desc, ilike, or } from "drizzle-orm"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.trim() || ""

  const db = getDb()
  const allGuests = await db
    .select()
    .from(guests)
    .where(
      query
        ? or(
            ilike(guests.name, `%${query}%`),
            ilike(guests.email, `%${query}%`),
          )
        : undefined,
    )
    .orderBy(desc(guests.createdAt))

  const headerRow = ["Name", "Email", "Status", "Party Size", "Dietary Restrictions", "Message", "Date"]
  const dataRows = allGuests.map((g) => [
    g.name,
    g.email || "",
    g.status === "regret" ? "Can't make it" : "Going",
    String(g.partySize),
    g.dietaryRestrictions || "",
    g.message || "",
    g.createdAt.toISOString().split("T")[0],
  ])

  const csv = [headerRow, ...dataRows].map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n")

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=guests.csv",
    },
  })
}
