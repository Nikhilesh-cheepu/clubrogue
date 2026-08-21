import { NextRequest, NextResponse } from "next/server";
import { clearPaymentsUnlockCookie } from "@/lib/admin-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearPaymentsUnlockCookie(res);
  return res;
}
