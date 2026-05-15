import { RSVPForm } from "@/components/rsvp-form"

export default function Home() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-b from-zinc-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">You&apos;re Invited</h1>
          <p className="text-zinc-500 mt-2">RSVP for the Nantucket party</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
          <RSVPForm />
        </div>
      </div>
    </div>
  )
}
