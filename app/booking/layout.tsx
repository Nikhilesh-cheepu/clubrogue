import { Suspense } from "react";
import type { ReactNode } from "react";

export default function BookingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse text-purple-400">Loading...</div>
          </div>
        </main>
      }
    >
      {children}
    </Suspense>
  );
}

