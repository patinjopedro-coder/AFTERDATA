import { createClient } from '@supabase/supabase-js'

// Estas líneas leen automáticamente las variables que guardamos en Vercel y en tu entorno local
// Soportamos tanto VITE_ (Vite) como NEXT_PUBLIC_ (Vercel/Supabase integration)
const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || import.meta.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
const rawTableName = import.meta.env.VITE_SUPABASE_TABLE_NAME?.trim() || import.meta.env.NEXT_PUBLIC_SUPABASE_TABLE_NAME?.trim() || 'registros'

const supabaseUrl = rawSupabaseUrl?.replace(/\/+$/, '') || ''
const supabaseAnonKey = rawSupabaseAnonKey || ''

export const SUPABASE_TABLE_NAME = rawTableName

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export function getSupabaseConfigError() {
  if (!supabaseUrl) return 'Falta VITE_SUPABASE_URL en las variables de entorno.'
  if (!supabaseAnonKey) return 'Falta VITE_SUPABASE_ANON_KEY en las variables de entorno.'
  return null
}
