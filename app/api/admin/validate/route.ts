import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminScopeFromRequest } from "@/lib/admin-auth";
import { parseTicketQrPayload } from "@/lib/confirmation-code";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function guestCount(r: {
  numberOfMen: string;
  numberOfWomen: string;
  numberOfCouples: string;
}): number {
  return (
    (parseInt(r.numberOfMen, 10) || 0) +
    (parseInt(r.numberOfWomen, 10) || 0) +
    (parseInt(r.numberOfCouples, 10) || 0) * 2
  );
}

async function findReservation(params: {
  confirmationCode: string | null;
  reservationId: string | null;
  brandIds: readonly string[];
}) {
  if (params.reservationId) {
    const byId = await prisma.reservation.findFirst({
      where: { id: params.reservationId, brandId: { in: [...params.brandIds] } },
    });
    if (byId) return byId;
  }
  if (params.confirmationCode) {
    return prisma.reservation.findFirst({
      where: {
        confirmationCode: params.confirmationCode,
        brandId: { in: [...params.brandIds] },
      },
    });
  }
  return null;
}

/** Door scan — BookMyShow style: payment status + one-time check-in. */
export async function POST(req: NextRequest) {
  const scope = await getAdminScopeFromRequest(req);
  if (!scope) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const raw =
    typeof body.raw === "string"
      ? body.raw
      : typeof body.code === "string"
        ? body.code
        : "";
  const checkIn = body.checkIn === true;

  const parsed = parseTicketQrPayload(raw);
  if (!parsed.confirmationCode && !parsed.reservationId) {
    return NextResponse.json(
      { error: "No code found. Scan again or type CR-XXXXXX." },
      { status: 400 }
    );
  }

  const reservation = await findReservation({
    confirmationCode: parsed.confirmationCode,
    reservationId: parsed.reservationId,
    brandIds: scope.brandIds,
  });

  if (!reservation) {
    return NextResponse.json({
      valid: false,
      paymentDone: false,
      canCheckIn: false,
      alreadyUsed: false,
      reason: "Booking not found",
      state: "NOT_FOUND",
    });
  }

  // QR is linked to the checkout mobile — flag mismatch if QR carries a different number
  const qrMobileMismatch =
    Boolean(parsed.contactNumber) &&
    parsed.contactNumber !== reservation.contactNumber;

  const payment = await prisma.reservationPayment.findFirst({
    where: { reservationId: reservation.id },
    orderBy: { createdAt: "desc" },
    select: {
      status: true,
      amountPaise: true,
      razorpayPaymentId: true,
      razorpayOrderId: true,
    },
  });

  const paid = payment?.status === "PAID";
  const confirmed = reservation.status === "CONFIRMED";
  let checkedInAt = reservation.checkedInAt;
  const alreadyUsed = Boolean(checkedInAt);

  if (
    checkIn &&
    paid &&
    confirmed &&
    !checkedInAt &&
    !qrMobileMismatch
  ) {
    const updated = await prisma.reservation.update({
      where: { id: reservation.id },
      data: { checkedInAt: new Date() },
      select: { checkedInAt: true },
    });
    checkedInAt = updated.checkedInAt;
  }

  const usedNow = Boolean(checkedInAt);
  const canCheckIn = paid && confirmed && !usedNow && !qrMobileMismatch;
  const valid = paid && confirmed && !qrMobileMismatch;

  let state:
    | "READY"
    | "CHECKED_IN"
    | "PAYMENT_PENDING"
    | "NOT_CONFIRMED"
    | "MOBILE_MISMATCH"
    | "NOT_FOUND" = "READY";
  let reason = "OK";

  if (qrMobileMismatch) {
    state = "MOBILE_MISMATCH";
    reason = "QR mobile does not match booking mobile";
  } else if (!confirmed) {
    state = "NOT_CONFIRMED";
    reason = `Booking status: ${reservation.status}`;
  } else if (!paid) {
    state = "PAYMENT_PENDING";
    reason = "Payment not completed";
  } else if (usedNow) {
    state = "CHECKED_IN";
    reason = checkIn ? "Checked in" : "Already used — do not admit again";
  } else {
    state = "READY";
    reason = "Payment done — ready to check in";
  }

  return NextResponse.json({
    valid,
    paymentDone: paid,
    canCheckIn,
    alreadyUsed: usedNow,
    reason,
    state,
    booking: {
      bookingId: reservation.id,
      confirmationCode: reservation.confirmationCode,
      fullName: reservation.fullName,
      contactNumber: reservation.contactNumber,
      brandName: reservation.brandName,
      brandId: reservation.brandId,
      date: reservation.date,
      timeSlot: reservation.timeSlot,
      guests: guestCount(reservation),
      notes: reservation.notes,
      status: reservation.status,
      checkedInAt: checkedInAt?.toISOString() ?? null,
    },
    payment: {
      status: payment?.status ?? "MISSING",
      amountInr: payment ? payment.amountPaise / 100 : null,
      razorpayPaymentId: payment?.razorpayPaymentId ?? null,
      razorpayOrderId: payment?.razorpayOrderId ?? null,
    },
  });
}
