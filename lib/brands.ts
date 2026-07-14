/** Club Rogue–only brand catalog for a standalone site. */

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

export const BRANDS: Brand[] = [
  {
    id: "club-rogue-gachibowli",
    name: "Club Rogue Gachibowli",
    shortName: "Club Rogue Gachibowli",
    accentColor: "#F97316",
    exploreUrl: "#",
    instagramUrls: ["https://www.instagram.com/clubrogue.gachibowli/"],
    websiteUrl: "/",
    description: "Club nights • Signature cocktails",
    tag: "Club",
    logoPath: "/logos/club-rogue.png",
  },
  {
    id: "club-rogue-kondapur",
    name: "Club Rogue Kondapur",
    shortName: "Club Rogue Kondapur",
    accentColor: "#EC4899",
    exploreUrl: "#",
    instagramUrls: ["https://www.instagram.com/clubrogue.kondapur/"],
    websiteUrl: "/",
    description: "Club nights • Signature cocktails",
    tag: "Club",
    logoPath: "/logos/club-rogue.png",
  },
  {
    id: "club-rogue-jubilee-hills",
    name: "Club Rogue Jubilee Hills",
    shortName: "Club Rogue Jubilee Hills",
    accentColor: "#A855F7",
    exploreUrl: "#",
    instagramUrls: ["https://www.instagram.com/clubrogue.jubileehills/"],
    websiteUrl: "/",
    description: "Club nights • Signature cocktails",
    tag: "Club",
    logoPath: "/logos/club-rogue.png",
  },
];

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
