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
        return parseValue<T>(data.value, defaultValue);
      }
    } catch (e) {
      console.warn(`Error al leer desde Supabase para [${key}], cayendo a localStorage:`, e);
    }
  }

  // Respaldo y migración desde localStorage
  const localRaw = localStorage.getItem(key);
  if (localRaw !== null) {
    try {
      const parsed = JSON.parse(localRaw) as T;
      try {
        await setDBItem(key, parsed);
      } catch (err) {
        console.warn('No se pudo migrar el dato a Supabase:', err);
      }
      return parsed;
    } catch (e) {
      return defaultValue;
    }
  }
  return defaultValue;
}

export async function setDBItem<T>(key: string, value: T): Promise<void> {
  const configError = getSupabaseConfigError();
  if (!configError && supabase) {
    try {
      const { error } = await supabase
        .from(SUPABASE_TABLE_NAME)
        .upsert([{ key, value: serializeValue(value) }], { onConflict: 'key' });

      if (!error) {
        localStorage.setItem(key, JSON.stringify(value));
        return;
      }

      throw error;
    } catch (e) {
      console.warn('Error al guardar en Supabase, respaldando solo en localStorage:', e);
    }
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error crítico: No se pudo respaldar en localStorage', e);
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
