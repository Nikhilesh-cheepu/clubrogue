"use client";

import { useRouter } from "next/navigation";
import { Venue } from "@/lib/venues";

interface BookTableButtonProps {
  venue: Venue;
}

export default function BookTableButton({ venue }: BookTableButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/booking?venue=${venue.slug}&name=${encodeURIComponent(venue.name)}`);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-50 shadow-lg">
      <button
        onClick={handleClick}
        className="w-full bg-orange-500 text-white py-3.5 px-6 rounded-lg font-semibold text-base active:bg-orange-600 transition-colors"
      >
        Book a table
      </button>
    </div>
  );
}
