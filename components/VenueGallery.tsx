"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface VenueGalleryProps {
  slug: string;
}

export default function VenueGallery({ slug }: VenueGalleryProps) {
  const router = useRouter();
  const galleryItems = [1, 2, 3, 4, 5, 6];
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});

  const handleImageError = (item: number) => {
    setImageErrors((prev) => ({ ...prev, [item]: true }));
  };

  // Show first 5 images, 6th image shows +N if there are more
  const visibleCount = 5;
  const visibleItems = galleryItems.slice(0, visibleCount);
  const remainingCount = galleryItems.length > visibleCount ? galleryItems.length - visibleCount : 0;

  return (
    <div className="grid grid-cols-2 gap-2">
      {visibleItems.map((item, index) => {
        const hasError = imageErrors[item];
        return (
          <div
            key={item}
            onClick={() => router.push(`/venue/${slug}/photos`)}
            className="relative aspect-square rounded-lg overflow-hidden cursor-pointer active:scale-98 transition-transform"
          >
            {hasError ? (
              <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-3xl mb-1">📸</div>
                </div>
              </div>
            ) : (
              <img
                src={`/club-rogue/${slug}/vibe/vibe-${item}.jpg`}
                alt={`Gallery ${item}`}
                className="w-full h-full object-cover"
                onError={() => handleImageError(item)}
              />
            )}
          </div>
        );
      })}
      {/* Show +N indicator if there are more images */}
      {remainingCount > 0 && (
        <div
          onClick={() => router.push(`/venue/${slug}/photos`)}
          className="relative aspect-square rounded-lg overflow-hidden cursor-pointer active:scale-98 transition-transform bg-gray-200 flex items-center justify-center"
        >
          {galleryItems[visibleCount] && !imageErrors[galleryItems[visibleCount]] ? (
            <>
              <img
                src={`/club-rogue/${slug}/vibe/vibe-${galleryItems[visibleCount]}.jpg`}
                alt={`Gallery ${galleryItems[visibleCount]}`}
                className="w-full h-full object-cover opacity-60"
                onError={() => handleImageError(galleryItems[visibleCount])}
              />
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <span className="text-white font-bold text-lg">+{remainingCount}</span>
              </div>
            </>
          ) : (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <span className="text-white font-bold text-lg">+{remainingCount}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
