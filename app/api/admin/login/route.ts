import { NextRequest, NextResponse } from "next/server";
import {
  createAdminSessionToken,
  resolveAdminPasscode,
  setAdminSessionCookie,
} from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const passcode = typeof body.passcode === "string" ? body.passcode.trim() : "";
  const scope = resolveAdminPasscode(passcode);
  if (!scope) {
    return NextResponse.json({ error: "Wrong passcode." }, { status: 401 });
  }

  const token = await createAdminSessionToken(scope);
  const res = NextResponse.json({ ok: true, brandIds: scope.brandIds });
  setAdminSessionCookie(res, token);
  return res;
}
