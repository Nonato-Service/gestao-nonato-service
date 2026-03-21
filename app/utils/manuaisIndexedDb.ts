/**
 * Armazenamento dos manuais em IndexedDB — o localStorage (~5MB) enche com PDFs em base64.
 */

const DB_NAME = 'nonato-gestao-tecnica-v1'
const STORE = 'kv'
const KEY = 'nonato-manuais-familias-grupos'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB indisponível'))
      return
    }
    const req = indexedDB.open(DB_NAME, 1)
    req.onerror = () => reject(req.error ?? new Error('IDB open failed'))
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
  })
}

export async function loadManuaisFamiliasGruposFromIdb(): Promise<any | null> {
  try {
    const db = await openDb()
    return await new Promise<any | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const r = tx.objectStore(STORE).get(KEY)
      r.onsuccess = () => resolve(r.result ?? null)
      r.onerror = () => reject(r.error)
    })
  } catch {
    return null
  }
}

export async function saveManuaisFamiliasGruposToIdb(data: any): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(data, KEY)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}
