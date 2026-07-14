import ClubRogueOutletPage from "@/components/club-rogue/ClubRogueOutletPage";
import { getVenuePayload } from "@/lib/venue-data";
import { isClubRogueBrand } from "@/lib/club-rogue";
import { notFound } from "next/navigation";

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

  return (
    <ClubRogueOutletPage
      outletSlug={outlet}
      initialVenueData={data}
      initialEventId={typeof eventId === "string" ? eventId : null}
    />
  );
}
