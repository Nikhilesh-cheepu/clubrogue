import { prisma } from "@/lib/db";
import { BRANDS, getVenueLabelsFromCatalog } from "@/lib/brands";
import { getContactForBrand, getWhatsAppMessageForBrand } from "@/lib/outlet-contacts";
import { Prisma } from "@prisma/client";

export type VenuePayload = {
  outletUi: Record<string, unknown>;
  offers: {
    id: string;
    imageUrl: string;
    title: string | null;
    description: string | null;
    eventDate: string | null;
    eventContinuous: boolean;
    entryLabel: string | null;
    capacityText: string | null;
  }[];
  galleryImages: string[];
  menus: { id: string; name: string; thumbnail: string; images: string[] }[];
  location: { address: string; mapUrl: string | null };
  contactPhone: string;
  contactNumbers: { phone: string; label?: string }[];
  whatsappMessage: string;
  sectionVisibility: {
    menu: boolean;
    photos: boolean;
    spots: boolean;
  };
};

const DEFAULT_MAP_URL = "https://maps.app.goo.gl/k9PYAFMX8ak6YS2w7?g_st=ic";
const defaultLocation = { address: "", mapUrl: DEFAULT_MAP_URL };
const defaultSectionVisibility = { menu: true, photos: true, spots: true };
const defaultOutletUi = {};

function brandFallbackPayload(brandId: string): VenuePayload | null {
  const brand = BRANDS.find((b) => b.id === brandId);
  if (!brand) return null;
  const contactPhone = getContactForBrand(brandId);
  const whatsappMessage = getWhatsAppMessageForBrand(brandId, brand.shortName);
  return {
    outletUi: defaultOutletUi,
    offers: [],
    galleryImages: [],
    menus: [],
    location: defaultLocation,
    contactPhone,
    contactNumbers: [{ phone: contactPhone, label: "Contact" }],
    whatsappMessage,
    sectionVisibility: defaultSectionVisibility,
  };
}

export async function getVenueDataByBrandId(brandId: string): Promise<VenuePayload | null> {
  try {
    const venue = await prisma.venue.findUnique({
      where: { brandId },
      include: {
        images: { where: { type: "GALLERY" }, orderBy: { order: "asc" } },
        offers: {
          where: {
            OR: [{ endDate: null }, { endDate: { gt: new Date().toISOString() } }],
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!venue) return brandFallbackPayload(brandId);

    const galleryImages = venue.images.map((img) => img.url);
    const rawContacts = venue.contactNumbers;
    const contactNumbers: { phone: string; label?: string }[] =
      Array.isArray(rawContacts) && rawContacts.length > 0
        ? (rawContacts as { phone: string; label?: string }[]).filter(
            (c) => c && typeof c.phone === "string" && c.phone.trim()
          )
        : (() => {
            const single = venue.contactPhone ?? getContactForBrand(brandId);
            return single ? [{ phone: single, label: "Contact" }] : [];
          })();
    const contactPhone = contactNumbers[0]?.phone ?? getContactForBrand(brandId);
    const { shortName: displayShortName } = getVenueLabelsFromCatalog(
      brandId,
      venue.name,
      venue.shortName
    );
    const whatsappMessage = getWhatsAppMessageForBrand(brandId, displayShortName);
    const offers = venue.offers.map((o) => ({
      id: o.id,
      imageUrl: o.imageUrl,
      title: o.title ?? null,
      description: o.description ?? null,
      eventDate: o.eventDate ?? null,
      eventContinuous: Boolean(o.eventContinuous),
      entryLabel: o.entryLabel ?? null,
      capacityText: o.capacityText ?? null,
    }));

    const rawSectionVisibility = venue.sectionVisibility;
    const sectionVisibility = {
      menu:
        rawSectionVisibility &&
        typeof rawSectionVisibility === "object" &&
        "menu" in (rawSectionVisibility as Record<string, unknown>)
          ? Boolean((rawSectionVisibility as Record<string, unknown>).menu)
          : true,
      photos:
        rawSectionVisibility &&
        typeof rawSectionVisibility === "object" &&
        "photos" in (rawSectionVisibility as Record<string, unknown>)
          ? Boolean((rawSectionVisibility as Record<string, unknown>).photos)
          : true,
      spots:
        rawSectionVisibility &&
        typeof rawSectionVisibility === "object" &&
        "spots" in (rawSectionVisibility as Record<string, unknown>)
          ? Boolean((rawSectionVisibility as Record<string, unknown>).spots)
          : true,
    };

    return {
      outletUi:
        venue.outletUi && typeof venue.outletUi === "object"
          ? (venue.outletUi as Record<string, unknown>)
          : defaultOutletUi,
      offers,
      galleryImages,
      menus: [],
      location: { address: venue.address ?? "", mapUrl: venue.mapUrl ?? DEFAULT_MAP_URL },
      contactPhone,
      contactNumbers,
      whatsappMessage,
      sectionVisibility,
    };
  } catch (error) {
    const code = error instanceof Prisma.PrismaClientKnownRequestError ? error.code : null;
    if (code === "P1001" || code === "P2022" || (code && String(code).startsWith("P"))) {
      return brandFallbackPayload(brandId);
    }
    return null;
  }
}

/** Alias used by outlet pages — same as getVenueDataByBrandId. */
export async function getVenuePayload(brandId: string): Promise<VenuePayload | null> {
  return getVenueDataByBrandId(brandId);
}
