import type { Metadata } from "next"
import { Geist, Geist_Mono, Fredoka, DM_Sans } from "next/font/google"
import Script from "next/script"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

// Bold Summer Pop type — display + body for the invitation experience
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
})

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
})

const title = "Foam Party & Pig Roast — You're Invited"
const description =
  "Saturday, June 27th · 1:00 PM · 3040 Nantucket Dr. RSVP — it takes 10 seconds."

// Absolute base URL so the og:image resolves for link previews (iMessage/SMS,
// social). Defaults to the production domain; NEXT_PUBLIC_SITE_URL overrides
// (e.g. http://localhost:3000 in dev, or a new domain if it ever changes).
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thenantucket.party"

// Compressed (~275 KB) copy of the hero, sized for fast link previews.
const heroImage = {
  url: "/hero-og.jpg",
  width: 1200,
  height: 655,
  alt: "Foam Party & Pig Roast — a sunny backyard with a foam cannon, a pig on a spit, balloons, and kids playing in the suds",
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    images: [heroImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [heroImage.url],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} ${dmSans.variable}`}
    >
      <body className="font-sans antialiased">
        {children}
        {/* Cloudflare Turnstile — only loaded once a site key is configured */}
        {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  )
}
