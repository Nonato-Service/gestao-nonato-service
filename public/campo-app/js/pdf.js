(function (global) {
  "use strict";
  const U = global.NCampoUtils;

  const RS_PDF_CSS = `@page { size: A4 portrait; margin: 10mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body.rs-pdf { font-family: "Segoe UI", system-ui, sans-serif; color: #0f172a; background: #fff; font-size: 10px; line-height: 1.45; padding: 10px 12px 16px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.rs-pdf .pdf-header { margin-bottom: 16px; break-inside: avoid; page-break-inside: avoid; break-after: avoid; page-break-after: avoid; }
.rs-pdf .pdf-header__row { display: flex; align-items: center; gap: 14px; padding: 14px 16px 12px; background: linear-gradient(135deg, #14532d 0%, #166534 42%, #15803d 100%); border-radius: 12px 12px 0 0; color: #fff; }
.rs-pdf .pdf-header__brand { flex-shrink: 0; min-width: 88px; max-width: 130px; padding: 8px 10px; background: rgba(255,255,255,0.97); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.rs-pdf .pdf-header__brand img { max-height: 58px; max-width: 118px; object-fit: contain; display: block; }
.rs-pdf .pdf-header__logo-text { font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; color: #14532d; text-align: center; line-height: 1.2; }
.rs-pdf .pdf-header__main { flex: 1; min-width: 0; text-align: center; }
.rs-pdf .pdf-header__title { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; line-height: 1.25; color: #fff; }
.rs-pdf .pdf-header__subtitle { margin-top: 4px; font-size: 9px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.88); }
.rs-pdf .pdf-header__contacts { margin-top: 6px; font-size: 8px; color: rgba(255,255,255,0.82); line-height: 1.35; }
.rs-pdf .pdf-header__meta { flex-shrink: 0; text-align: center; padding: 8px 12px; background: rgba(255,255,255,0.14); border: 1px solid rgba(255,255,255,0.35); border-radius: 10px; min-width: 92px; }
.rs-pdf .pdf-header__badge-label { display: block; font-size: 7px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(255,255,255,0.82); margin-bottom: 2px; }
.rs-pdf .pdf-header__badge-value { display: block; font-size: 13px; font-weight: 800; letter-spacing: 0.04em; color: #fff; }
.rs-pdf .pdf-header__accent { height: 4px; background: linear-gradient(90deg, #166534 0%, #22c55e 50%, #166534 100%); border-radius: 0 0 10px 10px; }
.rs-pdf .info-section { margin-bottom: 14px; padding: 14px; border: 1px solid #e2e8f0; border-radius: 10px; background: #fafafa; break-inside: auto; page-break-inside: auto; }
.rs-pdf .info-section:not(:has(table)) { break-inside: avoid; page-break-inside: avoid; }
.rs-pdf .header { break-inside: avoid; page-break-inside: avoid; break-after: avoid; page-break-after: avoid; }
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
@media print { body.rs-pdf { padding-bottom: 8mm; } .rs-pdf .info-section:has(table) { break-inside: auto; page-break-inside: auto; } .rs-pdf .info-section tbody tr { break-inside: avoid; page-break-inside: avoid; } }`;

  function logoHtml(logo, nomeEmpresa) {
    if (logo && logo.dataUrl) return `<img src="${logo.dataUrl}" alt="Logo" width="118" height="58" />`;
    return `<span class="pdf-header__logo-text">${U.esc(nomeEmpresa || "Nonato Service")}</span>`;
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
    if (telefone) parts.push(`<div>Tel: ${U.esc(telefone)}</div>`);
    return parts.length ? `<div class="${cls || "header-contacts"}">${parts.join("")}</div>` : "";
  }

  function fmtAssinaturaData(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
    } catch {
      return "";
    }
  }

  function assinaturaBlockHtml(titulo, imgData, nome, dataIso) {
    const img = imgData
      ? `<img src="${String(imgData).replace(/"/g, "&quot;")}" alt="Assinatura" />`
      : `<div class="sig-line"></div>`;
    const data = fmtAssinaturaData(dataIso);
    return `<div class="sig-block">
      <h4>${U.esc(titulo)}</h4>
      ${img}
      ${nome ? `<div class="sig-name">${U.esc(nome)}</div>` : ""}
      ${data ? `<div class="sig-date">Data: ${U.esc(data)}</div>` : `<div class="sig-date">Data: ___________________</div>`}
    </div>`;
  }

  function signaturesHtml(relatorio) {
    return `<div class="signatures">
      ${assinaturaBlockHtml("Assinatura do Técnico", relatorio.assinaturaTecnico, relatorio.tecnico, relatorio.dataAssinaturaTecnico)}
      ${assinaturaBlockHtml("Assinatura do Cliente", relatorio.assinaturaCliente, relatorio.cliente, relatorio.dataAssinaturaCliente)}
    </div>`;
  }

  function openPrint(html, title) {
    const w = window.open("", "_blank");
    if (!w) {
      alert("Permita pop-ups para gerar o PDF.");
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
            ? `<tr><td colspan="14" style="text-align:left;padding:6px;background:#f9f9f9;font-size:9px;"><strong>Descrição:</strong> ${U.esc(dia.descricaoTrabalho)}</td></tr>`
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

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório ${U.esc(relatorio.numero)}</title><style>${RS_PDF_CSS}</style></head>
    <body class="rs-pdf">
      <div class="pdf-header">
        <div class="pdf-header__row">
          <div class="pdf-header__brand">${logoHtml(logo, nomeEmpresa)}</div>
          <div class="pdf-header__main">
            <div class="pdf-header__title">RELATÓRIO DE SERVIÇO — ASSISTÊNCIA TÉCNICA</div>
            <div class="pdf-header__subtitle">${U.esc(nomeEmpresa || "Nonato Service")}</div>
            ${headerContactsHtml(enderecoEmpresa, telefoneEmpresa, "pdf-header__contacts")}
          </div>
          <div class="pdf-header__meta">
            <span class="pdf-header__badge-label">Nº Relatório</span>
            <span class="pdf-header__badge-value">${U.esc(relatorio.numero)}</span>
          </div>
        </div>
        <div class="pdf-header__accent"></div>
      </div>
      <div class="info-section"><h3>DADOS DO CLIENTE E EQUIPAMENTO</h3><div class="info-grid">
        <div><span class="info-label">Técnico:</span> ${U.esc(relatorio.tecnico)}</div>
        <div><span class="info-label">Data:</span> ${U.fmtDatePt(relatorio.data)}</div>
        <div><span class="info-label">Cliente:</span> ${U.esc(relatorio.cliente)}</div>
        <div><span class="info-label">Máquina/Modelo:</span> ${U.esc(relatorio.maquinaModelo)}</div>
        <div><span class="info-label">Cidade:</span> ${U.esc(relatorio.cidade)}</div>
        <div><span class="info-label">Nº Máquina:</span> ${U.esc(relatorio.numeroMaquina)}</div>
        <div><span class="info-label">Telefone:</span> ${U.esc(relatorio.telefone)}</div>
        <div><span class="info-label">Tipo serviço:</span> ${U.esc(relatorio.tipoServico)}</div>
      </div></div>
      ${dias.length ? `<div class="info-section"><h3>CONTROLE DE HORAS E DESLOCAMENTOS</h3>
        <table><thead><tr><th rowspan="2">DATA</th><th colspan="3">IDA</th><th colspan="3">HORAS</th><th colspan="3">RETORNO</th><th colspan="3">KM</th><th rowspan="2">PAUSA</th></tr>
        <tr><th>Saída</th><th>Chegada</th><th>Dur.</th><th>Início</th><th>Fim</th><th>Dur.</th><th>Saída</th><th>Chegada</th><th>Dur.</th><th>Ida</th><th>Ret.</th><th>Total</th></tr></thead>
        <tbody>${diasRows}</tbody></table>
        <div class="summary">
          <div class="summary-card"><h4>Horas trabalho</h4><div class="value">${totais.horasTrabalho}h</div></div>
          <div class="summary-card"><h4>Km percorridos</h4><div class="value">${totais.kmsPercorridos} km</div></div>
          <div class="summary-card"><h4>Horas viagem</h4><div class="value">${totais.horasViagem}h</div></div>
          <div class="summary-card"><h4>Diárias</h4><div class="value">${dias.length}</div></div>
          <div class="summary-card"><h4>Viagem ida</h4><div class="value">${totais.horasViagemIda}h</div></div>
          <div class="summary-card"><h4>Viagem retorno</h4><div class="value">${totais.horasViagemRetorno}h</div></div>
        </div></div>` : ""}
      ${relatorio.observacoes ? `<div class="info-section"><h3>OBSERVAÇÕES</h3><div class="obs">${U.esc(relatorio.observacoes)}</div></div>` : ""}
      ${signaturesHtml(relatorio)}
      <p style="margin-top:16px;font-size:8px;color:#64748b;text-align:center;">Documento gerado em ${new Date().toLocaleString("pt-BR")} — ${U.esc(nomeEmpresa)}</p>
    </body></html>`;
  }

  function buildWhatsAppText(relatorio, brand) {
    const { nomeEmpresa, telefoneEmpresa } = brandOpts(brand);
    const lines = [
      `Olá${relatorio.cliente ? `, ${relatorio.cliente}` : ""}!`,
      "",
      `Segue o relatório de serviço nº ${relatorio.numero || "—"}.`,
      `Técnico: ${relatorio.tecnico || "—"}`,
      `Data: ${U.fmtDatePt(relatorio.data)}`,
      `Equipamento: ${relatorio.maquinaModelo || "—"}`,
      relatorio.tipoServico ? `Serviço: ${relatorio.tipoServico}` : "",
      "",
      "Anexe o PDF do relatório (use «Guardar como PDF» na impressão).",
      "",
      nomeEmpresa,
    ];
    if (telefoneEmpresa) lines.push(`Tel: ${telefoneEmpresa}`);
    lines.push("", "Obrigado.");
    return lines.filter(Boolean).join("\n");
  }

  function printRelatorio(relatorio, brand) {
    openPrint(buildRelatorioHtml(relatorio, brand), "Relatório " + relatorio.numero);
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
      if (!tel) {
        alert("Telefone do cliente não definido — escolha o contacto no WhatsApp e anexe o PDF.");
      } else {
        alert("PDF aberto para guardar/imprimir. O WhatsApp abrirá a seguir — anexe o PDF à mensagem.");
      }
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
        ${fotos ? `<tr><td colspan="5" style="padding:10px;background:#f9f9f9;"><strong>Comprovantes:</strong><br/>${fotos}</td></tr>` : ""}`;
      })
      .join("");

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Despesas ${U.esc(doc.clienteNome)}</title>
    <style>@page{size:A4;margin:12mm}body{font-family:Segoe UI,sans-serif;font-size:11px;color:#111;padding:12px}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #166534;padding-bottom:12px;margin-bottom:16px;gap:12px}
    .hdr img{max-height:48px;max-width:180px}.hdr-contacts{font-size:9px;color:#555;margin-top:6px;line-height:1.4}
    h1{font-size:16px;text-transform:uppercase;color:#14532d}
    table{width:100%;border-collapse:collapse;margin:12px 0}th,td{border:1px solid #ddd;padding:8px;text-align:left}
    th{background:#166534;color:#fff}.total{font-size:14px;font-weight:800;text-align:right;margin-top:12px;color:#14532d}</style></head>
    <body>
      <div class="hdr"><div><div>${logoHtml(logo, nomeEmpresa)}</div>${headerContactsHtml(enderecoEmpresa, telefoneEmpresa, "hdr-contacts")}</div><h1>REGISTRO DE DESPESAS</h1></div>
      <p><strong>Cliente:</strong> ${U.esc(doc.clienteNome)} &nbsp;|&nbsp; <strong>Relatório:</strong> ${U.esc(doc.relatorioNumero || "—")} &nbsp;|&nbsp; <strong>Data:</strong> ${U.fmtDatePt(doc.data)}</p>
      <table><thead><tr><th>#</th><th>Tipo</th><th>Valor</th><th>Descrição</th><th>Cartão</th></tr></thead><tbody>${linhas || "<tr><td colspan='5'>Sem linhas</td></tr>"}</tbody></table>
      <p class="total">Total: € ${total.toFixed(2)}</p>
      <p style="font-size:9px;color:#666;margin-top:20px;text-align:center;">Gerado em ${new Date().toLocaleString("pt-BR")} — ${U.esc(nomeEmpresa)}</p>
    </body></html>`;
    openPrint(html, "Despesas");
  }

  global.NCampoPdf = { printRelatorio, printDespesas, shareRelatorioWhatsApp, buildRelatorioHtml };
})(typeof window !== "undefined" ? window : globalThis);
