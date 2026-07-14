/** Pick Railway private URL when deployed; public URL when developing locally. */
export function resolveDatabaseUrl(): string {
  const privateUrl = process.env.DATABASE_URL?.trim() || "";
  const publicUrl = process.env.DATABASE_PUBLIC_URL?.trim() || "";

  const onRailway = Boolean(
    process.env.RAILWAY_ENVIRONMENT ||
      process.env.RAILWAY_SERVICE_ID ||
      process.env.RAILWAY_PROJECT_ID
  );

  if (onRailway) {
    return privateUrl || publicUrl;
  }

  if (privateUrl.includes("railway.internal") && publicUrl) {
    return publicUrl;
  }

  return privateUrl || publicUrl;
}
