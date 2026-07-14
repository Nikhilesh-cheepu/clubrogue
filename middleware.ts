import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const VENUE_TO_BRAND: Record<string, string> = {
  gachibowli: "club-rogue-gachibowli",
  kondapur: "club-rogue-kondapur",
  "jubilee-hills": "club-rogue-jubilee-hills",
};

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname !== "/booking") {
    return NextResponse.next();
  }

  const venue = request.nextUrl.searchParams.get("venue")?.trim() || "";
  const brandId =
    VENUE_TO_BRAND[venue] ||
    (venue.startsWith("club-rogue-") ? venue : "club-rogue-gachibowli");

  return NextResponse.redirect(new URL(`/${brandId}`, request.url));
}

export const config = {
  matcher: ["/booking"],
};
