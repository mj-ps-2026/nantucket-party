# Nantucket Party RSVP

A free, self-hosted RSVP system for parties. Built with Next.js 16 (App Router), Neon Postgres, Resend, and Drizzle ORM.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Neon Postgres (via Vercel Marketplace — free tier)
- **ORM:** Drizzle ORM
- **Email:** Resend (100 free emails/day)
- **Styling:** Tailwind CSS v4
- **Auth:** bcryptjs password + session cookie

## Local Development

1. Clone the repo
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run migrations: `STORAGE_POSTGRES_URL=your-url npm run db:push`
5. Start dev server: `npm run dev`

## Environment Variables

| Variable | Description |
|---|---|
| `STORAGE_POSTGRES_URL` | Neon connection string (auto-set by Vercel) |
| `RESEND_API_KEY` | Resend API key for sending emails |
| `FROM_EMAIL` | Sender email address for RSVP confirmations |
| `ADMIN_PASSWORD_HASH` | bcrypt hash of the admin password |

## Deployment (Vercel)

1. Push to GitHub
2. Import repo in Vercel
3. Add a Neon Postgres database (via Vercel Marketplace)
4. Set `RESEND_API_KEY`, `FROM_EMAIL`, and `ADMIN_PASSWORD_HASH`
5. Deploy

Generate the admin password hash:

```
node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Push schema to database |
