import { supabase, SUPABASE_TABLE_NAME, getSupabaseConfigError } from './supabase'

// Función para guardar un nuevo registro
export async function guardarRegistro(datosNuevoEquipo) {
  const configError = getSupabaseConfigError()
  if (configError || !supabase) {
    console.error(configError || 'No hay cliente de Supabase inicializado.')
    alert('Falta la configuración de Supabase. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.')
    return
  }

  const { data, error } = await supabase
    .from(SUPABASE_TABLE_NAME)
    .insert([
      {
        serial: datosNuevoEquipo.serial,
        razon_social: datosNuevoEquipo.razonSocial,
        fecha: datosNuevoEquipo.fecha
      }
    ])

  if (error) {
    console.error('Error al guardar:', error.message)
    alert('Hubo un error al guardar el registro.')
  } else {
    console.log('Guardado exitoso en la nube:', data)
    alert('¡Registro guardado con éxito!')
  }
}

// Función para cargar los registros en pantalla
export async function obtenerRegistros() {
  const configError = getSupabaseConfigError()
  if (configError || !supabase) {
    console.error(configError || 'No hay cliente de Supabase inicializado.')
    return []
  }

  const { data, error } = await supabase
    .from(SUPABASE_TABLE_NAME)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al cargar:', error.message)
    return []
  }

  return data
}
