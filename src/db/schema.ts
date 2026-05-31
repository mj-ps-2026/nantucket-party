import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core"

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
