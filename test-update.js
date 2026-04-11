import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://zgzqeusbpobrwanvktyz.supabase.co";
// using the ANON key from the file
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnenFldXNicG9icndhbnZrdHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDg2OTksImV4cCI6MjA4MTcyNDY5OX0.F5KRxRDsKT88mAIwFwBXJLaldt8l0lDCT-vs80aCZ40";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  const { data: sol, error: err1 } = await supabase.from('solicitudes').select('id, nombre_institucion').limit(1).single();
  if (err1) { console.error('Select error:', err1); return; }
  console.log('Selected:', sol);

  const { data, error } = await supabase
    .from('solicitudes')
    .update({ nombre_institucion: sol.nombre_institucion + ' test' })
    .eq('id', sol.id)
    .select();
  
  console.log('Update result:', data);
  if (error) console.error('Update error:', error);
  
  // Revert
  await supabase.from('solicitudes').update({ nombre_institucion: sol.nombre_institucion }).eq('id', sol.id);
}

test();
