export async function getDBItem<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const response = await fetch(`/api/db?key=${encodeURIComponent(key)}`);
    if (response.ok) {
      const data = await response.json();
      if (data.value !== undefined && data.value !== null) {
        return data.value as T;
      }
    }
  } catch (e) {
    console.warn(`Error al leer de la base de datos compartida local para [${key}], cayendo a localStorage:`, e);
  }

  // Respaldo y migración desde localStorage
  const localRaw = localStorage.getItem(key);
  if (localRaw !== null) {
    try {
      const parsed = JSON.parse(localRaw) as T;
      // Intentar migrar al archivo compartido local_db.json
      try {
        await fetch('/api/db', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value: parsed })
        });
      } catch (err) {
        console.warn("No se pudo migrar el dato a la base de datos compartida:", err);
      }
      return parsed;
    } catch (e) {
      return defaultValue;
    }
  }
  return defaultValue;
}

export async function setDBItem<T>(key: string, value: T): Promise<void> {
  // Intentar escribir en la base de datos compartida local
  try {
    const response = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    if (response.ok) {
      // También guardar en localStorage local del navegador como respaldo
      localStorage.setItem(key, JSON.stringify(value));
      return;
    }
  } catch (e) {
    console.warn("Error al guardar en la base de datos compartida local, respaldando solo en localStorage:", e);
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error("Error crítico: No se pudo respaldar en localStorage", e);
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
