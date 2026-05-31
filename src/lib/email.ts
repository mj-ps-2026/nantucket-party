import { Resend } from "resend"

function getResend() {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

function fromEmail() {
  return process.env.FROM_EMAIL || "onboarding@resend.dev"
}

// hosts who get pinged on every RSVP
const HOST_EMAILS = ["mjchapmn@gmail.com", "ltchapmn@gmail.com"]

function wrapHtml(body: string, preheader: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="display:none;font-size:1px;color:#333;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:32px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
          <tr>
            <td style="padding:48px 40px 40px">
              ${body}
              <p style="color:#999;font-size:12px;line-height:16px;margin-top:40px;margin-bottom:0;padding-top:24px;border-top:1px solid #eee">
                Nantucket Party
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function wrapText(text: string) {
  return `Nantucket Party\n\n${text}\n\n---\nNantucket Party`
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

  const bodyHtml = `
    <p style="color:#666;font-size:14px;line-height:20px;margin:0 0 4px">RSVP Confirmed</p>
    <h1 style="font-size:24px;font-weight:600;margin:0 0 24px;color:#111">You're on the list</h1>
    <p style="color:#333;font-size:16px;line-height:24px;margin:0 0 24px">Thanks ${rsvp.name}!</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:8px;padding:16px">
      <tr><td style="padding:6px 0;color:#666;font-size:14px">Party size</td><td style="padding:6px 0;color:#111;font-size:14px;font-weight:500">${rsvp.partySize}</td></tr>
      ${rsvp.dietaryRestrictions ? `<tr><td style="padding:6px 0;color:#666;font-size:14px">Dietary restrictions</td><td style="padding:6px 0;color:#111;font-size:14px">${rsvp.dietaryRestrictions}</td></tr>` : ""}
    </table>
    ${rsvp.message ? `<p style="color:#555;font-size:14px;line-height:20px;margin:16px 0 0;padding:12px;background:#fafafa;border-radius:8px;font-style:italic">"${rsvp.message}"</p>` : ""}
    <p style="color:#999;font-size:14px;margin-top:24px">See you there!</p>`

  const bodyText = `RSVP Confirmed\n\nThanks ${rsvp.name}!\n\nParty size: ${rsvp.partySize}${rsvp.dietaryRestrictions ? `\nDietary restrictions: ${rsvp.dietaryRestrictions}` : ""}${rsvp.message ? `\nMessage: "${rsvp.message}"` : ""}`

  await resend.emails.send({
    from: `Nantucket Party <${fromEmail()}>`,
    to: rsvp.email,
    subject: "RSVP Confirmed",
    html: wrapHtml(bodyHtml, `Your RSVP for Nantucket Party is confirmed`),
    text: wrapText(bodyText),
    headers: { "List-Unsubscribe": `<mailto:unsubscribe@${fromEmail().split("@")[1]}>` },
  })
}

type HostNotification = {
  name: string
  email: string | null
  going: boolean
  partySize: number
  message: string | null
}

export async function sendHostNotification(rsvp: HostNotification) {
  const resend = getResend()
  if (!resend) return

  const verb = rsvp.going ? "is in" : "sends regrets"
  const subject = rsvp.going
    ? `${rsvp.name} is coming (+${rsvp.partySize})`
    : `${rsvp.name} can't make it`

  const rows = [
    ["Response", rsvp.going ? "Going" : "Regret"],
    ...(rsvp.going ? [["Party size", String(rsvp.partySize)]] : []),
    ["Email", rsvp.email || "—"],
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 0;color:#666;font-size:14px">${k}</td><td style="padding:6px 0;color:#111;font-size:14px;font-weight:500">${v}</td></tr>`,
    )
    .join("")

  const bodyHtml = `
    <p style="color:#666;font-size:14px;line-height:20px;margin:0 0 4px">New RSVP</p>
    <h1 style="font-size:24px;font-weight:600;margin:0 0 24px;color:#111">${rsvp.name} ${verb}</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:8px;padding:16px">
      ${rows}
    </table>
    ${rsvp.message ? `<p style="color:#555;font-size:14px;line-height:20px;margin:16px 0 0;padding:12px;background:#fafafa;border-radius:8px;font-style:italic">"${rsvp.message}"</p>` : ""}`

  const bodyText = `New RSVP\n\n${rsvp.name} ${verb}\n\nResponse: ${rsvp.going ? "Going" : "Regret"}${rsvp.going ? `\nParty size: ${rsvp.partySize}` : ""}\nEmail: ${rsvp.email || "—"}${rsvp.message ? `\nMessage: "${rsvp.message}"` : ""}`

  await resend.emails.send({
    from: `Nantucket Party <${fromEmail()}>`,
    to: HOST_EMAILS,
    subject,
    html: wrapHtml(bodyHtml, `${rsvp.name} ${verb}`),
    text: wrapText(bodyText),
  })
}

export async function sendInviteEmail(name: string, email: string, token: string) {
  const resend = getResend()
  if (!resend) return null
  const link = `https://thenantucket.party/invite/${token}`

  const bodyHtml = `
    <p style="color:#666;font-size:14px;line-height:20px;margin:0 0 4px">You're Invited</p>
    <h1 style="font-size:24px;font-weight:600;margin:0 0 24px;color:#111">Nantucket Party</h1>
    <p style="color:#333;font-size:16px;line-height:24px;margin:0 0 8px">Hi ${name},</p>
    <p style="color:#555;font-size:15px;line-height:22px;margin:0 0 24px">You're invited to a party on Nantucket. Click the button below to let us know if you can make it.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 32px">
      <tr>
        <td style="background-color:#111;border-radius:8px;padding:14px 32px">
          <a href="${link}" style="color:#fff;font-size:15px;font-weight:500;text-decoration:none;display:block">RSVP Now</a>
        </td>
      </tr>
    </table>
    <p style="color:#999;font-size:14px;line-height:20px">Feel free to forward this to anyone else who should come.</p>`

  const bodyText = `You're Invited!\n\nHi ${name},\n\nYou're invited to a party on Nantucket. RSVP here:\n${link}\n\nFeel free to forward this to anyone else who should come.`

  return await resend.emails.send({
    from: `Nantucket Party <${fromEmail()}>`,
    to: email,
    subject: "You're Invited to Nantucket Party",
    html: wrapHtml(bodyHtml, `RSVP for Nantucket Party`),
    text: wrapText(bodyText),
    headers: { "List-Unsubscribe": `<mailto:unsubscribe@${fromEmail().split("@")[1]}>` },
  })
}
