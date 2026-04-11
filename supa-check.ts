import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: sol, error: errSol } = await supabase.from('solicitudes').select('*');
  console.log('solicitudes count:', sol?.length, errSol?.message);
  
  const { data: asig, error: errAsig } = await supabase.from('asignaciones_visita').select('*');
  console.log('asignaciones count:', asig?.length, errAsig?.message);
}
check();
