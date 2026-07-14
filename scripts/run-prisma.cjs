#!/usr/bin/env node
/**
 * Prisma CLI wrapper: sets DATABASE_URL to public when running outside Railway.
 */
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

const root = path.join(__dirname, "..");
loadEnvFile(path.join(root, ".env"));
loadEnvFile(path.join(root, ".env.local"));

const privateUrl = (process.env.DATABASE_URL || "").trim();
const publicUrl = (process.env.DATABASE_PUBLIC_URL || "").trim();
const onRailway = Boolean(
  process.env.RAILWAY_ENVIRONMENT ||
    process.env.RAILWAY_SERVICE_ID ||
    process.env.RAILWAY_PROJECT_ID
);

if (onRailway) {
  process.env.DATABASE_URL = privateUrl || publicUrl;
} else if (privateUrl.includes("railway.internal") && publicUrl) {
  process.env.DATABASE_URL = publicUrl;
} else {
  process.env.DATABASE_URL = privateUrl || publicUrl;
}

const args = process.argv.slice(2);
const result = spawnSync("npx", ["prisma", ...args], {
  stdio: "inherit",
  env: process.env,
  cwd: root,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
