import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;
const SEND_TO = process.env.FORM_SEND_TO || "hello@parqlet.com";
const SEND_FROM = process.env.FORM_SEND_FROM || "ParQlet <onboarding@resend.dev>";

function sanitize(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .trim()
    .slice(0, 500);
}

export async function POST(request: Request) {
  try {
    const { fullName, email, company, building, city, role, details, website } =
      await request.json();

    // Honeypot check
    if (website) {
      return Response.json({ success: true });
    }

    if (!fullName || !email || !company || !city || !role) {
      return Response.json(
        { error: "Required fields are missing" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }

    const safe = {
      fullName: sanitize(fullName),
      email: sanitize(email),
      company: sanitize(company),
      building: sanitize(building || "—"),
      city: sanitize(city),
      role: sanitize(role),
      details: sanitize(details || "—"),
    };

    const rows = [
      ["👤 Full Name", safe.fullName],
      ["✉️ Email", safe.email],
      ["🏢 Company", safe.company],
      ["🏗️ Building", safe.building],
      ["📍 City", safe.city],
      ["💼 Role", safe.role],
      ["📝 Details", safe.details],
    ]
      .map(
        ([label, value]) =>
          `<tr>
            <td style="padding: 10px 0; color: #666; font-size: 14px; width: 120px; vertical-align: top;">${label}</td>
            <td style="padding: 10px 0; color: #222; font-size: 14px; font-weight: 500;">${value}</td>
          </tr>`
      )
      .join("");

    if (!resend) {
      return Response.json({ error: "Email service not configured" }, { status: 500 });
    }

    await resend.emails.send({
      from: SEND_FROM,
      to: SEND_TO,
      subject: `Demo Request from ${safe.fullName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto;">
          <div style="background: #1a2e1a; border-radius: 12px 12px 0 0; padding: 32px; text-align: center;">
            <h1 style="color: #c8ff00; margin: 0; font-size: 22px;">New Demo Request</h1>
            <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px;">from ${safe.fullName}</p>
          </div>
          <div style="background: #f9f9f6; border: 1px solid #e5e5e0; border-top: none; border-radius: 0 0 12px 12px; padding: 28px;">
            <table style="width: 100%; border-collapse: collapse;">
              ${rows}
            </table>
            <div style="margin-top: 24px; text-align: center;">
              <a href="mailto:${safe.email}" style="display: inline-block; background: #1a2e1a; color: #fff; padding: 10px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">Reply to ${safe.fullName}</a>
            </div>
          </div>
          <p style="text-align: center; color: #999; font-size: 12px; margin-top: 16px;">ParQlet Demo Requests</p>
        </div>
      `,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Book demo email error:", error);
    return Response.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
