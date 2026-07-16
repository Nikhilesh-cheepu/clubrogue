"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CLUB_ROGUE_OUTLETS } from "@/lib/outlets";
import { CLUB_ROGUE_THEME } from "@/lib/club-rogue-landing";

const LOGO = "/logos/club-rogue.png";

/** Drop real crowd shots here — used when files exist in /public/landing */
const VIBE_SHOTS = [
  { src: "/landing/vibe-1.jpg", alt: "Crowd on the Club Rogue floor" },
  { src: "/landing/vibe-2.jpg", alt: "Club Rogue night energy" },
  { src: "/landing/vibe-3.jpg", alt: "Lights and bass at Club Rogue" },
  { src: "/landing/vibe-4.jpg", alt: "Weekend crowd at Club Rogue" },
] as const;

export default function ClubRogueHomeLanding() {
  return (
    <main
      className="min-h-screen overflow-x-hidden text-stone-50"
      style={{
        background: `radial-gradient(120% 80% at 50% -10%, ${CLUB_ROGUE_THEME.glow}, transparent 55%), linear-gradient(180deg, ${CLUB_ROGUE_THEME.bg} 0%, ${CLUB_ROGUE_THEME.bgMid} 45%, #0a0605 100%)`,
      }}
    >
      {/* HERO — one composition */}
      <section className="relative flex min-h-[100dvh] flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E\")",
            mixBlendMode: "overlay",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/80 to-transparent"
        />

        <div className="relative z-[1] mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-10 pt-8 sm:max-w-2xl sm:px-8 lg:max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-1 flex-col items-center justify-center text-center"
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

            <h1 className="font-[family-name:var(--font-display)] text-[2.35rem] font-bold uppercase leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Hyderabad&apos;s most
              <br />
              happening club
            </h1>

            <p
              className="mt-4 max-w-md text-sm leading-relaxed sm:text-base"
              style={{ color: CLUB_ROGUE_THEME.textMuted }}
            >
              Three locations. One wild night. Book your table before the floor fills up.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.55 }}
              className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
            >
              <a
                href="#book"
                className="inline-flex min-w-[11.5rem] items-center justify-center rounded-full px-8 py-3.5 text-[15px] font-semibold text-[#0c0604] shadow-lg shadow-orange-500/25 transition-transform active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${CLUB_ROGUE_THEME.orangeLight}, ${CLUB_ROGUE_THEME.orange})`,
                }}
              >
                Book a table
              </a>
              <a
                href="#vibe"
                className="text-sm font-medium tracking-wide underline-offset-4 hover:underline"
                style={{ color: CLUB_ROGUE_THEME.textDim }}
              >
                See the vibe
              </a>
            </motion.div>
          </motion.div>

          <p
            className="relative z-[1] text-center text-[10px] uppercase tracking-[0.28em]"
            style={{ color: CLUB_ROGUE_THEME.textDim }}
          >
            Gachibowli · Kondapur · Jubilee Hills
          </p>
        </div>
      </section>

      {/* VIBE — full-bleed visual plane for crowd shots */}
      <section id="vibe" className="relative">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="mb-8 text-center"
          >
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
              The night looks like this
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm" style={{ color: CLUB_ROGUE_THEME.textMuted }}>
              Crowds, lights, bass — Hyderabad shows up at Club Rogue.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
            {VIBE_SHOTS.map((shot, i) => (
              <motion.div
                key={shot.src}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                className="relative aspect-[3/4] overflow-hidden rounded-2xl"
                style={{
                  background: `linear-gradient(160deg, rgba(249,115,22,0.18), rgba(15,10,9,0.95)), ${CLUB_ROGUE_THEME.bgMid}`,
                  border: `1px solid ${CLUB_ROGUE_THEME.borderSubtle}`,
                }}
              >
                {/* Real photos: drop vibe-1.jpg … vibe-4.jpg into /public/landing */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={shot.src}
                  alt={shot.alt}
                  className="absolute inset-0 h-full w-full object-cover opacity-90"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/55 via-transparent to-transparent p-3">
                  <span
                    className="text-[10px] font-medium uppercase tracking-[0.2em]"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                  >
                    Vibe {i + 1}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BOOK — pick outlet */}
      <section id="book" className="border-t" style={{ borderColor: CLUB_ROGUE_THEME.borderSubtle }}>
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mb-10 text-center">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
              Choose your Rogue
            </h2>
            <p className="mt-2 text-sm" style={{ color: CLUB_ROGUE_THEME.textMuted }}>
              Same energy. Three Hyderabad floors. Pick yours and lock the table.
            </p>
          </div>

          <ul className="space-y-3">
            {CLUB_ROGUE_OUTLETS.map((outlet, i) => (
              <motion.li
                key={outlet.brandId}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
              >
                <Link
                  href={`/${outlet.brandId}`}
                  className="group flex items-center justify-between gap-4 rounded-2xl border px-5 py-4 transition-colors"
                  style={{
                    borderColor: CLUB_ROGUE_THEME.border,
                    background: CLUB_ROGUE_THEME.surface,
                  }}
                >
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em]" style={{ color: CLUB_ROGUE_THEME.orangeLight }}>
                      {outlet.locality}
                    </p>
                    <p className="mt-1 font-[family-name:var(--font-display)] text-lg font-semibold text-white">
                      {outlet.name}
                    </p>
                  </div>
                  <span
                    className="shrink-0 rounded-full px-4 py-2 text-xs font-semibold text-[#0c0604] transition-transform group-active:scale-[0.97]"
                    style={{ background: CLUB_ROGUE_THEME.orange }}
                  >
                    Book
                  </span>
                </Link>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t px-5 py-10 text-center" style={{ borderColor: CLUB_ROGUE_THEME.borderSubtle }}>
        <p className="text-[10px] uppercase tracking-[0.28em]" style={{ color: CLUB_ROGUE_THEME.textDim }}>
          Club Rogue · Hyderabad
        </p>
        <p className="mt-4 text-[10px] tracking-wide" style={{ color: "rgba(214, 211, 209, 0.35)" }}>
          Marketing partner{" "}
          <a
            href="https://bassik.in"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-white/15 underline-offset-2 hover:text-white/55"
          >
            bassik.in
          </a>
        </p>
      </footer>
    </main>
  );
}
