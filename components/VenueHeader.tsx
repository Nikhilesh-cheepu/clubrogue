"use client";

import { useRouter } from "next/navigation";

export default function VenueHeader() {
  const router = useRouter();

  return (
    <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
      <button
        onClick={() => router.back()}
        className="bg-black/50 backdrop-blur-sm rounded-full p-2 text-white active:bg-black/70"
      >
        ←
      </button>
      <div className="flex gap-3">
        <button className="bg-black/50 backdrop-blur-sm rounded-full p-2 text-white active:bg-black/70">
          ♡
        </button>
        <button className="bg-black/50 backdrop-blur-sm rounded-full p-2 text-white active:bg-black/70">
          ↗
        </button>
      </div>
    </div>
  );
}

