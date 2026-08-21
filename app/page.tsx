import ClubRogueWalkInLanding from "@/components/club-rogue/ClubRogueWalkInLanding";
import { isOnlineBookingEnabled } from "@/lib/feature-flags";
import { redirect } from "next/navigation";
import { CLUB_ROGUE_GACHIBOWLI_ID } from "@/lib/club-rogue";

export default function Home() {
  if (isOnlineBookingEnabled()) {
    // Full booking flow preserved — enable via NEXT_PUBLIC_CLUB_ROGUE_BOOKING_ENABLED=true
    redirect(`/${CLUB_ROGUE_GACHIBOWLI_ID}`);
  }

  // Walk-in only (client request). Booking UI kept in repo — see docs/ONLINE_BOOKING_PRESERVED.md
  return <ClubRogueWalkInLanding />;
}
