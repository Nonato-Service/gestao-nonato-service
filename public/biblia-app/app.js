(function () {
  "use strict";

  const STORAGE_KEY = "nonatoServiceBiblia.v1";
  const GESTAO_STORAGE_KEY = "nonato-biblia-nonato-service";
  const ATTACHMENT_MAX_BYTES = 6 * 1024 * 1024;
  let hostedPushTimer = null;
  const ATTACHMENT_MAX_PER_MODEL = 24;

  /** @typedef {{ id: string, name: string, mime: string, dataUrl: string }} Attachment */
  /** @typedef {{ id: string, name: string, software: string, mechanical: string, electrical: string, notes: string, attachments?: Attachment[] }} Model */
  /** @typedef {{ id: string, name: string, models: Model[] }} Brand */
  /** @typedef {{ id: string, name: string, brands: Brand[] }} Category */

  /** @type {{ categories: Category[] }} */
  let state = { categories: [] };

  let route = { categoryId: null, brandId: null, modelId: null };
  let searchQuery = "";
  let activeTab = "software";
  const IS_EMBEDDED = new URLSearchParams(window.location.search).get("embedded") === "1";
  let previewAttachment = null;

  function translateViaParent(text) {
    return new Promise((resolve) => {
      const source = String(text || "").trim();
      if (!source) {
        resolve("");
        return;
      }
      if (!IS_EMBEDDED || !window.parent || window.parent === window) {
        alert("Tradução disponível ao abrir a Bíblia dentro do programa Gestão.");
        resolve(null);
        return;
      }
      const callbackId = uid();
      const timeout = window.setTimeout(() => {
        window.removeEventListener("message", onMsg);
        resolve(null);
      }, 120000);
      function onMsg(ev) {
        if (ev.origin !== window.location.origin) return;
        const d = ev.data;
        if (d && d.type === "nonato-biblia-translate-result" && d.callbackId === callbackId) {
          window.clearTimeout(timeout);
          window.removeEventListener("message", onMsg);
          resolve(typeof d.translated === "string" ? d.translated : "");
        }
      }
      window.addEventListener("message", onMsg);
      window.parent.postMessage(
        { type: "nonato-biblia-translate-request", text: source, callbackId },
        window.location.origin
      );
    });
  }

  function getActiveDetailField() {
    const map = {
      software: "fieldSoftware",
      mechanical: "fieldMechanical",
      electrical: "fieldElectrical",
      notes: "fieldNotes",
    };
    const id = map[activeTab] || "fieldSoftware";
    return $(id);
  }

  function readTextareaSelection(el) {
    if (!el) return { text: "", start: 0, end: 0, hasSelection: false, full: "" };
    const full = el.value || "";
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const hasSelection = start !== end;
    const text = (hasSelection ? full.slice(start, end) : full).trim();
    return { text, start, end, hasSelection, full };
  }

  async function runTranslateFromTextarea(el) {
    const { text, start, end, hasSelection, full } = readTextareaSelection(el);
    if (!text) {
      alert("Selecione ou escreva texto antes de traduzir.");
      return;
    }
    const translated = await translateViaParent(text);
    if (translated == null || translated === "") return;
    if (hasSelection) {
      el.value = full.slice(0, start) + translated + full.slice(end);
      scheduleSave();
    } else {
      el.value = translated;
      scheduleSave();
    }
  }

  function runCopyFromTextarea(el) {
    const { text, full } = readTextareaSelection(el);
    const toCopy = text || full;
    if (!toCopy.trim()) return;
    navigator.clipboard.writeText(toCopy).catch(() => {});
  }

  function isPdfAttachment(a) {
    const n = (a.name || "").toLowerCase();
    return (a.mime || "") === "application/pdf" || n.endsWith(".pdf");
  }

  function isImageAttachment(a) {
    const n = (a.name || "").toLowerCase();
    return (a.mime || "").startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(n);
  }

  function isTextAttachment(a) {
    const n = (a.name || "").toLowerCase();
    return (a.mime || "").startsWith("text/") || /\.(txt|md|csv|json|log|xml|html?)$/i.test(n);
  }

  function isWordAttachment(a) {
    const n = (a.name || "").toLowerCase();
    return (
      (a.mime || "").includes("wordprocessingml") ||
      (a.mime || "") === "application/msword" ||
      /\.(docx?|rtf)$/i.test(n)
    );
  }

  async function loadAttachmentText(a) {
    if (isTextAttachment(a)) {
      const res = await fetch(a.dataUrl);
      return res.text();
    }
    if (isWordAttachment(a)) {
      const res = await fetch("/api/extract-file-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl: a.dataUrl, nome: a.name }),
      });
      const data = await res.json();
      if (data.ok && data.text) return data.text;
      throw new Error(data.message || data.error || "extract_failed");
    }
    return "";
  }

  async function openAttachmentPreview(a) {
    previewAttachment = a;
    const modal = $("previewModal");
    const body = $("previewModalBody");
    const title = $("previewModalTitle");
    const paste = $("previewTranslateField");
    if (!modal || !body || !title) return;
    title.textContent = a.name || "Anexo";
    if (paste) paste.value = "";
    body.innerHTML = '<p class="hint">A carregar…</p>';

    if (isPdfAttachment(a)) {
      body.innerHTML =
        '<iframe class="preview-modal__frame" title="' +
        escapeHtml(a.name || "PDF") +
        '" src="' +
        a.dataUrl +
        '"></iframe>';
    } else if (isImageAttachment(a)) {
      body.innerHTML =
        '<div class="preview-modal__image-wrap"><img class="preview-modal__image" src="' +
        a.dataUrl +
        '" alt="' +
        escapeHtml(a.name || "") +
        '" /></div>';
    } else if (isTextAttachment(a) || isWordAttachment(a)) {
      try {
        const text = await loadAttachmentText(a);
        if (paste) paste.value = text;
        body.innerHTML =
          '<textarea class="textarea preview-modal__text" rows="12" readonly>' +
          escapeHtml(text) +
          "</textarea>";
      } catch (e) {
        body.innerHTML =
          '<p class="hint">Não foi possível extrair texto. Use Descarregar ou converta para PDF/TXT.</p>';
      }
    } else {
      body.innerHTML =
        '<p class="hint">Pré-visualização não disponível para este tipo. Use Descarregar.</p>';
    }

    modal.showModal();
  }

  async function runPreviewTranslate() {
    const paste = $("previewTranslateField");
    if (!paste) return;
    const { text, start, end, hasSelection, full } = readTextareaSelection(paste);
    if (!text) {
      alert("Cole ou selecione texto no campo de tradução.");
      return;
    }
    const translated = await translateViaParent(text);
    if (translated == null) return;
    if (hasSelection) {
      paste.value = full.slice(0, start) + translated + full.slice(end);
    } else {
      paste.value = translated;
    }
  }

  const $ = (id) => document.getElementById(id);

  function uid() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.categories)) state = parsed;
      }
    } catch (e) {
      console.warn("Load failed", e);
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      scheduleHostedPush();
    } catch (e) {
      alert("Não foi possível guardar. Verifique o espaço do navegador.");
    }
  }

  function isHostedGestao() {
    if (!window.location.protocol.startsWith("http")) return false;
    return window.location.pathname.includes("/biblia-app");
  }

  function setSyncStatus(message, kind) {
    const bar = $("syncBar");
    const el = $("syncStatus");
    if (!bar || !el) return;
    bar.hidden = false;
    el.textContent = message;
    el.className = "sync-bar__status" + (kind ? " sync-bar__status--" + kind : "");
  }

  function convertToGestao(stateObj) {
    const categories = stateObj.categories || [];
    return {
      familias: categories.map((cat, ci) => ({
        id: cat.id || uid(),
        nome: cat.name || "",
        ordem: ci,
        linhas: (cat.brands || []).map((br, bi) => ({
          id: br.id || uid(),
          titulo: br.name || "",
          ordem: bi,
          modelos: (br.models || []).map((mod, mi) => {
            const parts = [];
            if (mod.software && mod.software.trim()) parts.push("[Software]\n" + mod.software.trim());
            if (mod.mechanical && mod.mechanical.trim()) parts.push("[Mecânica]\n" + mod.mechanical.trim());
            if (mod.electrical && mod.electrical.trim()) parts.push("[Elétrica]\n" + mod.electrical.trim());
            if (mod.notes && mod.notes.trim()) parts.push("[Notas]\n" + mod.notes.trim());
            const informacoes = parts.join("\n\n");
            const anexos = (mod.attachments || [])
              .filter((a) => a && a.dataUrl && String(a.dataUrl).startsWith("data:"))
              .map((a) => ({
                id: a.id || uid(),
                nome: a.name || "ficheiro",
                mime: a.mime || "application/octet-stream",
                dataUrl: a.dataUrl,
              }));
            return {
              id: mod.id || uid(),
              nome: mod.name || "",
              ordem: mi,
              software: mod.software || "",
              mecanica: mod.mechanical || "",
              eletrica: mod.electrical || "",
              notas: mod.notes || "",
              informacoes,
              anexos,
            };
          }),
        })),
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  async function fetchServerKey(base, key) {
    const res = await fetch(base + "/api/data/load?key=" + encodeURIComponent(key), {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    if (!json.success || json.data == null) return null;
    return json.data;
  }

  async function loadFromServerHosted(silent) {
    const base = window.location.origin;
    setSyncStatus("A carregar do servidor…", "warn");
    try {
      let data = await fetchServerKey(base, STORAGE_KEY);
      if (!data) data = await fetchServerKey(base, GESTAO_STORAGE_KEY);
      if (!data) {
        setSyncStatus("Servidor ligado — ainda sem dados. Edite e guarde.", "warn");
        return false;
      }
      state = normalizeImport(data);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (_) {}
      route = { categoryId: null, brandId: null, modelId: null };
      render();
      setSyncStatus("Sincronizado · " + importSummary(state), "ok");
      if (!silent) alert("Dados carregados do servidor.\n" + importSummary(state));
      return true;
    } catch (err) {
      console.error(err);
      setSyncStatus("Sem ligação ao servidor — a usar cópia local.", "err");
      return false;
    }
  }

  async function pushToServerHosted() {
    if (!isHostedGestao()) return;
    const base = window.location.origin;
    if (detailDirty) flushDetailFields();
    setSyncStatus("A guardar no servidor…", "warn");
    try {
      for (const item of [
        { key: STORAGE_KEY, value: state },
        { key: GESTAO_STORAGE_KEY, value: convertToGestao(state) },
      ]) {
        const res = await fetch(base + "/api/data/save", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(item),
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const json = await res.json();
        if (!json.success) throw new Error(json.error || "save failed");
      }
      setSyncStatus("Guardado no servidor · " + new Date().toLocaleString("pt-BR"), "ok");
    } catch (err) {
      console.error(err);
      setSyncStatus("Erro ao guardar no servidor — cópia local mantida.", "err");
    }
  }

  function scheduleHostedPush() {
    if (!isHostedGestao()) return;
    if (hostedPushTimer) clearTimeout(hostedPushTimer);
    hostedPushTimer = setTimeout(() => pushToServerHosted(), 900);
  }

  async function initHostedGestao() {
    if (!isHostedGestao()) return;
    await loadFromServerHosted(true);
  }

  async function bootstrap() {
    load();
    if (isHostedGestao()) {
      await initHostedGestao();
      if (state.categories.length === 0) seedExample();
    } else if (state.categories.length === 0) {
      seedExample();
    }
    render();
    initLanding();
  }

  function ensureAttachments(model) {
    if (!Array.isArray(model.attachments)) model.attachments = [];
    return model.attachments;
  }

  function countData(stateObj) {
    let categories = 0;
    let brands = 0;
    let models = 0;
    let attachments = 0;
    (stateObj.categories || []).forEach((cat) => {
      categories += 1;
      (cat.brands || []).forEach((br) => {
        brands += 1;
        (br.models || []).forEach((m) => {
          models += 1;
          attachments += ensureAttachments(m).length;
        });
      });
    });
    return { categories, brands, models, attachments };
  }

  /** Converte { familias } do programa Gestão Nonato Service */
  function convertFromGestao(parsed) {
    const familias = Array.isArray(parsed.familias) ? parsed.familias : [];
    const categories = familias.map((fam) => {
      const linhas = Array.isArray(fam.linhas)
        ? fam.linhas
        : Array.isArray(fam.grupos)
          ? fam.grupos
          : [];
      return {
        id: fam.id || uid(),
        name: (fam.nome || "Sem categoria").trim() || "Sem categoria",
        brands: linhas.map((lin) => ({
          id: lin.id || uid(),
          name: (lin.titulo || "Sem fabricante").trim() || "Sem fabricante",
          models: (Array.isArray(lin.modelos) ? lin.modelos : []).map((mod) => {
            const anexos = Array.isArray(mod.anexos) ? mod.anexos : [];
            const attachments = anexos
              .filter((a) => a && typeof a.dataUrl === "string" && a.dataUrl.startsWith("data:"))
              .map((a) => ({
                id: a.id || uid(),
                name: (a.nome || a.name || "ficheiro").slice(0, 200),
                mime: a.mime || "application/octet-stream",
                dataUrl: a.dataUrl,
              }));
            function parseSectionedNotes(text) {
              const raw = String(text || "");
              const pick = (tag) => {
                const re = new RegExp("\\[" + tag + "\\]\\s*([\\s\\S]*?)(?=\\n\\n\\[|$)", "i");
                const m = raw.match(re);
                return m ? m[1].trim() : "";
              };
              const software = pick("Software");
              const mechanical = pick("Mecânica") || pick("Mecanica");
              const electrical = pick("Elétrica") || pick("Eletrica");
              const notes = pick("Notas");
              if (software || mechanical || electrical || notes) {
                return { software, mechanical, electrical, notes: notes || "" };
              }
              return { software: "", mechanical: "", electrical: "", notes: raw.trim() };
            }
            let software = String(mod.software || "");
            let mechanical = String(mod.mechanical || mod.mecanica || "");
            let electrical = String(mod.electrical || mod.eletrica || "");
            let notes = String(mod.notes || mod.notas || "");
            if (!software && !mechanical && !electrical && !notes && typeof mod.informacoes === "string") {
              const parsed = parseSectionedNotes(mod.informacoes);
              software = parsed.software;
              mechanical = parsed.mechanical;
              electrical = parsed.electrical;
              notes = parsed.notes;
            } else if (typeof mod.informacoes === "string" && mod.informacoes.trim() && !notes) {
              notes = mod.informacoes.trim();
            }
            return {
              id: mod.id || uid(),
              name: (mod.nome || mod.titulo || mod.name || "Sem modelo").trim() || "Sem modelo",
              software,
              mechanical,
              electrical,
              notes,
              attachments,
            };
          }),
        })),
      };
    });
    return { categories };
  }

  function normalizeImport(parsed) {
    if (!parsed || typeof parsed !== "object") {
      throw new Error("invalid");
    }
    if (Array.isArray(parsed.categories)) {
      return parsed;
    }
    if (Array.isArray(parsed.familias)) {
      return convertFromGestao(parsed);
    }
    if (typeof parsed === "string") {
      return normalizeImport(JSON.parse(parsed));
    }
    throw new Error("invalid");
  }

  function importSummary(parsed) {
    const stats = countData(parsed);
    return (
      stats.categories +
      " categoria(s), " +
      stats.brands +
      " fabricante(s), " +
      stats.models +
      " modelo(s)" +
      (stats.attachments ? ", " + stats.attachments + " anexo(s)" : "")
    );
  }

  function applyImport(parsed) {
    state = normalizeImport(parsed);
    save();
    route = { categoryId: null, brandId: null, modelId: null };
    render();
  }

  function findCategory(id) {
    return state.categories.find((c) => c.id === id);
  }

  function findBrand(cat, brandId) {
    return cat.brands.find((b) => b.id === brandId);
  }

  function findModel(brand, modelId) {
    return brand.models.find((m) => m.id === modelId);
  }

  function renderAttachments() {
    const block = $("attachmentsBlock");
    const ul = $("attachmentsList");
    const cat = findCategory(route.categoryId);
    const brand = cat ? findBrand(cat, route.brandId) : null;
    const model = brand ? findModel(brand, route.modelId) : null;
    if (!model || !ul || !block) return;

    block.hidden = false;
    const attachments = ensureAttachments(model);
    if (attachments.length === 0) {
      ul.innerHTML = '<li class="hint">Nenhum anexo neste modelo.</li>';
      return;
    }

    ul.innerHTML = attachments
      .map(
        (a) => `<li class="attachments__item">
          <span class="attachments__name" title="${escapeHtml(a.name)}">${escapeHtml(a.name)}</span>
          <button type="button" class="btn btn--secondary attachments__view" data-view="${a.id}">Visualizar</button>
          <a href="${a.dataUrl}" download="${escapeHtml(a.name)}" class="attachments__dl" title="Descarregar">↓</a>
          <button type="button" class="attachments__remove" data-att="${a.id}" title="Remover">✕</button>
        </li>`
      )
      .join("");

    ul.querySelectorAll("[data-view]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-view");
        const att = attachments.find((x) => x.id === id);
        if (att) openAttachmentPreview(att);
      });
    });

    ul.querySelectorAll("[data-att]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-att");
        model.attachments = attachments.filter((x) => x.id !== id);
        save();
        renderAttachments();
      });
    });
  }

  function normalize(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  }

  function matchesSearch(cat, brand, model) {
    if (!searchQuery) return true;
    const q = normalize(searchQuery);
    const parts = [
      normalize(cat.name),
      brand && normalize(brand.name),
      model && normalize(model.name),
    ].filter(Boolean);
    return parts.some((p) => p.includes(q));
  }

  function getFilteredCategories() {
    if (!searchQuery) return state.categories;
    return state.categories.filter((cat) => {
      if (matchesSearch(cat, null, null)) return true;
      return cat.brands.some((br) => {
        if (matchesSearch(cat, br, null)) return true;
        return br.models.some((m) => matchesSearch(cat, br, m));
      });
    });
  }

  function renderBreadcrumbs() {
    const el = $("breadcrumbs");
    const cat = route.categoryId ? findCategory(route.categoryId) : null;
    const brand =
      cat && route.brandId ? findBrand(cat, route.brandId) : null;
    const model =
      brand && route.modelId ? findModel(brand, route.modelId) : null;

    const parts = [
      `<button type="button" data-crumb="home">Início</button>`,
    ];
    if (cat) {
      parts.push(`<span class="breadcrumbs__sep">›</span>`);
      parts.push(
        `<button type="button" data-crumb="cat" data-id="${cat.id}">${escapeHtml(cat.name)}</button>`
      );
    }
    if (brand) {
      parts.push(`<span class="breadcrumbs__sep">›</span>`);
      parts.push(
        `<button type="button" data-crumb="brand" data-cat="${cat.id}" data-id="${brand.id}">${escapeHtml(brand.name)}</button>`
      );
    }
    if (model) {
      parts.push(`<span class="breadcrumbs__sep">›</span>`);
      parts.push(`<span>${escapeHtml(model.name)}</span>`);
    }
    el.innerHTML = parts.join(" ");
    el.querySelectorAll("button[data-crumb]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const crumb = btn.getAttribute("data-crumb");
        if (crumb === "home") {
          route = { categoryId: null, brandId: null, modelId: null };
        } else if (crumb === "cat") {
          route = {
            categoryId: btn.getAttribute("data-id"),
            brandId: null,
            modelId: null,
          };
        } else if (crumb === "brand") {
          route = {
            categoryId: btn.getAttribute("data-cat"),
            brandId: btn.getAttribute("data-id"),
            modelId: null,
          };
        }
        render();
      });
    });
  }

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s;
    return d.innerHTML;
  }

  function showViews() {
    const hasCat = !!route.categoryId;
    const hasBrand = !!route.brandId;
    const hasModel = !!route.modelId;

    const homeHero = $("homeHero");
    if (homeHero) homeHero.hidden = hasCat;

    $("viewCategories").hidden = hasCat;
    $("viewBrands").hidden = !hasCat || hasBrand;
    $("viewModels").hidden = !hasBrand || hasModel;
    $("viewDetail").hidden = !hasModel;
  }

  function bindListItemActions(ul, type) {
    ul.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.getAttribute("data-action");
        const id = btn.getAttribute("data-id");
        const catId = btn.getAttribute("data-cat");
        const brandId = btn.getAttribute("data-brand");

        if (action === "rename") {
          if (type === "category") openModalRenameCategory(id);
          else if (type === "brand") openModalRenameBrand(catId, id);
          else if (type === "model") openModalRenameModel(catId, brandId, id);
        } else if (action === "delete") {
          if (type === "category") deleteCategory(id);
          else if (type === "brand") deleteBrand(catId, id);
          else if (type === "model") deleteModel(catId, brandId, id);
        }
      });
    });
  }

  function renderCategories() {
    const ul = $("listCategories");
    const list = getFilteredCategories();
    if (list.length === 0) {
      ul.innerHTML =
        '<li class="hint">Nenhuma categoria. Adicione «Seccionadoras» ou outro tipo.</li>';
      return;
    }
    ul.innerHTML = list
      .map((c) => {
        const nBrands = c.brands.length;
        const nModels = c.brands.reduce((acc, b) => acc + b.models.length, 0);
        return `<li class="list__item">
          <button type="button" class="list__item-btn" data-nav="cat" data-id="${c.id}">
            <strong>${escapeHtml(c.name)}</strong>
            <div class="list__item-meta">${nBrands} fabricante(s) · ${nModels} modelo(s)</div>
          </button>
          <div class="list__item-actions">
            <button type="button" class="list__rename" data-action="rename" data-id="${c.id}" title="Renomear">✎</button>
            <button type="button" class="list__delete" data-action="delete" data-id="${c.id}" title="Excluir">✕</button>
          </div>
        </li>`;
      })
      .join("");

    ul.querySelectorAll("[data-nav='cat']").forEach((btn) => {
      btn.addEventListener("click", () => {
        route = {
          categoryId: btn.getAttribute("data-id"),
          brandId: null,
          modelId: null,
        };
        render();
      });
    });
    bindListItemActions(ul, "category");
  }

  function renderBrands() {
    const cat = findCategory(route.categoryId);
    $("brandsTitle").textContent = cat
      ? `Fabricantes — ${cat.name}`
      : "Fabricantes";
    const ul = $("listBrands");
    if (!cat) return;
    const filtered = searchQuery
      ? cat.brands.filter(
          (b) =>
            matchesSearch(cat, b, null) ||
            b.models.some((m) => matchesSearch(cat, b, m))
        )
      : cat.brands;

    if (filtered.length === 0) {
      ul.innerHTML =
        '<li class="hint">Nenhum fabricante nesta categoria. Adicione Holzma, Homag, etc.; depois os modelos.</li>';
      return;
    }
    ul.innerHTML = filtered
      .map((b) => {
        const n = b.models.length;
        return `<li class="list__item">
          <button type="button" class="list__item-btn" data-nav="brand" data-id="${b.id}">
            <strong>${escapeHtml(b.name)}</strong>
            <div class="list__item-meta">${n} modelo(s)</div>
          </button>
          <div class="list__item-actions">
            <button type="button" class="list__rename" data-action="rename" data-id="${b.id}" data-cat="${cat.id}" title="Renomear">✎</button>
            <button type="button" class="list__delete" data-action="delete" data-id="${b.id}" data-cat="${cat.id}" title="Excluir">✕</button>
          </div>
        </li>`;
      })
      .join("");

    ul.querySelectorAll("[data-nav='brand']").forEach((btn) => {
      btn.addEventListener("click", () => {
        route.brandId = btn.getAttribute("data-id");
        route.modelId = null;
        render();
      });
    });
    bindListItemActions(ul, "brand");
  }

  function renderModels() {
    const cat = findCategory(route.categoryId);
    const brand = cat ? findBrand(cat, route.brandId) : null;
    $("modelsTitle").textContent = brand
      ? `Modelos — ${brand.name}`
      : "Modelos";
    const ul = $("listModels");
    if (!brand) return;
    const models = searchQuery
      ? brand.models.filter((m) => matchesSearch(cat, brand, m))
      : brand.models;

    if (models.length === 0) {
      ul.innerHTML =
        '<li class="hint">Nenhum modelo. Adicione HPP 230, HPL 380, etc.</li>';
      return;
    }
    ul.innerHTML = models
      .map(
        (m) => `<li class="list__item">
        <button type="button" class="list__item-btn" data-nav="model" data-id="${m.id}">
          <strong>${escapeHtml(m.name)}</strong>
        </button>
        <div class="list__item-actions">
          <button type="button" class="list__rename" data-action="rename" data-id="${m.id}" data-cat="${cat.id}" data-brand="${brand.id}" title="Renomear">✎</button>
          <button type="button" class="list__delete" data-action="delete" data-id="${m.id}" data-cat="${cat.id}" data-brand="${brand.id}" title="Excluir">✕</button>
        </div>
      </li>`
      )
      .join("");

    ul.querySelectorAll("[data-nav='model']").forEach((btn) => {
      btn.addEventListener("click", () => {
        route.modelId = btn.getAttribute("data-id");
        render();
      });
    });
    bindListItemActions(ul, "model");
  }

  let detailDirty = false;
  let detailTimer = null;

  function flushDetailFields() {
    const cat = findCategory(route.categoryId);
    const brand = cat ? findBrand(cat, route.brandId) : null;
    const model = brand ? findModel(brand, route.modelId) : null;
    if (!model) return;
    model.software = $("fieldSoftware").value;
    model.mechanical = $("fieldMechanical").value;
    model.electrical = $("fieldElectrical").value;
    model.notes = $("fieldNotes").value;
    save();
    $("saveHint").textContent = "Guardado " + new Date().toLocaleTimeString("pt-BR");
    detailDirty = false;
  }

  function renderDetail() {
    const cat = findCategory(route.categoryId);
    const brand = cat ? findBrand(cat, route.brandId) : null;
    const model = brand ? findModel(brand, route.modelId) : null;
    if (!model) return;

    $("detailTitle").textContent = `${cat.name} · ${brand.name} · ${model.name}`;

    const fields = ["fieldSoftware", "fieldMechanical", "fieldElectrical", "fieldNotes"];
    const vals = [model.software, model.mechanical, model.electrical, model.notes];
    fields.forEach((fid, i) => {
      $(fid).value = vals[i] || "";
    });

    document.querySelectorAll(".tabs__tab").forEach((tab) => {
      const t = tab.getAttribute("data-tab");
      tab.classList.toggle("is-active", t === activeTab);
      tab.setAttribute("aria-selected", t === activeTab ? "true" : "false");
    });
    const map = {
      software: "tab-software",
      mechanical: "tab-mechanical",
      electrical: "tab-electrical",
      notes: "tab-notes",
    };
    Object.entries(map).forEach(([key, panelId]) => {
      const panel = $(panelId);
      panel.hidden = key !== activeTab;
      panel.classList.toggle("is-active", key === activeTab);
    });

    detailDirty = false;
    renderAttachments();

    const tools = $("bibliaViewTools");
    if (tools) tools.hidden = !IS_EMBEDDED;
  }

  function scheduleSave() {
    detailDirty = true;
    clearTimeout(detailTimer);
    detailTimer = setTimeout(() => {
      if (detailDirty) flushDetailFields();
    }, 400);
  }

  function showAttachmentsBlock() {
    const block = $("attachmentsBlock");
    if (block) block.hidden = !route.modelId;
  }

  function render() {
    renderBreadcrumbs();
    showViews();
    showAttachmentsBlock();
    renderCategories();
    if (route.categoryId) renderBrands();
    if (route.brandId) renderModels();
    if (route.modelId) renderDetail();
  }

  const modal = $("modal");
  let modalResolve = null;

  function openModal(title, defaultValue) {
    $("modalTitle").textContent = title;
    $("modalInput").value = defaultValue || "";
    modal.showModal();
    setTimeout(() => $("modalInput").focus(), 50);
    return new Promise((resolve) => {
      modalResolve = resolve;
    });
  }

  function closeModal(value) {
    modal.close();
    if (modalResolve) modalResolve(value);
    modalResolve = null;
  }

  $("modalForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = $("modalInput").value.trim();
    closeModal(v || null);
  });
  $("modalCancel").addEventListener("click", () => closeModal(null));

  function openModalRenameCategory(id) {
    const c = findCategory(id);
    if (!c) return;
    openModal("Renomear categoria", c.name).then((name) => {
      if (!name || name === c.name) return;
      c.name = name;
      save();
      render();
    });
  }

  function openModalRenameBrand(catId, brandId) {
    const cat = findCategory(catId);
    const b = cat ? findBrand(cat, brandId) : null;
    if (!b) return;
    openModal("Renomear fabricante", b.name).then((name) => {
      if (!name || name === b.name) return;
      b.name = name;
      save();
      render();
    });
  }

  function openModalRenameModel(catId, brandId, modelId) {
    const cat = findCategory(catId);
    const br = cat ? findBrand(cat, brandId) : null;
    const m = br ? findModel(br, modelId) : null;
    if (!m) return;
    openModal("Renomear modelo", m.name).then((name) => {
      if (!name || name === m.name) return;
      m.name = name;
      save();
      render();
    });
  }

  function deleteCategory(id) {
    if (!confirm("Excluir esta categoria, todos os fabricantes e modelos?")) return;
    state.categories = state.categories.filter((c) => c.id !== id);
    if (route.categoryId === id)
      route = { categoryId: null, brandId: null, modelId: null };
    save();
    render();
  }

  function deleteBrand(catId, brandId) {
    const cat = findCategory(catId);
    if (!cat) return;
    if (!confirm("Excluir este fabricante e todos os modelos?")) return;
    cat.brands = cat.brands.filter((b) => b.id !== brandId);
    if (route.brandId === brandId) route.brandId = route.modelId = null;
    save();
    render();
  }

  function deleteModel(catId, brandId, modelId) {
    const cat = findCategory(catId);
    const br = cat ? findBrand(cat, brandId) : null;
    if (!br) return;
    if (!confirm("Excluir este modelo?")) return;
    br.models = br.models.filter((m) => m.id !== modelId);
    if (route.modelId === modelId) route.modelId = null;
    save();
    render();
  }

  $("btnAddCategory").addEventListener("click", () => {
    openModal("Nova categoria").then((name) => {
      if (!name) return;
      state.categories.push({
        id: uid(),
        name,
        brands: [],
      });
      save();
      render();
    });
  });

  $("btnAddBrand").addEventListener("click", () => {
    const cat = findCategory(route.categoryId);
    if (!cat) return;
    openModal("Novo fabricante (ex.: Holzma)").then((name) => {
      if (!name) return;
      cat.brands.push({ id: uid(), name, models: [] });
      save();
      render();
    });
  });

  $("btnAddModel").addEventListener("click", () => {
    const cat = findCategory(route.categoryId);
    const br = cat ? findBrand(cat, route.brandId) : null;
    if (!br) return;
    openModal("Novo modelo (ex.: HPP 380)").then((name) => {
      if (!name) return;
      br.models.push({
        id: uid(),
        name,
        software: "",
        mechanical: "",
        electrical: "",
        notes: "",
        attachments: [],
      });
      save();
      render();
    });
  });

  $("btnDeleteModel").addEventListener("click", () => {
    deleteModel(route.categoryId, route.brandId, route.modelId);
  });

  document.querySelectorAll(".tabs__tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      activeTab = tab.getAttribute("data-tab") || "software";
      flushDetailFields();
      renderDetail();
    });
  });

  ["fieldSoftware", "fieldMechanical", "fieldElectrical", "fieldNotes"].forEach(
    (id) => {
      $(id).addEventListener("input", scheduleSave);
    }
  );

  window.addEventListener("beforeunload", () => {
    if (detailDirty) flushDetailFields();
  });

  $("btnSearch").addEventListener("click", () => {
    const p = $("searchPanel");
    const open = p.hidden;
    p.hidden = !open;
    if (!open) $("searchInput").focus();
  });

  $("searchInput").addEventListener("input", () => {
    searchQuery = $("searchInput").value.trim();
    render();
  });

  $("btnExport").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `nonato-service-biblia-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $("importFile").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        let raw = reader.result;
        if (typeof raw === "string") raw = raw.trim();
        let parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (parsed && typeof parsed === "object" && !parsed.categories && !parsed.familias) {
          parsed = JSON.parse(String(parsed));
        }
        const normalized = normalizeImport(parsed);
        const msg =
          "Importar " +
          importSummary(normalized) +
          "?\n\nIsto substitui todos os dados neste dispositivo. Exporte antes se precisar de cópia.";
        if (!confirm(msg)) return;
        applyImport(normalized);
        alert("Importação concluída.\n" + importSummary(state));
      } catch (err) {
        alert(
          "Não foi possível ler o ficheiro.\n\nUse um backup deste app ({ categories }) ou do programa Gestão ({ familias })."
        );
      }
    };
    reader.readAsText(file);
  });

  $("btnBibliaTranslate")?.addEventListener("click", () => {
    runTranslateFromTextarea(getActiveDetailField());
  });

  $("btnBibliaCopy")?.addEventListener("click", () => {
    runCopyFromTextarea(getActiveDetailField());
  });

  $("previewModalClose")?.addEventListener("click", () => {
    $("previewModal")?.close();
  });

  $("previewModalTranslate")?.addEventListener("click", () => {
    runPreviewTranslate();
  });

  $("previewModalCopy")?.addEventListener("click", () => {
    runCopyFromTextarea($("previewTranslateField"));
  });

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("read_failed"));
      reader.readAsDataURL(file);
    });
  }

  $("attachmentInput")?.addEventListener("change", async (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (files.length === 0) return;

    const cat = findCategory(route.categoryId);
    const brand = cat ? findBrand(cat, route.brandId) : null;
    const model = brand ? findModel(brand, route.modelId) : null;
    if (!model) return;

    const attachments = ensureAttachments(model);
    let added = 0;
    let skippedLimit = false;

    for (const file of files) {
      if (attachments.length >= ATTACHMENT_MAX_PER_MODEL) {
        skippedLimit = true;
        break;
      }
      if (file.size > ATTACHMENT_MAX_BYTES) {
        alert("«" + file.name + "» demasiado grande (máx. ~6 MB).");
        continue;
      }
      try {
        const dataUrl = await readFileAsDataUrl(file);
        const mime =
          file.type ||
          (/\.pdf$/i.test(file.name) ? "application/pdf" : "application/octet-stream");
        attachments.push({
          id: uid(),
          name: file.name.slice(0, 200),
          mime,
          dataUrl,
        });
        added += 1;
      } catch {
        alert("Não foi possível ler «" + file.name + "».");
      }
    }

    if (skippedLimit) {
      alert("Limite de " + ATTACHMENT_MAX_PER_MODEL + " anexos por modelo.");
    }
    if (added > 0) {
      save();
      renderAttachments();
      $("saveHint").textContent =
        added === 1
          ? "Anexo guardado " + new Date().toLocaleTimeString("pt-BR")
          : added + " anexos guardados " + new Date().toLocaleTimeString("pt-BR");
    }
  });

  function seedExample() {
    if (state.categories.length > 0) return;
    const seccionadoras = {
      id: uid(),
      name: "Seccionadoras",
      brands: [
        {
          id: uid(),
          name: "Holzma",
          models: [
            "HPP 230",
            "HPP 250",
            "HPP 350",
            "HPP 380",
            "HPL 300",
            "HPL 380",
          ].map((name) => ({
            id: uid(),
            name,
            software: "",
            mechanical: "",
            electrical: "",
            notes: "",
            attachments: [],
          })),
        },
        {
          id: uid(),
          name: "Homag (Espanha)",
          models: [],
        },
      ],
    };
    state.categories.push(seccionadoras);
    save();
  }

  const SESSION_ENTERED = "nonatoBibliaEntered";

  function initLanding() {
    const landing = document.getElementById("landing");
    const appMain = document.getElementById("appMain");
    const btnEnter = document.getElementById("btnEnter");
    if (!landing || !appMain) return;

    function showApp() {
      sessionStorage.setItem(SESSION_ENTERED, "1");
      landing.hidden = true;
      appMain.hidden = false;
      try {
        document.getElementById("btnSearch")?.focus({ preventScroll: true });
      } catch (_) {}
      render();
    }

    const embedded = new URLSearchParams(window.location.search).get("embedded") === "1";

    if (embedded || sessionStorage.getItem(SESSION_ENTERED)) {
      landing.hidden = true;
      appMain.hidden = false;
    } else {
      landing.hidden = false;
      appMain.hidden = true;
    }

    btnEnter?.addEventListener("click", showApp);
  }

  bootstrap();
})();
