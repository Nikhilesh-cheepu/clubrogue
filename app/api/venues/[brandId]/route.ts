import { NextRequest, NextResponse } from "next/server";
import { getVenuePayload } from "@/lib/venue-data";
import { isClubRogueBrand } from "@/lib/club-rogue";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { brandId: string } }
) {
  const brandId = params.brandId;

  if (!brandId || !isClubRogueBrand(brandId)) {
    return NextResponse.json({ error: "Unknown outlet" }, { status: 404 });
  }

  const data = await getVenuePayload(brandId);
  if (!data) {
    return NextResponse.json({ error: "Venue not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
