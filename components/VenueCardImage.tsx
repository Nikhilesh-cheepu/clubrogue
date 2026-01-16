"use client";

import { useState } from "react";

interface VenueCardImageProps {
  src: string;
  alt: string;
}

export default function VenueCardImage({ src, alt }: VenueCardImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return null;
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

