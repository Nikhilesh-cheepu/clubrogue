import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getAdminScopeFromRequest,
  hasPaymentsUnlockFromRequest,
} from "@/lib/admin-auth";
import { CLUB_ROGUE_OUTLETS } from "@/lib/outlets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

export async function GET(req: NextRequest) {
  const scope = await getAdminScopeFromRequest(req);
  if (!scope) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!(await hasPaymentsUnlockFromRequest(req))) {
    return NextResponse.json({ error: "Payments locked", locked: true }, { status: 403 });
  }

  const brandIds = [...scope.brandIds];
  const url = new URL(req.url);
  const outlet = url.searchParams.get("outlet")?.trim() || "all";
  const monthFilter = url.searchParams.get("month")?.trim() || "all"; // YYYY-MM or all

  const filterBrandIds =
    outlet !== "all" && brandIds.includes(outlet) ? [outlet] : brandIds;

  const paidPayments = await prisma.reservationPayment.findMany({
    where: { brandId: { in: filterBrandIds }, status: "PAID" },
    select: {
      amountPaise: true,
      createdAt: true,
      brandId: true,
      reservationId: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenueInr =
    Math.round((paidPayments.reduce((s, p) => s + p.amountPaise, 0) / 100) * 100) / 100;
  const paidCount = paidPayments.length;

  const byMonthMap = new Map<string, { revenueInr: number; paidCount: number }>();
  for (const p of paidPayments) {
    const key = monthKey(p.createdAt);
    const cur = byMonthMap.get(key) || { revenueInr: 0, paidCount: 0 };
    cur.revenueInr += p.amountPaise / 100;
    cur.paidCount += 1;
    byMonthMap.set(key, cur);
  }

  const byMonth = [...byMonthMap.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, v]) => ({
      month: key,
      label: monthLabel(key),
      revenueInr: Math.round(v.revenueInr * 100) / 100,
      paidCount: v.paidCount,
    }));

  let filteredPayments = paidPayments;
  if (monthFilter !== "all" && /^\d{4}-\d{2}$/.test(monthFilter)) {
    filteredPayments = paidPayments.filter((p) => monthKey(p.createdAt) === monthFilter);
  }

  const filteredRevenueInr =
    Math.round((filteredPayments.reduce((s, p) => s + p.amountPaise, 0) / 100) * 100) / 100;

  const byOutletMap = new Map<string, { revenueInr: number; paidCount: number }>();
  for (const p of filteredPayments) {
    const cur = byOutletMap.get(p.brandId) || { revenueInr: 0, paidCount: 0 };
    cur.revenueInr += p.amountPaise / 100;
    cur.paidCount += 1;
    byOutletMap.set(p.brandId, cur);
  }

  const outletName = Object.fromEntries(CLUB_ROGUE_OUTLETS.map((o) => [o.brandId, o.locality]));
  const byOutlet = [...byOutletMap.entries()].map(([brandId, v]) => ({
    brandId,
    label: outletName[brandId] || brandId,
    revenueInr: Math.round(v.revenueInr * 100) / 100,
    paidCount: v.paidCount,
  }));

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayRevenueInr =
    Math.round(
      (paidPayments
        .filter((p) => p.createdAt >= startOfToday)
        .reduce((s, p) => s + p.amountPaise, 0) /
        100) *
        100
    ) / 100;

  return NextResponse.json({
    locked: false,
    totalRevenueInr,
    paidCount,
    todayRevenueInr,
    filteredRevenueInr,
    filteredPaidCount: filteredPayments.length,
    monthFilter,
    outlet,
    byMonth,
    byOutlet,
    refreshedAt: new Date().toISOString(),
  });
}
