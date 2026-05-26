/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const DB_NAME = 'disglobal_tracking_db';
const STORE_NAME = 'keyvalue_store';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

/**
 * Initializes the IndexedDB database and returns the database instance.
 */
function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Retrieves a value from IndexedDB.
 * If not found, it automatically checks localStorage for migration.
 */
export async function getDBItem<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(transaction.objectStoreNames[0]);
      const request = store.get(key);

      request.onsuccess = async () => {
        const result = request.result;
        if (result !== undefined) {
          resolve(result as T);
        } else {
          // Attempt migration from localStorage
          const localRaw = localStorage.getItem(key);
          if (localRaw !== null) {
            try {
              const parsed = JSON.parse(localRaw) as T;
              // Migrate to IndexedDB
              await setDBItem(key, parsed);
              // Clean up localStorage to prevent future redundant migrations
              localStorage.removeItem(key);
              resolve(parsed);
            } catch (e) {
              console.error(`Error parsing localStorage backup for key ${key}:`, e);
              resolve(defaultValue);
            }
          } else {
            resolve(defaultValue);
          }
        }
      };

      request.onerror = () => {
        console.error(`Error reading key ${key} from IndexedDB:`, request.error);
        resolve(defaultValue);
      };
    });
  } catch (error) {
    console.error('Failed to access IndexedDB, falling back to localStorage/default:', error);
    // Fallback to localStorage directly if IndexedDB fails entirely
    const localRaw = localStorage.getItem(key);
    if (localRaw !== null) {
      try {
        return JSON.parse(localRaw) as T;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  }
}

/**
 * Saves a value to IndexedDB.
 */
export async function setDBItem<T>(key: string, value: T): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(transaction.objectStoreNames[0]);
      const request = store.put(value, key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(`Failed to save key ${key} to IndexedDB:`, error);
    // Fallback to localStorage in case of extreme errors
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Failed fallback to localStorage:', e);
    }
  }
}

/**
 * Deletes a key from IndexedDB.
 */
export async function deleteDBItem(key: string): Promise<void> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(transaction.objectStoreNames[0]);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(`Failed to delete key ${key} from IndexedDB:`, error);
    localStorage.removeItem(key);
  }
}
