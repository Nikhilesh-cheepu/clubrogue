"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CLUB_ROGUE_THEME } from "@/lib/club-rogue-landing";

const TABS = [
  { href: "/admin/scan", label: "Scan" },
  { href: "/admin/dashboard", label: "Bookings" },
  { href: "/admin/payments", label: "Payments" },
] as const;

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-5 flex gap-1 rounded-full border p-1" style={{ borderColor: CLUB_ROGUE_THEME.border }}>
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex-1 rounded-full py-2.5 text-center text-xs font-semibold uppercase tracking-[0.14em] transition-colors"
            style={
              active
                ? {
                    background: CLUB_ROGUE_THEME.orange,
                    color: "#0c0604",
                  }
                : {
                    color: CLUB_ROGUE_THEME.textMuted,
                  }
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
