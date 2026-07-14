import { NextRequest, NextResponse } from "next/server";
import { fulfillRazorpayReservationPayment } from "@/lib/razorpay-fulfillment";
import { getRazorpayClient, verifyRazorpayWebhookSignature } from "@/lib/razorpay";

export const runtime = "nodejs";

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
      };
    };
    order?: {
      entity?: {
        id?: string;
      };
    };
  };
};

function extractPaymentIds(body: RazorpayWebhookPayload): {
  orderId: string;
  paymentId: string;
} {
  const paymentEntity = body.payload?.payment?.entity;
  const orderEntity = body.payload?.order?.entity;
  const paymentId = paymentEntity?.id?.trim() || "";
  const orderId =
    paymentEntity?.order_id?.trim() || orderEntity?.id?.trim() || "";
  return { orderId, paymentId };
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature")?.trim() || "";

    if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
      console.error("[razorpay webhook] signature mismatch");
      return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
    }

    const body = JSON.parse(rawBody) as RazorpayWebhookPayload;
    const event = body.event || "";

    if (event !== "payment.captured" && event !== "order.paid") {
      return NextResponse.json({ received: true, skipped: event || "unknown" });
    }

    let { orderId, paymentId } = extractPaymentIds(body);

    // order.paid sometimes arrives without payment entity — look up captured payment.
    if (orderId && !paymentId) {
      try {
        const payments = await getRazorpayClient().orders.fetchPayments(orderId);
        const items = (payments as { items?: { id?: string; status?: string }[] }).items ?? [];
        const captured = items.find(
          (p) => p.id && (p.status === "captured" || p.status === "authorized")
        );
        paymentId = captured?.id?.trim() || "";
      } catch (e) {
        console.error("[razorpay webhook] fetchPayments failed", orderId, e);
      }
    }

    if (!orderId || !paymentId) {
      console.error("[razorpay webhook] missing ids", { event, orderId, paymentId });
      return NextResponse.json({ error: "Missing payment data." }, { status: 400 });
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || req.nextUrl.origin;
    const result = await fulfillRazorpayReservationPayment({
      orderId,
      paymentId,
      origin,
    });

    if (!result.ok) {
      console.error("[razorpay webhook] fulfill failed", orderId, result.error);
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    console.log("[razorpay webhook] ok", event, orderId, result.reservationId);
    return NextResponse.json({
      received: true,
      event,
      reservationId: result.reservationId,
      alreadyFulfilled: result.alreadyFulfilled ?? false,
    });
  } catch (error) {
    console.error("[razorpay webhook]", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}

/** Health check for Razorpay dashboard URL validation. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/payments/razorpay/webhook",
    events: ["payment.captured", "order.paid"],
  });
}
