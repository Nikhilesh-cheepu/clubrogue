# Online booking system (preserved)

The full paid-booking flow is still in this repo. Public pages hide it until you flip the flag.

## What was built

- Guest booking on outlet pages (`ClubRogueOutletPage`)
- Razorpay confirmation fee + webhook/verify
- PENDING → CONFIRMED reservations, confirmation codes, downloadable QR tickets
- Admin: `/admin` (passcode `1010`) — Scan, Bookings, Payments vault (`7013884485`)

## Re-enable for public

1. Vercel / `.env`:
   ```
   NEXT_PUBLIC_CLUB_ROGUE_BOOKING_ENABLED=true
   ```
2. Ensure Razorpay + `DATABASE_URL` are set
3. Redeploy

Home and `/{outlet}` will show the booking UI again.

## Keep hidden (current)

Leave `NEXT_PUBLIC_CLUB_ROGUE_BOOKING_ENABLED` unset or `false`.  
Site shows venues + Maps + Instagram + phone + walk-in message only.  
Admin routes still work at `/admin` if you need them internally.
