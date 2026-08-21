import { prisma } from "@/lib/db";

export type RazorpayFulfillResult =
  | {
      ok: true;
      reservationId: string | null;
      confirmationCode: string | null;
      alreadyFulfilled?: boolean;
    }
  | { ok: false; error: string; status: number };

async function ticketFields(reservationId: string | null) {
  if (!reservationId) return { confirmationCode: null as string | null };
  const row = await prisma.reservation.findUnique({
    where: { id: reservationId },
    select: { confirmationCode: true, status: true },
  });
  return {
    confirmationCode: row?.confirmationCode ?? null,
    status: row?.status ?? null,
  };
}

/** Mark order paid and confirm reservation — shared by client verify + webhook. */
export async function fulfillRazorpayReservationPayment(params: {
  orderId: string;
  paymentId: string;
  origin: string;
  cookie?: string;
}): Promise<RazorpayFulfillResult> {
  const { orderId, paymentId, cookie } = params;
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    params.origin.replace(/\/$/, "");

  const payment = await prisma.reservationPayment.findUnique({
    where: { razorpayOrderId: orderId },
  });
  if (!payment) {
    return { ok: false, error: "Payment record not found.", status: 404 };
  }

  // Fully done only when paid AND linked reservation is CONFIRMED
  if (payment.status === "PAID" && payment.reservationId) {
    const linked = await ticketFields(payment.reservationId);
    if (linked.status === "CONFIRMED") {
      return {
        ok: true,
        reservationId: payment.reservationId,
        confirmationCode: linked.confirmationCode,
        alreadyFulfilled: true,
      };
    }
  }

  if (payment.status !== "PAID") {
    await prisma.reservationPayment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        razorpayPaymentId: paymentId,
      },
    });
  } else if (paymentId && !payment.razorpayPaymentId) {
    await prisma.reservationPayment.update({
      where: { id: payment.id },
      data: { razorpayPaymentId: paymentId },
    });
  }

  const bookingDraft = payment.bookingDraft as Record<string, unknown>;
  const reservationRes = await fetch(`${origin}/api/reservations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: cookie || "",
    },
    body: JSON.stringify({
      ...bookingDraft,
      clubRoguePaymentOrderId: orderId,
    }),
  });
  const reservationData = await reservationRes.json().catch(() => ({}));
  if (!reservationRes.ok) {
    return {
      ok: false,
      error:
        (typeof reservationData.error === "string" && reservationData.error) ||
        "Booking failed after payment. Contact support.",
      status: 502,
    };
  }

  const reservationId =
    typeof reservationData.reservationId === "string"
      ? reservationData.reservationId
      : payment.reservationId;

  const confirmationCode =
    typeof reservationData.confirmationCode === "string"
      ? reservationData.confirmationCode
      : (await ticketFields(reservationId)).confirmationCode;

  if (reservationId && reservationId !== payment.reservationId) {
    await prisma.reservationPayment.update({
      where: { id: payment.id },
      data: { reservationId },
    });
  }

  return { ok: true, reservationId, confirmationCode };
}
