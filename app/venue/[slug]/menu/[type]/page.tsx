"use client";

import { notFound, useRouter } from "next/navigation";
import { getVenueBySlug } from "@/lib/venues";
import { useState, useRef } from "react";

interface MenuPageProps {
  params: {
    slug: string;
    type: string;
  };
}

export default function MenuPage({ params }: MenuPageProps) {
  const router = useRouter();
  const venue = getVenueBySlug(params.slug);
  const menuType = params.type === "food" ? "food" : "liquor";
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<{ [key: number]: boolean }>({});
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Menu images - can have multiple pages
  const menuImages = [1, 2, 3]; // Adjust based on actual images

  if (!venue || (params.type !== "food" && params.type !== "liquor")) {
    notFound();
  }

  const handleImageError = (index: number) => {
    setImageErrors((prev) => ({ ...prev, [index]: true }));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(diff) > minSwipeDistance) {
      if (diff > 0 && currentIndex < menuImages.length - 1) {
        // Swipe left - next image
        setCurrentIndex(currentIndex + 1);
      } else if (diff < 0 && currentIndex > 0) {
        // Swipe right - previous image
        setCurrentIndex(currentIndex - 1);
      }
    }
  };

  const goToNext = () => {
    if (currentIndex < menuImages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 bg-black/95 backdrop-blur-sm z-50 border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="text-white text-xl"
        >
          ←
        </button>
        <h1 className="text-lg font-semibold uppercase">{menuType} Menu</h1>
        <div className="w-8"></div>
      </div>

      {/* Image Counter */}
      <div className="absolute top-16 right-4 z-40 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm">
        {currentIndex + 1}/{menuImages.length}
      </div>

      {/* Swipeable Images */}
      <div
        className="relative h-[calc(100vh-120px)] overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {menuImages.map((item, index) => {
            const hasError = imageErrors[index];

            return (
              <div
                key={item}
                className="min-w-full h-full flex items-center justify-center bg-black"
              >
                {hasError ? (
                  <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-6xl mb-4">
                        {menuType === "food" ? "🍽️" : "🍸"}
                      </div>
                      <p className="text-lg">Menu Page {item}</p>
                    </div>
                  </div>
                ) : (
                  <img
                    src={`/club-rogue/${venue.slug}/${menuType}/${menuType}-${item}.jpg`}
                    alt={`${menuType} menu page ${item}`}
                    className="w-full h-full object-contain"
                    onError={() => handleImageError(index)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      {currentIndex > 0 && (
        <button
          onClick={goToPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 backdrop-blur-sm text-white w-10 h-10 rounded-full flex items-center justify-center z-40"
        >
          ‹
        </button>
      )}
      {currentIndex < menuImages.length - 1 && (
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 backdrop-blur-sm text-white w-10 h-10 rounded-full flex items-center justify-center z-40"
        >
          ›
        </button>
      )}

      {/* Dots Indicator */}
      {menuImages.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-40">
          {menuImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-white w-6"
                  : "bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

