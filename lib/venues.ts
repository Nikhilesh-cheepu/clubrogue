export interface Venue {
  slug: string;
  name: string;
  location: string;
  description: string;
}

export const venues: Venue[] = [
  {
    slug: "gachibowli",
    name: "Club Rogue Gachibowli",
    location: "Gachibowli, Hyderabad",
    description: "The ultimate party destination in Gachibowli",
  },
  {
    slug: "kondapur",
    name: "Club Rogue Kondapur",
    location: "Kondapur, Hyderabad",
    description: "Where the night comes alive in Kondapur",
  },
  {
    slug: "jubilee-hills",
    name: "Club Rogue Jubilee Hills",
    location: "Jubilee Hills, Hyderabad",
    description: "Premium nightlife experience in Jubilee Hills",
  },
];

export function getVenueBySlug(slug: string): Venue | undefined {
  return venues.find((venue) => venue.slug === slug);
}

