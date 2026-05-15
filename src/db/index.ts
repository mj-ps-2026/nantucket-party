import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

function createDb() {
  const url = process.env.STORAGE_POSTGRES_URL || process.env.POSTGRES_URL
  if (!url) return null
  const sql = neon(url)
  return drizzle({ client: sql, schema })
}

const _db = createDb()

export function getDb() {
  if (!_db) throw new Error("STORAGE_POSTGRES_URL environment variable is not set. Configure Neon in Vercel Marketplace or set it in .env.local.")
  return _db
}

export { schema }
