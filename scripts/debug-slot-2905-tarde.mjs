import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import dns from "node:dns";
import { Client } from "pg";

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

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const connectionString =
  process.env.SUPABASE_TRANSACTION_POOLER || process.env.SUPABASE_DIRECT_CONNECTION;
if (!connectionString) {
  console.error("Missing SUPABASE_TRANSACTION_POOLER or SUPABASE_DIRECT_CONNECTION in .env");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
  family: 4,
});

await client.connect();

// 1) Find slot in vista_disponibilidad_visitas for 29/05 (any year found by date)
const slotRes = await client.query(
  `
  select id_plani, fecha, tipo_turno, hora_inicio, hora_fin, anio, mes
  from public.vista_disponibilidad_visitas
  where fecha = $1 and lower(tipo_turno) like '%tarde%'
  order by id_plani asc
  `,
  ["2026-05-29"]
);

// 2) Check planificacion rows (source table) too
const planiRes = await client.query(
  `
  select p.id_plani, d.fecha, p.id_turno, t.tipo_turno
  from public.planificacion p
  join public.dias d on d.id_dia = p.id_dia
  join public.turnos t on t.id_turno = p.id_turno
  where d.fecha = $1
  order by p.id_plani asc
  `,
  ["2026-05-29"]
);

// 3) Check asignaciones for that date by join
const asigRes = await client.query(
  `
  select av.id_asignacion, av.id_plani, av.estado, av.nombre_institucion, av.created_at
  from public.asignaciones_visita av
  join public.planificacion p on p.id_plani = av.id_plani
  join public.dias d on d.id_dia = p.id_dia
  where d.fecha = $1
  order by av.created_at desc
  limit 30
  `,
  ["2026-05-29"]
);

const out = {
  slotRows: slotRes.rows,
  planificacionRows: planiRes.rows,
  asignacionesForDate: asigRes.rows,
};

const outPath = path.join(repoRoot, "scripts", "debug-slot-2905-tarde.json");
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");

await client.end();
