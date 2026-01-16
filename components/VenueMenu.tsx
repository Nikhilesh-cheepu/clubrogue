"use client";

import { useRouter } from "next/navigation";

interface VenueMenuProps {
  slug: string;
}

export default function VenueMenu({ slug }: VenueMenuProps) {
  const router = useRouter();

  return (
    <div className="flex gap-3">
      {/* Food Menu Card */}
      <div
        onClick={() => router.push(`/venue/${slug}/menu/food`)}
        className="flex-1 relative rounded-xl overflow-hidden border border-gray-200 cursor-pointer active:scale-98 transition-transform"
      >
        <div className="aspect-[4/5] bg-gradient-to-br from-orange-50 to-orange-100 relative">
          <img
            src={`/club-rogue/${slug}/food/food-1.jpg`}
            alt="Food Menu"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2">
              <h3 className="font-bold text-sm">FOOD MENU</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Liquor Menu Card */}
      <div
        onClick={() => router.push(`/venue/${slug}/menu/liquor`)}
        className="flex-1 relative rounded-xl overflow-hidden border border-gray-200 cursor-pointer active:scale-98 transition-transform"
      >
        <div className="aspect-[4/5] bg-gradient-to-br from-purple-50 to-pink-100 relative">
          <img
            src={`/club-rogue/${slug}/liquor/liquor-1.jpg`}
            alt="Liquor Menu"
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2">
              <h3 className="font-bold text-sm">LIQUOR MENU</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
