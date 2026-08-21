/**
 * Online table booking + Razorpay + QR check-in is fully built and preserved.
 * Public site is walk-in only until this flag is turned on.
 *
 * Re-enable: set NEXT_PUBLIC_CLUB_ROGUE_BOOKING_ENABLED=true (and Razorpay env).
 * See docs/ONLINE_BOOKING_PRESERVED.md
 */
export function isOnlineBookingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CLUB_ROGUE_BOOKING_ENABLED?.trim() === "true";
}
