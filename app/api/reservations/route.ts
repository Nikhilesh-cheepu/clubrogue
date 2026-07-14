import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOutletLabelForReservation } from "@/lib/brands";
import {
  CLUB_ROGUE_GACHIBOWLI_ID,
  CLUB_ROGUE_RESERVATION_FEE_INR,
  isClubRogueBrand,
} from "@/lib/club-rogue";
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
      eventName,
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
        const paid = await prisma.reservationPayment.findUnique({
          where: { razorpayOrderId: clubRoguePaymentOrderId },
        });
        if (!paid || paid.status !== "PAID" || paid.brandId !== brandId) {
          return NextResponse.json(
            {
              error: "Payment not verified. Please complete payment and try again.",
              code: "PAYMENT_REQUIRED",
            },
            { status: 402 }
          );
        }
        if (paid.reservationId) {
          return NextResponse.json({
            success: true,
            message: "Reservation already confirmed",
            reservationId: paid.reservationId,
          });
        }
      }
    }

    const userNotesTrimmed =
      notes && String(notes).trim() ? String(notes).trim() : "";

    let notesSectionFromUser = "";
    if (userNotesTrimmed) {
      const notesLower = userNotesTrimmed.toLowerCase();
      if (notesLower.includes("birthday") || notesLower.includes("bday")) {
        notesSectionFromUser = "Birthday";
      } else if (notesLower.includes("anniversary")) {
        notesSectionFromUser = "Anniversary";
      } else if (notesLower.includes("celebration")) {
        notesSectionFromUser = "Celebration";
      } else {
        notesSectionFromUser = userNotesTrimmed;
      }
    }

    const formatTime = (time24: string): string => {
      if (!time24) return "";
      const [hours, minutes] = time24.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
    };

    const formatDateShort = (dateStr: string): string => {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    const timeToFormat = timeSlot || time;
    const totalGuests =
      parseInt(numberOfMen) + parseInt(numberOfWomen) + parseInt(numberOfCouples) * 2;
    const dateShort = formatDateShort(date);
    const timeLabel = timeToFormat ? formatTime(timeToFormat) : "";

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

    let nightGenre: "tollywood" | "bollywood" | null = null;
    if (brandId === CLUB_ROGUE_GACHIBOWLI_ID) {
      const raw =
        typeof bookingNightGenre === "string"
          ? bookingNightGenre.toLowerCase().trim()
          : "";
      if (raw !== "tollywood" && raw !== "bollywood") {
        return NextResponse.json(
          { error: "Please select Tollywood night or Bollywood night." },
          { status: 400 }
        );
      }
      nightGenre = raw;
    }

    const outletDisplayName = getOutletLabelForReservation(
      brandId,
      null,
      brandName,
      venue.name,
      venue.shortName
    );
    const outletNameForTemplate = outletDisplayName;
    const brandLabelForBooking = outletDisplayName;

    const offerText = "NA";

    const timeSlotNormalized = String(timeToFormat);
    const menNormalized = String(numberOfMen);
    const womenNormalized = String(numberOfWomen);
    const couplesNormalized = String(numberOfCouples);
    const eventIdNormalized =
      typeof eventId === "string" && eventId.trim() ? eventId.trim() : null;
    const isEventBooking = Boolean(eventIdNormalized);
    const dbNotesParts: string[] = [];
    if (brandId === CLUB_ROGUE_GACHIBOWLI_ID && nightGenre) {
      dbNotesParts.push(nightGenre === "tollywood" ? "Tollywood night" : "Bollywood night");
    }
    if (userNotesTrimmed) dbNotesParts.push(userNotesTrimmed);
    const notesNormalized =
      [
        dbNotesParts.length > 0 ? dbNotesParts.join("\n") : "",
        eventIdNormalized ? `[event:${eventIdNormalized}]` : "",
      ]
        .filter(Boolean)
        .join("\n")
        .trim() || null;

    let eventNameForTemplate = "Event";
    let eventDateForTemplate = dateShort;
    if (typeof eventName === "string" && eventName.trim()) {
      eventNameForTemplate = eventName.trim();
    }
    if (eventIdNormalized && date) {
      eventDateForTemplate = formatDateShort(String(date));
    }

    const selectedDiscountsNormalized =
      Array.isArray(selectedDiscounts) && selectedDiscounts.length > 0
        ? JSON.stringify(
            [...selectedDiscounts]
              .map((x) => (typeof x === "string" ? x : ""))
              .filter(Boolean)
              .sort()
          )
        : null;

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
      select: { id: true, createdAt: true },
    });

    const createdReservation = existingReservation
      ? null
      : await prisma.reservation.create({
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
          },
          select: { id: true },
        });
    const reservationId = existingReservation?.id ?? createdReservation?.id;
    if (!reservationId) {
      return NextResponse.json(
        { error: "Failed to create reservation. Please try again." },
        { status: 500 }
      );
    }

    if (clubRoguePaymentOrderId && !existingReservation) {
      await prisma.reservationPayment.updateMany({
        where: { razorpayOrderId: clubRoguePaymentOrderId, reservationId: null },
        data: { reservationId },
      });
    }

    const shouldTriggerInterakt = !existingReservation;

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

    if (!shouldTriggerInterakt) {
      console.log("[RESERVATION API] Duplicate booking detected; skipping WhatsApp trigger.");
    } else if (!interaktApiKey) {
      return NextResponse.json(
        { error: "WhatsApp service is not configured. Please try again shortly." },
        { status: 503 }
      );
    } else {
      // Template body vars: {{1}} name, {{2}} outlet, {{3}} mobile
      const bodyValues = [normalizedFullName, outletNameForTemplate, contactNumber];
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
        return NextResponse.json(
          { error: "Unable to send WhatsApp confirmation. Please try again." },
          { status: 502 }
        );
      }

      if (staffNotifyEnabled) {
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
