import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isClubRogueBrand } from "@/lib/club-rogue";
import { buildClubRogueReservationNotes } from "@/lib/booking-notes";
import { getOutletLabelForReservation } from "@/lib/brands";
import {
  clubRogueReservationFeePaise,
  clubRogueBookingRequiresPayment,
  getRazorpayClient,
  getRazorpayPublicKeyId,
  isRazorpayConfigured,
} from "@/lib/razorpay";
import { isEventSlotInPast } from "@/lib/event-booking-slots";
import { allocateConfirmationCode } from "@/lib/confirmation-code";

function normalizePhone(raw: string): string {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length > 10 && (digits.startsWith("91") || digits.startsWith("0"))) {
    return digits.replace(/^(91|0)+/, "").slice(0, 10);
  }
  return digits.slice(0, 10);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const brandId = typeof body.brandId === "string" ? body.brandId.trim() : "";
    if (!isClubRogueBrand(brandId)) {
      return NextResponse.json({ error: "Invalid venue" }, { status: 400 });
    }

    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const contactNumber = normalizePhone(body.contactNumber);
    const date = typeof body.date === "string" ? body.date.trim() : "";
    const timeSlot = typeof body.timeSlot === "string" ? body.timeSlot.trim() : "";
    const numberOfMen = String(body.numberOfMen ?? "1");
    const numberOfWomen = String(body.numberOfWomen ?? "0");
    const numberOfCouples = String(body.numberOfCouples ?? "0");
    const coverChargeAcknowledged = body.coverChargeAcknowledged === true;

    if (!fullName || !/^\d{10}$/.test(contactNumber) || !date || !timeSlot) {
      return NextResponse.json({ error: "Please fill all required fields." }, { status: 400 });
    }
    if (isEventSlotInPast(date, timeSlot)) {
      return NextResponse.json({ error: "Please choose a future time slot." }, { status: 400 });
    }
    if (!coverChargeAcknowledged) {
      return NextResponse.json(
        { error: "Please acknowledge the ₹2,000 cover charge." },
        { status: 400 }
      );
    }

    const notesBuild = buildClubRogueReservationNotes({
      brandId,
      notes: body.notes,
      eventId: body.eventId,
      bookingNightGenre: body.bookingNightGenre,
    });
    if (notesBuild.error) {
      return NextResponse.json({ error: notesBuild.error }, { status: 400 });
    }

    const guests = Math.max(1, Math.min(20, parseInt(numberOfMen, 10) || 1));

    const venue = await prisma.venue.findUnique({
      where: { brandId },
      select: { id: true, name: true, shortName: true },
    });
    if (!venue) {
      return NextResponse.json({ error: "Unknown outlet" }, { status: 400 });
    }

    const brandName =
      typeof body.brandName === "string" && body.brandName.trim()
        ? body.brandName.trim()
        : getOutletLabelForReservation(brandId, null, null, venue.name, venue.shortName);

    const bookingDraft = {
      ...body,
      fullName,
      contactNumber,
      date,
      timeSlot,
      numberOfMen,
      numberOfWomen,
      numberOfCouples,
      brandId,
      brandName,
      coverChargeAcknowledged: true,
      selectedDiscounts: [],
      notes:
        typeof body.notes === "string" && body.notes.trim()
          ? body.notes.trim()
          : "Club Rogue online reservation",
    };

    const amountPaise = clubRogueReservationFeePaise(guests);

    // Local / staging test path — skip Razorpay and issue a real ticket
    if (!clubRogueBookingRequiresPayment()) {
      const confirmationCode = await allocateConfirmationCode();
      const reservation = await prisma.reservation.create({
        data: {
          venueId: venue.id,
          brandId,
          brandName,
          fullName,
          contactNumber,
          numberOfMen,
          numberOfWomen,
          numberOfCouples,
          date,
          timeSlot,
          notes: notesBuild.notes,
          selectedDiscounts: null,
          status: "CONFIRMED",
          confirmationCode,
        },
        select: { id: true, confirmationCode: true },
      });

      const fakeOrderId = `test_order_${reservation.id}`;
      await prisma.reservationPayment.create({
        data: {
          brandId,
          razorpayOrderId: fakeOrderId,
          razorpayPaymentId: `test_pay_${reservation.id}`,
          amountPaise,
          status: "PAID",
          bookingDraft,
          reservationId: reservation.id,
        },
      });

      return NextResponse.json({
        skipPayment: true,
        reservationId: reservation.id,
        bookingId: reservation.id,
        confirmationCode: reservation.confirmationCode,
        amountPaise,
        amountInr: amountPaise / 100,
        prefill: { name: fullName, contact: contactNumber },
      });
    }

    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        {
          error:
            "Online payment is not set up yet. Bookings cannot be confirmed until Razorpay is connected.",
          code: "PAYMENT_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    // Save lead before Razorpay so admin can track name/number immediately
    const pendingReservation = await prisma.reservation.create({
      data: {
        venueId: venue.id,
        brandId,
        brandName,
        fullName,
        contactNumber,
        numberOfMen,
        numberOfWomen,
        numberOfCouples,
        date,
        timeSlot,
        notes: notesBuild.notes,
        selectedDiscounts: null,
        status: "PENDING",
      },
      select: { id: true },
    });

    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `cr_${Date.now().toString(36)}`.slice(0, 40),
      notes: {
        brandId,
        phone: contactNumber,
        reservationId: pendingReservation.id,
      },
    });

    await prisma.reservationPayment.create({
      data: {
        brandId,
        razorpayOrderId: order.id,
        amountPaise,
        status: "CREATED",
        bookingDraft,
        reservationId: pendingReservation.id,
      },
    });

    return NextResponse.json({
      skipPayment: false,
      keyId: getRazorpayPublicKeyId(),
      orderId: order.id,
      amountPaise,
      amountInr: amountPaise / 100,
      currency: "INR",
      reservationId: pendingReservation.id,
      prefill: { name: fullName, contact: contactNumber },
    });
  } catch (error) {
    console.error("[razorpay create-order]", error);
    return NextResponse.json({ error: "Could not start payment. Try again." }, { status: 500 });
  }
}
