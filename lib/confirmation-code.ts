import { prisma } from "@/lib/db";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length = 6): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

function normalizePhone10(raw: string): string {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length > 10 && (digits.startsWith("91") || digits.startsWith("0"))) {
    return digits.replace(/^(91|0)+/, "").slice(0, 10);
  }
  return digits.slice(0, 10);
}

/** Short guest-facing code, e.g. CR-K7M2P9 */
export async function allocateConfirmationCode(): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt++) {
    const code = `CR-${randomCode(6)}`;
    const existing = await prisma.reservation.findUnique({
      where: { confirmationCode: code },
      select: { id: true },
    });
    if (!existing) return code;
  }
  return `CR-${randomCode(8)}`;
}

/**
 * BookMyShow-style QR payload — tied to booking + mobile used at checkout.
 * Format: CLUBROGUE|<code>|<bookingId>|<10-digit mobile>
 */
export function buildTicketQrPayload(params: {
  confirmationCode: string;
  reservationId: string;
  contactNumber: string;
}): string {
  const mobile = normalizePhone10(params.contactNumber);
  return `CLUBROGUE|${params.confirmationCode}|${params.reservationId}|${mobile}`;
}

export function parseTicketQrPayload(raw: string): {
  confirmationCode: string | null;
  reservationId: string | null;
  contactNumber: string | null;
} {
  const text = String(raw || "").trim();
  if (!text) {
    return { confirmationCode: null, reservationId: null, contactNumber: null };
  }

  if (text.startsWith("CLUBROGUE|")) {
    const parts = text.split("|");
    const mobile = parts[3] ? normalizePhone10(parts[3]) : null;
    return {
      confirmationCode: parts[1]?.trim() || null,
      reservationId: parts[2]?.trim() || null,
      contactNumber: mobile && /^\d{10}$/.test(mobile) ? mobile : null,
    };
  }

  if (/^CR-[A-Z0-9]{6,10}$/i.test(text)) {
    return {
      confirmationCode: text.toUpperCase(),
      reservationId: null,
      contactNumber: null,
    };
  }

  try {
    const url = new URL(text);
    const code = url.searchParams.get("code");
    if (code) {
      return {
        confirmationCode: code.trim().toUpperCase(),
        reservationId: null,
        contactNumber: null,
      };
    }
  } catch {
    /* not a URL */
  }

  return {
    confirmationCode: text.toUpperCase(),
    reservationId: null,
    contactNumber: null,
  };
}

export function clubRogueWhatsAppEnabled(): boolean {
  return process.env.CLUB_ROGUE_SEND_WHATSAPP === "true";
}
