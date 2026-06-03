import { supabase } from './supabaseClient';

export async function getDBItem<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const { data, error } = await supabase
      .from('app_data')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) throw error;

    if (data && data.value !== undefined) {
      return data.value as T;
    }

    const localRaw = localStorage.getItem(key);
    if (localRaw !== null) {
      try {
        const parsed = JSON.parse(localRaw) as T;
        await setDBItem(key, parsed);
        localStorage.removeItem(key);
        return parsed;
      } catch (e) {
        return defaultValue;
      }
    }

    return defaultValue;
  } catch (error) {
    console.error(`Error al leer la clave [${key}] desde Supabase, usando localStorage como respaldo:`, error);
    const localRaw = localStorage.getItem(key);
    if (localRaw !== null) {
      try {
        return JSON.parse(localRaw) as T;
      } catch (e) {
        return defaultValue;
      }
    }
    return defaultValue;
  }
}

export async function setDBItem<T>(key: string, value: T): Promise<void> {
  try {
    const { error } = await supabase
      .from('app_data')
      .upsert(
        { key: key, value: value, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    if (error) throw error;
  } catch (error) {
    console.error(`Error al guardar la clave [${key}] en Supabase, respaldando en localStorage:`, error);
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Error crítico: No se pudo respaldar en localStorage", e);
    }
  }
}
