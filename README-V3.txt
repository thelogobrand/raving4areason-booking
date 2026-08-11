RAVING 4 A REASON - FINAL POLISH V3

INSTALL
1. Supabase SQL Editor: run final-polish-v3.sql once.
2. Netlify: replace the site files with this V3 package and redeploy.
3. Netlify environment variables must include SUPABASE_SERVICE_ROLE_KEY (already used by the project) and RESEND_API_KEY for booking emails.
4. Test Admin, Mentor and Parent portals after deploy.

BOOKING EMAIL
The existing send-booking-email Netlify function automatically sends each booking confirmation to the parent email AND unitypromotionsuk@gmail.com.

SECURITY NOTE
This V3 improves password-setting handling by storing password hashes in a server-only secure_settings table and using Netlify Functions. However, the wider legacy app still uses permissive public Supabase RLS policies for several tables/storage buckets. Do not treat the project as fully production-hardened until those policies are replaced with authenticated/role-scoped access.


BOOKING EMAIL UPDATE
- New bookings automatically call the Netlify send-booking-email function.
- Parent confirmation is sent to the email entered on the booking.
- A copy is sent to unitypromotionsuk@gmail.com for testing/admin notification.
- Email includes a VIEW / MANAGE BOOKING button using the booking's unique chat token.
- The linked page shows the booking details and Parent ↔ Mentor chat.
- Existing expense email function is unchanged.
- Automatic Mentor email notification is reserved for a later update.

IMPORTANT: Sending to arbitrary parent email addresses through Resend requires an approved/verified sender domain. The current onboarding@resend.dev sender may be limited by Resend during testing.
