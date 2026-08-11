RAVING 4 A REASON — PARENT + MENTOR FINAL LOCK

1. In Supabase SQL Editor run:
   parent-mentor-final-lock.sql

2. Redeploy this package to Netlify.

Final Parent changes:
- Booking form uses Parent/Guardian First Name + Surname.
- Child field is now Child / Member’s Name.
- Mailing-list opt-in reuses those details and upserts by email (no duplicate email rows).
- Each new booking gets a human-friendly reference such as R4AR-260812-A7K4.
- Booking reference appears on confirmation/manage booking and confirmation email.

Final Mentor / booking-chat changes:
- Mentor booked-session cards show the booking reference and a View Booking Chat button.
- Parent ↔ Mentor booking messages stay tied to the booking.
- Admin → Mentor messages sent from Admin Booked Sessions are a booking-specific Admin/Mentor thread, not the general Admin chat.
- Admin → Parent messages sent from a booking remain tied to that booking.
- General Admin ↔ Mentor chat remains separate.

Existing bookings are not rewritten; booking references are generated for NEW bookings from this release onward.
