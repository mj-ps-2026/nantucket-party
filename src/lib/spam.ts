import { headers } from "next/headers"
import { and, eq, lt } from "drizzle-orm"
import { getDb } from "@/db"
import { rateHits } from "@/db/schema"

/**
 * Spam defenses for the public RSVP + wall forms. Every helper degrades safely
 * when its backing service isn't configured, so local dev (no DB, no Turnstile
 * keys) keeps working — the protections simply switch on once you set the
 * relevant env vars and a database is reachable.
 */

/** Best-effort client IP from proxy headers. Vercel sets both of these. */
export async function clientIp(): Promise<string> {
  const h = await headers()
  const xff = h.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  return h.get("x-real-ip")?.trim() || "unknown"
}

/**
 * Sliding-window rate limit backed by Postgres. Returns true when the action is
 * allowed. No-ops (allows) when no DB is configured. Prunes the bucket's expired
 * rows on each call, so the table stays small and the count is a true window.
 */
export async function rateLimit(bucket: string, max: number, windowSeconds: number): Promise<boolean> {
  let db
  try {
    db = getDb()
  } catch {
    return true
  }
  const cutoff = new Date(Date.now() - windowSeconds * 1000)
  await db.delete(rateHits).where(and(eq(rateHits.bucket, bucket), lt(rateHits.createdAt, cutoff)))
  const recent = await db.$count(rateHits, eq(rateHits.bucket, bucket))
  if (recent >= max) return false
  await db.insert(rateHits).values({ bucket })
  return true
}

/**
 * Server-side Cloudflare Turnstile verification. Returns true when the token is
 * valid — and also when TURNSTILE_SECRET_KEY is unset, so the site keeps working
 * until Turnstile is wired up. Set BOTH NEXT_PUBLIC_TURNSTILE_SITE_KEY (client)
 * and TURNSTILE_SECRET_KEY (server) to actually enforce it.
 */
export async function verifyTurnstile(token: string | null | undefined, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true
  if (!token) return false
  try {
    const body = new URLSearchParams({ secret, response: token })
    if (ip && ip !== "unknown") body.set("remoteip", ip)
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    })
    const data = (await res.json()) as { success?: boolean; hostname?: string }
    if (data.success !== true) return false

    // hostname allowlist — stops a stolen site key being used on another domain.
    // Optional: skipped entirely when TURNSTILE_ALLOWED_HOSTNAMES is unset.
    const allowed = process.env.TURNSTILE_ALLOWED_HOSTNAMES
    if (allowed) {
      const list = allowed
        .split(",")
        .map((h) => h.trim().toLowerCase())
        .filter(Boolean)
      if (list.length && (!data.hostname || !list.includes(data.hostname.toLowerCase()))) {
        return false
      }
    }
    return true
  } catch {
    // network hiccup talking to Cloudflare shouldn't hard-fail a real guest
    return true
  }
}

/** Links and common spam terms have no business on a party RSVP or wall note. */
const LINK_RE =
  /(https?:\/\/|www\.|\b[a-z0-9][a-z0-9-]*\.(com|net|org|ru|cn|xyz|top|io|info|biz|store|shop|click|link|live|online|site|vip)\b)/i
const SPAM_TERMS = [
  "viagra",
  "cialis",
  "casino",
  "porn",
  "escort",
  "crypto",
  "bitcoin",
  "forex",
  "payday",
  "seo service",
  "backlink",
  "binary option",
  "weight loss",
  "free money",
  "click here",
  "buy now",
]

export function looksLikeSpam(...parts: Array<string | null | undefined>): boolean {
  const text = parts.filter(Boolean).join(" \n ").toLowerCase()
  if (!text.trim()) return false
  if (LINK_RE.test(text)) return true
  return SPAM_TERMS.some((term) => text.includes(term))
}
