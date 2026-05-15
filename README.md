# Nantucket Party RSVP System

## 📌 Project Description
A free, self-hosted RSVP system for parties using **Odette** (TypeScript/Node.js) with **SQLite** for storage. Hosted on **Railway** (free tier) with **GitHub** for code management.

## 🧰 Tech Stack
- Frontend: HTML/CSS (Odette templates)
- Backend: Odette (TypeScript/Node.js)
- Database: SQLite (via `better-sqlite3`)
- Hosting: Railway (free tier, no credit card needed)
- Version Control: GitHub

## 🚀 Setup Instructions
1. Clone this repository
2. Install dependencies: `npm install`
3. Deploy to Railway using Docker
4. Set up environment variables for SMTP and session secret

## 📦 Railway Integration
- Use the provided `Dockerfile` for deployment
- Configure environment variables in Railway's dashboard
- Ensure `.dockerignore` excludes build artifacts

## 🔐 Security
- Store SMTP credentials and session secrets in environment variables
- Never commit sensitive data to GitHub

## 📁 Folder Structure
- `public/` - Static assets
- `pages/` - Next.js page components
- `components/` - Reusable UI components
- `utils/` - Helper functions
- `styles/` - Global styles (Tailwind CSS)
- `docker/` - Docker-specific configuration