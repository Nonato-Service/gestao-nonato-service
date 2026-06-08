(function (global) {
  "use strict";
  const U = global.NCampoUtils;
  const I18n = global.NCampoI18n;
  const t = (k, p) => I18n.t(k, p);

  const RS_PDF_CSS = `@page { size: A4 portrait; margin: 10mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body.rs-pdf { font-family: "Segoe UI", system-ui, sans-serif; color: #0f172a; background: #fff; font-size: 10px; line-height: 1.45; padding: 10px 12px 16px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.rs-pdf .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 3px solid #166534; }
.rs-pdf .header-left { display: flex; flex-direction: column; gap: 6px; max-width: 45%; }
.rs-pdf .header-logo img { max-height: 52px; max-width: 200px; object-fit: contain; display: block; }
.rs-pdf .header-logo strong { font-size: 14px; color: #14532d; }
.rs-pdf .header-contacts { font-size: 9px; color: #475569; line-height: 1.4; }
.rs-pdf .header-title { font-size: 13px; font-weight: 800; text-align: center; flex: 1; text-transform: uppercase; letter-spacing: 0.06em; padding-top: 4px; }
.rs-pdf .header-number { font-size: 11px; font-weight: 800; color: #14532d; white-space: nowrap; padding: 6px 10px; border: 1px solid #bbf7d0; border-radius: 8px; background: #f0fdf4; }
.rs-pdf .info-section { margin-bottom: 14px; padding: 14px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fafafa; page-break-inside: avoid; }
.rs-pdf .info-section h3 { font-size: 9px; margin: -14px -14px 12px; padding: 10px 12px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #14532d; background: #ecfdf5; border-left: 4px solid #166534; border-radius: 10px 10px 0 0; }
.rs-pdf .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 14px; }
.rs-pdf .info-label { font-weight: 700; color: #334155; }
.rs-pdf table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 0.92em; }
.rs-pdf th, .rs-pdf td { border: 1px solid #e2e8f0; padding: 5px 4px; text-align: center; vertical-align: middle; }
.rs-pdf th { background: #166534; color: #fff; font-weight: 700; font-size: 0.85em; }
.rs-pdf tbody tr:nth-child(even) td { background: #f8fafc; }
.rs-pdf .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 14px 0; }
.rs-pdf .summary-card { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 8px; text-align: center; background: #fff; }
.rs-pdf .summary-card h4 { font-size: 0.85em; margin-bottom: 6px; font-weight: 700; color: #334155; }
.rs-pdf .summary-card .value { font-size: 1.15em; font-weight: 800; color: #14532d; }
.rs-pdf .obs { margin-top: 12px; padding: 10px; background: #f8fafc; border-left: 3px solid #166534; border-radius: 0 6px 6px 0; white-space: pre-wrap; }
.rs-pdf .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; page-break-inside: avoid; }
.rs-pdf .sig-block { text-align: center; padding-top: 8px; border-top: 1px solid #cbd5e1; }
.rs-pdf .sig-block h4 { font-size: 9px; font-weight: 800; text-transform: uppercase; color: #14532d; margin-bottom: 8px; letter-spacing: 0.06em; }
.rs-pdf .sig-block img { max-width: 240px; max-height: 90px; object-fit: contain; display: block; margin: 0 auto 6px; border-bottom: 1px solid #000; padding-bottom: 4px; background: #fff; }
.rs-pdf .sig-line { width: 240px; height: 70px; border-bottom: 2px solid #000; margin: 0 auto 6px; }
.rs-pdf .sig-name { font-size: 9px; font-weight: 700; color: #334155; }
.rs-pdf .sig-date { font-size: 8px; color: #64748b; margin-top: 4px; }
@media print { body.rs-pdf { padding-bottom: 8mm; } }`;

  function logoHtml(logo, nomeEmpresa) {
    if (logo && logo.dataUrl) return `<img src="${logo.dataUrl}" alt="Logo" />`;
    return `<strong>${U.esc(nomeEmpresa || "Nonato Service")}</strong>`;
  }

  function brandOpts(brand) {
    if (brand && typeof brand === "object" && !brand.dataUrl) {
      return {
        logo: brand.logo,
        nomeEmpresa: brand.nomeEmpresa || "Nonato Service",
        enderecoEmpresa: brand.enderecoEmpresa || "",
        telefoneEmpresa: brand.telefoneEmpresa || "",
      };
    }
    return { logo: brand, nomeEmpresa: "Nonato Service", enderecoEmpresa: "", telefoneEmpresa: "" };
  }

  function headerContactsHtml(endereco, telefone, cls) {
    const parts = [];
    if (endereco) parts.push(`<div>${U.esc(endereco)}</div>`);
    if (telefone) parts.push(`<div>${t("pdfTel")}: ${U.esc(telefone)}</div>`);
    return parts.length ? `<div class="${cls || "header-contacts"}">${parts.join("")}</div>` : "";
  }

  function fmtAssinaturaData(iso) {
    if (!iso) return "";
    try {
      const loc = I18n.localeTag();
      return new Date(iso).toLocaleString(loc, { dateStyle: "short", timeStyle: "short" });
    } catch {
      return "";
    }
  }

  function assinaturaBlockHtml(titulo, imgData, nome, dataIso) {
    const img = imgData
      ? `<img src="${String(imgData).replace(/"/g, "&quot;")}" alt="${U.esc(t("sigAlt"))}" />`
      : `<div class="sig-line"></div>`;
    const data = fmtAssinaturaData(dataIso);
    return `<div class="sig-block">
      <h4>${U.esc(titulo)}</h4>
      ${img}
      ${nome ? `<div class="sig-name">${U.esc(nome)}</div>` : ""}
      ${data ? `<div class="sig-date">${t("pdfDateLabel")}: ${U.esc(data)}</div>` : `<div class="sig-date">${t("pdfDateLabel")}: ___________________</div>`}
    </div>`;
  }

  function signaturesHtml(relatorio) {
    return `<div class="signatures">
      ${assinaturaBlockHtml(t("sigTechnician"), relatorio.assinaturaTecnico, relatorio.tecnico, relatorio.dataAssinaturaTecnico)}
      ${assinaturaBlockHtml(t("sigClient"), relatorio.assinaturaCliente, relatorio.cliente, relatorio.dataAssinaturaCliente)}
    </div>`;
  }

  function openPrint(html, title) {
    const w = window.open("", "_blank");
    if (!w) {
      alert(t("pdfPopupBlocked"));
      return false;
    }
    w.document.write(html);
    w.document.close();
    w.document.title = title;
    setTimeout(() => w.print(), 400);
    return true;
  }

  function buildRelatorioHtml(relatorio, brand) {
    const { logo, nomeEmpresa, enderecoEmpresa, telefoneEmpresa } = brandOpts(brand);
    const totais = U.calcularTotais(relatorio.diasTrabalho);
    const dias = (relatorio.diasTrabalho || []).map((d) => U.atualizarCalculosDia(d));
    const diasRows = dias
      .map((dia) => {
        const desc =
          (dia.descricaoTrabalho || "").trim() !== ""
            ? `<tr><td colspan="14" style="text-align:left;padding:6px;background:#f9f9f9;font-size:9px;"><strong>${t("pdfDescLabel")}</strong> ${U.esc(dia.descricaoTrabalho)}</td></tr>`
            : "";
        return `<tr>
          <td>${U.fmtDatePt(dia.data)}</td>
          <td>${dia.idaHora || "-"}</td><td>${dia.idaChegada || "-"}</td><td>${dia.idaDuracao || "-"}</td>
          <td>${dia.horasInicio || "-"}</td><td>${dia.horasFim || "-"}</td><td>${dia.horasDuracao || "-"}</td>
          <td>${dia.retornoSaida || "-"}</td><td>${dia.retornoChegada || "-"}</td><td>${dia.retornoDuracao || "-"}</td>
          <td>${dia.kmIda || "0"}</td><td>${dia.kmRetorno || "0"}</td><td><strong>${dia.kmTotal || "0"}</strong></td>
          <td>${dia.tempoPausa || dia.pausa || "-"}</td>
        </tr>${desc}`;
      })
      .join("");

    const genDate = new Date().toLocaleString(I18n.localeTag());

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${U.esc(t("pdfReportTitle"))} ${U.esc(relatorio.numero)}</title><style>${RS_PDF_CSS}</style></head>
    <body class="rs-pdf">
      <div class="header">
        <div class="header-left">
          <div class="header-logo">${logoHtml(logo, nomeEmpresa)}</div>
          ${headerContactsHtml(enderecoEmpresa, telefoneEmpresa)}
        </div>
        <div class="header-title">${U.esc(t("pdfReportHeader"))}</div>
        <div class="header-number">${t("pdfNo")}: ${U.esc(relatorio.numero)}</div>
      </div>
      <div class="info-section"><h3>${U.esc(t("pdfClientEquipment"))}</h3><div class="info-grid">
        <div><span class="info-label">${t("labelTechnician")}:</span> ${U.esc(relatorio.tecnico)}</div>
        <div><span class="info-label">${t("labelDate")}:</span> ${U.fmtDatePt(relatorio.data)}</div>
        <div><span class="info-label">${t("labelClient")}:</span> ${U.esc(relatorio.cliente)}</div>
        <div><span class="info-label">${t("labelMachine")}:</span> ${U.esc(relatorio.maquinaModelo)}</div>
        <div><span class="info-label">${t("labelCity")}:</span> ${U.esc(relatorio.cidade)}</div>
        <div><span class="info-label">${t("labelMachineNum")}:</span> ${U.esc(relatorio.numeroMaquina)}</div>
        <div><span class="info-label">${t("labelPhone")}:</span> ${U.esc(relatorio.telefone)}</div>
        <div><span class="info-label">${t("labelServiceType")}:</span> ${U.esc(relatorio.tipoServico)}</div>
      </div></div>
      ${dias.length ? `<div class="info-section"><h3>${U.esc(t("pdfHoursTravel"))}</h3>
        <table><thead><tr><th rowspan="2">${t("pdfThDate")}</th><th colspan="3">${t("pdfThOut")}</th><th colspan="3">${t("pdfThHours")}</th><th colspan="3">${t("pdfThReturn")}</th><th colspan="3">${t("pdfThKm")}</th><th rowspan="2">${t("pdfThBreak")}</th></tr>
        <tr><th>${t("pdfThDeparture")}</th><th>${t("pdfThArrival")}</th><th>${t("pdfThDur")}</th><th>${t("pdfThStart")}</th><th>${t("pdfThEnd")}</th><th>${t("pdfThDur")}</th><th>${t("pdfThDeparture")}</th><th>${t("pdfThArrival")}</th><th>${t("pdfThDur")}</th><th>${t("pdfThOutKm")}</th><th>${t("pdfThRetKm")}</th><th>${t("pdfThTotal")}</th></tr></thead>
        <tbody>${diasRows}</tbody></table>
        <div class="summary">
          <div class="summary-card"><h4>${t("pdfWorkHours")}</h4><div class="value">${totais.horasTrabalho}h</div></div>
          <div class="summary-card"><h4>${t("pdfKmTraveled")}</h4><div class="value">${totais.kmsPercorridos} km</div></div>
          <div class="summary-card"><h4>${t("pdfTravelHours")}</h4><div class="value">${totais.horasViagem}h</div></div>
          <div class="summary-card"><h4>${t("pdfDailyRates")}</h4><div class="value">${dias.length}</div></div>
          <div class="summary-card"><h4>${t("pdfTravelOut")}</h4><div class="value">${totais.horasViagemIda}h</div></div>
          <div class="summary-card"><h4>${t("pdfTravelReturn")}</h4><div class="value">${totais.horasViagemRetorno}h</div></div>
        </div></div>` : ""}
      ${relatorio.observacoes ? `<div class="info-section"><h3>${U.esc(t("pdfObservations"))}</h3><div class="obs">${U.esc(relatorio.observacoes)}</div></div>` : ""}
      ${signaturesHtml(relatorio)}
      <p style="margin-top:16px;font-size:8px;color:#64748b;text-align:center;">${U.esc(t("pdfGenerated", { date: genDate, company: nomeEmpresa }))}</p>
    </body></html>`;
  }

  function buildWhatsAppText(relatorio, brand) {
    const { nomeEmpresa, telefoneEmpresa } = brandOpts(brand);
    const hello = relatorio.cliente
      ? t("waHello", { client: ", " + relatorio.cliente })
      : t("waHelloNoClient");
    const lines = [
      hello,
      "",
      t("waFollowReport", { num: relatorio.numero || "—" }),
      `${t("waTechnician")}: ${relatorio.tecnico || "—"}`,
      `${t("labelDate")}: ${U.fmtDatePt(relatorio.data)}`,
      `${t("waEquipment")}: ${relatorio.maquinaModelo || "—"}`,
      relatorio.tipoServico ? `${t("waService")}: ${relatorio.tipoServico}` : "",
      "",
      t("waAttachPdf"),
      "",
      nomeEmpresa,
    ];
    if (telefoneEmpresa) lines.push(`${t("pdfTel")}: ${telefoneEmpresa}`);
    lines.push("", t("waThanks"));
    return lines.filter(Boolean).join("\n");
  }

  function printRelatorio(relatorio, brand) {
    openPrint(buildRelatorioHtml(relatorio, brand), t("pdfReportTitle") + " " + relatorio.numero);
  }

  function shareRelatorioWhatsApp(relatorio, brand) {
    const tel = U.telefoneDigitsParaWa(relatorio.telefone);
    const texto = buildWhatsAppText(relatorio, brand);
    const url = tel.length >= 11
      ? `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    printRelatorio(relatorio, brand);
    setTimeout(() => {
      window.open(url, "_blank", "noopener,noreferrer");
      alert(tel ? t("waOpenPdf") : t("waNoPhone"));
    }, 700);
  }

  function printDespesas(doc, brand) {
    const { logo, nomeEmpresa, enderecoEmpresa, telefoneEmpresa } = brandOpts(brand);
    const total = (doc.despesas || []).reduce((s, d) => s + (Number(d.valor) || 0), 0);
    const linhas = (doc.despesas || [])
      .map((d, i) => {
        const fotos = (d.fotos || [])
          .map((f) => `<img src="${f}" alt="" style="max-width:100%;max-height:180px;margin:4px;border:1px solid #ddd;border-radius:4px;" />`)
          .join("");
        return `<tr><td>${i + 1}</td><td>${U.esc(d.tipoNome)}</td><td>€ ${(Number(d.valor) || 0).toFixed(2)}</td><td>${U.esc(d.descricao)}</td><td>${U.esc(d.cartaoRotulo || "—")}</td></tr>
        ${fotos ? `<tr><td colspan="5" style="padding:10px;background:#f9f9f9;"><strong>${t("pdfReceipts")}:</strong><br/>${fotos}</td></tr>` : ""}`;
      })
      .join("");

    const genDate = new Date().toLocaleString(I18n.localeTag());

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${U.esc(t("pdfExpensesTitle"))} ${U.esc(doc.clienteNome)}</title>
    <style>@page{size:A4;margin:12mm}body{font-family:Segoe UI,sans-serif;font-size:11px;color:#111;padding:12px}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #166534;padding-bottom:12px;margin-bottom:16px;gap:12px}
    .hdr img{max-height:48px;max-width:180px}.hdr-contacts{font-size:9px;color:#555;margin-top:6px;line-height:1.4}
    h1{font-size:16px;text-transform:uppercase;color:#14532d}
    table{width:100%;border-collapse:collapse;margin:12px 0}th,td{border:1px solid #ddd;padding:8px;text-align:left}
    th{background:#166534;color:#fff}.total{font-size:14px;font-weight:800;text-align:right;margin-top:12px;color:#14532d}</style></head>
    <body>
      <div class="hdr"><div><div>${logoHtml(logo, nomeEmpresa)}</div>${headerContactsHtml(enderecoEmpresa, telefoneEmpresa, "hdr-contacts")}</div><h1>${U.esc(t("pdfExpenseRegister"))}</h1></div>
      <p><strong>${t("labelClient")}:</strong> ${U.esc(doc.clienteNome)} &nbsp;|&nbsp; <strong>${t("tabReports")}:</strong> ${U.esc(doc.relatorioNumero || "—")} &nbsp;|&nbsp; <strong>${t("labelDate")}:</strong> ${U.fmtDatePt(doc.data)}</p>
      <table><thead><tr><th>#</th><th>${t("labelType")}</th><th>${t("labelValue")}</th><th>${t("pdfDescription")}</th><th>${t("pdfCard")}</th></tr></thead><tbody>${linhas || `<tr><td colspan='5'>${t("pdfNoLines")}</td></tr>`}</tbody></table>
      <p class="total">${t("pdfTotal")}: € ${total.toFixed(2)}</p>
      <p style="font-size:9px;color:#666;margin-top:20px;text-align:center;">${U.esc(t("pdfGeneratedShort", { date: genDate, company: nomeEmpresa }))}</p>
    </body></html>`;
    openPrint(html, t("pdfExpensesTitle"));
  }

  global.NCampoPdf = { printRelatorio, printDespesas, shareRelatorioWhatsApp, buildRelatorioHtml };
})(typeof window !== "undefined" ? window : globalThis);
