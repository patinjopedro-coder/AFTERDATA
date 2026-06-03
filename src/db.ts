import { supabase, isSupabaseConfigured } from './supabaseClient';

export async function getDBItem<T>(key: string, defaultValue: T): Promise<T> {
  if (!isSupabaseConfigured) {
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
  if (!isSupabaseConfigured) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Error crítico: No se pudo respaldar en localStorage", e);
    }
    return;
  }

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
