import { getDb } from "@/db"
import { guests as guestsTable, invites } from "@/db/schema"
import { desc, ilike, or, eq, count } from "drizzle-orm"
import { DeleteGuestForm } from "@/components/delete-guest-form"
import { MessageCell } from "@/components/message-cell"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = q?.trim() || ""

  const db = getDb()

  const allInvites = await db
    .select({
      id: invites.id,
      name: invites.name,
      email: invites.email,
      sentAt: invites.sentAt,
      createdAt: invites.createdAt,
      rsvpCount: count(guestsTable.id),
    })
    .from(invites)
    .leftJoin(guestsTable, eq(guestsTable.inviteId, invites.id))
    .groupBy(invites.id)
    .orderBy(desc(invites.createdAt))

  const allGuests = await db
    .select()
    .from(guestsTable)
    .where(
      query
        ? or(
            ilike(guestsTable.name, `%${query}%`),
            ilike(guestsTable.email, `%${query}%`),
          )
        : undefined,
    )
    .orderBy(desc(guestsTable.createdAt))

  const totalPeople = allGuests.reduce((sum, g) => sum + g.partySize, 0)
  const totalInvited = allInvites.length
  const totalRsvped = allInvites.filter((i) => i.rsvpCount > 0).length

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-semibold">{totalInvited}</div>
          <div className="text-sm text-zinc-500">Invited</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-semibold">{totalRsvped}</div>
          <div className="text-sm text-zinc-500">RSVP&#39;d</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-semibold">{allGuests.length}</div>
          <div className="text-sm text-zinc-500">Total RSVPs</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-semibold">{totalPeople}</div>
          <div className="text-sm text-zinc-500">Total Guests</div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Invites</h2>
          <a
            href="/admin/invites"
            className="text-sm text-zinc-500 hover:text-zinc-900 underline transition-colors"
          >
            Manage
          </a>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left">
                <th className="p-4 font-medium text-zinc-500">Name</th>
                <th className="p-4 font-medium text-zinc-500">Email</th>
                <th className="p-4 font-medium text-zinc-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {allInvites.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-zinc-400">
                    No invites. <a href="/admin/invites" className="underline">Create one</a>.
                  </td>
                </tr>
              )}
              {allInvites.slice(0, 10).map((invite) => (
                <tr key={invite.id} className="border-b border-zinc-100">
                  <td className="p-4">{invite.name}</td>
                  <td className="p-4 text-zinc-500">{invite.email}</td>
                  <td className="p-4">
                    {invite.rsvpCount > 0 ? (
                      <span className="text-green-600 font-medium">RSVP&#39;d</span>
                    ) : invite.sentAt ? (
                      <span className="text-zinc-500">Sent</span>
                    ) : (
                      <span className="text-zinc-400">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">RSVPs</h2>
          <a
            href={`/admin/dashboard/csv${query ? `?q=${encodeURIComponent(query)}` : ""}`}
            className="text-sm text-zinc-500 hover:text-zinc-900 underline transition-colors"
          >
            Export CSV
          </a>
        </div>

        <form className="mb-4">
          <input
            name="q"
            type="text"
            defaultValue={query}
            placeholder="Search by name or email..."
            className="w-full max-w-sm px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </form>

        <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left">
                <th className="p-4 font-medium text-zinc-500">Name</th>
                <th className="p-4 font-medium text-zinc-500">Email</th>
                <th className="p-4 font-medium text-zinc-500">Party</th>
                <th className="p-4 font-medium text-zinc-500">Dietary</th>
                <th className="p-4 font-medium text-zinc-500">Message</th>
                <th className="p-4 font-medium text-zinc-500">Date</th>
                <th className="p-4 font-medium text-zinc-500"></th>
              </tr>
            </thead>
            <tbody>
              {allGuests.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-400">
                    No RSVPs yet.
                  </td>
                </tr>
              )}
              {allGuests.map((guest) => (
                <tr key={guest.id} className="border-b border-zinc-100">
                  <td className="p-4">{guest.name}</td>
                  <td className="p-4 text-zinc-500">{guest.email}</td>
                  <td className="p-4">{guest.partySize}</td>
                  <td className="p-4 text-zinc-500">{guest.dietaryRestrictions || "—"}</td>
                  <td className="p-4"><MessageCell message={guest.message} /></td>
                  <td className="p-4 text-zinc-400 whitespace-nowrap">
                    {guest.createdAt.toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <DeleteGuestForm guestId={guest.id} name={guest.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
