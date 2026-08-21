import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fulfillRazorpayReservationPayment } from "@/lib/razorpay-fulfillment";
import { getRazorpayClient, isRazorpayConfigured } from "@/lib/razorpay";

export const runtime = "nodejs";

/**
 * Reconcile an order after UPI/QR pay when Checkout.js handler may not fire.
 * Looks up Razorpay for a captured payment, then fulfills reservation.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isRazorpayConfigured()) {
      return NextResponse.json({ error: "Payment not configured." }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId." }, { status: 400 });
    }

    const record = await prisma.reservationPayment.findUnique({
      where: { razorpayOrderId: orderId },
    });
    if (!record) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (record.status === "PAID" && record.reservationId) {
      const linked = await prisma.reservation.findUnique({
        where: { id: record.reservationId },
        select: { id: true, status: true, confirmationCode: true },
      });
      if (linked?.status === "CONFIRMED") {
        return NextResponse.json({
          success: true,
          status: "confirmed",
          reservationId: linked.id,
          bookingId: linked.id,
          confirmationCode: linked.confirmationCode,
          alreadyFulfilled: true,
        });
      }
    }

    const razorpay = getRazorpayClient();
    const payments = await razorpay.orders.fetchPayments(orderId);
    const items = (payments as { items?: { id?: string; status?: string }[] }).items ?? [];
    const captured = items.find(
      (p) => p.id && (p.status === "captured" || p.status === "authorized")
    );

    if (!captured?.id) {
      return NextResponse.json({
        success: false,
        status: "pending",
        message: "Payment not captured yet.",
      });
    }

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || req.nextUrl.origin;

    const result = await fulfillRazorpayReservationPayment({
      orderId,
      paymentId: captured.id,
      origin,
      cookie: req.headers.get("cookie") || "",
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error, status: "failed" }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      status: "confirmed",
      reservationId: result.reservationId,
      bookingId: result.reservationId,
      confirmationCode: result.confirmationCode,
      alreadyFulfilled: result.alreadyFulfilled ?? false,
    });
  } catch (error) {
    console.error("[razorpay confirm-order]", error);
    return NextResponse.json({ error: "Could not confirm payment." }, { status: 500 });
  }
}
