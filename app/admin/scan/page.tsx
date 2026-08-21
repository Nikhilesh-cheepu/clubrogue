"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { CLUB_ROGUE_THEME } from "@/lib/club-rogue-landing";

type ValidateResult = {
  valid: boolean;
  paymentDone?: boolean;
  canCheckIn?: boolean;
  alreadyUsed?: boolean;
  reason?: string;
  state?: string;
  booking?: {
    bookingId: string;
    confirmationCode: string | null;
    fullName: string;
    contactNumber: string;
    brandName: string;
    date: string;
    timeSlot: string;
    guests: number;
    notes: string | null;
    status: string;
    checkedInAt: string | null;
  };
  payment?: {
    status: string;
    amountInr: number | null;
    razorpayPaymentId: string | null;
  };
};

function formatSlot(time24: string): string {
  if (!time24) return "—";
  const [h, m] = time24.split(":").map(Number);
  if (Number.isNaN(h)) return time24;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m || 0).padStart(2, "0")} ${period}`;
}

export default function AdminScanPage() {
  const router = useRouter();
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ValidateResult | null>(null);
  const [lastRaw, setLastRaw] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef("");

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => {
        if (!r.ok) router.replace("/admin");
      })
      .catch(() => router.replace("/admin"));
  }, [router]);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
      await scanner.clear();
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, [stopScanner]);

  const validate = useCallback(
    async (raw: string, checkIn = false) => {
      const text = raw.trim();
      if (!text) return;
      setBusy(true);
      setError("");
      setLastRaw(text);
      try {
        const res = await fetch("/api/admin/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raw: text, checkIn }),
        });
        if (res.status === 401) {
          router.replace("/admin");
          return;
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(typeof data.error === "string" ? data.error : "Validation failed");
          setResult(null);
          return;
        }
        setResult(data as ValidateResult);
      } catch {
        setError("Network error");
      } finally {
        setBusy(false);
      }
    },
    [router]
  );

  const startScanner = async () => {
    setError("");
    setResult(null);
    lastScanRef.current = "";
    try {
      await stopScanner();
      const scanner = new Html5Qrcode("admin-qr-reader");
      scannerRef.current = scanner;
      setScanning(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 } },
        (decoded) => {
          if (!decoded || decoded === lastScanRef.current) return;
          lastScanRef.current = decoded;
          void (async () => {
            await stopScanner();
            await validate(decoded, false);
          })();
        },
        () => {}
      );
    } catch (e) {
      console.error(e);
      setScanning(false);
      setError("Camera blocked or unavailable. Enter the code manually.");
    }
  };

  const paymentDone = Boolean(result?.paymentDone);
  const canCheckIn = Boolean(result?.canCheckIn);
  const alreadyUsed = Boolean(result?.alreadyUsed);
  const bannerOk = paymentDone && !alreadyUsed && result?.state !== "MOBILE_MISMATCH";

  return (
    <main className="mx-auto max-w-lg px-4 py-6 sm:px-6">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-tight">
            Door scan
          </h1>
          <p className="mt-1 text-xs" style={{ color: CLUB_ROGUE_THEME.textDim }}>
            BookMyShow-style — scan QR, confirm payment, check in once
          </p>
        </div>
        <Link
          href="/admin/dashboard"
          className="rounded-full border px-3 py-1.5 text-xs font-medium"
          style={{ borderColor: CLUB_ROGUE_THEME.border, color: CLUB_ROGUE_THEME.textMuted }}
        >
          Bookings
        </Link>
      </header>

      <div className="space-y-3">
        {!scanning ? (
          <button
            type="button"
            onClick={() => void startScanner()}
            className="w-full rounded-full py-3.5 text-sm font-semibold text-[#0c0604]"
            style={{ background: CLUB_ROGUE_THEME.orange }}
          >
            Open camera scanner
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void stopScanner()}
            className="w-full rounded-full border py-3 text-sm font-medium"
            style={{ borderColor: CLUB_ROGUE_THEME.border, color: CLUB_ROGUE_THEME.textMuted }}
          >
            Stop scanner
          </button>
        )}

        <div
          id="admin-qr-reader"
          className={`overflow-hidden rounded-2xl ${scanning ? "border" : "hidden"}`}
          style={{ borderColor: CLUB_ROGUE_THEME.border }}
        />

        <div className="pt-2">
          <label
            className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: CLUB_ROGUE_THEME.textDim }}
          >
            Or type confirmation code
          </label>
          <div className="flex gap-2">
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="CR-XXXXXX"
              className="min-w-0 flex-1 rounded-xl border bg-black/30 px-3 py-3 text-sm tracking-widest outline-none"
              style={{ borderColor: CLUB_ROGUE_THEME.border }}
            />
            <button
              type="button"
              disabled={busy || !manualCode.trim()}
              onClick={() => void validate(manualCode, false)}
              className="shrink-0 rounded-xl px-4 text-sm font-semibold text-[#0c0604] disabled:opacity-50"
              style={{ background: CLUB_ROGUE_THEME.orangeLight }}
            >
              Check
            </button>
          </div>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      {result ? (
        <div
          className="mt-6 overflow-hidden rounded-2xl border"
          style={{
            borderColor: alreadyUsed
              ? "rgba(248,113,113,0.4)"
              : bannerOk
                ? "rgba(52,211,153,0.4)"
                : "rgba(248,113,113,0.35)",
            background: alreadyUsed
              ? "rgba(239,68,68,0.1)"
              : bannerOk
                ? "rgba(16,185,129,0.12)"
                : "rgba(239,68,68,0.08)",
          }}
        >
          {/* Status strip — like BMS admit screen */}
          <div
            className="px-4 py-4 text-center"
            style={{
              background: alreadyUsed
                ? "rgba(239,68,68,0.25)"
                : paymentDone && bannerOk
                  ? "rgba(16,185,129,0.28)"
                  : "rgba(239,68,68,0.2)",
            }}
          >
            <p
              className="font-[family-name:var(--font-display)] text-xl font-bold uppercase tracking-wide"
              style={{
                color: alreadyUsed ? "#fca5a5" : paymentDone && bannerOk ? "#6ee7b7" : "#fca5a5",
              }}
            >
              {alreadyUsed
                ? "Already used"
                : paymentDone && bannerOk
                  ? "Payment done"
                  : result.state === "MOBILE_MISMATCH"
                    ? "Mobile mismatch"
                    : "Not valid"}
            </p>
            {result.reason ? (
              <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
                {result.reason}
              </p>
            ) : null}
          </div>

          {result.booking ? (
            <div className="px-4 py-5">
              <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
                {result.booking.fullName}
              </p>
              <a
                href={`tel:+91${result.booking.contactNumber}`}
                className="mt-1 inline-block text-lg font-semibold tracking-wide"
                style={{ color: CLUB_ROGUE_THEME.orangeLight }}
              >
                +91 {result.booking.contactNumber}
              </a>

              <dl className="mt-5 space-y-2.5 text-sm">
                <Row label="Guests allowed" value={String(result.booking.guests)} emphasize />
                <Row label="Outlet" value={result.booking.brandName} />
                <Row
                  label="When"
                  value={`${result.booking.date} · ${formatSlot(result.booking.timeSlot)}`}
                />
                <Row
                  label="Amount paid"
                  value={
                    result.payment?.amountInr != null
                      ? `₹${result.payment.amountInr}`
                      : "—"
                  }
                  emphasize={paymentDone}
                />
                <Row label="Code" value={result.booking.confirmationCode || "—"} />
                <Row label="Booking ID" value={result.booking.bookingId} />
                {result.booking.notes ? <Row label="Notes" value={result.booking.notes} /> : null}
                {result.booking.checkedInAt ? (
                  <Row
                    label="Checked in at"
                    value={new Date(result.booking.checkedInAt).toLocaleString("en-IN")}
                  />
                ) : null}
              </dl>

              {canCheckIn ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void validate(
                      lastRaw ||
                        result.booking!.confirmationCode ||
                        result.booking!.bookingId,
                      true
                    )
                  }
                  className="mt-6 w-full rounded-2xl py-4 text-base font-bold uppercase tracking-[0.14em] text-[#052e1a] shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #6ee7b7, #34d399)",
                  }}
                >
                  {busy ? "Checking in…" : "Check in"}
                </button>
              ) : null}

              {alreadyUsed ? (
                <p className="mt-4 text-center text-sm font-medium text-red-300">
                  This ticket was already checked in. Do not let another group reuse it.
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setLastRaw("");
                  void startScanner();
                }}
                className="mt-3 w-full rounded-full border py-3 text-sm font-medium"
                style={{ borderColor: CLUB_ROGUE_THEME.border, color: CLUB_ROGUE_THEME.textMuted }}
              >
                Scan next
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </main>
  );
}

function Row({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt style={{ color: CLUB_ROGUE_THEME.textDim }}>{label}</dt>
      <dd
        className={`max-w-[65%] break-words text-right ${emphasize ? "font-semibold text-emerald-300" : "text-white/90"}`}
      >
        {value}
      </dd>
    </div>
  );
}
