import { notFound } from "next/navigation";
import { getVenueBySlug } from "@/lib/venues";
import VenueMenu from "@/components/VenueMenu";
import VenueGallery from "@/components/VenueGallery";
import BookTableButton from "@/components/BookTableButton";
import VenueHeroImage from "@/components/VenueHeroImage";
import VenueHeader from "@/components/VenueHeader";

interface VenuePageProps {
  params: {
    slug: string;
  };
}

export default function VenuePage({ params }: VenuePageProps) {
  const venue = getVenueBySlug(params.slug);

  if (!venue) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-white text-black pb-24">
      {/* Hero Section */}
      <section className="relative">
        <div className="aspect-[4/3] w-full relative overflow-hidden">
          <VenueHeroImage
            src={`/club-rogue/${venue.slug}/hero/hero.jpg`}
            alt={venue.name}
            venueName={venue.name}
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          
          {/* Header with back button */}
          <VenueHeader />

          {/* Venue Info Card */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="bg-white rounded-t-3xl p-4 shadow-lg">
              <h1 className="text-2xl font-bold mb-1">{venue.name}</h1>
              <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
                <span>📍</span>
                {venue.location}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Section - Swiggy style cards */}
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Menu</h2>
        </div>
        <VenueMenu slug={venue.slug} />
      </section>

      {/* Photos Section - Compact with +N indicator */}
      <section className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold">Photos</h2>
        </div>
        <VenueGallery slug={venue.slug} />
      </section>

      {/* Sticky Book Table CTA */}
      <BookTableButton venue={venue} />
    </main>
  );
}
