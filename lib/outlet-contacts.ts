const DEFAULT_NUMBER = "7013884485";

export const OUTLET_CONTACTS: Record<string, { phone: string; whatsappMessage: string }> = {
  "club-rogue-gachibowli": {
    phone: "8328576564",
    whatsappMessage: `Hi! I'd like to book a table at Club Rogue Gachibowli. I understand there's a mandatory ₹2000 cover charge — fully redeemable at the venue.`,
  },
  "club-rogue-kondapur": {
    phone: DEFAULT_NUMBER, // update when dedicated number is set
    whatsappMessage: `Hi! I'd like to book a table at Club Rogue Kondapur. I understand there's a mandatory ₹2000 cover charge — fully redeemable at the venue.`,
  },
  "club-rogue-jubilee-hills": {
    phone: DEFAULT_NUMBER, // update when dedicated number is set
    whatsappMessage: `Hi! I'd like to book a table at Club Rogue Jubilee Hills. I understand there's a mandatory ₹2000 cover charge — fully redeemable at the venue.`,
  },
};

export function getContactForBrand(brandId: string): string {
  return OUTLET_CONTACTS[brandId]?.phone ?? DEFAULT_NUMBER;
}

export function getWhatsAppMessageForBrand(brandId: string, brandName?: string): string {
  const custom = OUTLET_CONTACTS[brandId]?.whatsappMessage;
  if (custom) return custom;
  const name = brandName || "Club Rogue";
  return `Hi! I'd like to book a table at ${name}. I understand there's a mandatory ₹2000 cover charge — fully redeemable at the venue.`;
}

export function getFullPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return digits;
  return digits;
}
