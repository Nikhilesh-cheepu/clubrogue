"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/club-rogue/AdminNav";
import { CLUB_ROGUE_OUTLETS } from "@/lib/outlets";
import { CLUB_ROGUE_THEME } from "@/lib/club-rogue-landing";

type MonthRow = {
  month: string;
  label: string;
  revenueInr: number;
  paidCount: number;
};

type OutletRow = {
  brandId: string;
  label: string;
  revenueInr: number;
  paidCount: number;
};

type Summary = {
  locked?: boolean;
  totalRevenueInr: number;
  paidCount: number;
  todayRevenueInr: number;
  filteredRevenueInr: number;
  filteredPaidCount: number;
  monthFilter: string;
  outlet: string;
  byMonth: MonthRow[];
  byOutlet: OutletRow[];
  refreshedAt: string;
};

function formatInr(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function AdminPaymentsPage() {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [outlet, setOutlet] = useState("all");
  const [month, setMonth] = useState("all");
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ outlet, month });
      const res = await fetch(`/api/admin/payments/summary?${qs}`, { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/admin");
        return;
      }
      if (res.status === 403) {
        setUnlocked(false);
        setData(null);
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Failed to load");
        return;
      }
      setUnlocked(true);
      setData(json as Summary);
    } catch {
      setError("Could not load payments.");
    } finally {
      setLoading(false);
    }
  }, [outlet, month, router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onUnlock(e: FormEvent) {
    e.preventDefault();
    setUnlockError("");
    setUnlocking(true);
    try {
      const res = await fetch("/api/admin/payments/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUnlockError(typeof json.error === "string" ? json.error : "Wrong password");
        return;
      }
      setPasscode("");
      setUnlocked(true);
      await load();
    } catch {
      setUnlockError("Network error");
    } finally {
      setUnlocking(false);
    }
  }

  async function lockVault() {
    await fetch("/api/admin/payments/lock", { method: "POST" });
    setUnlocked(false);
    setData(null);
  }

  const maxMonthRevenue = useMemo(() => {
    const rows = data?.byMonth ?? [];
    return Math.max(1, ...rows.map((r) => r.revenueInr));
  }, [data?.byMonth]);

  const monthOptions = data?.byMonth ?? [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <AdminNav />

      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold uppercase tracking-tight">
          Payments
        </h1>
        <p className="mt-1 text-xs" style={{ color: CLUB_ROGUE_THEME.textDim }}>
          Revenue vault · password required
        </p>
      </header>

      {!unlocked ? (
        <form
          onSubmit={onUnlock}
          className="rounded-2xl border px-5 py-8"
          style={{ borderColor: CLUB_ROGUE_THEME.border, background: CLUB_ROGUE_THEME.surface }}
        >
          <p className="text-center text-sm" style={{ color: CLUB_ROGUE_THEME.textMuted }}>
            Enter the payments password to see total revenue.
          </p>
          <label className="mt-6 block">
            <span
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: CLUB_ROGUE_THEME.textDim }}
            >
              Payments password
            </span>
            <input
              type="password"
              inputMode="numeric"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-xl border bg-black/30 px-4 py-3 text-lg tracking-[0.2em] outline-none"
              style={{ borderColor: CLUB_ROGUE_THEME.border }}
              placeholder="••••••••••"
              autoComplete="off"
            />
          </label>
          {unlockError ? <p className="mt-2 text-sm text-red-300">{unlockError}</p> : null}
          <button
            type="submit"
            disabled={unlocking || passcode.length < 6}
            className="mt-5 w-full rounded-full py-3.5 text-sm font-semibold text-[#0c0604] disabled:opacity-50"
            style={{ background: CLUB_ROGUE_THEME.orange }}
          >
            {unlocking ? "Unlocking…" : "Unlock payments"}
          </button>
        </form>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs" style={{ color: CLUB_ROGUE_THEME.textDim }}>
              {data?.refreshedAt
                ? `Updated ${new Date(data.refreshedAt).toLocaleString("en-IN")}`
                : null}
            </p>
            <button
              type="button"
              onClick={() => void lockVault()}
              className="rounded-full border px-3 py-1.5 text-xs font-medium"
              style={{ borderColor: CLUB_ROGUE_THEME.border, color: CLUB_ROGUE_THEME.textMuted }}
            >
              Lock vault
            </button>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <Chip active={outlet === "all"} onClick={() => setOutlet("all")} label="All outlets" />
            {CLUB_ROGUE_OUTLETS.map((o) => (
              <Chip
                key={o.brandId}
                active={outlet === o.brandId}
                onClick={() => setOutlet(o.brandId)}
                label={o.locality}
              />
            ))}
          </div>

          <div className="mb-5">
            <label
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em]"
              style={{ color: CLUB_ROGUE_THEME.textDim }}
            >
              Month filter
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-xl border bg-black/40 px-3 py-3 text-sm outline-none sm:max-w-xs"
              style={{ borderColor: CLUB_ROGUE_THEME.border, color: "#fff" }}
            >
              <option value="all">All time</option>
              {monthOptions.map((m) => (
                <option key={m.month} value={m.month}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {error ? <p className="mb-3 text-sm text-red-300">{error}</p> : null}
          {loading && !data ? (
            <p className="text-sm" style={{ color: CLUB_ROGUE_THEME.textMuted }}>
              Loading…
            </p>
          ) : data ? (
            <>
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <StatCard
                  label="All-time total revenue"
                  value={formatInr(data.totalRevenueInr)}
                  sub={`${data.paidCount} paid bookings`}
                  big
                />
                <StatCard
                  label={month === "all" ? "Filtered (same as all-time)" : "Selected month revenue"}
                  value={formatInr(data.filteredRevenueInr)}
                  sub={`${data.filteredPaidCount} paid · today ${formatInr(data.todayRevenueInr)}`}
                />
              </div>

              <section
                className="mb-6 rounded-2xl border px-4 py-5"
                style={{ borderColor: CLUB_ROGUE_THEME.border, background: CLUB_ROGUE_THEME.surface }}
              >
                <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.16em] text-white">
                  Month-wise revenue
                </h2>
                {data.byMonth.length === 0 ? (
                  <p className="mt-6 text-center text-sm" style={{ color: CLUB_ROGUE_THEME.textMuted }}>
                    No paid bookings yet.
                  </p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {data.byMonth.map((row) => {
                      const pct = Math.round((row.revenueInr / maxMonthRevenue) * 100);
                      const highlighted = month === "all" || month === row.month;
                      return (
                        <li
                          key={row.month}
                          className={highlighted ? "opacity-100" : "opacity-40"}
                        >
                          <button
                            type="button"
                            onClick={() => setMonth(row.month === month ? "all" : row.month)}
                            className="w-full text-left"
                          >
                            <div className="mb-1 flex justify-between gap-2 text-sm">
                              <span className="font-medium text-white">{row.label}</span>
                              <span className="font-semibold text-emerald-300">
                                {formatInr(row.revenueInr)}
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.max(4, pct)}%`,
                                  background: `linear-gradient(90deg, ${CLUB_ROGUE_THEME.orangeLight}, ${CLUB_ROGUE_THEME.orange})`,
                                }}
                              />
                            </div>
                            <p
                              className="mt-1 text-[10px] uppercase tracking-wide"
                              style={{ color: CLUB_ROGUE_THEME.textDim }}
                            >
                              {row.paidCount} paid
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {data.byOutlet.length > 0 ? (
                <section
                  className="rounded-2xl border px-4 py-5"
                  style={{
                    borderColor: CLUB_ROGUE_THEME.border,
                    background: CLUB_ROGUE_THEME.surface,
                  }}
                >
                  <h2 className="font-[family-name:var(--font-display)] text-sm font-bold uppercase tracking-[0.16em] text-white">
                    By outlet
                    {month !== "all" ? " · filtered month" : ""}
                  </h2>
                  <ul className="mt-4 space-y-2">
                    {data.byOutlet.map((o) => (
                      <li
                        key={o.brandId}
                        className="flex justify-between gap-3 border-b py-2 text-sm last:border-0"
                        style={{ borderColor: CLUB_ROGUE_THEME.borderSubtle }}
                      >
                        <span style={{ color: CLUB_ROGUE_THEME.textMuted }}>{o.label}</span>
                        <span className="font-semibold text-white">
                          {formatInr(o.revenueInr)}{" "}
                          <span className="font-normal text-white/40">· {o.paidCount}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </>
          ) : null}
        </>
      )}
    </main>
  );
}

function Chip({
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
      className="rounded-full px-3.5 py-1.5 text-xs font-semibold"
      style={
        active
          ? { background: CLUB_ROGUE_THEME.orange, color: "#0c0604" }
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

function StatCard({
  label,
  value,
  sub,
  big,
}: {
  label: string;
  value: string;
  sub?: string;
  big?: boolean;
}) {
  return (
    <div
      className="rounded-2xl border px-4 py-4"
      style={{ borderColor: CLUB_ROGUE_THEME.border, background: CLUB_ROGUE_THEME.surface }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.2em]"
        style={{ color: CLUB_ROGUE_THEME.textDim }}
      >
        {label}
      </p>
      <p
        className={`mt-2 font-[family-name:var(--font-display)] font-bold text-emerald-300 ${big ? "text-3xl" : "text-2xl"}`}
      >
        {value}
      </p>
      {sub ? (
        <p className="mt-1 text-xs" style={{ color: CLUB_ROGUE_THEME.textMuted }}>
          {sub}
        </p>
      ) : null}
    </div>
  );
}
