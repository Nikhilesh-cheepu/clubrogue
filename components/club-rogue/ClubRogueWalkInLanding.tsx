"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { CLUB_ROGUE_OUTLETS, type ClubRogueOutletProfile } from "@/lib/outlets";
import { CLUB_ROGUE_THEME } from "@/lib/club-rogue-landing";

const LOGO = "/logos/club-rogue.png";

function telHref(phone: string) {
  return `tel:+91${phone.replace(/\D/g, "")}`;
}

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  return `+91 ${d}`;
}

export default function ClubRogueWalkInLanding({
  highlightBrandId,
}: {
  highlightBrandId?: string;
}) {
  const ordered = [...CLUB_ROGUE_OUTLETS].sort((a, b) => {
    if (a.brandId === highlightBrandId) return -1;
    if (b.brandId === highlightBrandId) return 1;
    return 0;
  });

  return (
    <main
      className="min-h-screen overflow-x-hidden text-stone-50"
      style={{
        background: `radial-gradient(120% 80% at 50% -10%, ${CLUB_ROGUE_THEME.glow}, transparent 55%), linear-gradient(180deg, ${CLUB_ROGUE_THEME.bg} 0%, ${CLUB_ROGUE_THEME.bgMid} 45%, #0a0605 100%)`,
      }}
    >
      <section className="relative flex min-h-[72dvh] flex-col px-5 pb-10 pt-10 sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")",
            mixBlendMode: "overlay",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-[1] mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center text-center sm:max-w-2xl"
        >
          <div className="relative mb-7 h-20 w-20 sm:h-24 sm:w-24">
            <Image
              src={LOGO}
              alt="Club Rogue"
              fill
              priority
              className="object-contain drop-shadow-[0_0_28px_rgba(249,115,22,0.35)]"
            />
          </div>

          <p
            className="mb-3 font-[family-name:var(--font-display)] text-[11px] font-semibold uppercase tracking-[0.42em] sm:text-xs"
            style={{ color: CLUB_ROGUE_THEME.orangeLight }}
          >
            Club Rogue
          </p>

          <h1 className="font-[family-name:var(--font-display)] text-[2.35rem] font-bold uppercase leading-[1.05] tracking-tight text-white sm:text-5xl">
            Walk in.
            <br />
            Book your table.
          </h1>

          <p
            className="mt-4 max-w-md text-sm leading-relaxed sm:text-base"
            style={{ color: CLUB_ROGUE_THEME.textMuted }}
          >
            Three Hyderabad floors. Pick your spot, open Maps, or call — we&apos;ll see you on the floor.
          </p>

          <a
            href="#venues"
            className="mt-8 inline-flex min-w-[12rem] items-center justify-center rounded-full px-8 py-3.5 text-[15px] font-semibold text-[#0c0604] shadow-lg shadow-orange-500/25"
            style={{
              background: `linear-gradient(135deg, ${CLUB_ROGUE_THEME.orangeLight}, ${CLUB_ROGUE_THEME.orange})`,
            }}
          >
            Find a venue
          </a>
        </motion.div>

        <p
          className="relative z-[1] text-center text-[10px] uppercase tracking-[0.28em]"
          style={{ color: CLUB_ROGUE_THEME.textDim }}
        >
          Gachibowli · Kondapur · Jubilee Hills
        </p>
      </section>

      <section
        id="venues"
        className="border-t px-5 py-14 sm:px-8 sm:py-16"
        style={{ borderColor: CLUB_ROGUE_THEME.borderSubtle }}
      >
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
              Our venues
            </h2>
            <p className="mt-2 text-sm" style={{ color: CLUB_ROGUE_THEME.textMuted }}>
              Location, Instagram, and contact — walk in anytime.
            </p>
          </div>

          <ul className="space-y-4">
            {ordered.map((outlet, i) => (
              <VenueCard key={outlet.brandId} outlet={outlet} index={i} />
            ))}
          </ul>
        </div>
      </section>

      <footer
        className="border-t px-5 py-10 text-center"
        style={{ borderColor: CLUB_ROGUE_THEME.borderSubtle }}
      >
        <p
          className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-[0.2em] text-white/80"
        >
          Walk in &amp; book your table
        </p>
        <p className="mt-3 text-[10px] uppercase tracking-[0.28em]" style={{ color: CLUB_ROGUE_THEME.textDim }}>
          Club Rogue · Hyderabad
        </p>
      </footer>
    </main>
  );
}

function VenueCard({
  outlet,
  index,
}: {
  outlet: ClubRogueOutletProfile;
  index: number;
}) {
  return (
    <motion.li
      id={outlet.brandId}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      className="rounded-2xl border px-5 py-5 sm:px-6 sm:py-6"
      style={{
        borderColor: CLUB_ROGUE_THEME.border,
        background: CLUB_ROGUE_THEME.surface,
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.28em]"
        style={{ color: CLUB_ROGUE_THEME.orangeLight }}
      >
        {outlet.locality}
      </p>
      <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl font-semibold text-white sm:text-2xl">
        {outlet.name}
      </h3>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: CLUB_ROGUE_THEME.textMuted }}>
        {outlet.address}
      </p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <a
          href={outlet.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center rounded-full px-4 py-3 text-sm font-semibold text-[#0c0604]"
          style={{ background: CLUB_ROGUE_THEME.orange }}
        >
          Google Maps
        </a>
        <a
          href={outlet.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-1 items-center justify-center rounded-full border px-4 py-3 text-sm font-medium"
          style={{ borderColor: CLUB_ROGUE_THEME.border, color: CLUB_ROGUE_THEME.textMuted }}
        >
          Instagram
        </a>
        <a
          href={telHref(outlet.phone)}
          className="inline-flex flex-1 items-center justify-center rounded-full border px-4 py-3 text-sm font-medium"
          style={{ borderColor: CLUB_ROGUE_THEME.border, color: CLUB_ROGUE_THEME.orangeLight }}
        >
          {formatPhone(outlet.phone)}
        </a>
      </div>

      <p
        className="mt-4 text-center text-[11px] font-medium uppercase tracking-[0.18em]"
        style={{ color: CLUB_ROGUE_THEME.textDim }}
      >
        Walk in · book your table
      </p>
    </motion.li>
  );
}
