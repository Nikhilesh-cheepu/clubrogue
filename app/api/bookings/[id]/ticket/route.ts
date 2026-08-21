import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Public ticket lookup after payment (cuid is unguessable). */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "Missing booking id" }, { status: 400 });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    select: {
      id: true,
      confirmationCode: true,
      contactNumber: true,
      status: true,
      brandName: true,
      fullName: true,
    },
  });

  if (!reservation || reservation.status !== "CONFIRMED" || !reservation.confirmationCode) {
    return NextResponse.json({ error: "Ticket not ready" }, { status: 404 });
  }

  return NextResponse.json({
    bookingId: reservation.id,
    confirmationCode: reservation.confirmationCode,
    contactNumber: reservation.contactNumber,
    venueName: reservation.brandName,
    guestName: reservation.fullName,
  });
}
