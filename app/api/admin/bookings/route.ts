import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminScopeFromRequest } from "@/lib/admin-auth";

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

function trackStage(params: {
  status: string;
  paymentStatus: string | null;
}): string {
  if (params.status === "CANCELLED") return "Cancelled";
  if (params.status === "COMPLETED") return "Completed";
  if (params.status === "CONFIRMED" || params.paymentStatus === "PAID") {
    return "Paid & confirmed";
  }
  if (params.paymentStatus === "CREATED") return "At payment";
  if (params.status === "PENDING") return "Details saved";
  return params.status;
}

export async function GET(req: NextRequest) {
  const scope = await getAdminScopeFromRequest(req);
  if (!scope) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const brandIds = [...scope.brandIds];
  const url = new URL(req.url);
  const outlet = url.searchParams.get("outlet")?.trim() || "all";
  const filterBrandIds =
    outlet !== "all" && brandIds.includes(outlet) ? [outlet] : brandIds;

  const whereBrand = { brandId: { in: filterBrandIds } };
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalBookings, todayBookings, listReservations] = await Promise.all([
    prisma.reservation.count({ where: whereBrand }),
    prisma.reservation.count({
      where: { ...whereBrand, createdAt: { gte: startOfToday } },
    }),
    prisma.reservation.findMany({
      where: whereBrand,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        brandId: true,
        brandName: true,
        fullName: true,
        contactNumber: true,
        numberOfMen: true,
        numberOfWomen: true,
        numberOfCouples: true,
        date: true,
        timeSlot: true,
        notes: true,
        confirmationCode: true,
        checkedInAt: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  const reservationIds = listReservations.map((r) => r.id);
  const listPayments =
    reservationIds.length > 0
      ? await prisma.reservationPayment.findMany({
          where: { reservationId: { in: reservationIds } },
          select: {
            reservationId: true,
            status: true,
            amountPaise: true,
            razorpayOrderId: true,
            razorpayPaymentId: true,
            updatedAt: true,
          },
        })
      : [];

  const paymentByReservation = new Map(
    listPayments
      .filter((p): p is typeof p & { reservationId: string } => Boolean(p.reservationId))
      .map((p) => [p.reservationId, p])
  );

  const bookings = listReservations.map((r) => {
    const payment = paymentByReservation.get(r.id) ?? null;
    const paymentStatus = payment?.status ?? null;
    return {
      id: r.id,
      brandId: r.brandId,
      brandName: r.brandName,
      fullName: r.fullName,
      contactNumber: r.contactNumber,
      guests: guestCount(r),
      date: r.date,
      timeSlot: r.timeSlot,
      notes: r.notes,
      confirmationCode: r.confirmationCode,
      checkedInAt: r.checkedInAt?.toISOString() ?? null,
      status: r.status,
      paymentStatus,
      paymentAmountInr: payment ? payment.amountPaise / 100 : null,
      razorpayOrderId: payment?.razorpayOrderId ?? null,
      stage: trackStage({ status: r.status, paymentStatus }),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  });

  const awaitingPayment = bookings.filter(
    (b) => b.stage === "At payment" || b.stage === "Details saved"
  ).length;
  const paidInList = bookings.filter((b) => b.stage === "Paid & confirmed").length;

  return NextResponse.json({
    bookings,
    counts: {
      total: bookings.length,
      awaitingPayment,
      paid: paidInList,
      totalBookingsAllTime: totalBookings,
      todayBookings,
    },
    refreshedAt: new Date().toISOString(),
  });
}
