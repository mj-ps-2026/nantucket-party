import { pgTable, uuid, text, integer, timestamp, index } from "drizzle-orm/pg-core"

export const invites = pgTable("invites", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const guests = pgTable("guests", {
  id: uuid("id").defaultRandom().primaryKey(),
  inviteId: uuid("invite_id").references(() => invites.id),
  name: text("name").notNull(),
  email: text("email"),
  partySize: integer("party_size").notNull().default(1),
  // "going" | "regret" — drives the Going list vs. the quiet regrets tally
  status: text("status").notNull().default("going"),
  message: text("message"),
  dietaryRestrictions: text("dietary_restrictions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// the open guestbook wall — anyone can post a note, no login
export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  text: text("text").notNull(),
  tint: integer("tint").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// sliding-window rate limiting — one row per accepted submission, keyed by
// "<action>:<ip>". Expired rows are pruned on each check (see lib/spam.ts).
export const rateHits = pgTable(
  "rate_hits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    bucket: text("bucket").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("rate_hits_bucket_created_idx").on(t.bucket, t.createdAt)],
)
