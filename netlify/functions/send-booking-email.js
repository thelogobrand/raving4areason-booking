export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
    const { booking } = JSON.parse(event.body || "{}");
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: "RESEND_API_KEY missing" }) };

    const safe = v => String(v || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const manageButton = booking.chat_url ? `<p style="margin:24px 0"><a href="${safe(booking.chat_url)}" style="display:inline-block;background:#111;color:#fff;border:2px solid #d4af37;padding:12px 18px;border-radius:10px;text-decoration:none;font-weight:bold">VIEW / MANAGE BOOKING</a></p><p style="font-size:12px;color:#666">From this page you can view the booking and message the mentor. Booking chat messages are retained for 14 days.</p>` : "";
    const html = `<div style="font-family:Arial,sans-serif"><h2>Booking Confirmation 🎧</h2>${booking.booking_ref ? `<p><strong>Booking Ref:</strong> ${safe(booking.booking_ref)}</p>` : ""}<p><strong>Child:</strong> ${safe(booking.child)}</p><p><strong>Parent:</strong> ${safe(booking.parent)}</p><p><strong>Session:</strong> ${safe(booking.type)}</p><p><strong>Mentor:</strong> ${safe(booking.mentor)}</p><p><strong>Date:</strong> ${safe(booking.date)} at ${safe(booking.time)}</p><p><strong>Location:</strong> ${safe(booking.location)}</p>${manageButton}</div>`;
    const response = await fetch("https://api.resend.com/emails", {
      method:"POST", headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"},
      body:JSON.stringify({from:"Raving 4 A Reason <onboarding@resend.dev>",to:[booking.parent_email,"unitypromotionsuk@gmail.com"],subject:`R4AR Booking Confirmation${booking.booking_ref ? ` — ${safe(booking.booking_ref)}` : ""} — ${safe(booking.date)} ${safe(booking.time)}`,html})
    });
    const data = await response.json();
    return { statusCode: response.ok ? 200 : response.status, body: JSON.stringify(data) };
  } catch (error) {
    console.error("send-booking-email error", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message || "Booking email failed" }) };
  }
}
