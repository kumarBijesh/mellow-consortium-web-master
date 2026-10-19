#!/usr/bin/env node
// Checks every supabase/*.sql file against the LIVE database and reports
// which ones have actually been run. Exists because "wrote the migration
// file" and "the migration is live" have been two separate, easy-to-forget
// steps — this collapses them into one command instead of a manual
// REST-API 404 check every time a form mysteriously breaks.
//
// Usage: node scripts/check-migrations.mjs   (or: npm run check-migrations)
//
// How it works: regex-parses each file for `create table <name>` and
// `alter table <name> add column ... <col>` statements, then checks the
// live schema (via PostgREST's OpenAPI root document, which needs the
// service_role key) for whether each referenced table/column exists.
// A file with no detected `create table`/`add column` statements (e.g.
// pure RLS-policy or data-only files) is reported as "not verifiable" —
// that's not a failure, just outside what this script can check.

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function loadEnvLocal() {
  const path = join(root, ".env.local");
  const env = {};
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) env[m[1]] = m[2].trim();
    }
  } catch {
    // no .env.local — fall through to process.env
  }
  return env;
}

const env = { ...loadEnvLocal(), ...process.env };
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (checked .env.local and process.env).");
  process.exit(1);
}

const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
  headers: { apikey: SERVICE_ROLE_KEY, Authorization: `Bearer ${SERVICE_ROLE_KEY}` },
});
if (!res.ok) {
  console.error(`Could not fetch live schema: ${res.status} ${await res.text()}`);
  process.exit(1);
}
const schema = await res.json();
const liveTables = schema.definitions ?? {};

const sqlDir = join(root, "supabase");
const files = readdirSync(sqlDir).filter((f) => f.endsWith(".sql")).sort();

let anyPending = false;

for (const file of files) {
  const sql = readFileSync(join(sqlDir, file), "utf8");

  const createdTables = [...sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?"?(\w+)"?/gi)].map((m) => m[1]);

  // Each `alter table X ... ;` statement, parsed as one block so every
  // `add column` line inside it (comma-separated, one per line) maps
  // back to the right table.
  const addedColumns = [...sql.matchAll(/alter\s+table\s+"?(\w+)"?([\s\S]*?);/gi)].flatMap(([, table, block]) =>
    [...block.matchAll(/add\s+column\s+(?:if\s+not\s+exists\s+)?"?(\w+)"?/gi)].map((m) => ({ table, col: m[1] }))
  );

  if (createdTables.length === 0 && addedColumns.length === 0) {
    console.log(`—  ${file}  (no create table / add column detected — not verifiable by this script)`);
    continue;
  }

  const missing = [];
  for (const t of createdTables) {
    if (!liveTables[t]) missing.push(`table ${t}`);
  }
  for (const { table, col } of addedColumns) {
    const props = liveTables[table]?.properties ?? {};
    if (liveTables[table] && !(col in props)) missing.push(`column ${table}.${col}`);
    else if (!liveTables[table]) missing.push(`column ${table}.${col} (table itself missing)`);
  }

  if (missing.length === 0) {
    console.log(`✅ ${file}`);
  } else {
    anyPending = true;
    console.log(`❌ ${file}  — missing: ${[...new Set(missing)].join(", ")}`);
  }
}

console.log("");
console.log(anyPending ? "Some migrations are pending — run the ❌ files in the Supabase SQL Editor." : "All checkable migrations are live.");
process.exit(anyPending ? 1 : 0);
