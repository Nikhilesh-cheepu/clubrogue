import { CLUB_ROGUE_OUTLETS, getOutletProfile } from "@/lib/outlets";

const DEFAULT_NUMBER = "7287984440";

export const OUTLET_CONTACTS: Record<string, { phone: string; whatsappMessage: string }> =
  Object.fromEntries(
    CLUB_ROGUE_OUTLETS.map((o) => [
      o.brandId,
      {
        phone: o.phone,
        whatsappMessage: `Hi! I'd like to book a table at ${o.name}. I understand there's a mandatory ₹2000 cover charge — fully redeemable at the venue.`,
      },
    ])
  );

export function getContactForBrand(brandId: string): string {
  return getOutletProfile(brandId)?.phone ?? OUTLET_CONTACTS[brandId]?.phone ?? DEFAULT_NUMBER;
}

export function getWhatsAppMessageForBrand(brandId: string, brandName?: string): string {
  const custom = OUTLET_CONTACTS[brandId]?.whatsappMessage;
  if (custom) return custom;
  const name = brandName || getOutletProfile(brandId)?.name || "Club Rogue";
  return `Hi! I'd like to book a table at ${name}. I understand there's a mandatory ₹2000 cover charge — fully redeemable at the venue.`;
}

export function getFullPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return digits;
  return digits;
}
