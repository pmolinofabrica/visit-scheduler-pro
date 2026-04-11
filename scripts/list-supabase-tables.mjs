import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import dns from "node:dns";
import net from "node:net";

function loadDotEnv(dotenvPath) {
  if (!fs.existsSync(dotenvPath)) return;
  const raw = fs.readFileSync(dotenvPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
loadDotEnv(path.join(repoRoot, ".env"));

const directConn = process.env.SUPABASE_DIRECT_CONNECTION;
const poolerConn = process.env.SUPABASE_TRANSACTION_POOLER;
if (!directConn && !poolerConn) {
  console.error(
    "Missing SUPABASE_DIRECT_CONNECTION and SUPABASE_TRANSACTION_POOLER. Ensure .env exists and contains at least one."
  );
  process.exit(1);
}

// Your network DNS may refuse supabase.co; force public resolvers for this script.
dns.setServers(["1.1.1.1", "8.8.8.8"]);

let Client;
try {
  ({ Client } = await import("pg"));
} catch {
  console.error(
    "Missing dependency 'pg'. Install it with: npm i -D pg (or npm i pg)."
  );
  process.exit(1);
}

function parseHostFromConnectionString(cs) {
  const u = new URL(cs);
  return u.hostname;
}

async function resolveIpv4(hostname) {
  try {
    const res = await dns.promises.lookup(hostname, { family: 4 });
    return res.address;
  } catch {
    return null;
  }
}

function canReachIpv4(address, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: address, port, timeout: 8000 }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function pickConnectionString() {
  // Try DIRECT first, then fall back to pooler (often has IPv4).
  for (const cs of [directConn, poolerConn].filter(Boolean)) {
    const host = parseHostFromConnectionString(cs);
    const ip4 = await resolveIpv4(host);
    if (!ip4) continue;
    // Default Postgres port is in the URL; if absent, assume 5432.
    const port = Number(new URL(cs).port || "5432");
    if (!(await canReachIpv4(ip4, port))) continue;
    return { cs, host, ip4, port };
  }
  return null;
}

const picked = await pickConnectionString();
if (!picked) {
  console.error(
    "Could not resolve/reach Supabase Postgres over IPv4. Likely DNS restrictions or IPv6-only endpoint."
  );
  process.exit(1);
}

// Force the connection to use the resolved IPv4 (bypasses system DNS issues).
const client = new Client({
  connectionString: picked.cs,
  ssl: { rejectUnauthorized: false },
  host: picked.host,
  hostaddr: picked.ip4,
  port: picked.port,
  family: 4,
});
await client.connect();

const { rows } = await client.query(
  `
  select schemaname, tablename
  from pg_catalog.pg_tables
  where schemaname not in ('pg_catalog', 'information_schema')
  order by schemaname, tablename;
  `
);

const outPath = path.join(repoRoot, "scripts", "supabase-tables.txt");
const lines = rows.map((r) => `${r.schemaname}.${r.tablename}`);
fs.writeFileSync(outPath, lines.join("\n") + (lines.length ? "\n" : ""), "utf8");

await client.end();
