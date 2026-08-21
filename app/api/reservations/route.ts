import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOutletLabelForReservation } from "@/lib/brands";
import {
  CLUB_ROGUE_RESERVATION_FEE_INR,
  clubRogueNightGenreLabel,
  isClubRogueBrand,
} from "@/lib/club-rogue";
import { buildClubRogueReservationNotes } from "@/lib/booking-notes";
import {
  allocateConfirmationCode,
  clubRogueWhatsAppEnabled,
} from "@/lib/confirmation-code";
import { localYmdTimeMs } from "@/lib/local-date";
import { clubRogueBookingRequiresPayment } from "@/lib/razorpay";

export const runtime = "nodejs";

function normalizeIndianMobile10(raw: string): string {
  const digitsOnly = String(raw || "").replace(/\D/g, "");
  const normalized =
    digitsOnly.length > 10 && (digitsOnly.startsWith("91") || digitsOnly.startsWith("0"))
      ? digitsOnly.replace(/^(91|0)+/, "").slice(0, 10)
      : digitsOnly.slice(0, 10);
  return normalized;
}

async function sendInteraktTemplateMessage(params: {
  apiKey: string;
  phoneNumber10: string;
  callbackData: string;
  templateName: string;
  languageCode: string;
  bodyValues: string[];
  logLabel: string;
}): Promise<{ ok: true } | { ok: false; status: number; text: string }> {
  const payload = {
    countryCode: "+91",
    phoneNumber: params.phoneNumber10,
    type: "Template",
    callbackData: params.callbackData,
    template: {
      name: params.templateName,
      languageCode: params.languageCode,
      bodyValues: params.bodyValues,
    },
  };

  const resp = await fetch("https://api.interakt.ai/v1/public/message/", {
    method: "POST",
    headers: {
      Authorization: `Basic ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    console.error(
      `[INTERAKT ${params.logLabel}] Non-2xx response:`,
      resp.status,
      text.slice(0, 500)
    );
    return { ok: false, status: resp.status, text };
  }

  await resp.json().catch(() => null);
  return { ok: true };
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    let {
      fullName,
      contactNumber,
      numberOfMen,
      numberOfWomen,
      numberOfCouples,
      date,
      time,
      timeSlot,
      notes,
      selectedDiscounts,
      eventId,
      brandId,
      brandName,
      coverChargeAcknowledged,
      bookingNightGenre,
    } = body;

    contactNumber = normalizeIndianMobile10(String(contactNumber || ""));
    const valid10Digit = /^\d{10}$/.test(contactNumber);
    const normalizedFullName = String(fullName || "").trim();

    if (
      !normalizedFullName ||
      !contactNumber ||
      numberOfMen === undefined ||
      numberOfWomen === undefined ||
      numberOfCouples === undefined ||
      !date ||
      (!time && !timeSlot) ||
      !brandId
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!valid10Digit) {
      return NextResponse.json(
        { error: "Please provide a valid 10-digit contact number." },
        { status: 400 }
      );
    }

    const timeToValidate = String(timeSlot || time || "").trim();
    const slotMs = localYmdTimeMs(String(date), timeToValidate);
    if (!timeToValidate || Number.isNaN(slotMs) || slotMs < Date.now()) {
      return NextResponse.json(
        { error: "Please choose a date and time in the future." },
        { status: 400 }
      );
    }

    const clubRoguePaymentOrderId =
      typeof body.clubRoguePaymentOrderId === "string"
        ? body.clubRoguePaymentOrderId.trim()
        : "";

    let paidPayment: {
      id: string;
      reservationId: string | null;
      brandId: string;
      status: string;
    } | null = null;

    if (isClubRogueBrand(String(brandId))) {
      if (clubRogueBookingRequiresPayment()) {
        if (!clubRoguePaymentOrderId) {
          return NextResponse.json(
            {
              error: `Please pay the ₹${CLUB_ROGUE_RESERVATION_FEE_INR} confirmation fee to complete your Club Rogue booking.`,
              code: "PAYMENT_REQUIRED",
            },
            { status: 402 }
          );
        }
        paidPayment = await prisma.reservationPayment.findUnique({
          where: { razorpayOrderId: clubRoguePaymentOrderId },
          select: { id: true, reservationId: true, brandId: true, status: true },
        });
        if (!paidPayment || paidPayment.status !== "PAID" || paidPayment.brandId !== brandId) {
          return NextResponse.json(
            {
              error: "Payment not verified. Please complete payment and try again.",
              code: "PAYMENT_REQUIRED",
            },
            { status: 402 }
          );
        }
        if (paidPayment.reservationId) {
          const linked = await prisma.reservation.findUnique({
            where: { id: paidPayment.reservationId },
            select: { id: true, status: true, confirmationCode: true },
          });
          if (linked?.status === "CONFIRMED") {
            return NextResponse.json({
              success: true,
              message: "Reservation already confirmed",
              reservationId: linked.id,
              confirmationCode: linked.confirmationCode,
              bookingId: linked.id,
            });
          }
        }
      }
    }

    const timeToFormat = timeSlot || time;

    const venue = await prisma.venue.findUnique({
      where: { brandId },
      select: { id: true, name: true, shortName: true },
    });

    if (!venue) {
      return NextResponse.json({ error: "Unknown outlet" }, { status: 400 });
    }

    if (isClubRogueBrand(brandId)) {
      if (coverChargeAcknowledged !== true) {
        return NextResponse.json(
          {
            error:
              "Please acknowledge the ₹2,000 mandatory cover charge (fully redeemable at the venue) to continue.",
          },
          { status: 400 }
        );
      }
    }

    const notesBuild = buildClubRogueReservationNotes({
      brandId,
      notes,
      eventId,
      bookingNightGenre,
    });
    if (notesBuild.error) {
      return NextResponse.json({ error: notesBuild.error }, { status: 400 });
    }
    const nightGenre = notesBuild.nightGenre;
    const notesNormalized = notesBuild.notes;

    const outletDisplayName = getOutletLabelForReservation(
      brandId,
      null,
      brandName,
      venue.name,
      venue.shortName
    );
    const outletNameForTemplate = outletDisplayName;
    const brandLabelForBooking = outletDisplayName;

    const timeSlotNormalized = String(timeToFormat);
    const menNormalized = String(numberOfMen);
    const womenNormalized = String(numberOfWomen);
    const couplesNormalized = String(numberOfCouples);
    const eventIdNormalized =
      typeof eventId === "string" && eventId.trim() ? eventId.trim() : null;
    const isEventBooking = Boolean(eventIdNormalized);

    const selectedDiscountsNormalized =
      Array.isArray(selectedDiscounts) && selectedDiscounts.length > 0
        ? JSON.stringify(
            [...selectedDiscounts]
              .map((x) => (typeof x === "string" ? x : ""))
              .filter(Boolean)
              .sort()
          )
        : null;

    // Prefer confirming the PENDING row created at create-order time
    let reservationId: string | null = null;
    let shouldTriggerInterakt = true;

    if (paidPayment?.reservationId) {
      const pending = await prisma.reservation.findUnique({
        where: { id: paidPayment.reservationId },
        select: { id: true, status: true },
      });
      if (pending) {
        if (pending.status === "CONFIRMED") {
          const existing = await prisma.reservation.findUnique({
            where: { id: pending.id },
            select: { id: true, confirmationCode: true },
          });
          return NextResponse.json({
            success: true,
            message: "Reservation already confirmed",
            reservationId: pending.id,
            confirmationCode: existing?.confirmationCode ?? null,
            bookingId: pending.id,
          });
        }
        const confirmationCode = await allocateConfirmationCode();
        await prisma.reservation.update({
          where: { id: pending.id },
          data: {
            fullName: normalizedFullName,
            contactNumber,
            numberOfMen: menNormalized,
            numberOfWomen: womenNormalized,
            numberOfCouples: couplesNormalized,
            date,
            timeSlot: timeSlotNormalized,
            notes: notesNormalized,
            selectedDiscounts: selectedDiscountsNormalized,
            brandName: brandLabelForBooking,
            status: "CONFIRMED",
            confirmationCode,
          },
        });
        reservationId = pending.id;
      }
    }

    if (!reservationId) {
      const recently = new Date(Date.now() - 30 * 1000);
      const existingReservation = await prisma.reservation.findFirst({
        where: {
          brandId,
          date,
          timeSlot: timeSlotNormalized,
          contactNumber,
          fullName: normalizedFullName,
          numberOfMen: menNormalized,
          numberOfWomen: womenNormalized,
          numberOfCouples: couplesNormalized,
          notes: notesNormalized,
          selectedDiscounts: selectedDiscountsNormalized,
          status: "CONFIRMED",
          createdAt: { gte: recently },
        },
        orderBy: { createdAt: "desc" },
        select: { id: true, createdAt: true, confirmationCode: true },
      });

      if (existingReservation) {
        reservationId = existingReservation.id;
        shouldTriggerInterakt = false;
      } else {
        const confirmationCode = await allocateConfirmationCode();
        const createdReservation = await prisma.reservation.create({
          data: {
            venueId: venue.id,
            brandId,
            brandName: brandLabelForBooking,
            fullName: normalizedFullName,
            contactNumber,
            numberOfMen: menNormalized,
            numberOfWomen: womenNormalized,
            numberOfCouples: couplesNormalized,
            date,
            timeSlot: timeSlotNormalized,
            notes: notesNormalized,
            selectedDiscounts: selectedDiscountsNormalized,
            status: "CONFIRMED",
            confirmationCode,
          },
          select: { id: true },
        });
        reservationId = createdReservation.id;
      }
    }

    if (!reservationId) {
      return NextResponse.json(
        { error: "Failed to create reservation. Please try again." },
        { status: 500 }
      );
    }

    if (clubRoguePaymentOrderId) {
      await prisma.reservationPayment.updateMany({
        where: { razorpayOrderId: clubRoguePaymentOrderId },
        data: { reservationId },
      });
    }

    // Ensure every confirmed booking has a door code (legacy / race paths)
    let ticket = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { id: true, confirmationCode: true },
    });
    if (ticket && !ticket.confirmationCode) {
      const confirmationCode = await allocateConfirmationCode();
      ticket = await prisma.reservation.update({
        where: { id: reservationId },
        data: { confirmationCode },
        select: { id: true, confirmationCode: true },
      });
    }

    const interaktApiKey = process.env.INTERAKT_API_KEY?.trim();
    const defaultTemplateName =
      process.env.INTERAKT_BOOKING_TEMPLATE_NAME?.trim() || "club_rogue_confirmed";
    const defaultLanguageCode =
      process.env.INTERAKT_BOOKING_TEMPLATE_LANGUAGE_CODE?.trim() || "en";
    const eventTemplateName =
      process.env.INTERAKT_EVENT_TEMPLATE_NAME?.trim() || defaultTemplateName;
    const eventLanguageCode =
      process.env.INTERAKT_EVENT_TEMPLATE_LANGUAGE_CODE?.trim() || defaultLanguageCode;
    const interaktTemplateName = isEventBooking ? eventTemplateName : defaultTemplateName;
    const interaktLanguageCode = isEventBooking ? eventLanguageCode : defaultLanguageCode;

    const staffNotifyRaw = process.env.INTERAKT_STAFF_NOTIFY_PHONE?.trim() ?? "";
    const staffNotifyPhone10 = normalizeIndianMobile10(staffNotifyRaw);
    const staffNotifyEnabled =
      Boolean(staffNotifyRaw) &&
      /^\d{10}$/.test(staffNotifyPhone10) &&
      staffNotifyPhone10 !== contactNumber;
    const staffTemplateName =
      process.env.INTERAKT_STAFF_BOOKING_TEMPLATE_NAME?.trim() || interaktTemplateName;
    const staffLanguageCode =
      process.env.INTERAKT_STAFF_BOOKING_TEMPLATE_LANGUAGE_CODE?.trim() || interaktLanguageCode;

    // WhatsApp off by default for now — ticket + QR is the confirmation path
    if (!shouldTriggerInterakt) {
      console.log("[RESERVATION API] Duplicate booking detected; skipping WhatsApp trigger.");
    } else if (!clubRogueWhatsAppEnabled()) {
      console.log("[RESERVATION API] WhatsApp confirmation disabled (CLUB_ROGUE_SEND_WHATSAPP!=true).");
    } else if (!interaktApiKey) {
      console.warn("[RESERVATION API] WhatsApp enabled but INTERAKT_API_KEY missing; continuing with ticket.");
    } else {
      // Template: {{1}} name, {{2}} outlet, {{3}} mobile, {{4}} night
      const bodyValues = [
        normalizedFullName,
        outletNameForTemplate,
        contactNumber,
        clubRogueNightGenreLabel(nightGenre),
      ];
      const customerSend = await sendInteraktTemplateMessage({
        apiKey: interaktApiKey,
        phoneNumber10: contactNumber,
        callbackData: reservationId,
        templateName: interaktTemplateName,
        languageCode: interaktLanguageCode,
        bodyValues,
        logLabel: "booking-customer",
      });

      if (!customerSend.ok) {
        console.error(
          "[INTERAKT booking-customer] Failed after payment; ticket still issued:",
          customerSend.status,
          customerSend.text?.slice?.(0, 500)
        );
      } else if (staffNotifyEnabled) {
        const staffSend = await sendInteraktTemplateMessage({
          apiKey: interaktApiKey,
          phoneNumber10: staffNotifyPhone10,
          callbackData: `${reservationId}-staff`,
          templateName: staffTemplateName,
          languageCode: staffLanguageCode,
          bodyValues,
          logLabel: "booking-staff",
        });

        if (!staffSend.ok) {
          console.error(
            "[INTERAKT booking-staff] Staff notify failed after customer OK:",
            staffSend.status,
            staffSend.text?.slice?.(0, 500)
          );
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Reservation submitted successfully",
        reservationId,
        bookingId: reservationId,
        confirmationCode: ticket?.confirmationCode ?? null,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    const err = error as { message?: string; code?: string; meta?: unknown; name?: string; stack?: string };
    console.error("[RESERVATION API] Top-level error caught:", error);
    console.error("[RESERVATION API] Full error details:", {
      message: err?.message,
      code: err?.code,
      meta: err?.meta,
      name: err?.name,
      stack: err?.stack?.split("\n").slice(0, 5).join("\n"),
    });

    return NextResponse.json(
      {
        error: "Failed to process reservation. Please try again.",
        details: err?.message || "Internal server error",
        code: err?.code || "UNKNOWN",
      },
      { status: 500 }
    );
  }
}
