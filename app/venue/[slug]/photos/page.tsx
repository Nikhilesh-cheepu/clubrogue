import { redirect } from "next/navigation";

const SLUG_TO_BRAND: Record<string, string> = {
  gachibowli: "club-rogue-gachibowli",
  kondapur: "club-rogue-kondapur",
  "jubilee-hills": "club-rogue-jubilee-hills",
};

export default function VenuePhotosRedirect({ params }: { params: { slug: string } }) {
  redirect(`/${SLUG_TO_BRAND[params.slug] ?? "club-rogue-gachibowli"}`);
}
