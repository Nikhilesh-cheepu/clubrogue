import { redirect } from "next/navigation";
import { CLUB_ROGUE_GACHIBOWLI_ID } from "@/lib/club-rogue";

/** Home goes straight to booking — no marketing landing for now. */
export default function Home() {
  redirect(`/${CLUB_ROGUE_GACHIBOWLI_ID}`);
}
