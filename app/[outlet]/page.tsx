import ClubRogueOutletPage from "@/components/club-rogue/ClubRogueOutletPage";
import { getVenuePayload } from "@/lib/venue-data";
import { isClubRogueBrand, CLUB_ROGUE_BRAND_IDS } from "@/lib/club-rogue";
import { outletMetadata, nightClubJsonLd } from "@/lib/seo";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export function generateStaticParams() {
  return CLUB_ROGUE_BRAND_IDS.map((outlet) => ({ outlet }));
}

export function generateMetadata({
  params,
}: {
  params: { outlet: string };
}): Metadata {
  if (!isClubRogueBrand(params.outlet)) return {};
  return outletMetadata(params.outlet);
}

export default async function OutletPage({
  params,
  searchParams,
}: {
  params: { outlet: string };
  searchParams: { event?: string };
}) {
  const outlet = params.outlet;
  if (!isClubRogueBrand(outlet)) notFound();

  const data = await getVenuePayload(outlet);
  const eventId = searchParams?.event ?? null;
  const jsonLd = nightClubJsonLd(outlet);

  return (
    <>
      {jsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ) : null}
      <ClubRogueOutletPage
        outletSlug={outlet}
        initialVenueData={data}
        initialEventId={typeof eventId === "string" ? eventId : null}
      />
    </>
  );
}
