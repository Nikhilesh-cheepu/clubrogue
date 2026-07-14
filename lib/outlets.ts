/** Canonical Club Rogue outlet profile data for bookings + SEO. */

export type ClubRogueOutletProfile = {
  brandId: string;
  name: string;
  locality: string;
  city: string;
  address: string;
  phone: string;
  mapUrl: string;
  instagramUrl: string;
  /** Approximate lat/lng for LocalBusiness schema (Hyderabad hubs). */
  geo: { lat: number; lng: number };
};

export const CLUB_ROGUE_OUTLETS: ClubRogueOutletProfile[] = [
  {
    brandId: "club-rogue-gachibowli",
    name: "Club Rogue Gachibowli",
    locality: "Gachibowli",
    city: "Hyderabad",
    address: "Club Rogue, Gachibowli, Hyderabad, Telangana",
    phone: "7287984440",
    mapUrl: "https://maps.app.goo.gl/k9PYAFMX8ak6YS2w7?g_st=ic",
    instagramUrl: "https://www.instagram.com/clubrogue.gachibowli/",
    geo: { lat: 17.4401, lng: 78.3489 },
  },
  {
    brandId: "club-rogue-kondapur",
    name: "Club Rogue Kondapur",
    locality: "Kondapur",
    city: "Hyderabad",
    address: "Club Rogue, Kondapur, Hyderabad, Telangana",
    phone: "7287984440",
    mapUrl: "https://maps.app.goo.gl/9vyRjWjPiZZk8CqQ9",
    instagramUrl: "https://www.instagram.com/clubrogue.kondapur/",
    geo: { lat: 17.485, lng: 78.3908 },
  },
  {
    brandId: "club-rogue-jubilee-hills",
    name: "Club Rogue Jubilee Hills",
    locality: "Jubilee Hills",
    city: "Hyderabad",
    address: "Club Rogue, Jubilee Hills, Hyderabad, Telangana",
    phone: "7287984441",
    mapUrl: "https://maps.app.goo.gl/mrRyovVrA7s2XaMP8",
    instagramUrl: "https://www.instagram.com/clubrogue.jubileehills/",
    geo: { lat: 17.432, lng: 78.407 },
  },
];

export function getOutletProfile(brandId: string): ClubRogueOutletProfile | undefined {
  return CLUB_ROGUE_OUTLETS.find((o) => o.brandId === brandId);
}

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://clubrogue.in";

export const SITE_NAME = "Club Rogue";
export const SITE_TAGLINE =
  "Hyderabad's hottest club nights — book your table at Club Rogue Gachibowli, Kondapur & Jubilee Hills.";
