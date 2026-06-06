import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fxobwjouwpwkkyfeleog.supabase.co';
const supabaseAnonKey = 'sb_publishable_aojBCYarUIxP20t-_J6MnA_QbAxqJFx';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  try {
    console.log("Intentando conectar a Supabase...");
    const { data, error } = await supabase
      .from('app_data')
      .select('*')
      .limit(1);

    if (error) {
      console.error("Error en consulta a app_data:", error);
    } else {
      console.log("Consulta exitosa! Datos:", data);
    }
  } catch (err) {
    console.error("Error inesperado:", err);
  }
}

test();
