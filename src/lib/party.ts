/* Party details, constants + helpers — shared by server and client */

export const PARTY = {
  title: "Foam Party & Pig Roast",
  date: "Sunday, June 28th",
  time: "1:00 PM",
  address: "3040 Nantucket Dr",
  note: "Bring a towel. Leave your dignity at home.",
  // weather call: rain bumped us to Sunday + tents — set body to "" to hide the banner
  rainPlan: {
    headline: "New plan: we're moving to Sunday! ☔️→🫧",
    body: "Rain's in the Saturday forecast, so we're bumping the party to Sunday and putting up tents in case there's still a bit of rain. Same spot, still pig, still foam, still a blast. Bring that towel.",
  },
}

export const PARTY_EMOJI = ["🦄", "🐷", "🫧", "🍻", "🎈", "🌭", "🍉", "🌈", "☀️", "🏖️"]

// rotating sticky-note colors (paper tints from the palette)
export const NOTE_TINTS = [
  { bg: "#FFE7B0", pin: "var(--tomato)" }, // butter
  { bg: "#FFD0E0", pin: "var(--pink)" }, // pink
  { bg: "#CFEFFF", pin: "var(--sky-deep)" }, // sky
  { bg: "#D7F4C8", pin: "var(--grass-deep)" }, // grass
  { bg: "#FFFFFF", pin: "var(--sunny)" }, // white
]

// deterministic emoji per name so a guest keeps their avatar without storing it
export function emojiFor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return PARTY_EMOJI[h % PARTY_EMOJI.length]
}

// motion timing spec (ms) — single source of truth
export const TIMING = {
  stickerThunk: 480,
  clearHold: 1000,
}

export type GuestTile = { id: string; name: string; guests: number; emoji: string }
export type WallNote = { id: string; name: string; text: string; tint: number }

// seed "who's going" — used as a fallback when the DB isn't configured (e.g. local dev)
export const SEED_GUESTS: GuestTile[] = [
  { id: "s1", name: "Marcus & the gang", guests: 4 },
  { id: "s2", name: "Priya", guests: 1 },
  { id: "s3", name: "The Delgados", guests: 5 },
  { id: "s4", name: "Sam", guests: 2 },
  { id: "s5", name: "Aunt Rosa", guests: 1 },
  { id: "s6", name: "Devon", guests: 1 },
  { id: "s7", name: "Keiko + roomies", guests: 3 },
  { id: "s8", name: "Big Tony", guests: 2 },
  { id: "s9", name: "Lena", guests: 1 },
  { id: "s10", name: "The Okonkwos", guests: 4 },
].map((g) => ({ ...g, emoji: emojiFor(g.name) }))

export const SEED_REGRETS = 3

export const SEED_NOTES: WallNote[] = [
  { id: "n1", name: "Priya", text: "Bringing my world-famous potato salad 🥔", tint: 1 },
  { id: "n2", name: "Devon", text: "Foam cannon guy reporting for duty", tint: 2 },
  { id: "n3", name: "Aunt Rosa", text: "Save me a seat away from the splash zone!", tint: 0 },
  { id: "n4", name: "Sam", text: "is the pig named yet. asking for a friend", tint: 3 },
]
