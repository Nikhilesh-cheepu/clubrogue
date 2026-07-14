#!/usr/bin/env node
/** Ensure Prisma can validate schema even if build envs are delayed. */
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

if (!process.env.DATABASE_URL?.trim() && process.env.DATABASE_PUBLIC_URL?.trim()) {
  process.env.DATABASE_URL = process.env.DATABASE_PUBLIC_URL.trim();
}

if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = "postgresql://postgres:postgres@127.0.0.1:5432/postgres";
}

const result = spawnSync("npx", ["prisma", "generate", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
  cwd: root,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
