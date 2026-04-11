import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf-8')
    .split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('='))
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase
    .from('solicitudes')
    .select('id, nombre_institucion, estado_actual, marca_temporal, created_at')
    .ilike('estado_actual', 'pendiente%');
    
  console.log("Error:", error);
  console.log("Data total length:", data ? data.length : 0);
  console.log("Data:", JSON.stringify(data, null, 2));
}

run();
