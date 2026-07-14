import { redirect } from "next/navigation";

export default function BookingRedirect({
  searchParams,
}: {
  searchParams: { venue?: string };
}) {
  const venue = searchParams.venue;
  const map: Record<string, string> = {
    gachibowli: "club-rogue-gachibowli",
    kondapur: "club-rogue-kondapur",
    "jubilee-hills": "club-rogue-jubilee-hills",
  };
  const brandId =
    (venue && map[venue]) ||
    (venue && venue.startsWith("club-rogue-") ? venue : null) ||
    "club-rogue-gachibowli";
  redirect(`/${brandId}`);
}
