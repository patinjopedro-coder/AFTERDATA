import { supabase } from './supabase'

// Función para guardar un nuevo registro
export async function guardarRegistro(datosNuevoEquipo) {
  const { data, error } = await supabase
    .from('registros')
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
  const { data, error } = await supabase
    .from('registros')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error al cargar:', error.message)
    return []
  }

  return data
}
