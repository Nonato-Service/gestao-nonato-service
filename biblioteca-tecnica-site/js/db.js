/**
 * IndexedDB — cópia gestão técnica (base separada do original BibliaNonatoService)
 */
const DB_NAME = 'GestaoBibliaNonatoSite';
const DB_VERSION = 1;
const STORES = { familias: 'familias', modelos: 'modelos', documentos: 'documentos', config: 'config' };

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => { db = req.result; resolve(db); };
    req.onupgradeneeded = (e) => {
      const database = e.target.result;
      if (!database.objectStoreNames.contains('familias')) {
        const fs = database.createObjectStore('familias', { keyPath: 'id' });
        fs.createIndex('ordem', 'ordem', { unique: false });
      }
      if (!database.objectStoreNames.contains('modelos')) {
        const ms = database.createObjectStore('modelos', { keyPath: 'id' });
        ms.createIndex('familiaId', 'familiaId', { unique: false });
        ms.createIndex('ordem', 'ordem', { unique: false });
      }
      if (!database.objectStoreNames.contains('documentos')) {
        const ds = database.createObjectStore('documentos', { keyPath: 'id' });
        ds.createIndex('modeloId', 'modeloId', { unique: false });
        ds.createIndex('ordem', 'ordem', { unique: false });
      }
      if (!database.objectStoreNames.contains('config')) {
        database.createObjectStore('config', { keyPath: 'key' });
      }
    };
  });
}

function getNextId(storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => {
      const items = req.result;
      const max = items.length ? Math.max(...items.map(x => x.id || 0)) : 0;
      resolve(max + 1);
    };
    req.onerror = () => reject(req.error);
  });
}

async function getAllFamilias() {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('familias', 'readonly');
    const req = tx.objectStore('familias').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function saveFamilia(familia) {
  await openDB();
  if (!familia.id) familia.id = await getNextId('familias');
  if (familia.ordem == null) {
    const all = await getAllFamilias();
    familia.ordem = all.length;
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction('familias', 'readwrite');
    const req = tx.objectStore('familias').put(familia);
    req.onsuccess = () => resolve(familia);
    req.onerror = () => reject(req.error);
  });
}

async function deleteFamilia(id) {
  await openDB();
  const modelos = await getModelosByFamilia(id);
  for (const m of modelos) await deleteModelo(m.id);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('familias', 'readwrite');
    const req = tx.objectStore('familias').delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getModelosByFamilia(familiaId) {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('modelos', 'readonly');
    const index = tx.objectStore('modelos').index('familiaId');
    const req = index.getAll(familiaId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function saveModelo(modelo) {
  await openDB();
  if (!modelo.id) modelo.id = await getNextId('modelos');
  if (modelo.ordem == null) {
    const all = await getModelosByFamilia(modelo.familiaId);
    modelo.ordem = all.length;
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction('modelos', 'readwrite');
    const req = tx.objectStore('modelos').put(modelo);
    req.onsuccess = () => resolve(modelo);
    req.onerror = () => reject(req.error);
  });
}

async function deleteModelo(id) {
  await openDB();
  const docs = await getDocumentosByModelo(id);
  for (const d of docs) await deleteDocumento(d.id);
  return new Promise((resolve, reject) => {
    const tx = db.transaction('modelos', 'readwrite');
    const req = tx.objectStore('modelos').delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getDocumentosByModelo(modeloId) {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('documentos', 'readonly');
    const index = tx.objectStore('documentos').index('modeloId');
    const req = index.getAll(modeloId);
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function saveDocumento(doc, file) {
  await openDB();
  if (!doc.id) doc.id = await getNextId('documentos');
  if (doc.ordem == null) {
    const all = await getDocumentosByModelo(doc.modeloId);
    doc.ordem = all.length;
  }
  if (file && file.size) {
    doc.fileName = file.name;
    doc.mimeType = file.type;
    doc.fileData = await fileToBase64(file);
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction('documentos', 'readwrite');
    const req = tx.objectStore('documentos').put(doc);
    req.onsuccess = () => resolve(doc);
    req.onerror = () => reject(req.error);
  });
}

async function deleteDocumento(id) {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('documentos', 'readwrite');
    const req = tx.objectStore('documentos').delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getAllModelos() {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('modelos', 'readonly');
    const req = tx.objectStore('modelos').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function getAllDocumentos() {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('documentos', 'readonly');
    const req = tx.objectStore('documentos').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function getConfig(key) {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('config', 'readonly');
    const req = tx.objectStore('config').get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror = () => reject(req.error);
  });
}

async function setConfig(key, value) {
  await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('config', 'readwrite');
    const req = tx.objectStore('config').put({ key, value });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
