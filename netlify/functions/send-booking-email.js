export async function handler(event) {
  try {
    const { booking } = JSON.parse(event.body || "{}");
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is missing");
    const recipients = [booking.parent_email, "unitypromotionsuk@gmail.com", booking.mentor_email].filter(Boolean);
    const uniqueRecipients = [...new Set(recipients.map(v => String(v).trim().toLowerCase()))];
    const manageButton = booking.manage_url ? `<p style="margin:24px 0"><a href="${booking.manage_url}" style="background:#b00000;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:bold">Manage Booking / Messages</a></p>` : "";
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.BOOKING_FROM_EMAIL || "Raving 4 A Reason <onboarding@resend.dev>",
        to: uniqueRecipients,
        subject: "Raving 4 A Reason Booking Confirmation",
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h2>Booking Confirmed</h2>${booking.booking_reference ? `<p><strong>Booking reference:</strong> ${booking.booking_reference}</p>` : ""}<p><strong>Child:</strong> ${booking.child}</p><p><strong>Parent:</strong> ${booking.parent}</p><p><strong>Mentor:</strong> ${booking.mentor}</p><p><strong>Session:</strong> ${booking.type}</p><p><strong>Date:</strong> ${booking.date}</p><p><strong>Time:</strong> ${booking.time}</p><p><strong>Location:</strong> ${booking.location}</p>${manageButton}<p>Please keep this email so you can access the booking-specific message page.</p><p style="margin-top:28px"><a href="https://www.gofundme.com/f/buy-more-equipment-for-young-peoples-workshops-worksh?attribution_id=sl:e5544b21-38bf-4f5d-9b45-75d32cf8ef34&lang=en_GB&utm_campaign=fp_sharesheet&utm_medium=customer&utm_source=qr_code" style="color:#b00000;font-weight:bold">❤️ Make a Donation</a></p></div>`
      })
    });
    const data = await response.json();
    if (!response.ok) return { statusCode: response.status, body: JSON.stringify({ success:false, data }) };
    return { statusCode: 200, body: JSON.stringify({ success:true, data }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ success:false, error:err.message }) };
  }
}
