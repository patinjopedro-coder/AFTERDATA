import { createClient } from '@supabase/supabase-js'

// Estas líneas leen automáticamente las variables que guardamos en Vercel y en tu entorno local
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
