(function (global) {
  "use strict";

  const LS_KEY = "nonato_campo_session_v1";
  const PERM_KEYS = ["home", "empresa", "servicos", "relatorios", "despesas", "gestao"];

  const DEFAULT_GESTOR = {
    home: true,
    empresa: true,
    servicos: true,
    relatorios: true,
    despesas: true,
    gestao: true,
  };

  const DEFAULT_TECNICO = {
    home: true,
    empresa: false,
    servicos: false,
    relatorios: true,
    despesas: true,
    gestao: false,
  };

  let currentUser = null;
  let sessionExpiresAt = null;

  function normalizePermissions(input, fallback) {
    const out = { ...fallback };
    if (!input || typeof input !== "object") return out;
    PERM_KEYS.forEach((k) => {
      if (typeof input[k] === "boolean") out[k] = input[k];
    });
    return out;
  }

  function readStoredSession() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.user || !parsed.expiresAt) return null;
      if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
        localStorage.removeItem(LS_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  function writeStoredSession(user, expiresAt) {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        user,
        expiresAt,
        savedAt: new Date().toISOString(),
      })
    );
  }

  function clearStoredSession() {
    localStorage.removeItem(LS_KEY);
  }

  function apiUrl(path) {
    return path.startsWith("/") ? path : "/" + path;
  }

  async function fetchJson(path, options) {
    const res = await fetch(apiUrl(path), {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options && options.headers) },
      ...options,
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { ok: res.ok, status: res.status, data };
  }

  async function tryOnlineStatus() {
    try {
      const { ok, data } = await fetchJson("/api/campo/auth/status");
      if (ok && data && data.authenticated && data.user) {
        currentUser = data.user;
        sessionExpiresAt = data.expiresAt || new Date(Date.now() + 30 * 86400000).toISOString();
        writeStoredSession(currentUser, sessionExpiresAt);
        return true;
      }
    } catch {
      /* offline */
    }
    return false;
  }

  async function init() {
    const stored = readStoredSession();
    if (stored) {
      currentUser = stored.user;
      sessionExpiresAt = stored.expiresAt;
    }
    await tryOnlineStatus();
    return Boolean(currentUser);
  }

  async function login(login, password) {
    const { ok, data } = await fetchJson("/api/campo/auth/login", {
      method: "POST",
      body: JSON.stringify({ login, password }),
    });
    if (!ok || !data || !data.user) {
      throw new Error((data && data.message) || "Login falhou.");
    }
    currentUser = data.user;
    sessionExpiresAt = data.expiresAt || new Date(Date.now() + 30 * 86400000).toISOString();
    writeStoredSession(currentUser, sessionExpiresAt);
    return currentUser;
  }

  async function loginLocal(login, password, Db) {
    const users = await Db.getCampoUsers();
    const normalized = String(login || "").trim().toLowerCase();
    const user = users.find(
      (u) => u.active !== false && String(u.login || "").trim().toLowerCase() === normalized
    );
    if (!user || String(user.password || "") !== String(password || "")) {
      throw new Error("Utilizador ou senha incorretos.");
    }
    currentUser = {
      id: user.id,
      name: user.name,
      login: user.login,
      role: user.role,
      isAdmin: Boolean(user.isAdmin || user.role === "gestor"),
      active: user.active !== false,
      permissions: normalizePermissions(
        user.permissions,
        user.role === "gestor" ? DEFAULT_GESTOR : DEFAULT_TECNICO
      ),
    };
    sessionExpiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
    writeStoredSession(currentUser, sessionExpiresAt);
    return currentUser;
  }

  async function bootstrapLocalGestor(login, password, name, Db) {
    const users = await Db.getCampoUsers();
    if (users.length) throw new Error("Gestor local já configurado.");
    const now = new Date().toISOString();
    const gestor = {
      id: "local-gestor-" + Date.now(),
      name: name || "Gestor",
      login: String(login || "gestor").trim().toLowerCase(),
      password: String(password || ""),
      role: "gestor",
      isAdmin: true,
      active: true,
      permissions: { ...DEFAULT_GESTOR },
      createdAt: now,
      updatedAt: now,
    };
    await Db.saveCampoUsers([gestor]);
    return loginLocal(gestor.login, password, Db);
  }

  async function logout() {
    try {
      await fetchJson("/api/campo/auth/logout", { method: "POST" });
    } catch {
      /* offline */
    }
    currentUser = null;
    sessionExpiresAt = null;
    clearStoredSession();
  }

  function getUser() {
    return currentUser;
  }

  function isAuthenticated() {
    return Boolean(currentUser);
  }

  function can(view) {
    if (!currentUser) return false;
    const perms = normalizePermissions(
      currentUser.permissions,
      currentUser.role === "gestor" || currentUser.isAdmin ? DEFAULT_GESTOR : DEFAULT_TECNICO
    );
    if (view === "home") return perms.home !== false;
    return Boolean(perms[view]);
  }

  function isGestor() {
    return Boolean(currentUser && (currentUser.isAdmin || currentUser.role === "gestor" || can("gestao")));
  }

  function firstAllowedView() {
    const order = ["home", "relatorios", "despesas", "servicos", "empresa", "gestao"];
    for (const v of order) {
      if (can(v)) return v === "empresa" ? "logo" : v;
    }
    return "home";
  }

  async function refreshUser() {
    const ok = await tryOnlineStatus();
    if (!ok && currentUser) return currentUser;
    return currentUser;
  }

  global.NCampoAuth = {
    PERM_KEYS,
    DEFAULT_GESTOR,
    DEFAULT_TECNICO,
    init,
    login,
    loginLocal,
    bootstrapLocalGestor,
    logout,
    getUser,
    isAuthenticated,
    can,
    isGestor,
    firstAllowedView,
    refreshUser,
    fetchJson,
    normalizePermissions,
  };
})(typeof window !== "undefined" ? window : globalThis);
