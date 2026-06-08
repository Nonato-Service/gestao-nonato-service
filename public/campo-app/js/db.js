(function (global) {
  "use strict";

  const DB_NAME = "nonatoCampoApp";
  const DB_VERSION = 1;
  const STORES = ["settings", "servicoGrupos", "servicos", "relatorios", "despesasDocs", "cartoes"];

  let dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => reject(req.error);
      req.onupgradeneeded = () => {
        const db = req.result;
        STORES.forEach((s) => {
          if (!db.objectStoreNames.contains(s)) db.createObjectStore(s);
        });
      };
      req.onsuccess = () => resolve(req.result);
    });
    return dbPromise;
  }

  async function getStore(store, mode) {
    const db = await openDb();
    return db.transaction(store, mode).objectStore(store);
  }

  async function getKey(store, key) {
    const os = await getStore(store, "readonly");
    return new Promise((resolve, reject) => {
      const req = os.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function setKey(store, key, value) {
    const os = await getStore(store, "readwrite");
    return new Promise((resolve, reject) => {
      const req = os.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async function getJson(store, key, fallback) {
    const v = await getKey(store, key);
    return v === undefined ? fallback : v;
  }

  async function setJson(store, key, value) {
    await setKey(store, key, value);
  }

  async function loadAll() {
    const [logo, nomeEmpresa, enderecoEmpresa, telefoneEmpresa, locale, servicoGrupos, servicos, relatorios, despesasDocs, cartoes] = await Promise.all([
      getJson("settings", "logo", null),
      getJson("settings", "nomeEmpresa", "Nonato Service"),
      getJson("settings", "enderecoEmpresa", ""),
      getJson("settings", "telefoneEmpresa", ""),
      getJson("settings", "locale", null),
      getJson("servicoGrupos", "list", []),
      getJson("servicos", "list", []),
      getJson("relatorios", "list", []),
      getJson("despesasDocs", "list", []),
      getJson("cartoes", "list", []),
    ]);
    return { logo, nomeEmpresa, enderecoEmpresa, telefoneEmpresa, locale, servicoGrupos, servicos, relatorios, despesasDocs, cartoes };
  }

  async function saveLocale(locale) {
    await setJson("settings", "locale", String(locale || "pt"));
  }

  async function saveLogo(logo) {
    await setJson("settings", "logo", logo);
  }

  async function saveNomeEmpresa(nome) {
    await setJson("settings", "nomeEmpresa", String(nome || "Nonato Service").trim() || "Nonato Service");
  }

  async function saveEnderecoEmpresa(endereco) {
    await setJson("settings", "enderecoEmpresa", String(endereco || "").trim());
  }

  async function saveTelefoneEmpresa(telefone) {
    await setJson("settings", "telefoneEmpresa", String(telefone || "").trim());
  }

  async function saveServicoGrupos(list) {
    await setJson("servicoGrupos", "list", list);
  }

  async function saveServicos(list) {
    await setJson("servicos", "list", list);
  }

  async function saveRelatorios(list) {
    await setJson("relatorios", "list", list);
  }

  async function saveDespesasDocs(list) {
    await setJson("despesasDocs", "list", list);
  }

  async function saveCartoes(list) {
    await setJson("cartoes", "list", list);
  }

  async function importBackup(data) {
    if (!data || typeof data !== "object") throw new Error("invalid");
    if (data.logo != null) await saveLogo(data.logo);
    if (data.nomeEmpresa != null) await saveNomeEmpresa(data.nomeEmpresa);
    if (data.enderecoEmpresa != null) await saveEnderecoEmpresa(data.enderecoEmpresa);
    if (data.telefoneEmpresa != null) await saveTelefoneEmpresa(data.telefoneEmpresa);
    if (data.locale) await saveLocale(data.locale);
    if (Array.isArray(data.servicoGrupos)) await saveServicoGrupos(data.servicoGrupos);
    if (Array.isArray(data.servicos)) await saveServicos(data.servicos);
    if (Array.isArray(data.relatorios)) await saveRelatorios(data.relatorios);
    if (Array.isArray(data.despesasDocs)) await saveDespesasDocs(data.despesasDocs);
    if (Array.isArray(data.cartoes)) await saveCartoes(data.cartoes);
  }

  async function exportBackup() {
    const all = await loadAll();
    return {
      version: 1,
      app: "nonato-campo-app",
      exportedAt: new Date().toISOString(),
      ...all,
    };
  }

  global.NCampoDb = {
    loadAll,
    saveLocale,
    saveLogo,
    saveNomeEmpresa,
    saveEnderecoEmpresa,
    saveTelefoneEmpresa,
    saveServicoGrupos,
    saveServicos,
    saveRelatorios,
    saveDespesasDocs,
    saveCartoes,
    importBackup,
    exportBackup,
  };
})(typeof window !== "undefined" ? window : globalThis);
