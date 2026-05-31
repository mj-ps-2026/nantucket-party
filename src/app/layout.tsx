import type { Metadata } from "next"
import { Geist, Geist_Mono, Fredoka, DM_Sans } from "next/font/google"
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

export const metadata: Metadata = {
  title: "Foam Party & Pig Roast — You're Invited",
  description: "Saturday, June 27th · 1:00 PM · 3040 Nantucket Dr. RSVP — it takes 10 seconds.",
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
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
