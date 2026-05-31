# Design Prompt — Foam Party Invitation Experience

> Paste everything below into Claude (design). Replace the `«PLACEHOLDER»` party
> details before sending if you have them; otherwise leave them and I'll wire real
> data in later.

---

## What I'm building

A single-page digital party invitation — think **Paperless Post, but for a backyard
Foam Party & Pig Roast**. The whole thing should feel like a fun, tactile, slightly
chaotic summer party in your browser. It is NOT a form-first webpage; it's an
*experience* that happens to collect an RSVP.

There are six "parts" to the experience. Build them as one continuous, scrolling,
animated page. Each part is described in detail below. Read all of them before
designing — they share a visual language and the foam ties them together.

The hero artwork already exists: a **hand-drawn storybook illustration** captioned
**"FOAM PARTY & PIG ROAST!"** — a sunny backyard with bunting/pennant flags, string
lights, balloons, a pig on a spit, a foam cannon blasting suds, and kids playing in
the foam with unicorn floaties. That illustration is the invitation card itself.
The surrounding UI should feel like it belongs to the same world.

---

## Visual direction — "Bold Summer Pop"

Do **not** copy the hand-drawn cartoon line style for the UI chrome. Instead, build
a **modern flat poster** aesthetic *inspired by* the illustration's palette and
energy:

- **Big color blocks**, high contrast, confident.
- **Chunky display type** for headlines (poster/billboard weight — think condensed
  or extra-bold geometric sans, all-caps for big moments). A clean, readable sans
  for body copy and the RSVP fields.
- **Palette pulled from the artwork:** sky blue, grass green, foam/cream white,
  balloon brights (tomato red, sunny yellow, hot pink, teal), warm wood-fence brown
  as a grounding neutral. Pick ~5 and use them boldly.
- Generous, rounded corners; thick playful borders are OK; subtle drop shadows that
  feel like stickers sitting *on* the page.
- High energy but still legible and easy to use — the fun must never block the RSVP.

Deliver a small color + type spec alongside the design so it's reproducible.

---

## PART 1 — The foam-reveal entrance

When the page first loads, **the entire screen is full of foam.** Dense, soft,
overlapping white bubbles edge to edge — like someone aimed the foam cannon at the
camera. Hold for a beat (~0.5s).

Then the foam **blows away** in a directional gust (a soft "whoosh"), thinning out
and drifting off-screen, **revealing the invitation card sitting underneath it.**
The foam doesn't fully vanish — a little stays behind: residual suds **pooled along
the bottom edge of the screen, clinging to the corners, and resting on the top/side
edges of the card** like froth on the rim of a glass.

This entrance IS the foam effect's first appearance — the same foam system (Part 6)
drives it. Time the whole reveal to feel snappy and delightful, ~1.5–2s total.

---

## PART 2 — The invitation card

Once revealed, the card is the hero. It's the existing illustration, presented like
a **physical card sitting on a surface**:

- Slight 3D presence: a real drop shadow, maybe a hair of perspective/tilt, the kind
  of weight a thick printed card has.
- The card can react subtly to mouse/tilt (a gentle parallax/lean) so it feels
  physical — but keep it tasteful.
- Around/below the card, render the key party details in the Bold Summer Pop type:
  - **Foam Party & Pig Roast**
  - **Saturday, June 27th** · **1:00 PM**
  - **3040 Nantucket Dr**
  - **«HOST / ONE-LINE NOTE»** (e.g. "Bring a towel. Leave your dignity at home.")
- A clear visual cue/arrow inviting the user to RSVP just below.

---

## PART 3 — The RSVP (quick & easy)

The single most important interaction. Keep it **fast and obvious** — two big,
friendly choices up top:

- **`I'M IN!`** (going) — celebratory primary button
- **`CAN'T MAKE IT`** (regrets) — secondary button

When they pick one, reveal a tiny **standard** form (don't show all fields up front;
progressive reveal keeps it light):

- **Name** (required)
- **Headcount / +guests** (a small stepper, default 1 — "just me", "+1", etc.)
- **Note** (optional, one line — "anything to say?")

Then a single **Submit** button. The whole thing should be completable in well under
10 seconds. Big tap targets, mobile-first. No email/dietary fields — keep it minimal.

On submit → go to the success state (Part 7).

---

## PART 4 — Who's going (live list)

Below the RSVP, show **who's coming** — this updates live as people respond:

- A header like **`GOING (12)`** with a big count.
- A lively grid/wall of attendees: each shows their **name**, their **+guests**
  count, and a fun touch — a randomly assigned party emoji/avatar (🦄 🐷 🫧 🍻 🎈)
  so the list feels alive and on-brand.
