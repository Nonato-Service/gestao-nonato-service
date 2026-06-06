(function () {
  "use strict";

  const Db = window.NCampoDb;
  const U = window.NCampoUtils;
  const Pdf = window.NCampoPdf;

  const $ = (id) => document.getElementById(id);
  const main = $("main");
  const modal = $("modal");

  let state = {
    view: "home",
    logo: null,
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
    alert("App instalada! Pode fechar o browser e usar pelo ícone — funciona offline.");
  });

  function tryInstallApp() {
    if (deferredInstall) {
      deferredInstall.prompt();
      deferredInstall.userChoice.finally(() => { deferredInstall = null; });
      return;
    }
    alert("Toque no menu ⋮ do Chrome → «Instalar app» ou «Adicionar ao ecrã inicial».\n\nDepois de instalada, funciona sem internet.");
  }

  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }

  async function persist() {
    await Db.saveLogo(state.logo);
    await Db.saveServicoGrupos(state.servicoGrupos);
    await Db.saveServicos(state.servicos);
    await Db.saveRelatorios(state.relatorios);
    await Db.saveDespesasDocs(state.despesasDocs);
    await Db.saveCartoes(state.cartoes);
    updateTopLogo();
  }

  async function load() {
    const all = await Db.loadAll();
    state.logo = all.logo;
    state.servicoGrupos = all.servicoGrupos.length ? all.servicoGrupos : [{ id: "grupo-geral", nome: "Geral", ordem: 0 }];
    state.servicos = all.servicos;
    state.relatorios = all.relatorios;
    state.despesasDocs = all.despesasDocs;
    state.cartoes = all.cartoes;
    if (!state.servicos.length) {
      state.servicos = [
        { id: U.uid(), grupoId: "grupo-geral", cod: "HTT", nome: "Hora técnica trabalhada", valor: 0, tipoCobranca: "hora", categoria: "servico" },
        { id: U.uid(), grupoId: "grupo-geral", cod: "KM", nome: "Quilometragem", valor: 0, tipoCobranca: "km", categoria: "servico" },
        { id: U.uid(), grupoId: "grupo-geral", cod: "COMB", nome: "Combustível", valor: 0, tipoCobranca: "unidade", categoria: "despesa" },
        { id: U.uid(), grupoId: "grupo-geral", cod: "PED", nome: "Pedágio", valor: 0, tipoCobranca: "unidade", categoria: "despesa" },
      ];
      await persist();
    }
    updateTopLogo();
  }

  function updateTopLogo() {
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
        <div class="kpi"><div class="kpi__n">${state.relatorios.length}</div><div class="kpi__l">Relatórios</div></div>
        <div class="kpi"><div class="kpi__n">${state.servicos.length}</div><div class="kpi__l">Serviços</div></div>
        <div class="kpi"><div class="kpi__n">${state.despesasDocs.length}</div><div class="kpi__l">Despesas</div></div>
      </div>
      <div class="panel">
        <h2 class="panel__title">Nonato Campo — app de terreno</h2>
        <p class="hint">Depois de <strong>instalar no telemóvel</strong>, funciona <strong>100% offline</strong> — sem Wi‑Fi, sem PC, sem internet. Os dados ficam só neste aparelho.</p>
        <div class="panel panel--install">
          <h3 class="panel__title">Instalar (só uma vez)</h3>
          <ol class="install-steps">
            <li>Abra no <strong>Chrome</strong> (Android) — link enviado por WhatsApp ou Wi‑Fi do PC (ver abaixo).</li>
            <li>Toque em <strong>Instalar app</strong> (botão abaixo ou menu ⋮).</li>
            <li>Abra pelo <strong>ícone</strong> no ecrã — daí em diante, tudo offline.</li>
          </ol>
          <button type="button" class="btn btn--primary btn--install" id="btnInstallApp" hidden>📲 Instalar no telemóvel</button>
          ${isStandalone() ? "<p class='install-ok'>✓ App instalada — a usar em modo offline</p>" : ""}
        </div>
        <div class="list__actions" style="margin-top:12px">
          <button type="button" class="btn btn--primary" data-go="relatorios">+ Novo relatório</button>
          <button type="button" class="btn" data-go="despesas">Registar despesas</button>
          <button type="button" class="btn" data-go="logo">Configurar logo</button>
        </div>
      </div>`;
    main.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => setView(b.getAttribute("data-go"))));
    const installBtn = document.getElementById("btnInstallApp");
    if (installBtn) installBtn.onclick = tryInstallApp;
    if (deferredInstall && installBtn) installBtn.hidden = false;
  }

  function renderLogo() {
    main.innerHTML = `
      <div class="panel">
        <div class="panel__head"><h2 class="panel__title">Logo nos PDFs</h2></div>
        <p class="hint">Escolha a imagem que aparece nos relatórios de serviço e despesas (PNG ou JPG recomendado).</p>
        ${state.logo && state.logo.dataUrl ? `<img class="logo-preview" src="${state.logo.dataUrl}" alt="Logo" />` : "<p class='hint'>Nenhum logo — usa texto NONATO SERVICE.</p>"}
        <label class="btn btn--primary btn--file">Carregar logo<input type="file" id="logoFile" accept="image/*" hidden /></label>
        ${state.logo ? `<button type="button" class="btn btn--danger btn--sm" id="btnRemoveLogo" style="margin-left:8px">Remover</button>` : ""}
      </div>`;
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
        <div class="list__meta">${s.categoria === "despesa" ? "Despesa" : "Serviço"} · € ${Number(s.valor || 0).toFixed(2)} · ${U.esc(s.tipoCobranca || "")}</div></div>
        <div class="list__actions">
          <button type="button" class="btn btn--sm btn--danger" data-del-serv="${s.id}">✕</button>
        </div>
      </li>`;
    main.innerHTML = `
      <div class="panel">
        <div class="panel__head">
          <h2 class="panel__title">Cadastro de serviços</h2>
          <button type="button" class="btn btn--primary btn--sm" id="btnAddServico">+ Serviço</button>
        </div>
        <p class="hint">Códigos HTT, KM, diárias, etc. — usados no fechamento. Categoria «despesa» alimenta o registo de despesas.</p>
        <ul class="list">${servs.length ? servs.map(row).join("") : "<li class='empty'>Sem serviços cadastrados.</li>"}</ul>
      </div>
      <div class="panel">
        <div class="panel__head">
          <h2 class="panel__title">Tipos de despesa</h2>
          <button type="button" class="btn btn--primary btn--sm" id="btnAddDespesaTipo">+ Tipo despesa</button>
        </div>
        <ul class="list">${despesas.length ? despesas.map(row).join("") : "<li class='empty'>Sem tipos de despesa.</li>"}</ul>
      </div>`;

    async function addServico(categoria) {
      const nome = await promptText(categoria === "despesa" ? "Novo tipo de despesa" : "Novo serviço", "Nome", "");
      if (!nome) return;
      const cod = (await promptText("Código (opcional)", "Ex.: HTT, COMB", "")) || "";
      const valorStr = (await promptText("Valor €", "0.00", "0")) || "0";
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
        if (!confirm("Eliminar este item?")) return;
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
          <h2 class="panel__title">Relatórios de serviço</h2>
          <button type="button" class="btn btn--primary btn--sm" id="btnNewRel">+ Relatório</button>
        </div>
        <ul class="list">${sorted.length ? sorted.map((r) => `
          <li class="list__item">
            <div><strong>${U.esc(r.numero)}</strong> — ${U.esc(r.cliente)}
            <div class="list__meta">${U.fmtDatePt(r.data)} · ${U.esc(r.tecnico)} · ${(r.diasTrabalho || []).length} dia(s)</div></div>
            <div class="list__actions">
              <button type="button" class="btn btn--sm" data-edit-rel="${r.id}">Editar</button>
              <button type="button" class="btn btn--sm btn--primary" data-pdf-rel="${r.id}">PDF</button>
              <button type="button" class="btn btn--sm btn--danger" data-del-rel="${r.id}">✕</button>
            </div>
          </li>`).join("") : "<li class='empty'>Nenhum relatório. Toque em + Relatório.</li>"}</ul>
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
        if (r) Pdf.printRelatorio(r, state.logo);
      };
    });
    main.querySelectorAll("[data-del-rel]").forEach((b) => {
      b.onclick = async () => {
        if (!confirm("Eliminar relatório?")) return;
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
        <div class="dia-card__head"><strong>Dia ${idx + 1}</strong><button type="button" class="btn btn--sm btn--danger" data-rm-dia="${idx}">Remover</button></div>
        <label class="label">Data</label><input class="input" data-f="data" type="date" value="${(dia.data || "").slice(0, 10)}" />
        <div class="dia-grid">
          <div><label class="label">Ida saída</label><input class="input" data-f="idaHora" type="time" value="${dia.idaHora || ""}" /></div>
          <div><label class="label">Ida chegada</label><input class="input" data-f="idaChegada" type="time" value="${dia.idaChegada || ""}" /></div>
          <div><label class="label">Horas início</label><input class="input" data-f="horasInicio" type="time" value="${dia.horasInicio || ""}" /></div>
          <div><label class="label">Horas fim</label><input class="input" data-f="horasFim" type="time" value="${dia.horasFim || ""}" /></div>
          <div><label class="label">Retorno saída</label><input class="input" data-f="retornoSaida" type="time" value="${dia.retornoSaida || ""}" /></div>
          <div><label class="label">Retorno chegada</label><input class="input" data-f="retornoChegada" type="time" value="${dia.retornoChegada || ""}" /></div>
          <div><label class="label">Km ida</label><input class="input" data-f="kmIda" inputmode="decimal" value="${dia.kmIda || ""}" /></div>
          <div><label class="label">Km retorno</label><input class="input" data-f="kmRetorno" inputmode="decimal" value="${dia.kmRetorno || ""}" /></div>
          <div><label class="label">Pausa (HH:MM)</label><input class="input" data-f="tempoPausa" placeholder="0:30" value="${dia.tempoPausa || dia.pausa || ""}" /></div>
        </div>
        <label class="label">Descrição do trabalho</label>
        <textarea class="textarea" data-f="descricaoTrabalho" rows="3">${U.esc(dia.descricaoTrabalho || "")}</textarea>
      </div>`).join("");

    main.innerHTML = `
      <div class="panel">
        <div class="panel__head">
          <h2 class="panel__title">Relatório ${U.esc(r.numero)}</h2>
          <div class="list__actions">
            <button type="button" class="btn btn--sm" id="btnBackRel">← Lista</button>
            <button type="button" class="btn btn--sm btn--primary" id="btnPdfRel">PDF</button>
          </div>
        </div>
        <div class="grid2">
          <div><label class="label">Número</label><input class="input" id="f_numero" value="${U.esc(r.numero)}" /></div>
          <div><label class="label">Data</label><input class="input" id="f_data" type="date" value="${(r.data || "").slice(0, 10)}" /></div>
          <div><label class="label">Técnico</label><input class="input" id="f_tecnico" value="${U.esc(r.tecnico)}" /></div>
          <div><label class="label">Cliente</label><input class="input" id="f_cliente" value="${U.esc(r.cliente)}" /></div>
          <div><label class="label">Cidade</label><input class="input" id="f_cidade" value="${U.esc(r.cidade)}" /></div>
          <div><label class="label">Telefone</label><input class="input" id="f_telefone" value="${U.esc(r.telefone)}" /></div>
          <div><label class="label">Máquina / modelo</label><input class="input" id="f_maquina" value="${U.esc(r.maquinaModelo)}" /></div>
          <div><label class="label">Nº máquina</label><input class="input" id="f_numMaquina" value="${U.esc(r.numeroMaquina)}" /></div>
        </div>
        <label class="label">Tipo de serviço</label><input class="input" id="f_tipo" value="${U.esc(r.tipoServico)}" />
        <label class="label">Observações</label><textarea class="textarea" id="f_obs" rows="3">${U.esc(r.observacoes || "")}</textarea>
        <div class="panel__head" style="margin-top:16px"><h3 class="panel__title">Dias de trabalho</h3><button type="button" class="btn btn--sm btn--primary" id="btnAddDia">+ Dia</button></div>
        <div id="diasWrap">${diasHtml}</div>
        <button type="button" class="btn btn--primary" id="btnSaveRel" style="margin-top:12px;width:100%">Guardar relatório</button>
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
    $("btnPdfRel").onclick = () => { collectForm(); Pdf.printRelatorio(r, state.logo); };
    $("btnSaveRel").onclick = async () => {
      collectForm();
      if (!r.tecnico || !r.cliente || !r.numero) { alert("Preencha técnico, cliente e número."); return; }
      await persist();
      alert("Relatório guardado.");
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
          <h2 class="panel__title">Registo de despesas</h2>
          <button type="button" class="btn btn--primary btn--sm" id="btnNewDespDoc">+ Documento</button>
        </div>
        <p class="hint">Um documento por cliente/relatório. Adicione linhas com fotos de comprovativos e gere PDF.</p>
        <ul class="list">${state.despesasDocs.length ? state.despesasDocs.map((d) => {
          const tot = (d.despesas || []).reduce((s, x) => s + (Number(x.valor) || 0), 0);
          return `<li class="list__item">
            <div><strong>${U.esc(d.clienteNome)}</strong>
            <div class="list__meta">${U.fmtDatePt(d.data)} · ${U.esc(d.relatorioNumero || "—")} · € ${tot.toFixed(2)} · ${(d.despesas || []).length} linha(s)</div></div>
            <div class="list__actions">
              <button type="button" class="btn btn--sm" data-edit-desp="${d.id}">Editar</button>
              <button type="button" class="btn btn--sm btn--primary" data-pdf-desp="${d.id}">PDF</button>
              <button type="button" class="btn btn--sm btn--danger" data-del-desp="${d.id}">✕</button>
            </div>
          </li>`;
        }).join("") : "<li class='empty'>Nenhum documento de despesas.</li>"}</ul>
      </div>`;

    $("btnNewDespDoc").onclick = async () => {
      const cliente = await promptText("Novo documento", "Nome do cliente", "");
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
        if (d) Pdf.printDespesas(d, state.logo);
      };
    });
    main.querySelectorAll("[data-del-desp]").forEach((b) => {
      b.onclick = async () => {
        if (!confirm("Eliminar documento?")) return;
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
        <div class="list__meta">${U.esc(lin.descricao || "")} · ${(lin.fotos || []).length} foto(s)</div>
        ${(lin.fotos || []).length ? `<div class="foto-grid">${lin.fotos.map((f) => `<img src="${f}" alt="" />`).join("")}</div>` : ""}
        </div>
        <button type="button" class="btn btn--sm btn--danger" data-rm-lin="${i}">✕</button>
      </li>`).join("");

    main.innerHTML = `
      <div class="panel">
        <div class="panel__head">
          <h2 class="panel__title">Despesas — ${U.esc(doc.clienteNome)}</h2>
          <div class="list__actions">
            <button type="button" class="btn btn--sm" id="btnBackDesp">← Lista</button>
            <button type="button" class="btn btn--sm btn--primary" id="btnPdfDesp">PDF</button>
          </div>
        </div>
        <label class="label">Cliente</label><input class="input" id="d_cliente" value="${U.esc(doc.clienteNome)}" />
        <label class="label">Relatório (opcional)</label>
        <select class="select" id="d_rel"><option value="">— Nenhum —</option>${relOpts}</select>
        <label class="label">Data documento</label><input class="input" id="d_data" type="date" value="${(doc.data || "").slice(0, 10)}" />

        <div class="panel__head" style="margin-top:16px"><h3 class="panel__title">Nova linha</h3></div>
        ${tipos.length ? `<label class="label">Tipo</label><select class="select" id="lin_tipo">${tipos.map((t) => `<option value="${t.id}">${U.esc(t.nome)}</option>`).join("")}</select>` : "<p class='hint'>Cadastre tipos de despesa em Serviços.</p>"}
        <label class="label">Valor €</label><input class="input" id="lin_valor" inputmode="decimal" placeholder="0.00" />
        <label class="label">Descrição</label><input class="input" id="lin_desc" />
        <label class="btn btn--file btn--sm">+ Fotos comprovativo<input type="file" id="lin_fotos" accept="image/*" multiple hidden /></label>
        <div class="foto-grid" id="lin_preview"></div>
        <button type="button" class="btn btn--primary btn--sm" id="btnAddLin" style="margin-top:8px">Adicionar linha</button>

        <h3 class="panel__title" style="margin-top:20px">Linhas (${(doc.despesas || []).length})</h3>
        <ul class="list">${linhasHtml || "<li class='empty'>Sem linhas ainda.</li>"}</ul>
        <button type="button" class="btn btn--primary" id="btnSaveDesp" style="width:100%;margin-top:12px">Guardar documento</button>
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
      if (!tipoId) { alert("Cadastre tipos de despesa primeiro."); return; }
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
    $("btnPdfDesp").onclick = () => Pdf.printDespesas(doc, state.logo);
    $("btnSaveDesp").onclick = async () => {
      doc.clienteNome = $("d_cliente").value.trim();
      doc.data = $("d_data").value;
      const sel = $("d_rel");
      doc.relatorioId = sel.value;
      doc.relatorioNumero = sel.selectedOptions[0]?.getAttribute("data-num") || "";
      await persist();
      alert("Documento guardado.");
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

  load().then(() => {
    render();
  });
})();
