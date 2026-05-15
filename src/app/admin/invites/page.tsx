import { getDb } from "@/db"
import { invites, guests } from "@/db/schema"
import { desc, eq, count } from "drizzle-orm"
import { createInvite, sendInvite, deleteInvite } from "./actions"
import { SelectableInput } from "@/components/selectable-input"

export const dynamic = "force-dynamic"

export default async function InvitesPage() {
  const db = getDb()

  const allInvites = await db
    .select({
      id: invites.id,
      name: invites.name,
      email: invites.email,
      token: invites.token,
      sentAt: invites.sentAt,
      createdAt: invites.createdAt,
      rsvpCount: count(guests.id),
    })
    .from(invites)
    .leftJoin(guests, eq(guests.inviteId, invites.id))
    .groupBy(invites.id)
    .orderBy(desc(invites.createdAt))

  const totalSent = allInvites.filter((i) => i.sentAt).length
  const totalRsvped = allInvites.filter((i) => i.rsvpCount > 0).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          Invites
          <span className="text-zinc-400 text-lg ml-2">({allInvites.length})</span>
        </h1>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-semibold">{allInvites.length}</div>
          <div className="text-sm text-zinc-500">Total Invites</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-semibold">{totalSent}</div>
          <div className="text-sm text-zinc-500">Emails Sent</div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
          <div className="text-2xl font-semibold">{totalRsvped}</div>
          <div className="text-sm text-zinc-500">RSVPs Received</div>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm mb-8">
        <h2 className="font-semibold mb-4">Add Invite</h2>
        <form action={createInvite} className="flex gap-3">
          <input
            name="name"
            type="text"
            placeholder="Name"
            required
            className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Add
          </button>
        </form>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left">
              <th className="p-4 font-medium text-zinc-500">Name</th>
              <th className="p-4 font-medium text-zinc-500">Email</th>
              <th className="p-4 font-medium text-zinc-500">Status</th>
              <th className="p-4 font-medium text-zinc-500">Link</th>
              <th className="p-4 font-medium text-zinc-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {allInvites.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-400">
                  No invites yet. Add one above.
                </td>
              </tr>
            )}
            {allInvites.map((invite) => (
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
                <td className="p-4">
                  <SelectableInput value={`https://thenantucket.party/invite/${invite.token}`} />
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    {!invite.sentAt && (
                      <form action={sendInvite}>
                        <input type="hidden" name="id" value={invite.id} />
                        <button
                          type="submit"
                          className="text-sm text-zinc-500 hover:text-zinc-900 underline transition-colors"
                        >
                          Send
                        </button>
                      </form>
                    )}
                    <form action={deleteInvite}>
                      <input type="hidden" name="id" value={invite.id} />
                      <button
                        type="submit"
                        className="text-sm text-red-500 hover:text-red-700 underline transition-colors"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
