"use client";

import { notFound, useRouter } from "next/navigation";
import { getVenueBySlug } from "@/lib/venues";
import { useState, useRef } from "react";

interface PhotosPageProps {
  params: {
    slug: string;
  };
}

export default function PhotosPage({ params }: PhotosPageProps) {
  const router = useRouter();
  const venue = getVenueBySlug(params.slug);
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!venue) {
    notFound();
  }

  const galleryItems = [1, 2, 3, 4, 5, 6]; // Can be extended

  const handleImageError = (item: number) => {
    setImageErrors((prev) => ({ ...prev, [item]: true }));
  };

  const handleImageClick = (index: number) => {
    setSelectedIndex(index);
  };

  const closeFullscreen = () => {
    setSelectedIndex(null);
  };

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < galleryItems.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const goToPrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-white z-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-black text-xl"
        >
          ←
        </button>
        <h1 className="text-lg font-semibold">Photos</h1>
        <div className="w-8"></div>
      </div>

      {/* Photo Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-2">
          {galleryItems.map((item, index) => {
            const hasError = imageErrors[item];

            return (
              <div
                key={item}
                onClick={() => handleImageClick(index)}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer active:scale-98 transition-transform"
              >
                {hasError ? (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-4xl mb-2">📸</div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={`/club-rogue/${venue.slug}/vibe/vibe-${item}.jpg`}
                    alt={`Gallery ${item}`}
                    className="w-full h-full object-cover"
                    onError={() => handleImageError(item)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fullscreen View */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          onClick={closeFullscreen}
        >
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 text-white text-2xl z-60 bg-black/50 backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center"
          >
            ×
          </button>

          {selectedIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 backdrop-blur-sm text-white w-10 h-10 rounded-full flex items-center justify-center z-60"
            >
              ‹
            </button>
          )}

          {selectedIndex < galleryItems.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 backdrop-blur-sm text-white w-10 h-10 rounded-full flex items-center justify-center z-60"
            >
              ›
            </button>
          )}

          <div className="relative w-full h-full flex items-center justify-center p-4">
            {imageErrors[galleryItems[selectedIndex]] ? (
              <div className="text-center text-white">
                <div className="text-6xl mb-4">📸</div>
                <p className="text-lg">Image {galleryItems[selectedIndex]}</p>
              </div>
            ) : (
              <img
                src={`/club-rogue/${venue.slug}/vibe/vibe-${galleryItems[selectedIndex]}.jpg`}
                alt={`Gallery ${galleryItems[selectedIndex]}`}
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>

          {/* Image Counter */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
              {selectedIndex + 1}/{galleryItems.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

