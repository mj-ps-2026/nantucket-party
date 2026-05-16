"use client"

import { deleteGuest } from "@/app/admin/(dashboard)/dashboard/actions"

export function DeleteGuestForm({ guestId, name }: { guestId: string; name: string }) {
  return (
    <form action={deleteGuest}>
      <input type="hidden" name="id" value={guestId} />
      <button
        type="submit"
        onClick={(e) => {
          if (!window.confirm(`Delete RSVP from ${name}? This cannot be undone.`)) {
            e.preventDefault()
          }
        }}
        className="text-sm text-red-500 hover:text-red-700 underline transition-colors"
      >
        Delete
      </button>
    </form>
  )
}
