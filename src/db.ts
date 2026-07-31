import { supabase, SUPABASE_TABLE_NAME, getSupabaseConfigError } from './lib/supabase';

function serializeValue<T>(value: T): string {
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function parseValue<T>(value: unknown, fallback: T): T {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }
  return value as T;
}

export async function getDBItem<T>(key: string, defaultValue: T): Promise<T> {
  const configError = getSupabaseConfigError();
  if (!configError && supabase) {
    try {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE_NAME)
        .select('key, value')
        .eq('key', key)
        .maybeSingle();

      if (!error && data?.value !== undefined && data?.value !== null) {
        const parsed = parseValue<T>(data.value, defaultValue);
        setLocalItem(key, parsed);
        return parsed;
      }
    } catch (e) {
      console.warn(`Error al leer desde Supabase para [${key}], cayendo a almacenamiento local:`, e);
    }
  }

  // 1. Probar IndexedDB primero (sin límites de tamaño)
  try {
    const idbVal = await getLocalItem<T | null>(key, null);
    if (idbVal !== null && idbVal !== undefined) {
      return idbVal as T;
    }
  } catch (e) {
    console.warn(`Error al leer desde IndexedDB para [${key}]:`, e);
  }

  // 2. Respaldo secundario desde localStorage
  try {
    const localRaw = localStorage.getItem(key);
    if (localRaw !== null) {
      const parsed = JSON.parse(localRaw) as T;
      setLocalItem(key, parsed);
      return parsed;
    }
  } catch (e) {
    console.warn(`Error al leer desde localStorage para [${key}]:`, e);
  }

  return defaultValue;
}

export async function setDBItem<T>(key: string, value: T): Promise<void> {
  // Siempre guardar primero en IndexedDB (soporta volúmenes masivos de datos)
  try {
    await setLocalItem(key, value);
  } catch (e) {
    console.warn(`Error al guardar en IndexedDB para [${key}]:`, e);
  }

  const configError = getSupabaseConfigError();
  if (!configError && supabase) {
    try {
      const { error } = await supabase
        .from(SUPABASE_TABLE_NAME)
        .upsert([{ key, value: serializeValue(value) }], { onConflict: 'key' });

      if (!error) {
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (lsErr) {
          // Ignorar cuota excedida de localStorage ya que IndexedDB y Supabase tienen los datos
        }
        return;
      }
    } catch (e) {
      console.warn('Error al guardar en Supabase, usando almacenamiento local:', e);
    }
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // Si localStorage falla por QuotaExceededError, IndexedDB ya tiene el respaldo seguro
  }
}

// -------------------------------------------------------------
// IndexedDB Local Storage Helpers for Unlimited Capacity (100,000+ rows)
// -------------------------------------------------------------
let dbPromise: Promise<IDBDatabase> | null = null;

function getIDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('disglobal_tracking_local_db', 1);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('kv_store')) {
        db.createObjectStore('kv_store');
      }
    };
    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
    request.onerror = (event) => {
      dbPromise = null;
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
  return dbPromise;
}

export async function getLocalItem<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await getIDB();
    return new Promise((resolve) => {
      const transaction = db.transaction('kv_store', 'readonly');
      const store = transaction.objectStore('kv_store');
      const request = store.get(key);
      request.onsuccess = () => {
        if (request.result !== undefined) {
          resolve(request.result as T);
        } else {
          resolve(defaultValue);
        }
      };
      request.onerror = () => {
        resolve(defaultValue);
      };
    });
  } catch (error) {
    console.error(`Error loading key [${key}] from IndexedDB, falling back to defaultValue:`, error);
    return defaultValue;
  }
}

export async function setLocalItem<T>(key: string, value: T): Promise<void> {
  try {
    const db = await getIDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('kv_store', 'readwrite');
      const store = transaction.objectStore('kv_store');
      const request = store.put(value, key);
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(`Error saving key [${key}] to IndexedDB:`, error);
  }
}
