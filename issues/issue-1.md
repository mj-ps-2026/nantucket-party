## #1 Setup Project Structure for Railway Deployment

### Description
Initialize project structure for a Vercel/Next.js app that will be hosted on **Railway** (free tier) with **Odette** (TypeScript/Node.js) and **SQLite**. This setup ensures compatibility with Railway's Docker deployment model and free tier limitations.

### Subtasks
- Create the following folders:
  - `public` (for static assets like images and fonts)
  - `pages` (for Next.js page components)
  - `components` (for reusable UI components)
  - `utils` (for helper functions)
  - `styles` (for global styles with Tailwind CSS)
  - `docker` (for Docker-specific configuration)
- Write `README.md` with:
  - Project description (RSVP system for parties)
  - Setup instructions (npm install, Railway deployment)
  - Tech stack (Next.js, TypeScript, Tailwind CSS, Odette)
  - Railway integration notes (Docker setup, environment variables)
- Add `.gitignore` file with:
  - Node.js/TypeScript templates
  - Vercel-specific files (`.vercelignore`)
  - Environment variables (`.env.local`)
- Create `Dockerfile` for Railway deployment with:
  - Base image (node:18)
  - Dependency installation
  - File copying and exposure
  - Command to run the app
- Add `.dockerignore` file to exclude build artifacts
- Set up environment variables for:
  - SMTP credentials (Gmail app password)
  - Session secret (for cookie encryption)
  - Railway-specific configuration (if needed)

### Labels
- setup
- railway
- deployment