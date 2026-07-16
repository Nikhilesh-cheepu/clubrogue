import type { Metadata } from "next";
import { CLUB_ROGUE_OUTLETS, SITE_NAME, SITE_TAGLINE, SITE_URL, getOutletProfile } from "@/lib/outlets";

export function rootMetadata(): Metadata {
  const title = {
    default: "Club Rogue | Hyderabad's Most Happening Club — Book a Table",
    template: "%s | Club Rogue Hyderabad",
  };

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description: SITE_TAGLINE,
    applicationName: SITE_NAME,
    keywords: [
      "Club Rogue",
      "clubrogue",
      "Club Rogue Hyderabad",
      "Club Rogue Gachibowli",
      "Club Rogue Kondapur",
      "Club Rogue Jubilee Hills",
      "book table Club Rogue",
      "nightclub Hyderabad",
      "club nights Hyderabad",
      "Gachibowli club",
      "Kondapur club",
      "Jubilee Hills club",
    ],
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: SITE_URL,
      siteName: SITE_NAME,
      title: "Club Rogue | Hyderabad's Most Happening Club",
      description: SITE_TAGLINE,
      images: [
        {
          url: "/logos/club-rogue.png",
          width: 512,
          height: 512,
          alt: "Club Rogue logo",
        },
      ],
    },
    twitter: {
      card: "summary",
      title: "Club Rogue | Hyderabad's Most Happening Club",
      description: SITE_TAGLINE,
      images: ["/logos/club-rogue.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    category: "nightlife",
  };
}

export function outletMetadata(brandId: string): Metadata {
  const outlet = getOutletProfile(brandId);
  if (!outlet) return {};

  const title = `${outlet.name} | Book Table Online`;
  const description = `Book your table at ${outlet.name}. Nightclub in ${outlet.locality}, Hyderabad. Call ${outlet.phone}. ₹2,000 cover at entry (redeemable on F&B).`;
  const url = `/${outlet.brandId}`;

  return {
    title,
    description,
    keywords: [
      outlet.name,
      `Club Rogue ${outlet.locality}`,
      `book table ${outlet.locality}`,
      `club ${outlet.locality} Hyderabad`,
      "clubrogue",
      "Club Rogue",
    ],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url: `${SITE_URL}${url}`,
      title,
      description,
      siteName: SITE_NAME,
      images: [{ url: "/logos/club-rogue.png", alt: outlet.name }],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: ["/logos/club-rogue.png"],
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logos/club-rogue.png`,
    sameAs: CLUB_ROGUE_OUTLETS.map((o) => o.instagramUrl),
    contactPoint: CLUB_ROGUE_OUTLETS.map((o) => ({
      "@type": "ContactPoint",
      telephone: `+91${o.phone}`,
      contactType: "reservations",
      areaServed: o.locality,
      availableLanguage: ["English", "Hindi", "Telugu"],
    })),
  };
}

export function nightClubJsonLd(brandId: string) {
  const outlet = getOutletProfile(brandId);
  if (!outlet) return null;

  return {
    "@context": "https://schema.org",
    "@type": "NightClub",
    "@id": `${SITE_URL}/${outlet.brandId}#venue`,
    name: outlet.name,
    alternateName: ["Club Rogue", "clubrogue", `Club Rogue ${outlet.locality}`],
    description: `Book a table at ${outlet.name} — Hyderabad nightclub in ${outlet.locality}.`,
    url: `${SITE_URL}/${outlet.brandId}`,
    image: `${SITE_URL}/logos/club-rogue.png`,
    telephone: `+91${outlet.phone}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: outlet.address,
      addressLocality: outlet.locality,
      addressRegion: "Telangana",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: outlet.geo.lat,
      longitude: outlet.geo.lng,
    },
    hasMap: outlet.mapUrl,
    sameAs: [outlet.instagramUrl, outlet.mapUrl],
    priceRange: "₹₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, UPI, Card",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Friday", "Saturday", "Wednesday"],
        opens: "20:00",
        closes: "02:00",
      },
    ],
    potentialAction: {
      "@type": "ReserveAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/${outlet.brandId}`,
        inLanguage: "en-IN",
        actionPlatform: [
          "http://schema.org/DesktopWebPlatform",
          "http://schema.org/MobileWebPlatform",
        ],
      },
      result: {
        "@type": "Reservation",
        name: "Table booking",
      },
    },
  };
}

export function allNightClubsJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": CLUB_ROGUE_OUTLETS.map((o) => nightClubJsonLd(o.brandId)).filter(Boolean),
  };
}
