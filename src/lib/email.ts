import { Resend } from "resend"

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

type RSVPData = {
  name: string
  email: string
  partySize: number
  message: string | null
  dietaryRestrictions: string | null
}

export async function sendConfirmationEmail(rsvp: RSVPData) {
  const resend = getResend()
  if (!resend) return
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

export async function sendInviteEmail(name: string, email: string, token: string) {
  const resend = getResend()
  if (!resend) return
  const fromEmail = process.env.FROM_EMAIL || "onboarding@resend.dev"
  const link = `https://thenantucket.party/invite/${token}`

  await resend.emails.send({
    from: `Nantucket Party <${fromEmail}>`,
    to: email,
    subject: "You're Invited!",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1>You're Invited!</h1>
        <p>Hi <strong>${name}</strong>,</p>
        <p>You've been invited to a party on Nantucket! Click the link below to RSVP:</p>
        <a href="${link}" style="display: inline-block; padding: 12px 24px; background: #000; color: #fff; text-decoration: none; border-radius: 8px; margin: 16px 0;">RSVP Now</a>
        <p style="color: #999; font-size: 14px;">Feel free to forward this email to anyone else who should come.</p>
      </div>
    `,
  })
}
