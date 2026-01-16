"use client";

import { useState } from "react";

interface VenueHeroImageProps {
  src: string;
  alt: string;
  venueName: string;
}

export default function VenueHeroImage({ src, alt, venueName }: VenueHeroImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="aspect-[4/3] w-full relative overflow-hidden bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-6xl mb-2">🎉</div>
          <h1 className="text-2xl font-bold">{venueName}</h1>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setHasError(true)}
    />
  );
}
