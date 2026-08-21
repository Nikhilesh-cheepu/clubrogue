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

function ymdLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

  const [totalBookings, paidPayments, listReservations, chartPayments] =
    await Promise.all([
      prisma.reservation.count({ where: whereBrand }),
      prisma.reservationPayment.findMany({
        where: { brandId: { in: filterBrandIds }, status: "PAID" },
        select: { amountPaise: true, createdAt: true, updatedAt: true },
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
      prisma.reservationPayment.findMany({
        where: {
          brandId: { in: filterBrandIds },
          status: "PAID",
          createdAt: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          },
        },
        select: { amountPaise: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  const totalRevenueInr = paidPayments.reduce((sum, p) => sum + p.amountPaise, 0) / 100;
  const paidBookings = paidPayments.length;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayRevenueInr =
    paidPayments
      .filter((p) => p.createdAt >= startOfToday || p.updatedAt >= startOfToday)
      .reduce((sum, p) => sum + p.amountPaise, 0) / 100;

  const todayBookings = await prisma.reservation.count({
    where: {
      ...whereBrand,
      createdAt: { gte: startOfToday },
    },
  });

  // Last 14 days revenue series (fill zeros)
  const dayKeys: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    dayKeys.push(ymdLocal(d));
  }
  const byDay = new Map(dayKeys.map((k) => [k, 0]));
  const bookingsByDay = new Map(dayKeys.map((k) => [k, 0]));
  for (const p of chartPayments) {
    const key = ymdLocal(p.createdAt);
    if (byDay.has(key)) {
      byDay.set(key, (byDay.get(key) || 0) + p.amountPaise / 100);
      bookingsByDay.set(key, (bookingsByDay.get(key) || 0) + 1);
    }
  }
  const revenueByDay = dayKeys.map((date) => ({
    date,
    label: new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    }),
    revenueInr: Math.round((byDay.get(date) || 0) * 100) / 100,
    paidCount: bookingsByDay.get(date) || 0,
  }));

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
      paidBookingsAllTime: paidBookings,
      totalRevenueInr: Math.round(totalRevenueInr * 100) / 100,
      todayBookings,
      todayRevenueInr: Math.round(todayRevenueInr * 100) / 100,
    },
    revenueByDay,
    refreshedAt: new Date().toISOString(),
  });
}
