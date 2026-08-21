import { NextRequest, NextResponse } from "next/server";
import { getClubRogueCustomerFeeBreakdown } from "@/lib/club-rogue-fees";
import { clubRogueBookingRequiresPayment, isRazorpayConfigured } from "@/lib/razorpay";

export async function GET(req: NextRequest) {
  const rawGuests = req.nextUrl.searchParams.get("guests");
  const guests = rawGuests ? parseInt(rawGuests, 10) : 1;
  const allowWithoutPayment = !clubRogueBookingRequiresPayment();
  return NextResponse.json({
    configured: isRazorpayConfigured() || allowWithoutPayment,
    allowWithoutPayment,
    ...getClubRogueCustomerFeeBreakdown(Number.isFinite(guests) ? guests : 1),
  });
}
