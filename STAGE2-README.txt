RAVING 4 A REASON – STAGE 2 COMPLETE

1. BACK UP your current GitHub project.
2. In Supabase SQL Editor, run stage2-complete.sql once.
3. Replace/upload all files from this folder to the GitHub repository.
4. Netlify will redeploy automatically.
5. Keep RESEND_API_KEY in Netlify. After verifying a sending domain, add BOOKING_FROM_EMAIL with a value such as:
   Raving 4 A Reason <bookings@yourdomain.co.uk>

DEFAULT SHARED PARENT LOGIN
Username: parent
Password: R4AR
Change PARENT_USERNAME and PARENT_PASSWORD near the top of app.js if required.

TEST ORDER
- Parent shared login
- Book a session
- Confirmation email/manage link
- Parent sends message to mentor/admin/both
- Mentor and admin reply
- Upload a PDF newsletter
- Confirm only latest 3 remain
- Admin-assisted booking

IMPORTANT
This release follows the existing app's simple shared-password approach. It is suitable for controlled testing, but true user accounts and tighter Supabase RLS are recommended before storing highly sensitive information.
