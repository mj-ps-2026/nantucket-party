"use client"

import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { TIMING, type GuestTile, type WallNote } from "@/lib/party"
import { submitPartyRSVP, postWallNote } from "@/app/party-actions"
import { InvitationCard, Rsvp, Going, Wall, type RsvpChoice, type RsvpData } from "./sections"
import { Burst, DieCutSticker } from "./ui"
import { FoamLayer } from "./foam-layer"
import type { FoamHandle } from "@/lib/foam"

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)"
function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(REDUCED_QUERY)
      mq.addEventListener("change", cb)
      return () => mq.removeEventListener("change", cb)
    },
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  )
}

export function PartyExperience({
  initialGuests,
  initialRegrets,
  initialNotes,
  inviteToken,
  invitedBy,
  defaultName,
}: {
  initialGuests: GuestTile[]
  initialRegrets: number
  initialNotes: WallNote[]
  inviteToken?: string
  invitedBy?: string
  defaultName?: string
}) {
  const [guests, setGuests] = useState(initialGuests)
  const [regrets, setRegrets] = useState(initialRegrets)
  const [notes, setNotes] = useState(initialNotes)
  const [newId, setNewId] = useState<string | null>(null)
  const [newNoteId, setNewNoteId] = useState<string | null>(null)

  const [phase, setPhase] = useState<"live" | "success">("live")
  const [going, setGoing] = useState(true)
  const [stickerShown, setStickerShown] = useState(false)
  const [burstGo, setBurstGo] = useState(false)
  const [pending, setPending] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const reduced = useReducedMotion()

  const listRef = useRef<HTMLElement>(null)
  const rsvpRef = useRef<HTMLDivElement>(null)
  const honeypotRef = useRef<HTMLInputElement>(null)
  const foamRef = useRef<FoamHandle>(null)
  const loadedAt = useRef(0)

  // mark the body so globals.css can paint the backyard background;
  // stamp the load time for the submit speed-check
  useEffect(() => {
    loadedAt.current = Date.now()
    document.body.classList.add("party")
    return () => document.body.classList.remove("party")
  }, [])

  function scrollToEl(el: HTMLElement | null) {
    if (!el) return
    const y = el.getBoundingClientRect().top + window.scrollY - 12
    window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" })
  }

  function finish(g: boolean, guest: GuestTile | null, note: WallNote | null) {
    if (guest) {
      setGuests((arr) => [guest, ...arr])
      setNewId(guest.id)
    } else if (!g) {
      setRegrets((r) => r + 1)
    }
    if (note) {
      setNotes((n) => [note, ...n])
      setNewNoteId(note.id)
    }
    setPhase("live")
    setStickerShown(false)
    setBurstGo(false)
    setPending(false)
    setTimeout(() => scrollToEl(listRef.current), 220)
  }

  async function handleSubmit(choice: RsvpChoice, data: RsvpData) {
    if (pending) return
    setPending(true)
    setToast(null)

    // suds start rising the instant they hit submit, covering the form
    // while the request is in flight
    if (!reduced) foamRef.current?.fill()

    const fd = new FormData()
    fd.set("choice", choice)
    fd.set("name", data.name)
    fd.set("email", data.email)
    fd.set("guests", String(data.guests || 1))
    fd.set("note", data.note)
    if (inviteToken) fd.set("inviteToken", inviteToken)
    fd.set("website", honeypotRef.current?.value || "")
    fd.set("loadedAt", String(loadedAt.current))
    fd.set("turnstileToken", data.token || "")

    let result
    try {
      result = await submitPartyRSVP(fd)
    } catch {
      result = { ok: false as const, error: "Couldn't reach the server — try again in a sec." }
    }

    if (!result.ok) {
      setPending(false)
      setToast(result.error)
      foamRef.current?.reset() // no payoff — wipe the suds away
      return
    }

    const g = choice === "in"
    const guest = result.guest
    const note = result.note

    // play the success payoff: sticker thunks on, confetti, hold, then reveal list
    setGoing(g)
    setPhase("success")
    setStickerShown(false)
    setBurstGo(false)
    setTimeout(() => {
      setStickerShown(true)
      // the success message lands and blows the foam off from the centre,
      // revealing itself underneath (queues if the fill is still rising)
      if (!reduced) foamRef.current?.blast()
    }, 60)
    setTimeout(() => setBurstGo(true), 220)
    setTimeout(() => finish(g, guest, note), TIMING.clearHold + 700)
  }

  async function handlePost({ name, text, token }: { name: string; text: string; token: string | null }) {
    const tempId = `tmp-${Date.now()}`
    const temp: WallNote = { id: tempId, name: name || "Anonymous", text, tint: 0 }
    setNotes((arr) => [temp, ...arr])
    setNewNoteId(tempId)
    const saved = await postWallNote({
      name,
      text,
      turnstileToken: token || "",
      website: honeypotRef.current?.value || "",
      loadedAt: String(loadedAt.current),
    })
    if (saved) {
      setNotes((arr) => arr.map((n) => (n.id === tempId ? saved : n)))
      setNewNoteId(saved.id)
    }
  }

  return (
    <div className="party-root">
      {/* honeypot — hidden from humans, bots fill it and get silently dropped */}
      <input
        ref={honeypotRef}
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", top: 0, opacity: 0, pointerEvents: "none" }}
      />

      <InvitationCard
        revealed
        reduced={reduced}
        invitedBy={invitedBy}
        onRsvp={() => scrollToEl(rsvpRef.current)}
      />

      <div ref={rsvpRef}>
        <Rsvp onSubmit={handleSubmit} reduced={reduced} pending={pending} defaultName={defaultName} />
      </div>

      <Going guests={guests} regrets={regrets} newId={newId} listRef={listRef} />

      <Wall notes={notes} newNoteId={newNoteId} onPost={handlePost} />

      <footer style={{ textAlign: "center", padding: "0 0 50px", color: "var(--wood-deep)" }}>
        <div style={{ fontFamily: "var(--display)", fontWeight: 600, fontSize: 15, opacity: 0.8 }}>
          3040 Nantucket Dr · see you in the suds 🫧
        </div>
      </footer>

      {/* soap-suds layer — fills on submit, blasts off on success */}
      <FoamLayer ref={foamRef} />

      {/* success overlay */}
      {phase === "success" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            pointerEvents: "none",
            background: "rgba(46,32,22,.32)",
            backdropFilter: "blur(3px)",
            transition: "background .3s var(--ease)",
          }}
        >
          <Burst go={burstGo} />
          <DieCutSticker shown={stickerShown} going={going} />
        </div>
      )}

      {/* error toast */}
      {toast && (
        <div
          role="alert"
          onClick={() => setToast(null)}
          style={{
            position: "fixed",
            left: "50%",
            bottom: 24,
            transform: "translateX(-50%)",
            zIndex: 110,
            background: "var(--tomato)",
            color: "#fff",
            fontFamily: "var(--display)",
            fontWeight: 600,
            fontSize: 15,
            padding: "12px 20px",
            borderRadius: 999,
            border: "3px solid #fff",
            boxShadow: "var(--pop-shadow)",
            cursor: "pointer",
            maxWidth: "90vw",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
