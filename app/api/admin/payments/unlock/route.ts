import { NextRequest, NextResponse } from "next/server";
import {
  createPaymentsUnlockToken,
  getAdminScopeFromRequest,
  isPaymentsPasscode,
  setPaymentsUnlockCookie,
} from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const scope = await getAdminScopeFromRequest(req);
  if (!scope) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const passcode = typeof body.passcode === "string" ? body.passcode.trim() : "";
  if (!isPaymentsPasscode(passcode)) {
    return NextResponse.json({ error: "Wrong payments password." }, { status: 401 });
  }

  const token = await createPaymentsUnlockToken();
  const res = NextResponse.json({ ok: true });
  setPaymentsUnlockCookie(res, token);
  return res;
}
