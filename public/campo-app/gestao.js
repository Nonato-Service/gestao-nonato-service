(function (global) {
  "use strict";

  const Auth = () => global.NCampoAuth;
  const Db = () => global.NCampoDb;
  const U = () => global.NCampoUtils;
  const t = (k, p) => global.NCampoI18n.t(k, p);

  const PERM_LABELS = {
    home: "permHome",
    empresa: "permCompany",
    servicos: "permServices",
    relatorios: "permReports",
    despesas: "permExpenses",
    gestao: "permManage",
  };

  function permissionsHtml(perms, prefix) {
    return Auth().PERM_KEYS.map((key) => {
      const checked = perms && perms[key] ? "checked" : "";
      return `<label class="perm-check"><input type="checkbox" data-perm="${key}" id="${prefix}_perm_${key}" ${checked} /> ${t(PERM_LABELS[key])}</label>`;
    }).join("");
  }

  function readPermissions(prefix) {
    const out = { ...Auth().DEFAULT_TECNICO };
    Auth().PERM_KEYS.forEach((key) => {
      const el = document.getElementById(`${prefix}_perm_${key}`);
      if (el) out[key] = el.checked;
    });
    if (out.gestao) {
      Auth().PERM_KEYS.forEach((key) => {
        out[key] = true;
      });
    }
    return out;
  }

  async function listUsersOnline() {
    const { ok, data } = await Auth().fetchJson("/api/campo/users");
    if (!ok || !data || !Array.isArray(data.users)) throw new Error((data && data.message) || t("manageLoadError"));
    return data.users;
  }

  async function listUsersLocal() {
    return Db().getCampoUsers().then((users) => users.filter((u) => u.active !== false));
  }

  async function listUsers() {
    try {
      return await listUsersOnline();
    } catch {
      return listUsersLocal();
    }
  }

  function renderUserRow(user, onChanged) {
    return `
      <li class="list__item user-row" data-user-id="${U().esc(user.id)}">
        <div>
          <strong>${U().esc(user.name)}</strong>
          <div class="list__meta">${U().esc(user.login)} · ${user.role === "gestor" ? t("roleGestor") : t("roleTecnico")}</div>
        </div>
        <div class="list__actions">
          <button type="button" class="btn btn--sm" data-edit-user="${U().esc(user.id)}">${t("edit")}</button>
          <button type="button" class="btn btn--sm btn--danger" data-del-user="${U().esc(user.id)}">✕</button>
        </div>
      </li>`;
  }

  async function saveUserOnline(id, payload) {
    if (id) {
      const { ok, data } = await Auth().fetchJson(`/api/campo/users/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      if (!ok) throw new Error((data && data.message) || t("manageSaveError"));
      return data.user;
    }
    const { ok, data } = await Auth().fetchJson("/api/campo/users", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!ok) throw new Error((data && data.message) || t("manageSaveError"));
    return data.user;
  }

  async function saveUserLocal(id, payload) {
    const users = await Db().getCampoUsers();
    if (id) {
      const idx = users.findIndex((u) => u.id === id);
      if (idx < 0) throw new Error(t("manageNotFound"));
      users[idx] = {
        ...users[idx],
        name: payload.name,
        login: payload.login,
        password: payload.password || users[idx].password,
        role: payload.role,
        isAdmin: payload.role === "gestor",
        permissions: payload.permissions,
        updatedAt: new Date().toISOString(),
      };
    } else {
      users.push({
        id: "local-" + Date.now(),
        name: payload.name,
        login: payload.login,
        password: payload.password,
        role: payload.role,
        isAdmin: payload.role === "gestor",
        active: true,
        permissions: payload.permissions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    await Db().saveCampoUsers(users);
    return users[users.length - 1];
  }

  async function deleteUserOnline(id) {
    const { ok, data } = await Auth().fetchJson(`/api/campo/users/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!ok) throw new Error((data && data.message) || t("manageDeleteError"));
  }

  async function deleteUserLocal(id) {
    const users = await Db().getCampoUsers();
    await Db().saveCampoUsers(
      users.map((u) => (u.id === id ? { ...u, active: false, updatedAt: new Date().toISOString() } : u))
    );
  }

  function renderGestao(main, rerenderApp) {
    if (!Auth().can("gestao")) {
      main.innerHTML = `<div class="panel"><p class="hint">${t("manageForbidden")}</p></div>`;
      return;
    }

    main.innerHTML = `
      <div class="panel">
        <div class="panel__head">
          <h2 class="panel__title">${t("manageTitle")}</h2>
          <button type="button" class="btn btn--primary btn--sm" id="btnAddUser">${t("manageAddUser")}</button>
        </div>
        <p class="hint">${t("manageHint")}</p>
        <ul class="list" id="usersList"><li class="empty">${t("loading")}</li></ul>
      </div>
      <div class="panel" id="userFormPanel" hidden>
        <h3 class="panel__title" id="userFormTitle">${t("manageAddUser")}</h3>
        <label class="label">${t("manageName")}</label>
        <input class="input" id="uf_name" autocomplete="name" />
        <label class="label">${t("manageLogin")}</label>
        <input class="input" id="uf_login" autocomplete="username" />
        <label class="label">${t("managePassword")}</label>
        <input class="input" id="uf_password" type="password" autocomplete="new-password" />
        <label class="label">${t("manageRole")}</label>
        <select class="select" id="uf_role">
          <option value="tecnico">${t("roleTecnico")}</option>
          <option value="gestor">${t("roleGestor")}</option>
        </select>
        <div class="perm-grid" id="uf_perms">${permissionsHtml(Auth().DEFAULT_TECNICO, "uf")}</div>
        <div class="list__actions" style="margin-top:12px">
          <button type="button" class="btn btn--primary" id="btnSaveUser">${t("save")}</button>
          <button type="button" class="btn btn--ghost" id="btnCancelUser">${t("cancel")}</button>
        </div>
      </div>`;

    let editingId = null;

    async function refreshList() {
      const list = document.getElementById("usersList");
      try {
        const users = await listUsers();
        list.innerHTML = users.length
          ? users.map((u) => renderUserRow(u)).join("")
          : `<li class="empty">${t("manageNoUsers")}</li>`;
        list.querySelectorAll("[data-edit-user]").forEach((btn) => {
          btn.onclick = () => openForm(btn.getAttribute("data-edit-user"), users);
        });
        list.querySelectorAll("[data-del-user]").forEach((btn) => {
          btn.onclick = async () => {
            if (!confirm(t("manageConfirmDelete"))) return;
            const id = btn.getAttribute("data-del-user");
            try {
              try {
                await deleteUserOnline(id);
              } catch {
                await deleteUserLocal(id);
              }
              await refreshList();
            } catch (err) {
              alert(err.message || t("manageDeleteError"));
            }
          };
        });
      } catch (err) {
        list.innerHTML = `<li class="empty">${U().esc(err.message || t("manageLoadError"))}</li>`;
      }
    }

    function openForm(id, users) {
      const panel = document.getElementById("userFormPanel");
      const user = users.find((u) => u.id === id);
      editingId = id || null;
      document.getElementById("userFormTitle").textContent = id ? t("manageEditUser") : t("manageAddUser");
      document.getElementById("uf_name").value = user ? user.name : "";
      document.getElementById("uf_login").value = user ? user.login : "";
      document.getElementById("uf_password").value = "";
      document.getElementById("uf_role").value = user && user.role === "gestor" ? "gestor" : "tecnico";
      document.getElementById("uf_perms").innerHTML = permissionsHtml(
        user ? user.permissions : Auth().DEFAULT_TECNICO,
        "uf"
      );
      panel.hidden = false;
    }

    document.getElementById("btnAddUser").onclick = () => openForm(null, []);
    document.getElementById("btnCancelUser").onclick = () => {
      document.getElementById("userFormPanel").hidden = true;
      editingId = null;
    };

    document.getElementById("uf_role").addEventListener("change", (e) => {
      const role = e.target.value;
      document.getElementById("uf_perms").innerHTML = permissionsHtml(
        role === "gestor" ? Auth().DEFAULT_GESTOR : Auth().DEFAULT_TECNICO,
        "uf"
      );
    });

    document.getElementById("btnSaveUser").onclick = async () => {
      const payload = {
        name: document.getElementById("uf_name").value.trim(),
        login: document.getElementById("uf_login").value.trim(),
        password: document.getElementById("uf_password").value,
        role: document.getElementById("uf_role").value === "gestor" ? "gestor" : "tecnico",
        permissions: readPermissions("uf"),
      };
      if (!payload.name || !payload.login) {
        alert(t("manageFillRequired"));
        return;
      }
      if (!editingId && payload.password.length < 4) {
        alert(t("managePasswordShort"));
        return;
      }
      try {
        try {
          await saveUserOnline(editingId, payload);
        } catch {
          await saveUserLocal(editingId, payload);
        }
        document.getElementById("userFormPanel").hidden = true;
        editingId = null;
        await refreshList();
        alert(t("manageSaved"));
      } catch (err) {
        alert(err.message || t("manageSaveError"));
      }
    };

    refreshList();
  }

  global.NCampoGestao = { renderGestao };
})(typeof window !== "undefined" ? window : globalThis);
