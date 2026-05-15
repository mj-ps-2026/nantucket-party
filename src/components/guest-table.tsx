type Guest = {
  id: string
  name: string
  email: string
  partySize: number
  message: string | null
  dietaryRestrictions: string | null
  createdAt: Date
}

export function GuestTable({ guests, query }: { guests: Guest[]; query: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left">
            <th className="pb-3 font-medium text-zinc-500">Name</th>
            <th className="pb-3 font-medium text-zinc-500">Email</th>
            <th className="pb-3 font-medium text-zinc-500">Party</th>
            <th className="pb-3 font-medium text-zinc-500">Dietary</th>
            <th className="pb-3 font-medium text-zinc-500">Message</th>
            <th className="pb-3 font-medium text-zinc-500">Date</th>
          </tr>
        </thead>
        <tbody>
          {guests.length === 0 && (
            <tr>
              <td colSpan={6} className="pt-8 text-center text-zinc-400">
                {query ? "No guests match your search." : "No RSVPs yet."}
              </td>
            </tr>
          )}
          {guests.map((guest) => (
            <tr key={guest.id} className="border-b border-zinc-100">
              <td className="py-3 pr-4">{guest.name}</td>
              <td className="py-3 pr-4 text-zinc-500">{guest.email}</td>
              <td className="py-3 pr-4">{guest.partySize}</td>
              <td className="py-3 pr-4 text-zinc-500">{guest.dietaryRestrictions || "—"}</td>
              <td className="py-3 pr-4 text-zinc-500 max-w-[200px] truncate">{guest.message || "—"}</td>
              <td className="py-3 text-zinc-400 whitespace-nowrap">
                {guest.createdAt.toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
