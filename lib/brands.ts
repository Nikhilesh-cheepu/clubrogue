/** Club Rogue–only brand catalog for a standalone site. */

import { CLUB_ROGUE_OUTLETS } from "@/lib/outlets";

export type Brand = {
  id: string;
  name: string;
  shortName: string;
  accentColor: string;
  exploreUrl: string;
  instagramUrls: string[];
  websiteUrl: string;
  description?: string;
  tag?: string;
  logoPath?: string;
};

const ACCENTS: Record<string, string> = {
  "club-rogue-gachibowli": "#F97316",
  "club-rogue-kondapur": "#EC4899",
  "club-rogue-jubilee-hills": "#A855F7",
};

export const BRANDS: Brand[] = CLUB_ROGUE_OUTLETS.map((o) => ({
  id: o.brandId,
  name: o.name,
  shortName: o.name,
  accentColor: ACCENTS[o.brandId] ?? "#F97316",
  exploreUrl: "#",
  instagramUrls: [o.instagramUrl],
  websiteUrl: "/",
  description: "Club nights • Signature cocktails",
  tag: "Club",
  logoPath: "/logos/club-rogue.png",
}));

export function findBrandBySlug(slug: string): Brand | undefined {
  return BRANDS.find((b) => b.id === slug);
}

export function getVenueLabelsFromCatalog(
  brandId: string,
  dbName: string,
  dbShortName: string
): { name: string; shortName: string } {
  const brand = BRANDS.find((b) => b.id === brandId);
  if (!brand) {
    return { name: dbName, shortName: dbShortName };
  }
  return { name: brand.name, shortName: brand.shortName };
}

/** Canonical outlet name for Interakt templates and Reservation.brandName. */
export function getOutletLabelForReservation(
  brandId: string,
  _hubSpotId: unknown,
  brandNameFromClient: unknown,
  venueName: string,
  venueShortName: string
): string {
  const cat = getVenueLabelsFromCatalog(brandId, venueName, venueShortName);
  if (BRANDS.some((b) => b.id === brandId)) {
    return cat.shortName;
  }
  if (typeof brandNameFromClient === "string" && brandNameFromClient.trim()) {
    return brandNameFromClient.trim();
  }
  return cat.shortName || venueShortName || venueName || brandId;
}
