export async function handler(event) {
try {
const { booking } = JSON.parse(event.body);

const RESEND_API_KEY = process.env.RESEND_API_KEY;

const message = `
New Booking

Child: ${booking.child}
Parent: ${booking.parent}
Phone: ${booking.phone}

Session:
${booking.type}
${booking.date} at ${booking.time}
${booking.location}
`;

const response = await fetch("https://api.resend.com/emails", {
method: "POST",
headers: {
Authorization: `Bearer ${RESEND_API_KEY}`,
"Content-Type": "application/json"
},
body: JSON.stringify({
from: "Raving 4 A Reason <onboarding@resend.dev>",
to: [
booking.parent_email,
"unitypromotionsuk@gmail.com"
],
subject: "Booking Confirmation 🎧",
html: `<pre>${message}</pre>`
})
});

const data = await response.json();

console.log("Email response:", data);

return {
statusCode: 200,
body: JSON.stringify({ success: true, data })
};

} catch (err) {
console.error("Email error:", err);

return {
statusCode: 500,
body: JSON.stringify({ error: err.message })
};
}
}