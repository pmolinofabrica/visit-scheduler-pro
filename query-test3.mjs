import { createClient } from '@supabase/supabase-js';
const supabase = createClient("https://zgzqeusbpobrwanvktyz.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnenFldXNicG9icndhbnZrdHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNDg2OTksImV4cCI6MjA4MTcyNDY5OX0.F5KRxRDsKT88mAIwFwBXJLaldt8l0lDCT-vs80aCZ40");
async function run() {
  const { data, error } = await supabase.from('planificacion').select('id_plani, dias(fecha), id_turno').eq('dias.fecha', '2026-05-29');
  console.log("Planificacion:", data?.filter(x => x.dias), error);
}
run();
