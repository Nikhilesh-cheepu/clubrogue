"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import AdminNav from "@/components/club-rogue/AdminNav";
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
  const [authed, setAuthed] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ValidateResult | null>(null);
  const [lastRaw, setLastRaw] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef("");
  const startingRef = useRef(false);

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

  const startScanner = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    setError("");
    setResult(null);
    lastScanRef.current = "";
    try {
      await stopScanner();
      // Keep reader mounted & visible before Html5Qrcode attaches
      setScanning(true);
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      await new Promise<void>((r) => setTimeout(r, 50));

      const el = document.getElementById("admin-qr-reader");
      if (!el) throw new Error("Scanner mount missing");

      const scanner = new Html5Qrcode("admin-qr-reader");
      scannerRef.current = scanner;

      const cameras = await Html5Qrcode.getCameras();
      const backCam =
        cameras.find((c) => /back|rear|environment/i.test(c.label)) ||
        cameras[cameras.length - 1];
      const cameraId = backCam?.id || { facingMode: "environment" as const };

      await scanner.start(
        cameraId,
        { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1 },
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
      console.error("[admin-scan]", e);
      setScanning(false);
      const name = e && typeof e === "object" && "name" in e ? String((e as { name: string }).name) : "";
      if (name === "NotAllowedError" || /permission|NotAllowed/i.test(String(e))) {
        setError("Allow camera access for clubrogue.in in browser settings, then tap Retry camera.");
      } else {
        setError("Could not open camera. Tap Retry camera, or type the code below.");
      }
    } finally {
      startingRef.current = false;
    }
  }, [stopScanner, validate]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/me")
      .then((r) => {
        if (!r.ok) {
          router.replace("/admin");
          return;
        }
        if (!cancelled) setAuthed(true);
      })
      .catch(() => router.replace("/admin"));
    return () => {
      cancelled = true;
    };
  }, [router]);

  // Open camera as soon as staff lands on this page
  useEffect(() => {
    if (!authed) return;
    void startScanner();
    return () => {
      void stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount once when authed
  }, [authed]);

  const paymentDone = Boolean(result?.paymentDone);
  const canCheckIn = Boolean(result?.canCheckIn);
  const alreadyUsed = Boolean(result?.alreadyUsed);
  const bannerOk = paymentDone && !alreadyUsed && result?.state !== "MOBILE_MISMATCH";

  return (
    <main className="mx-auto max-w-lg px-4 pb-10 pt-4 sm:px-6">
      <AdminNav />

      <header className="mb-4">
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold uppercase tracking-tight text-white">
          Scan ticket
        </h1>
        <p className="mt-0.5 text-xs" style={{ color: CLUB_ROGUE_THEME.textDim }}>
          Point at guest QR · payment check · check in
        </p>
      </header>

      {/* Camera first — always mounted so auto-start works */}
      <div
        className="overflow-hidden rounded-2xl border"
        style={{
          borderColor: CLUB_ROGUE_THEME.border,
          background: "#000",
          minHeight: scanning || !result ? 280 : 0,
        }}
      >
        <div id="admin-qr-reader" className="w-full overflow-hidden [&_video]:!w-full" />
        {!scanning && !result ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 px-4 py-10 text-center">
            <p className="text-sm" style={{ color: CLUB_ROGUE_THEME.textMuted }}>
              Starting camera…
            </p>
          </div>
        ) : null}
      </div>

      {scanning ? (
        <p className="mt-2 text-center text-[11px] uppercase tracking-[0.2em]" style={{ color: CLUB_ROGUE_THEME.orangeLight }}>
          Camera live — align QR inside the box
        </p>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-3 text-center">
          <p className="text-sm text-red-200">{error}</p>
          <button
            type="button"
            onClick={() => void startScanner()}
            className="mt-3 w-full rounded-full py-3 text-sm font-semibold text-[#0c0604]"
            style={{ background: CLUB_ROGUE_THEME.orange }}
          >
            Retry camera
          </button>
        </div>
      ) : null}

      {result ? (
        <div
          className="mt-4 overflow-hidden rounded-2xl border"
          style={{
            borderColor: alreadyUsed
              ? "rgba(248,113,113,0.45)"
              : bannerOk
                ? "rgba(52,211,153,0.45)"
                : "rgba(248,113,113,0.35)",
          }}
        >
          <div
            className="px-4 py-5 text-center"
            style={{
              background: alreadyUsed
                ? "rgba(239,68,68,0.28)"
                : paymentDone && bannerOk
                  ? "rgba(16,185,129,0.32)"
                  : "rgba(239,68,68,0.22)",
            }}
          >
            <p
              className="font-[family-name:var(--font-display)] text-2xl font-bold uppercase tracking-wide"
              style={{
                color: alreadyUsed ? "#fecaca" : paymentDone && bannerOk ? "#6ee7b7" : "#fecaca",
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
              <p className="mt-1 text-sm text-white/70">{result.reason}</p>
            ) : null}
          </div>

          {result.booking ? (
            <div className="bg-black/40 px-4 py-5">
              <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">
                {result.booking.fullName}
              </p>
              <a
                href={`tel:+91${result.booking.contactNumber}`}
                className="mt-1 inline-block text-lg font-semibold"
                style={{ color: CLUB_ROGUE_THEME.orangeLight }}
              >
                +91 {result.booking.contactNumber}
              </a>

              <dl className="mt-4 space-y-2 text-sm">
                <Row label="Guests" value={String(result.booking.guests)} emphasize />
                <Row label="Outlet" value={result.booking.brandName} />
                <Row
                  label="When"
                  value={`${result.booking.date} · ${formatSlot(result.booking.timeSlot)}`}
                />
                <Row
                  label="Paid"
                  value={
                    result.payment?.amountInr != null ? `₹${result.payment.amountInr}` : "—"
                  }
                  emphasize={paymentDone}
                />
                <Row label="Code" value={result.booking.confirmationCode || "—"} />
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
                  className="mt-5 w-full rounded-2xl py-4 text-base font-bold uppercase tracking-[0.16em] text-[#052e1a] disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #6ee7b7, #22c55e)" }}
                >
                  {busy ? "Checking in…" : "Check in"}
                </button>
              ) : null}

              {alreadyUsed ? (
                <p className="mt-4 text-center text-sm font-medium text-red-300">
                  Already checked in — do not admit again with this QR.
                </p>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setLastRaw("");
                  void startScanner();
                }}
                className="mt-3 w-full rounded-full border py-3 text-sm font-semibold"
                style={{ borderColor: CLUB_ROGUE_THEME.border, color: CLUB_ROGUE_THEME.textMuted }}
              >
                Scan next guest
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 border-t pt-5" style={{ borderColor: CLUB_ROGUE_THEME.borderSubtle }}>
        <label
          className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: CLUB_ROGUE_THEME.textDim }}
        >
          Manual code backup
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
