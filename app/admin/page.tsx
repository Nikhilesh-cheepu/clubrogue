"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CLUB_ROGUE_THEME } from "@/lib/club-rogue-landing";

export default function AdminLoginPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => {
        if (r.ok) router.replace("/admin/dashboard");
      })
      .catch(() => {});
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Login failed.");
        return;
      }
      router.replace("/admin/dashboard");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-12">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="relative mb-4 h-14 w-14">
          <Image src="/logos/club-rogue.png" alt="Club Rogue" fill className="object-contain" />
        </div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold uppercase tracking-tight">
          Bookings admin
        </h1>
        <p className="mt-2 text-sm" style={{ color: CLUB_ROGUE_THEME.textMuted }}>
          Enter the staff passcode to see live bookings.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: CLUB_ROGUE_THEME.textDim }}>
            Passcode
          </span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="current-password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="w-full rounded-xl border bg-black/30 px-4 py-3 text-lg tracking-[0.35em] outline-none focus:border-orange-400"
            style={{ borderColor: CLUB_ROGUE_THEME.border }}
            placeholder="••••"
            maxLength={8}
          />
        </label>
        {error ? (
          <p className="text-sm text-red-300">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={loading || passcode.length < 4}
          className="w-full rounded-full py-3.5 text-sm font-semibold text-[#0c0604] disabled:opacity-50"
          style={{
            background: `linear-gradient(135deg, ${CLUB_ROGUE_THEME.orangeLight}, ${CLUB_ROGUE_THEME.orange})`,
          }}
        >
          {loading ? "Checking…" : "Open dashboard"}
        </button>
      </form>
    </main>
  );
}
