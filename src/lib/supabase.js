import { createClient } from '@supabase/supabase-js'

const viteEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}

// Estas líneas leen automáticamente las variables que guardamos en Vercel y en tu entorno local
// Soportamos tanto VITE_ (Vite) como NEXT_PUBLIC_ (Vercel/Supabase integration)
const rawSupabaseUrl = viteEnv.VITE_SUPABASE_URL?.trim() || viteEnv.NEXT_PUBLIC_SUPABASE_URL?.trim()
const rawSupabaseAnonKey = viteEnv.VITE_SUPABASE_ANON_KEY?.trim() || viteEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || viteEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()
const rawTableName = viteEnv.VITE_SUPABASE_TABLE_NAME?.trim() || viteEnv.NEXT_PUBLIC_SUPABASE_TABLE_NAME?.trim() || 'registros'

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
