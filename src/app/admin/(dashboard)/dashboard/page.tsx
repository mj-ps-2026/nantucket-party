import { getDb } from "@/db"
import { guests } from "@/db/schema"
import { desc, ilike, or } from "drizzle-orm"
import { GuestTable } from "@/components/guest-table"
import { revalidatePath } from "next/cache"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() || ""

  let allGuests: Array<{
    id: string; name: string; email: string; partySize: number
    message: string | null; dietaryRestrictions: string | null; createdAt: Date
  }> = []
  let dbError = ""

  try {
    const db = getDb()
    allGuests = await db
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
  } catch (e: unknown) {
    dbError = e instanceof Error ? e.message : "Database error"
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          Guests
          <span className="text-zinc-400 text-lg ml-2">({allGuests.length})</span>
        </h1>
        <div className="flex items-center gap-3">
          <a
            href={`/admin/dashboard/csv${query ? `?q=${encodeURIComponent(query)}` : ""}`}
            className="text-sm text-zinc-500 hover:text-zinc-900 underline transition-colors"
          >
            Export CSV
          </a>
        </div>
      </div>

      {dbError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          Database error: {dbError}
        </div>
      )}

      <form className="mb-6">
        <input
          name="q"
          type="text"
          defaultValue={query}
          placeholder="Search by name or email..."
          className="w-full max-w-sm px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
        />
      </form>

      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
        <GuestTable guests={allGuests} query={query} />
      </div>
    </div>
  )
}
