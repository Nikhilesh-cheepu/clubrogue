import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { CLUB_ROGUE_BRAND_IDS } from "@/lib/club-rogue";

export const ADMIN_COOKIE = "admin_session";
const SESSION_TTL = "7d";

export type AdminScope = {
  kind: "outlet";
  brandIds: readonly string[];
};

const PASSCODE_TO_SCOPE: Record<string, AdminScope> = {
  "1010": { kind: "outlet", brandIds: CLUB_ROGUE_BRAND_IDS },
};

function getSecret(): Uint8Array {
  const raw =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.RAZORPAY_KEY_SECRET?.trim() ||
    "club-rogue-admin-dev-secret-change-me";
  return new TextEncoder().encode(raw);
}

export function resolveAdminPasscode(passcode: string): AdminScope | null {
  const key = String(passcode || "").trim();
  return PASSCODE_TO_SCOPE[key] ?? null;
}

export async function createAdminSessionToken(scope: AdminScope): Promise<string> {
  return new SignJWT({
    kind: scope.kind,
    brandIds: [...scope.brandIds],
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(getSecret());
}

export async function verifyAdminSessionToken(
  token: string
): Promise<AdminScope | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const brandIds = Array.isArray(payload.brandIds)
      ? payload.brandIds.filter((x): x is string => typeof x === "string")
      : [];
    if (brandIds.length === 0) return null;
    return { kind: "outlet", brandIds };
  } catch {
    return null;
  }
}

export async function getAdminScopeFromCookies(): Promise<AdminScope | null> {
  const jar = cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

export async function getAdminScopeFromRequest(
  req: NextRequest
): Promise<AdminScope | null> {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminSessionToken(token);
}

export function setAdminSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAdminSessionCookie(res: NextResponse) {
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
