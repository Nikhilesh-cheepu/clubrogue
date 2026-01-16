import Link from "next/link";
import { venues } from "@/lib/venues";
import VenueCardImage from "@/components/VenueCardImage";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-black">
      {/* Hero Section */}
      <section className="relative px-4 py-8 text-center">
        <div className="max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Choose Your Rogue.
          </h1>
          <p className="text-base text-gray-600 mb-8">
            Three locations. One wild night.
          </p>

          {/* Venue Cards */}
          <div className="space-y-4">
            {venues.map((venue) => (
              <Link
                key={venue.slug}
                href={`/venue/${venue.slug}`}
                className="block relative overflow-hidden rounded-xl border border-gray-200 active:scale-98 transition-transform bg-white shadow-sm"
              >
                {/* Placeholder for venue image */}
                <div className="aspect-[4/3] bg-gradient-to-br from-purple-100 to-pink-100 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-5xl opacity-20">🎉</div>
                  </div>
                  {/* You can replace this with actual images */}
                  <VenueCardImage
                    src={`/club-rogue/${venue.slug}/hero/hero.jpg`}
                    alt={venue.name}
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-bold mb-1 text-black">
                    {venue.name}
                  </h2>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <span>📍</span>
                    {venue.location}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

