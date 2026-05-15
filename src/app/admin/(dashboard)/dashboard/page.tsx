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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          Guests
          <span className="text-zinc-400 text-lg ml-2">({allGuests.length})</span>
        </h1>
        <div className="flex items-center gap-3">
          <form
            action={async (formData: FormData) => {
              "use server"
              revalidatePath("/admin/dashboard")
            }}
          >
            <a
              href={`/admin/dashboard/csv${query ? `?q=${encodeURIComponent(query)}` : ""}`}
              className="text-sm text-zinc-500 hover:text-zinc-900 underline transition-colors"
            >
              Export CSV
            </a>
          </form>
        </div>
      </div>

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
