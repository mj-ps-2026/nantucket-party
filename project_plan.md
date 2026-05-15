# Nantucket Party RSVP — Project Plan

## Objective

A free, self-hosted RSVP system for parties that collects guest info, sends email confirmations, and provides an admin dashboard for managing guests.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Neon Postgres (Vercel Marketplace free tier)
- **ORM:** Drizzle ORM
- **Email:** Resend (100 free emails/day)
- **Auth:** Session cookie + bcryptjs password
- **Styling:** Tailwind CSS v4
- **Hosting:** Vercel (free tier)

## Structure

```
src/
├── app/
│   ├── actions.ts              — RSVP server action
│   ├── layout.tsx              — Root layout
│   ├── page.tsx                — RSVP form (landing page)
│   └── admin/
│       ├── layout.tsx          — Admin layout (auth gate)
│       ├── login/
│       │   ├── actions.ts      — Login server action
│       │   └── page.tsx        — Admin login page
│       └── dashboard/
│           ├── csv/route.ts    — CSV export
│           └── page.tsx        — Guest list dashboard
├── components/
│   ├── guest-table.tsx         — Guest list table
│   └── rsvp-form.tsx           — RSVP form
├── db/
│   ├── index.ts                — DB connection (lazy)
│   └── schema.ts               — Drizzle schema
└── lib/
    ├── auth.ts                 — Session management
    └── email.ts                — Resend email helpers
```

## Database Schema

### `guests`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, auto-generated |
| `name` | text | Required |
| `email` | text | Required |
| `party_size` | integer | Default 1 |
| `message` | text | Optional |
| `dietary_restrictions` | text | Optional |
| `created_at` | timestamp | Auto |

## Deployment Checklist

1. [ ] Push repo to GitHub
2. [ ] Import in Vercel
3. [ ] Provision Neon Postgres via Vercel Marketplace
4. [ ] Set `RESEND_API_KEY`, `FROM_EMAIL`, `ADMIN_PASSWORD_HASH`
5. [ ] Deploy
6. [ ] Verify RSVP form works
7. [ ] Verify admin login works
