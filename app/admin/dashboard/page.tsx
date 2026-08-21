"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CLUB_ROGUE_OUTLETS } from "@/lib/outlets";
import { CLUB_ROGUE_THEME } from "@/lib/club-rogue-landing";

type Booking = {
  id: string;
  brandId: string;
  brandName: string;
  fullName: string;
  contactNumber: string;
  guests: number;
  date: string;
  timeSlot: string;
  notes: string | null;
  confirmationCode: string | null;
  checkedInAt: string | null;
  status: string;
  paymentStatus: string | null;
  paymentAmountInr: number | null;
  stage: string;
  createdAt: string;
};

type DayPoint = {
  date: string;
  label: string;
  revenueInr: number;
  paidCount: number;
};

type BookingsResponse = {
  bookings: Booking[];
  counts: {
    total: number;
    awaitingPayment: number;
    paid: number;
    totalBookingsAllTime: number;
    paidBookingsAllTime: number;
    totalRevenueInr: number;
    todayBookings: number;
    todayRevenueInr: number;
  };
  revenueByDay: DayPoint[];
  refreshedAt: string;
};

function formatSlot(time24: string): string {
  if (!time24) return "—";
  const [h, m] = time24.split(":").map(Number);
  if (Number.isNaN(h)) return time24;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m || 0).padStart(2, "0")} ${period}`;
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatInr(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function stageColor(stage: string): string {
  if (stage === "Paid & confirmed") return "#34d399";
  if (stage === "At payment") return "#fbbf24";
  if (stage === "Cancelled") return "#f87171";
  return CLUB_ROGUE_THEME.orangeLight;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [outlet, setOutlet] = useState("all");
  const [data, setData] = useState<BookingsResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [live, setLive] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/bookings?outlet=${encodeURIComponent(outlet)}`,
        { cache: "no-store" }
      );
      if (res.status === 401) {
        router.replace("/admin");
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Failed to load");
        return;
      }
      setData(json as BookingsResponse);
      setError("");
    } catch {
      setError("Could not refresh bookings.");
    } finally {
      setLoading(false);
    }
  }, [outlet, router]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => void load(), 5000);
    return () => window.clearInterval(id);
  }, [live, load]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin");
  }

  const locality = useMemo(() => {
    const map = Object.fromEntries(CLUB_ROGUE_OUTLETS.map((o) => [o.brandId, o.locality]));
    return (brandId: string) => map[brandId] || brandId;
  }, []);

  const maxRevenue = useMemo(() => {
    const points = data?.revenueByDay ?? [];
    return Math.max(1, ...points.map((p) => p.revenueInr));
  }, [data?.revenueByDay]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/admin/scan"
        className="mb-5 flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-4 text-left shadow-lg shadow-orange-500/20"
        style={{
          background: `linear-gradient(135deg, ${CLUB_ROGUE_THEME.orangeLight}, ${CLUB_ROGUE_THEME.orange})`,
        }}
      >
        <div>
          <p className="font-[family-name:var(--font-display)] text-lg font-bold uppercase tracking-tight text-[#0c0604]">
            Open QR scanner
          </p>
          <p className="text-xs font-medium text-[#0c0604]/90">
            Door check-in · camera opens automatically
          </p>
        </div>
        <span className="rounded-full bg-black/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#0c0604]">
          Scan
        </span>
      </Link>

      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0">
            <Image src="/logos/club-rogue.png" alt="" fill className="object-contain" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight sm:text-2xl">
              Live bookings
            </h1>
            <p className="text-xs" style={{ color: CLUB_ROGUE_THEME.textDim }}>
              {data?.refreshedAt
                ? `Updated ${formatWhen(data.refreshedAt)} · auto-refresh ${live ? "on" : "off"}`
                : "Loading…"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setLive((v) => !v)}
            className="rounded-full border px-3 py-1.5 text-xs font-medium"
            style={{ borderColor: CLUB_ROGUE_THEME.border, color: CLUB_ROGUE_THEME.textMuted }}
          >
            {live ? "Pause live" : "Resume live"}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border px-3 py-1.5 text-xs font-medium"
            style={{ borderColor: CLUB_ROGUE_THEME.border, color: CLUB_ROGUE_THEME.textMuted }}
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-full px-3 py-1.5 text-xs font-semibold text-[#0c0604]"
            style={{ background: CLUB_ROGUE_THEME.orange }}
          >
            Log out
          </button>
        </div>
      </header>

      <div className="mb-5 flex flex-wrap gap-2">
        <FilterChip active={outlet === "all"} onClick={() => setOutlet("all")} label="All outlets" />
        {CLUB_ROGUE_OUTLETS.map((o) => (
          <FilterChip
            key={o.brandId}
            active={outlet === o.brandId}
            onClick={() => setOutlet(o.brandId)}
            label={o.locality}
          />
        ))}
      </div>

      {/* Overview */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <Stat
          label="Total bookings"
          value={data?.counts.totalBookingsAllTime ?? "—"}
        />
        <Stat
          label="Total revenue"
          value={
            data?.counts.totalRevenueInr != null
              ? formatInr(data.counts.totalRevenueInr)
              : "—"
          }
          accent="#34d399"
        />
        <Stat
          label="Today bookings"
          value={data?.counts.todayBookings ?? "—"}
          accent={CLUB_ROGUE_THEME.orangeLight}
        />
        <Stat
          label="Today revenue"
          value={
            data?.counts.todayRevenueInr != null
              ? formatInr(data.counts.todayRevenueInr)
              : "—"
          }
          accent="#34d399"
        />
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2 sm:gap-3">
        <Stat label="In list" value={data?.counts.total ?? "—"} />
        <Stat label="At payment" value={data?.counts.awaitingPayment ?? "—"} accent="#fbbf24" />
        <Stat label="Paid (list)" value={data?.counts.paid ?? "—"} accent="#34d399" />
      </div>

      {/* Payments section + graph */}
      <section
        id="payments"
        className="mb-8 rounded-2xl border px-4 py-5 sm:px-5"
        style={{ borderColor: CLUB_ROGUE_THEME.border, background: CLUB_ROGUE_THEME.surface }}
      >
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold uppercase tracking-tight text-white">
              Payments
            </h2>
            <p className="mt-0.5 text-xs" style={{ color: CLUB_ROGUE_THEME.textDim }}>
              Last 14 days · confirmation fees collected
            </p>
          </div>
          <p className="text-sm font-semibold text-emerald-300">
            {data?.counts.paidBookingsAllTime != null
              ? `${data.counts.paidBookingsAllTime} paid · ${formatInr(data.counts.totalRevenueInr)}`
              : "—"}
          </p>
        </div>

        {data?.revenueByDay?.length ? (
          <div className="mt-2">
            <div className="flex h-40 items-end gap-1 sm:gap-1.5">
              {data.revenueByDay.map((d) => {
                const h = Math.max(4, Math.round((d.revenueInr / maxRevenue) * 100));
                return (
                  <div key={d.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                    <span className="text-[9px] tabular-nums text-white/50">
                      {d.revenueInr > 0 ? `₹${Math.round(d.revenueInr)}` : ""}
                    </span>
                    <div
                      className="w-full max-w-[28px] rounded-t-md transition-all"
                      style={{
                        height: `${h}%`,
                        minHeight: d.revenueInr > 0 ? 8 : 4,
                        background:
                          d.revenueInr > 0
                            ? `linear-gradient(180deg, ${CLUB_ROGUE_THEME.orangeLight}, ${CLUB_ROGUE_THEME.orange})`
                            : "rgba(255,255,255,0.08)",
                      }}
                      title={`${d.label}: ₹${d.revenueInr} · ${d.paidCount} paid`}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex gap-1 sm:gap-1.5">
              {data.revenueByDay.map((d, i) => (
                <div
                  key={d.date}
                  className="min-w-0 flex-1 text-center text-[8px] uppercase tracking-wide sm:text-[9px]"
                  style={{ color: CLUB_ROGUE_THEME.textDim }}
                >
                  {i % 2 === 0 || data.revenueByDay.length <= 8 ? d.label.split(" ")[0] : ""}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-sm" style={{ color: CLUB_ROGUE_THEME.textMuted }}>
            No payment data yet for the chart.
          </p>
        )}
      </section>

      {error ? <p className="mb-4 text-sm text-red-300">{error}</p> : null}

      <h2 className="mb-3 font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.18em] text-white/80">
        Recent bookings
      </h2>

      {loading && !data ? (
        <p className="text-sm" style={{ color: CLUB_ROGUE_THEME.textMuted }}>
          Loading bookings…
        </p>
      ) : !data?.bookings.length ? (
        <p
          className="rounded-2xl border px-5 py-10 text-center text-sm"
          style={{ borderColor: CLUB_ROGUE_THEME.border, color: CLUB_ROGUE_THEME.textMuted }}
        >
          No bookings yet. When someone taps pay, their name and number will land here instantly.
        </p>
      ) : (
        <ul className="space-y-3">
          {data.bookings.map((b) => (
            <li
              key={b.id}
              className="rounded-2xl border px-4 py-4 sm:px-5"
              style={{
                borderColor: CLUB_ROGUE_THEME.border,
                background: CLUB_ROGUE_THEME.surface,
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">
                    {b.fullName}
                  </p>
                  <a
                    href={`tel:+91${b.contactNumber}`}
                    className="mt-0.5 inline-block text-sm font-medium tracking-wide"
                    style={{ color: CLUB_ROGUE_THEME.orangeLight }}
                  >
                    +91 {b.contactNumber}
                  </a>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{
                    color: stageColor(b.stage),
                    background: "rgba(0,0,0,0.35)",
                    border: `1px solid ${stageColor(b.stage)}55`,
                  }}
                >
                  {b.stage}
                </span>
              </div>

              <div
                className="mt-3 grid gap-1.5 text-sm sm:grid-cols-2"
                style={{ color: CLUB_ROGUE_THEME.textMuted }}
              >
                <p>
                  <span style={{ color: CLUB_ROGUE_THEME.textDim }}>Outlet · </span>
                  {locality(b.brandId)}
                </p>
                <p>
                  <span style={{ color: CLUB_ROGUE_THEME.textDim }}>When · </span>
                  {b.date} · {formatSlot(b.timeSlot)}
                </p>
                <p>
                  <span style={{ color: CLUB_ROGUE_THEME.textDim }}>Guests · </span>
                  {b.guests}
                </p>
                <p>
                  <span style={{ color: CLUB_ROGUE_THEME.textDim }}>Fee · </span>
                  {b.paymentAmountInr != null
                    ? `₹${b.paymentAmountInr}${b.paymentStatus === "PAID" ? " paid" : " pending"}`
                    : "—"}
                </p>
                {b.confirmationCode ? (
                  <p>
                    <span style={{ color: CLUB_ROGUE_THEME.textDim }}>Code · </span>
                    {b.confirmationCode}
                    {b.checkedInAt ? " · checked in" : ""}
                  </p>
                ) : null}
              </div>

              {b.notes ? (
                <p className="mt-2 text-xs leading-relaxed" style={{ color: CLUB_ROGUE_THEME.textDim }}>
                  {b.notes}
                </p>
              ) : null}

              <p
                className="mt-2 text-[10px] uppercase tracking-[0.18em]"
                style={{ color: "rgba(255,255,255,0.28)" }}
              >
                Entered {formatWhen(b.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors"
      style={
        active
          ? {
              background: CLUB_ROGUE_THEME.orange,
              color: "#0c0604",
            }
          : {
              background: CLUB_ROGUE_THEME.surface,
              color: CLUB_ROGUE_THEME.textMuted,
              border: `1px solid ${CLUB_ROGUE_THEME.border}`,
            }
      }
    >
      {label}
    </button>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div
      className="rounded-2xl border px-3 py-3 sm:px-4"
      style={{ borderColor: CLUB_ROGUE_THEME.border, background: CLUB_ROGUE_THEME.surface }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.2em]"
        style={{ color: CLUB_ROGUE_THEME.textDim }}
      >
        {label}
      </p>
      <p
        className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold sm:text-2xl"
        style={{ color: accent || "#fff" }}
      >
        {value}
      </p>
    </div>
  );
}
