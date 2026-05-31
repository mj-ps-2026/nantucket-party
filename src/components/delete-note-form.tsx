"use client"

import { deleteNote } from "@/app/admin/(dashboard)/dashboard/actions"

export function DeleteNoteForm({ noteId }: { noteId: string }) {
  return (
    <form action={deleteNote}>
      <input type="hidden" name="id" value={noteId} />
      <button
        type="submit"
        onClick={(e) => {
          if (!window.confirm("Remove this note from the wall? This cannot be undone.")) {
            e.preventDefault()
          }
        }}
        className="text-sm text-red-500 hover:text-red-700 underline transition-colors"
      >
        Remove
      </button>
    </form>
  )
}
