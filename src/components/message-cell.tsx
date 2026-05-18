"use client"

import { useState } from "react"

export function MessageCell({ message }: { message: string | null }) {
  const [open, setOpen] = useState(false)

  if (!message) return <span className="text-zinc-400">&mdash;</span>

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-left text-zinc-500 max-w-[200px] truncate hover:text-zinc-900 transition-colors cursor-pointer"
      >
        {message}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-lg max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-zinc-500">Message</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-400 hover:text-zinc-900 text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <p className="text-sm text-zinc-800 whitespace-pre-wrap">{message}</p>
          </div>
        </div>
      )}
    </>
  )
}