- It should feel like a crowd filling up — celebratory, a little chaotic, fun to
  scroll. When someone new RSVPs, their tile should pop/drop in.
- (Optional, nice-to-have) a small "can't make it" count shown more quietly.

---

## PART 5 — The comment wall (open guestbook)

A public **guestbook wall** anyone can post to — no login:

- A simple "leave a note…" box + post button, always available.
- Posts appear instantly as **playful sticky-note / speech-bubble cards** scattered
  or stacked on the wall, each with a name and the message. Vary their rotation/color
  slightly so it reads like real notes stuck to a wall.
- Keep it social and immediate. (An admin can hide notes later — out of scope for
  this design, just leave room for a quiet delete affordance.)

---

## PART 6 — The foam effect (the centerpiece)

This is the signature interaction and must feel **alive and physical** throughout
the whole page — not just the intro.

**Look:** soft, white, slightly iridescent overlapping bubbles/blobs of varying
sizes — a metaball/froth look (overlapping soft radial blobs with a slight blur and
faint rainbow sheen on the highlights). Semi-transparent at the edges.

**Ambient state:** after the intro blows most of it away, residual foam lingers —
pooled along the bottom of the screen, in corners, and frothing on the edges of the
card and section headers. It drifts and jiggles very gently on its own, like it's
barely settling.

**Interactive — this is key:**
- **Desktop (mouse):** moving the cursor pushes foam aside, leaving a wake/trail;
  bubbles part around the pointer and slowly flow back.
- **Mobile (device tilt / gyroscope):** tilting the phone makes the residual foam
  **slide and slosh in the tilt direction**, like liquid responding to gravity. Pour
  it side to side.
- **iOS permission caveat (important):** iOS requires a user gesture before granting
  motion access (`DeviceOrientationEvent.requestPermission()`). Design a small,
  on-brand prompt for this — e.g. a little chip/sticker that says
  **"📱 tap to play with the foam 🫧"** — that triggers the permission request on
  tap. If denied or unsupported, fall back gracefully to touch-drag pushing the foam.

**Performance & accessibility:**
- Must stay smooth (target 60fps) on a mid-range phone. Suggest a lightweight
  approach (canvas 2D particle/metaball system, or minimal WebGL/shader) and cap
  particle counts on small screens.
- Respect `prefers-reduced-motion`: if set, show a calm static foam image with no
  motion and no gyroscope, and make sure all content/RSVP still works perfectly.

---

## PART 7 — The success state (the payoff)

When the user submits their RSVP:

1. **Foam floods back in** and fills the entire screen again (foam cannon to the
   face) — fast, joyful, with the same whoosh.
2. A big **glossy die-cut vinyl sticker** **thunks/stamps** onto the screen on top of
   the foam, reading **`YOU'RE IN!`** 🫧
   - Treat it like a real sticker: chunky bold lettering, a **slight rotation**
     (a few degrees off-axis), a soft **drop shadow**, a **glossy specular
     highlight/sheen** across it, and a **peeling corner** like it could be lifted
     off the screen. Very on-brand, very satisfying. A little overshoot/bounce on
     impact.
3. Hold the moment (~1s), maybe a confetti/bubble burst.
4. Foam **clears again** to reveal the updated **Who's Going** list (Part 4) with
   **their name now in it**, plus a gentle nudge to leave a note on the wall.

If they chose **Can't Make It**, run the same foam+sticker beat but keep it warm
rather than celebratory — still a sticker, just a softer message. (Primary design
target is the "YOU'RE IN!" path; design that fully and note the variant.)

---

## Technical context (for implementation handoff)

- The app is **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4**, deployed on
  Vercel, with a Postgres (Drizzle ORM) backend already storing guests (name, party
  size, message) and a comment/wall capability to be added.
- Design should be **component-based and mobile-first**. Desktop and mobile are both
  first-class (desktop = mouse foam, mobile = tilt foam).
- Provide the design as buildable React/Tailwind components where possible, plus the
  color/type spec and animation timings, so it drops into this stack.

## What I want back

1. The visual design for all six parts (Bold Summer Pop), desktop + mobile.
2. A working concept for the **foam system** (intro reveal, ambient, mouse + tilt
   interaction, reduced-motion fallback) — this is the make-or-break piece.
3. The **success sticker** treatment.
4. A short color + typography + motion-timing spec so it's reproducible.

Ask me anything that's ambiguous before you start.
