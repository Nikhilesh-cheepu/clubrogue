import { PrismaClient } from "@prisma/client";
import { resolveDatabaseUrl } from "../lib/database-url";

const prisma = new PrismaClient({
  datasources: { db: { url: resolveDatabaseUrl() } },
});

const OUTLETS = [
  {
    brandId: "club-rogue-gachibowli",
    name: "Club Rogue Gachibowli",
    shortName: "Club Rogue Gachibowli",
    address: "Gachibowli, Hyderabad",
    mapUrl: "https://maps.app.goo.gl/wD2TKLaW9v5gFnmj6",
    contactPhone: "8328576564",
  },
  {
    brandId: "club-rogue-kondapur",
    name: "Club Rogue Kondapur",
    shortName: "Club Rogue Kondapur",
    address: "Kondapur, Hyderabad",
    mapUrl: "https://maps.app.goo.gl/wD2TKLaW9v5gFnmj6",
    contactPhone: "7013884485",
  },
  {
    brandId: "club-rogue-jubilee-hills",
    name: "Club Rogue Jubilee Hills",
    shortName: "Club Rogue Jubilee Hills",
    address: "Jubilee Hills, Hyderabad",
    mapUrl: "https://maps.app.goo.gl/wD2TKLaW9v5gFnmj6",
    contactPhone: "7013884485",
  },
] as const;

/** Empty until real event/gallery art is uploaded — never use the brand logo as cover art. */
const PLACEHOLDER_IMAGE = "";

async function seedOutlet(outlet: (typeof OUTLETS)[number]) {
  const venue = await prisma.venue.upsert({
    where: { brandId: outlet.brandId },
    update: {
      name: outlet.name,
      shortName: outlet.shortName,
      address: outlet.address,
      mapUrl: outlet.mapUrl,
      contactPhone: outlet.contactPhone,
      contactNumbers: [{ phone: outlet.contactPhone, label: "Contact" }],
    },
    create: {
      brandId: outlet.brandId,
      name: outlet.name,
      shortName: outlet.shortName,
      address: outlet.address,
      mapUrl: outlet.mapUrl,
      contactPhone: outlet.contactPhone,
      contactNumbers: [{ phone: outlet.contactPhone, label: "Contact" }],
    },
  });

  // Remove logo-as-gallery leftovers that crop badly in the landing UI
  await prisma.venueImage.deleteMany({
    where: {
      venueId: venue.id,
      OR: [
        { url: "/logos/club-rogue.png" },
        { url: { contains: "/logos/club-rogue" } },
      ],
    },
  });

  const existingOffers = await prisma.venueOffer.count({ where: { venueId: venue.id } });
  if (existingOffers === 0) {
    await prisma.venueOffer.createMany({
      data: [
        {
          venueId: venue.id,
          imageUrl: PLACEHOLDER_IMAGE,
          title: "Ladies Night",
          description: "Every Wednesday — premium club night",
          eventContinuous: true,
          entryLabel: "Cover applies",
        },
        {
          venueId: venue.id,
          imageUrl: PLACEHOLDER_IMAGE,
          title: "Weekend Club Night",
          description: "Fri–Sat energy — book your table",
          eventContinuous: true,
          entryLabel: "Cover applies",
        },
      ],
    });
  } else {
    await prisma.venueOffer.updateMany({
      where: {
        venueId: venue.id,
        OR: [
          { imageUrl: "/logos/club-rogue.png" },
          { imageUrl: { contains: "/logos/club-rogue" } },
        ],
      },
      data: { imageUrl: PLACEHOLDER_IMAGE },
    });
  }

  return venue.brandId;
}

async function main() {
  for (const outlet of OUTLETS) {
    const id = await seedOutlet(outlet);
    console.log("Seeded", id);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
