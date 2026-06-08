(function () {
  "use strict";

  const Db = window.NCampoDb;
  const U = window.NCampoUtils;
  const Pdf = window.NCampoPdf;
  const I18n = window.NCampoI18n;
  const t = (k, p) => I18n.t(k, p);

  const $ = (id) => document.getElementById(id);
  const main = $("main");
  const modal = $("modal");

  let state = {
    view: "home",
    logo: null,
    nomeEmpresa: "Nonato Service",
    enderecoEmpresa: "",
    telefoneEmpresa: "",
    servicoGrupos: [],
    servicos: [],
    relatorios: [],
    despesasDocs: [],
    cartoes: [],
    editRelatorioId: null,
    editDespesaId: null,
  };

  let modalResolve = null;
  let deferredInstall = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstall = e;
    const btn = document.getElementById("btnInstallApp");
    if (btn) btn.hidden = false;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstall = null;
    const btn = document.getElementById("btnInstallApp");
    if (btn) btn.hidden = true;
    alert(t("alertInstalled"));
  });

  function tryInstallApp() {
    if (deferredInstall) {
      deferredInstall.prompt();
      deferredInstall.userChoice.finally(() => { deferredInstall = null; });
      return;
    }
    alert(t("alertInstallHint"));
  }

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  function isInAppBrowser() {
    const ua = navigator.userAgent || "";
    return /WhatsApp|FBAN|FBAV|Instagram|Line\//i.test(ua);
  }

  function openInChromeHint() {
    const url = location.href;
    alert(t("alertChromeHint", { url }));
  }

  function getBrand() {
    return {
      logo: state.logo,
      nomeEmpresa: state.nomeEmpresa || "Nonato Service",
      enderecoEmpresa: state.enderecoEmpresa || "",
      telefoneEmpresa: state.telefoneEmpresa || "",
    };
  }

  function bindSignaturePad(canvas) {
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    let drawing = false;
    let last = null;

    function pointFromEvent(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const t = e.touches && e.touches.length ? e.touches[0] : e;
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }

    function start(e) {
      e.preventDefault();
      drawing = true;
      last = pointFromEvent(e);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
    }

    function move(e) {
      if (!drawing || !last) return;
      e.preventDefault();
      const p = pointFromEvent(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
    }

    function end() {
      drawing = false;
      last = null;
    }

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseup", end);
    canvas.addEventListener("mouseleave", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end);

    return {
      clear() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      },
      toDataUrl() {
        return canvas.toDataURL("image/png");
      },
      load(dataUrl) {
        if (!dataUrl) return;
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = dataUrl;
      },
    };
  }

  function signatureSectionHtml(label, field, existing, nomeCampo) {
    const hasSig = existing && String(existing).startsWith("data:");
    return `
      <div class="sig-panel" data-sig-field="${field}">
        <h4 class="sig-panel__title">${label}</h4>
        <p class="hint">${t("sigHint")}</p>
        ${hasSig ? `<img class="sig-preview" id="preview_${field}" src="${existing}" alt="${U.esc(t("sigAlt"))}" />` : ""}
        <canvas class="sig-canvas" id="canvas_${field}" width="320" height="120" ${hasSig ? 'hidden' : ""}></canvas>
        <div class="sig-actions">
          ${hasSig ? `<button type="button" class="btn btn--sm" id="btnEdit_${field}">${t("sigReplace")}</button>` : ""}
          <button type="button" class="btn btn--sm btn--ghost" id="btnClear_${field}">${t("sigClear")}</button>
          <button type="button" class="btn btn--sm btn--primary" id="btnSave_${field}">${t("sigSave")}</button>
        </div>
        <input type="hidden" id="val_${field}" value="" />
        ${nomeCampo ? `<p class="sig-nome">${U.esc(nomeCampo)}</p>` : ""}
      </div>`;
  }

  function wireSignatureSection(field, relatorio) {
    const dataKey = field === "assinaturaCliente" ? "dataAssinaturaCliente" : "dataAssinaturaTecnico";
    const canvas = $(`canvas_${field}`);
    const pad = bindSignaturePad(canvas);
    if (!pad) return;

    let hasDrawn = !!(relatorio[field] && String(relatorio[field]).startsWith("data:"));
    const markDrawn = () => { hasDrawn = true; };

    if (relatorio[field] && canvas && !canvas.hidden) pad.load(relatorio[field]);

    canvas?.addEventListener("mousedown", markDrawn);
    canvas?.addEventListener("touchstart", markDrawn, { passive: true });

    $(`btnClear_${field}`)?.addEventListener("click", () => {
      pad.clear();
      relatorio[field] = "";
      relatorio[dataKey] = "";
      hasDrawn = false;
      const preview = $(`preview_${field}`);
      if (preview) preview.remove();
      if (canvas) canvas.hidden = false;
    });

    $(`btnEdit_${field}`)?.addEventListener("click", () => {
      relatorio[field] = "";
      relatorio[dataKey] = "";
      hasDrawn = false;
      const preview = $(`preview_${field}`);
      if (preview) preview.remove();
      if (canvas) {
        canvas.hidden = false;
        pad.clear();
      }
      $(`btnEdit_${field}`)?.remove();
    });

    $(`btnSave_${field}`)?.addEventListener("click", async () => {
      if (!hasDrawn) {
        alert(t("alertSigDraw"));
        return;
      }
      relatorio[field] = pad.toDataUrl();
      relatorio[dataKey] = new Date().toISOString();
      await persist();
      alert(t("alertSigSaved"));
      render();
    });
  }

  async function persist() {
    await Db.saveLogo(state.logo);
    await Db.saveNomeEmpresa(state.nomeEmpresa);
    await Db.saveEnderecoEmpresa(state.enderecoEmpresa);
    await Db.saveTelefoneEmpresa(state.telefoneEmpresa);
    await Db.saveServicoGrupos(state.servicoGrupos);
    await Db.saveServicos(state.servicos);
    await Db.saveRelatorios(state.relatorios);
    await Db.saveDespesasDocs(state.despesasDocs);
    await Db.saveCartoes(state.cartoes);
    updateTopBrand();
  }

  async function setLanguage(loc) {
    I18n.setLocale(loc);
    await Db.saveLocale(loc);
    I18n.applyStaticUi();
    render();
  }

  async function load() {
    const all = await Db.loadAll();
    I18n.setLocale(all.locale || I18n.detectLocale());
    state.logo = all.logo;
    state.nomeEmpresa = all.nomeEmpresa || "Nonato Service";
    state.enderecoEmpresa = all.enderecoEmpresa || "";
    state.telefoneEmpresa = all.telefoneEmpresa || "";
    state.servicoGrupos = all.servicoGrupos.length ? all.servicoGrupos : [{ id: "grupo-geral", nome: t("generalGroup"), ordem: 0 }];
    state.servicos = all.servicos;
    state.relatorios = all.relatorios.map((r) => ({
      assinaturaCliente: "",
      dataAssinaturaCliente: "",
      assinaturaTecnico: "",
      dataAssinaturaTecnico: "",
      ...r,
    }));
    state.despesasDocs = all.despesasDocs;
    state.cartoes = all.cartoes;
    if (!state.servicos.length) {
      state.servicos = I18n.defaultServicos(U.uid);
      await persist();
    }
    I18n.applyStaticUi();
    updateTopBrand();
  }

  function updateTopBrand() {
    const title = $("topCompanyName");
    if (title) title.textContent = state.nomeEmpresa || "Nonato Service";
    const img = $("topLogo");
    if (state.logo && state.logo.dataUrl) {
      img.src = state.logo.dataUrl;
      img.hidden = false;
    } else img.hidden = true;
  }

  function setView(view) {
    state.view = view;
    document.querySelectorAll(".tabs__btn").forEach((b) => {
      b.classList.toggle("is-active", b.getAttribute("data-view") === view);
    });
    render();
  }

  function openModal(title, bodyHtml) {
    $("modalTitle").textContent = title;
    $("modalBody").innerHTML = bodyHtml;
    modal.showModal();
    return new Promise((resolve) => {
      modalResolve = resolve;
    });
  }

  $("modalForm").addEventListener("submit", (e) => {
    e.preventDefault();
    modal.close();
    if (modalResolve) modalResolve(true);
    modalResolve = null;
  });
  $("modalCancel").addEventListener("click", () => {
    modal.close();
    if (modalResolve) modalResolve(false);
    modalResolve = null;
  });

  async function promptText(title, label, value) {
    const ok = await openModal(
      title,
      `<label class="label">${label}</label><input class="input" id="modalInput" value="${U.esc(value || "")}" autocomplete="off" />`
    );
    if (!ok) return null;
    const v = $("modalInput").value.trim();
    return v || null;
  }

  function renderHome() {
    main.innerHTML = `
      <div class="kpi-row">
        <div class="kpi"><div class="kpi__n">${state.relatorios.length}</div><div class="kpi__l">${t("kpiReports")}</div></div>
        <div class="kpi"><div class="kpi__n">${state.servicos.length}</div><div class="kpi__l">${t("kpiServices")}</div></div>
        <div class="kpi"><div class="kpi__n">${state.despesasDocs.length}</div><div class="kpi__l">${t("kpiExpenses")}</div></div>
      </div>
      <div class="panel">
        <h2 class="panel__title">${t("homeTitle")}</h2>
        <p class="hint">${t("homeHint")}</p>
        ${isInAppBrowser() && !isStandalone() ? `
        <div class="panel panel--warn">
          <strong>${t("whatsappWarnTitle")}</strong>
          <p>${t("whatsappWarnBody")}</p>
          <button type="button" class="btn btn--primary btn--sm" id="btnOpenChromeHelp">${t("whatsappHelp")}</button>
        </div>` : ""}
        <div class="panel panel--install">
          <h3 class="panel__title">${t("installTitle")}</h3>
          <ol class="install-steps">
            <li>${t("installStep1")}</li>
            <li>${t("installStep2")}</li>
            <li>${t("installStep3")}</li>
          </ol>
          <button type="button" class="btn btn--primary btn--install" id="btnInstallApp">${t("installBtn")}</button>
          ${isStandalone() ? `<p class='install-ok'>${t("installOk")}</p>` : ""}
        </div>
        <div class="list__actions" style="margin-top:12px">
          <button type="button" class="btn btn--primary" data-go="relatorios">${t("newReport")}</button>
          <button type="button" class="btn" data-go="despesas">${t("registerExpenses")}</button>
          <button type="button" class="btn" data-go="logo">${t("logoAndCompany")}</button>
        </div>
      </div>`;
    main.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => setView(b.getAttribute("data-go"))));
    const installBtn = document.getElementById("btnInstallApp");
    if (installBtn) installBtn.onclick = tryInstallApp;
    document.getElementById("btnOpenChromeHelp")?.addEventListener("click", openInChromeHint);
  }

  function renderLogo() {
    main.innerHTML = `
      <div class="panel">
        <div class="panel__head"><h2 class="panel__title">${t("companyDataTitle")}</h2></div>
        <p class="hint">${t("companyDataHint")}</p>
        <label class="label">${t("labelName")}</label>
        <input class="input" id="nomeEmpresaInput" value="${U.esc(state.nomeEmpresa || "Nonato Service")}" maxlength="80" autocomplete="organization" />
        <label class="label">${t("labelAddress")}</label>
        <textarea class="textarea" id="enderecoEmpresaInput" rows="2" maxlength="200">${U.esc(state.enderecoEmpresa || "")}</textarea>
        <label class="label">${t("labelPhone")}</label>
        <input class="input" id="telefoneEmpresaInput" value="${U.esc(state.telefoneEmpresa || "")}" maxlength="40" inputmode="tel" autocomplete="tel" />
        <button type="button" class="btn btn--primary btn--sm" id="btnSaveEmpresa" style="margin-top:8px">${t("saveData")}</button>
      </div>
      <div class="panel">
        <div class="panel__head"><h2 class="panel__title">${t("logoTitle")}</h2></div>
        <p class="hint">${t("logoHint")}</p>
        ${state.logo && state.logo.dataUrl ? `<img class="logo-preview" src="${state.logo.dataUrl}" alt="${U.esc(t("logoAlt"))}" />` : `<p class='hint'>${t("noLogo", { name: state.nomeEmpresa || "Nonato Service" })}</p>`}
        <label class="btn btn--primary btn--file">${t("uploadLogo")}<input type="file" id="logoFile" accept="image/*" hidden /></label>
        ${state.logo ? `<button type="button" class="btn btn--danger btn--sm" id="btnRemoveLogo" style="margin-left:8px">${t("remove")}</button>` : ""}
      </div>`;
    $("btnSaveEmpresa")?.addEventListener("click", async () => {
      state.nomeEmpresa = $("nomeEmpresaInput").value.trim() || "Nonato Service";
      state.enderecoEmpresa = $("enderecoEmpresaInput").value.trim();
      state.telefoneEmpresa = $("telefoneEmpresaInput").value.trim();
      await persist();
      alert(t("alertSaved"));
      render();
    });
    $("logoFile")?.addEventListener("change", (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        state.logo = { dataUrl: String(r.result), nome: f.name.slice(0, 120) };
        persist().then(render);
      };
      r.readAsDataURL(f);
    });
    $("btnRemoveLogo")?.addEventListener("click", () => {
      state.logo = null;
      persist().then(render);
    });
  }

  function renderServicos() {
    const despesas = state.servicos.filter((s) => s.categoria === "despesa");
    const servs = state.servicos.filter((s) => s.categoria !== "despesa");
    const row = (s) => `
      <li class="list__item">
        <div><strong>${U.esc(s.cod ? s.cod + " — " : "")}${U.esc(s.nome)}</strong>
        <div class="list__meta">${s.categoria === "despesa" ? t("despesa") : t("servico")} · € ${Number(s.valor || 0).toFixed(2)} · ${U.esc(s.tipoCobranca || "")}</div></div>
        <div class="list__actions">
          <button type="button" class="btn btn--sm btn--danger" data-del-serv="${s.id}">✕</button>
        </div>
      </li>`;
    main.innerHTML = `
      <div class="panel">
        <div class="panel__head">
          <h2 class="panel__title">${t("servicesTitle")}</h2>
          <button type="button" class="btn btn--primary btn--sm" id="btnAddServico">${t("addService")}</button>
        </div>
        <p class="hint">${t("servicesHint")}</p>
        <ul class="list">${servs.length ? servs.map(row).join("") : `<li class='empty'>${t("noServices")}</li>`}</ul>
      </div>
      <div class="panel">
        <div class="panel__head">
          <h2 class="panel__title">${t("expenseTypesTitle")}</h2>
          <button type="button" class="btn btn--primary btn--sm" id="btnAddDespesaTipo">${t("addExpenseType")}</button>
        </div>
        <ul class="list">${despesas.length ? despesas.map(row).join("") : `<li class='empty'>${t("noExpenseTypes")}</li>`}</ul>
      </div>`;

    async function addServico(categoria) {
      const nome = await promptText(categoria === "despesa" ? t("newExpenseType") : t("newService"), t("promptName"), "");
      if (!nome) return;
      const cod = (await promptText(t("promptCode"), t("promptCodeEx"), "")) || "";
      const valorStr = (await promptText(t("promptValue"), "0.00", "0")) || "0";
      state.servicos.push({
        id: U.uid(),
        grupoId: state.servicoGrupos[0]?.id || "grupo-geral",
        cod,
        nome,
        valor: parseFloat(valorStr.replace(",", ".")) || 0,
        tipoCobranca: categoria === "despesa" ? "unidade" : "hora",
        categoria,
      });
      await persist();
      render();
    }

    $("btnAddServico").onclick = () => addServico("servico");
    $("btnAddDespesaTipo").onclick = () => addServico("despesa");
    main.querySelectorAll("[data-del-serv]").forEach((b) => {
      b.onclick = async () => {
        if (!confirm(t("confirmDeleteItem"))) return;
        state.servicos = state.servicos.filter((s) => s.id !== b.getAttribute("data-del-serv"));
        await persist();
        render();
      };
    });
  }

  function renderRelatoriosList() {
    if (state.editRelatorioId) return renderRelatorioForm();
    const sorted = [...state.relatorios].sort((a, b) => String(b.data).localeCompare(String(a.data)));
    main.innerHTML = `
      <div class="panel">
        <div class="panel__head">
          <h2 class="panel__title">${t("reportsTitle")}</h2>
          <button type="button" class="btn btn--primary btn--sm" id="btnNewRel">${t("addReport")}</button>
        </div>
        <ul class="list">${sorted.length ? sorted.map((r) => `
          <li class="list__item">
            <div><strong>${U.esc(r.numero)}</strong> — ${U.esc(r.cliente)}
            <div class="list__meta">${U.fmtDatePt(r.data)} · ${U.esc(r.tecnico)} · ${(r.diasTrabalho || []).length} ${t("days")}</div></div>
            <div class="list__actions">
              <button type="button" class="btn btn--sm" data-edit-rel="${r.id}">${t("edit")}</button>
              <button type="button" class="btn btn--sm btn--primary" data-pdf-rel="${r.id}">PDF</button>
              <button type="button" class="btn btn--sm btn--wa" data-wa-rel="${r.id}">WhatsApp</button>
              <button type="button" class="btn btn--sm btn--danger" data-del-rel="${r.id}">✕</button>
            </div>
          </li>`).join("") : `<li class='empty'>${t("noReports")}</li>`}</ul>
      </div>`;

    $("btnNewRel").onclick = () => {
      const r = U.relatorioVazio();
      r.numero = U.gerarNumeroRelatorio(state.relatorios, r.data);
      state.relatorios.push(r);
      state.editRelatorioId = r.id;
      persist().then(render);
    };
    main.querySelectorAll("[data-edit-rel]").forEach((b) => {
      b.onclick = () => { state.editRelatorioId = b.getAttribute("data-edit-rel"); render(); };
    });
    main.querySelectorAll("[data-pdf-rel]").forEach((b) => {
      b.onclick = () => {
        const r = state.relatorios.find((x) => x.id === b.getAttribute("data-pdf-rel"));
        if (r) Pdf.printRelatorio(r, getBrand());
      };
    });
    main.querySelectorAll("[data-wa-rel]").forEach((b) => {
      b.onclick = () => {
        const r = state.relatorios.find((x) => x.id === b.getAttribute("data-wa-rel"));
        if (r) Pdf.shareRelatorioWhatsApp(r, getBrand());
      };
    });
    main.querySelectorAll("[data-del-rel]").forEach((b) => {
      b.onclick = async () => {
        if (!confirm(t("confirmDeleteReport"))) return;
        state.relatorios = state.relatorios.filter((x) => x.id !== b.getAttribute("data-del-rel"));
        await persist();
        render();
      };
    });
  }

  function renderRelatorioForm() {
    const r = state.relatorios.find((x) => x.id === state.editRelatorioId);
    if (!r) { state.editRelatorioId = null; return render(); }

    const diasHtml = (r.diasTrabalho || []).map((dia, idx) => `
      <div class="dia-card" data-dia-idx="${idx}">
        <div class="dia-card__head"><strong>${t("day")} ${idx + 1}</strong><button type="button" class="btn btn--sm btn--danger" data-rm-dia="${idx}">${t("remove")}</button></div>
        <label class="label">${t("labelDate")}</label><input class="input" data-f="data" type="date" value="${(dia.data || "").slice(0, 10)}" />
        <div class="dia-grid">
          <div><label class="label">${t("labelOutDeparture")}</label><input class="input" data-f="idaHora" type="time" value="${dia.idaHora || ""}" /></div>
          <div><label class="label">${t("labelOutArrival")}</label><input class="input" data-f="idaChegada" type="time" value="${dia.idaChegada || ""}" /></div>
          <div><label class="label">${t("labelHoursStart")}</label><input class="input" data-f="horasInicio" type="time" value="${dia.horasInicio || ""}" /></div>
          <div><label class="label">${t("labelHoursEnd")}</label><input class="input" data-f="horasFim" type="time" value="${dia.horasFim || ""}" /></div>
          <div><label class="label">${t("labelReturnDeparture")}</label><input class="input" data-f="retornoSaida" type="time" value="${dia.retornoSaida || ""}" /></div>
          <div><label class="label">${t("labelReturnArrival")}</label><input class="input" data-f="retornoChegada" type="time" value="${dia.retornoChegada || ""}" /></div>
          <div><label class="label">${t("labelKmOut")}</label><input class="input" data-f="kmIda" inputmode="decimal" value="${dia.kmIda || ""}" /></div>
          <div><label class="label">${t("labelKmReturn")}</label><input class="input" data-f="kmRetorno" inputmode="decimal" value="${dia.kmRetorno || ""}" /></div>
          <div><label class="label">${t("labelBreak")}</label><input class="input" data-f="tempoPausa" placeholder="0:30" value="${dia.tempoPausa || dia.pausa || ""}" /></div>
        </div>
        <label class="label">${t("labelWorkDesc")}</label>
        <textarea class="textarea" data-f="descricaoTrabalho" rows="3">${U.esc(dia.descricaoTrabalho || "")}</textarea>
      </div>`).join("");

    main.innerHTML = `
      <div class="panel">
        <div class="panel__head">
          <h2 class="panel__title">${t("reportTitle", { num: r.numero })}</h2>
          <div class="list__actions">
            <button type="button" class="btn btn--sm" id="btnBackRel">${t("backList")}</button>
            <button type="button" class="btn btn--sm btn--wa" id="btnWaRel">WhatsApp</button>
            <button type="button" class="btn btn--sm btn--primary" id="btnPdfRel">PDF</button>
          </div>
        </div>
        <div class="grid2">
          <div><label class="label">${t("labelNumber")}</label><input class="input" id="f_numero" value="${U.esc(r.numero)}" /></div>
          <div><label class="label">${t("labelDate")}</label><input class="input" id="f_data" type="date" value="${(r.data || "").slice(0, 10)}" /></div>
          <div><label class="label">${t("labelTechnician")}</label><input class="input" id="f_tecnico" value="${U.esc(r.tecnico)}" /></div>
          <div><label class="label">${t("labelClient")}</label><input class="input" id="f_cliente" value="${U.esc(r.cliente)}" /></div>
          <div><label class="label">${t("labelCity")}</label><input class="input" id="f_cidade" value="${U.esc(r.cidade)}" /></div>
          <div><label class="label">${t("labelPhone")}</label><input class="input" id="f_telefone" value="${U.esc(r.telefone)}" /></div>
          <div><label class="label">${t("labelMachine")}</label><input class="input" id="f_maquina" value="${U.esc(r.maquinaModelo)}" /></div>
          <div><label class="label">${t("labelMachineNum")}</label><input class="input" id="f_numMaquina" value="${U.esc(r.numeroMaquina)}" /></div>
        </div>
        <label class="label">${t("labelServiceType")}</label><input class="input" id="f_tipo" value="${U.esc(r.tipoServico)}" />
        <label class="label">${t("labelObservations")}</label><textarea class="textarea" id="f_obs" rows="3">${U.esc(r.observacoes || "")}</textarea>
        <div class="panel__head" style="margin-top:16px"><h3 class="panel__title">${t("workDays")}</h3><button type="button" class="btn btn--sm btn--primary" id="btnAddDia">${t("addDay")}</button></div>
        <div id="diasWrap">${diasHtml}</div>
        <div class="panel__head" style="margin-top:20px"><h3 class="panel__title">${t("signatures")}</h3></div>
        <div class="sig-row">
          ${signatureSectionHtml(t("sigTechnician"), "assinaturaTecnico", r.assinaturaTecnico, r.tecnico)}
          ${signatureSectionHtml(t("sigClient"), "assinaturaCliente", r.assinaturaCliente, r.cliente)}
        </div>
        <button type="button" class="btn btn--primary" id="btnSaveRel" style="margin-top:12px;width:100%">${t("saveReport")}</button>
      </div>`;

    function collectForm() {
      r.numero = $("f_numero").value.trim();
      r.data = $("f_data").value;
      r.tecnico = $("f_tecnico").value.trim();
      r.cliente = $("f_cliente").value.trim();
      r.cidade = $("f_cidade").value.trim();
      r.telefone = $("f_telefone").value.trim();
      r.maquinaModelo = $("f_maquina").value.trim();
      r.numeroMaquina = $("f_numMaquina").value.trim();
      r.tipoServico = $("f_tipo").value.trim();
      r.observacoes = $("f_obs").value;
      main.querySelectorAll(".dia-card").forEach((card, idx) => {
        const dia = r.diasTrabalho[idx];
        if (!dia) return;
        card.querySelectorAll("[data-f]").forEach((inp) => {
          dia[inp.getAttribute("data-f")] = inp.value;
        });
        Object.assign(dia, U.atualizarCalculosDia(dia));
      });
    }

    $("btnBackRel").onclick = () => { collectForm(); persist(); state.editRelatorioId = null; render(); };
    $("btnPdfRel").onclick = () => { collectForm(); Pdf.printRelatorio(r, getBrand()); };
    $("btnWaRel").onclick = () => { collectForm(); persist().then(() => Pdf.shareRelatorioWhatsApp(r, getBrand())); };
    wireSignatureSection("assinaturaTecnico", r);
    wireSignatureSection("assinaturaCliente", r);
    $("btnSaveRel").onclick = async () => {
      collectForm();
      if (!r.tecnico || !r.cliente || !r.numero) { alert(t("fillRequired")); return; }
      await persist();
      alert(t("alertReportSaved"));
      state.editRelatorioId = null;
      render();
    };
    $("btnAddDia").onclick = () => {
      collectForm();
      r.diasTrabalho.push(U.diaTrabalhoVazio());
      render();
    };
    main.querySelectorAll("[data-rm-dia]").forEach((b) => {
      b.onclick = () => {
        collectForm();
        r.diasTrabalho.splice(parseInt(b.getAttribute("data-rm-dia"), 10), 1);
        if (!r.diasTrabalho.length) r.diasTrabalho.push(U.diaTrabalhoVazio());
        render();
      };
    });
  }

  function renderDespesasList() {
    if (state.editDespesaId) return renderDespesaForm();
    main.innerHTML = `
      <div class="panel">
        <div class="panel__head">
          <h2 class="panel__title">${t("expensesTitle")}</h2>
          <button type="button" class="btn btn--primary btn--sm" id="btnNewDespDoc">${t("addDoc")}</button>
        </div>
        <p class="hint">${t("expensesHint")}</p>
        <ul class="list">${state.despesasDocs.length ? state.despesasDocs.map((d) => {
          const tot = (d.despesas || []).reduce((s, x) => s + (Number(x.valor) || 0), 0);
          return `<li class="list__item">
            <div><strong>${U.esc(d.clienteNome)}</strong>
            <div class="list__meta">${U.fmtDatePt(d.data)} · ${U.esc(d.relatorioNumero || "—")} · € ${tot.toFixed(2)} · ${(d.despesas || []).length} ${t("line")}</div></div>
            <div class="list__actions">
              <button type="button" class="btn btn--sm" data-edit-desp="${d.id}">${t("edit")}</button>
              <button type="button" class="btn btn--sm btn--primary" data-pdf-desp="${d.id}">PDF</button>
              <button type="button" class="btn btn--sm btn--danger" data-del-desp="${d.id}">✕</button>
            </div>
          </li>`;
        }).join("") : `<li class='empty'>${t("noExpenseDocs")}</li>`}</ul>
      </div>`;

    $("btnNewDespDoc").onclick = async () => {
      const cliente = await promptText(t("newDoc"), t("clientName"), "");
      if (!cliente) return;
      const doc = {
        id: U.uid(),
        clienteId: "",
        clienteNome: cliente,
        relatorioId: "",
        relatorioNumero: "",
        data: U.todayIso(),
        despesas: [],
        dataCriacao: new Date().toISOString(),
      };
      state.despesasDocs.push(doc);
      state.editDespesaId = doc.id;
      await persist();
      render();
    };
    main.querySelectorAll("[data-edit-desp]").forEach((b) => {
      b.onclick = () => { state.editDespesaId = b.getAttribute("data-edit-desp"); render(); };
    });
    main.querySelectorAll("[data-pdf-desp]").forEach((b) => {
      b.onclick = () => {
        const d = state.despesasDocs.find((x) => x.id === b.getAttribute("data-pdf-desp"));
        if (d) Pdf.printDespesas(d, getBrand());
      };
    });
    main.querySelectorAll("[data-del-desp]").forEach((b) => {
      b.onclick = async () => {
        if (!confirm(t("confirmDeleteDoc"))) return;
        state.despesasDocs = state.despesasDocs.filter((x) => x.id !== b.getAttribute("data-del-desp"));
        await persist();
        render();
      };
    });
  }

  function renderDespesaForm() {
    const doc = state.despesasDocs.find((x) => x.id === state.editDespesaId);
    if (!doc) { state.editDespesaId = null; return render(); }
    const tipos = state.servicos.filter((s) => s.categoria === "despesa");
    const relOpts = state.relatorios.map((r) => `<option value="${r.id}" data-num="${U.esc(r.numero)}" ${doc.relatorioId === r.id ? "selected" : ""}>${U.esc(r.numero)} — ${U.esc(r.cliente)}</option>`).join("");

    const linhasHtml = (doc.despesas || []).map((lin, i) => `
      <li class="list__item">
        <div><strong>${U.esc(lin.tipoNome)}</strong> — € ${(Number(lin.valor) || 0).toFixed(2)}
        <div class="list__meta">${U.esc(lin.descricao || "")} · ${(lin.fotos || []).length} ${t("photo")}</div>
        ${(lin.fotos || []).length ? `<div class="foto-grid">${lin.fotos.map((f) => `<img src="${f}" alt="" />`).join("")}</div>` : ""}
        </div>
        <button type="button" class="btn btn--sm btn--danger" data-rm-lin="${i}">✕</button>
      </li>`).join("");

    main.innerHTML = `
      <div class="panel">
        <div class="panel__head">
          <h2 class="panel__title">${t("expensesDocTitle", { client: doc.clienteNome })}</h2>
          <div class="list__actions">
            <button type="button" class="btn btn--sm" id="btnBackDesp">${t("backList")}</button>
            <button type="button" class="btn btn--sm btn--primary" id="btnPdfDesp">PDF</button>
          </div>
        </div>
        <label class="label">${t("labelClient")}</label><input class="input" id="d_cliente" value="${U.esc(doc.clienteNome)}" />
        <label class="label">${t("labelReportOptional")}</label>
        <select class="select" id="d_rel"><option value="">${t("none")}</option>${relOpts}</select>
        <label class="label">${t("labelDocDate")}</label><input class="input" id="d_data" type="date" value="${(doc.data || "").slice(0, 10)}" />

        <div class="panel__head" style="margin-top:16px"><h3 class="panel__title">${t("newLine")}</h3></div>
        ${tipos.length ? `<label class="label">${t("labelType")}</label><select class="select" id="lin_tipo">${tipos.map((tpo) => `<option value="${tpo.id}">${U.esc(tpo.nome)}</option>`).join("")}</select>` : `<p class='hint'>${t("registerTypesInServices")}</p>`}
        <label class="label">${t("labelValue")}</label><input class="input" id="lin_valor" inputmode="decimal" placeholder="0.00" />
        <label class="label">${t("labelDescription")}</label><input class="input" id="lin_desc" />
        <label class="btn btn--file btn--sm">${t("addReceiptPhotos")}<input type="file" id="lin_fotos" accept="image/*" multiple hidden /></label>
        <div class="foto-grid" id="lin_preview"></div>
        <button type="button" class="btn btn--primary btn--sm" id="btnAddLin" style="margin-top:8px">${t("addLine")}</button>

        <h3 class="panel__title" style="margin-top:20px">${t("lines")} (${(doc.despesas || []).length})</h3>
        <ul class="list">${linhasHtml || `<li class='empty'>${t("noLinesYet")}</li>`}</ul>
        <button type="button" class="btn btn--primary" id="btnSaveDesp" style="width:100%;margin-top:12px">${t("saveDoc")}</button>
      </div>`;

    let pendingFotos = [];
    $("lin_fotos")?.addEventListener("change", (e) => {
      const files = Array.from(e.target.files || []);
      e.target.value = "";
      files.forEach((f) => {
        const r = new FileReader();
        r.onload = () => {
          pendingFotos.push(String(r.result));
          $("lin_preview").innerHTML = pendingFotos.map((p) => `<img src="${p}" alt="" />`).join("");
        };
        r.readAsDataURL(f);
      });
    });

    $("btnAddLin").onclick = () => {
      const tipoId = $("lin_tipo")?.value;
      if (!tipoId) { alert(t("registerExpenseTypesFirst")); return; }
      const tipo = state.servicos.find((s) => s.id === tipoId);
      doc.despesas.push({
        id: U.uid(),
        tipoId,
        tipoNome: tipo?.nome || "",
        valor: parseFloat(String($("lin_valor").value).replace(",", ".")) || 0,
        descricao: $("lin_desc").value.trim(),
        fotos: [...pendingFotos],
        data: $("d_data").value || U.todayIso(),
      });
      pendingFotos = [];
      persist().then(render);
    };

    $("btnBackDesp").onclick = () => { state.editDespesaId = null; render(); };
    $("btnPdfDesp").onclick = () => Pdf.printDespesas(doc, getBrand());
    $("btnSaveDesp").onclick = async () => {
      doc.clienteNome = $("d_cliente").value.trim();
      doc.data = $("d_data").value;
      const sel = $("d_rel");
      doc.relatorioId = sel.value;
      doc.relatorioNumero = sel.selectedOptions[0]?.getAttribute("data-num") || "";
      await persist();
      alert(t("alertDocSaved"));
      state.editDespesaId = null;
      render();
    };
    main.querySelectorAll("[data-rm-lin]").forEach((b) => {
      b.onclick = () => {
        doc.despesas.splice(parseInt(b.getAttribute("data-rm-lin"), 10), 1);
        persist().then(render);
      };
    });
  }

  function render() {
    if (state.view === "home") renderHome();
    else if (state.view === "logo") renderLogo();
    else if (state.view === "servicos") renderServicos();
    else if (state.view === "relatorios") renderRelatoriosList();
    else if (state.view === "despesas") renderDespesasList();
  }

  document.querySelectorAll(".tabs__btn").forEach((b) => {
    b.addEventListener("click", () => {
      state.editRelatorioId = null;
      state.editDespesaId = null;
      setView(b.getAttribute("data-view"));
    });
  });

  function wireLangButtons() {
    document.querySelectorAll(".lang-btn[data-lang]").forEach((btn) => {
      if (btn.dataset.langWired) return;
      btn.dataset.langWired = "1";
      btn.addEventListener("click", () => setLanguage(btn.getAttribute("data-lang")));
    });
  }

  load().then(() => {
    wireLangButtons();
    render();
  });
})();
