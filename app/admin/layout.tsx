import type { Metadata } from "next";
import { CLUB_ROGUE_THEME } from "@/lib/club-rogue-landing";

export const metadata: Metadata = {
  title: "Admin · Club Rogue",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen text-stone-50"
      style={{
        background: `radial-gradient(100% 60% at 50% -5%, ${CLUB_ROGUE_THEME.glow}, transparent 50%), ${CLUB_ROGUE_THEME.bg}`,
      }}
    >
      {children}
    </div>
  );
}
