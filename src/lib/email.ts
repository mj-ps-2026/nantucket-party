import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY!)

type RSVPData = {
  name: string
  email: string
  partySize: number
  message: string | null
  dietaryRestrictions: string | null
}

export async function sendConfirmationEmail(rsvp: RSVPData) {
  const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev"

  await resend.emails.send({
    from: `Nantucket Party <${fromEmail}>`,
    to: rsvp.email,
    subject: "RSVP Confirmed!",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1>You're on the list!</h1>
        <p>Thanks for your RSVP, <strong>${rsvp.name}</strong>.</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #666;">Party size:</td><td style="padding: 8px 0;">${rsvp.partySize}</td></tr>
          ${rsvp.dietaryRestrictions ? `<tr><td style="padding: 8px 0; color: #666;">Dietary restrictions:</td><td style="padding: 8px 0;">${rsvp.dietaryRestrictions}</td></tr>` : ""}
          ${rsvp.message ? `<tr><td style="padding: 8px 0; color: #666;">Message:</td><td style="padding: 8px 0;">${rsvp.message}</td></tr>` : ""}
        </table>
        <p style="color: #999; font-size: 14px; margin-top: 32px;">See you there!</p>
      </div>
    `,
  })
}
