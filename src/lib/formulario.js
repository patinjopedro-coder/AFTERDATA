import { guardarRegistro } from './registros'

export async function handleSubmitRegistro(event, mapDatos = (datos) => datos) {
  event.preventDefault()

  const form = event.currentTarget
  const formData = new FormData(form)

  const datosNuevoEquipo = {
    serial: formData.get('serial')?.toString().trim() ?? '',
    razonSocial: formData.get('razon_social')?.toString().trim() ?? '',
    fecha: formData.get('fecha')?.toString().trim() ?? ''
  }

  try {
    await guardarRegistro(mapDatos(datosNuevoEquipo))
    form.reset()
  } catch (error) {
    console.error('Error en el submit:', error)
  }
}
