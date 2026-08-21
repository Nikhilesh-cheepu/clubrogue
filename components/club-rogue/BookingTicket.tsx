"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { buildTicketQrPayload } from "@/lib/confirmation-code";
import { CLUB_ROGUE_THEME } from "@/lib/club-rogue-landing";

export type BookingTicketInfo = {
  confirmationCode: string;
  bookingId: string;
  contactNumber: string;
  venueName?: string;
  guests?: number;
};

export default function BookingTicket({
  ticket,
  onBookAnother,
}: {
  ticket: BookingTicketInfo;
  onBookAnother: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const payload = buildTicketQrPayload({
    confirmationCode: ticket.confirmationCode,
    reservationId: ticket.bookingId,
    contactNumber: ticket.contactNumber,
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const url = await QRCode.toDataURL(payload, {
          width: 280,
          margin: 2,
          color: { dark: "#0c0604", light: "#ffffff" },
        });
        if (!cancelled) setQrDataUrl(url);
      } catch (e) {
        console.error("[BookingTicket] QR generate failed", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [payload]);

  const downloadTicket = useCallback(async () => {
    setDownloadError(null);
    try {
      const canvas = canvasRef.current ?? document.createElement("canvas");
      const width = 720;
      const height = 1020;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");

      ctx.fillStyle = "#0f0a09";
      ctx.fillRect(0, 0, width, height);
      const glow = ctx.createRadialGradient(width / 2, 0, 20, width / 2, 120, 420);
      glow.addColorStop(0, "rgba(249,115,22,0.35)");
      glow.addColorStop(1, "transparent");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#FAFAF9";
      ctx.font = "bold 42px Syne, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Club Rogue", width / 2, 90);

      ctx.fillStyle = "#FB923C";
      ctx.font = "600 22px DM Sans, Arial, sans-serif";
      ctx.fillText("TABLE CONFIRMED", width / 2, 140);

      if (ticket.venueName) {
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.font = "500 20px DM Sans, Arial, sans-serif";
        ctx.fillText(ticket.venueName, width / 2, 180);
      }

      const qrUrl =
        qrDataUrl ||
        (await QRCode.toDataURL(payload, {
          width: 360,
          margin: 2,
          color: { dark: "#0c0604", light: "#ffffff" },
        }));
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("QR image failed"));
        img.src = qrUrl;
      });
      const qrSize = 360;
      const qrX = (width - qrSize) / 2;
      const qrY = 210;
      ctx.fillStyle = "#fff";
      ctx.fillRect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 32);
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

      let y = qrY + qrSize + 70;
      ctx.fillStyle = "#FAFAF9";
      ctx.font = "bold 36px Syne, Arial, sans-serif";
      ctx.fillText(ticket.confirmationCode, width / 2, y);

      y += 32;
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.font = "500 18px DM Sans, Arial, sans-serif";
      ctx.fillText("Confirmation code", width / 2, y);

      y += 48;
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.font = "600 22px DM Sans, Arial, sans-serif";
      ctx.fillText(`+91 ${ticket.contactNumber}`, width / 2, y);

      y += 36;
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.font = "500 18px DM Sans, Arial, sans-serif";
      ctx.fillText(`Booking ID · ${ticket.bookingId}`, width / 2, y);

      if (ticket.guests) {
        y += 36;
        ctx.fillText(`${ticket.guests} guest${ticket.guests === 1 ? "" : "s"}`, width / 2, y);
      }

      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "400 16px DM Sans, Arial, sans-serif";
      ctx.fillText("Show this QR at the door · one-time entry", width / 2, height - 50);

      const link = document.createElement("a");
      link.download = `club-rogue-${ticket.confirmationCode}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error(e);
      setDownloadError("Could not download ticket. Try again.");
    }
  }, [
    payload,
    qrDataUrl,
    ticket.bookingId,
    ticket.confirmationCode,
    ticket.contactNumber,
    ticket.guests,
    ticket.venueName,
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border px-5 py-8 text-center backdrop-blur-xl"
      style={{
        borderColor: "rgba(52, 211, 153, 0.25)",
        background: "rgba(16, 185, 129, 0.08)",
      }}
    >
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-xl text-emerald-300">
        ✓
      </div>
      <p className="text-xl font-semibold text-white">You&apos;re in</p>
      <p className="mt-1.5 text-sm" style={{ color: CLUB_ROGUE_THEME.textMuted }}>
        Ticket locked to your mobile — download &amp; show at the door
      </p>

      <div className="mx-auto mt-6 inline-block rounded-2xl bg-white p-3">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="Booking QR code" className="h-44 w-44" />
        ) : (
          <div className="flex h-44 w-44 items-center justify-center text-xs text-stone-500">
            Generating QR…
          </div>
        )}
      </div>

      <p className="mt-5 font-[family-name:var(--font-display)] text-2xl font-bold tracking-[0.12em] text-white">
        {ticket.confirmationCode}
      </p>
      <p
        className="mt-1 text-[10px] uppercase tracking-[0.22em]"
        style={{ color: CLUB_ROGUE_THEME.textDim }}
      >
        Confirmation code
      </p>

      <p className="mt-4 text-sm font-medium" style={{ color: CLUB_ROGUE_THEME.orangeLight }}>
        +91 {ticket.contactNumber}
      </p>
      <p className="mt-2 break-all text-xs" style={{ color: CLUB_ROGUE_THEME.textMuted }}>
        Booking ID · {ticket.bookingId}
      </p>
      {ticket.guests ? (
        <p className="mt-1 text-xs" style={{ color: CLUB_ROGUE_THEME.textDim }}>
          {ticket.guests} guest{ticket.guests === 1 ? "" : "s"}
        </p>
      ) : null}

      <p className="mt-3 text-xs leading-relaxed" style={{ color: CLUB_ROGUE_THEME.textDim }}>
        One-time entry after staff check-in. ₹2,000 cover per person redeemable on F&amp;B.
      </p>

      {downloadError ? <p className="mt-2 text-xs text-red-300">{downloadError}</p> : null}

      <button
        type="button"
        onClick={() => void downloadTicket()}
        className="mt-6 w-full rounded-full py-3 text-sm font-semibold text-[#0c0604]"
        style={{ background: CLUB_ROGUE_THEME.orange }}
      >
        Download QR ticket
      </button>
      <button
        type="button"
        onClick={onBookAnother}
        className="mt-3 w-full rounded-full border py-3 text-sm font-medium"
        style={{ borderColor: CLUB_ROGUE_THEME.border, color: CLUB_ROGUE_THEME.textMuted }}
      >
        Book another
      </button>

      <canvas ref={canvasRef} className="hidden" aria-hidden />
    </motion.div>
  );
}
