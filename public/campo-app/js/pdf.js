(function (global) {
  "use strict";
  const U = global.NCampoUtils;

  const RS_PDF_CSS = `@page { size: A4 portrait; margin: 10mm; }
* { margin: 0; padding: 0; box-sizing: border-box; }
body.rs-pdf { font-family: "Segoe UI", system-ui, sans-serif; color: #0f172a; background: #fff; font-size: 10px; line-height: 1.45; padding: 10px 12px 16px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.rs-pdf .header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 3px solid #166534; }
.rs-pdf .header-logo img { max-height: 52px; max-width: 200px; object-fit: contain; display: block; }
.rs-pdf .header-title { font-size: 13px; font-weight: 800; text-align: center; flex: 1; text-transform: uppercase; letter-spacing: 0.06em; }
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
@media print { body.rs-pdf { padding-bottom: 8mm; } }`;

  function logoHtml(logo) {
    if (logo && logo.dataUrl) return `<img src="${logo.dataUrl}" alt="Logo" />`;
    return "<strong>NONATO SERVICE</strong>";
  }

  function openPrint(html, title) {
    const w = window.open("", "_blank");
    if (!w) {
      alert("Permita pop-ups para gerar o PDF.");
      return;
    }
    w.document.write(html);
    w.document.close();
    w.document.title = title;
    setTimeout(() => w.print(), 400);
  }

  function printRelatorio(relatorio, logo) {
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

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatório ${U.esc(relatorio.numero)}</title><style>${RS_PDF_CSS}</style></head>
    <body class="rs-pdf">
      <div class="header">
        <div class="header-logo">${logoHtml(logo)}</div>
        <div class="header-title">RELATÓRIO DE SERVIÇO — ASSISTÊNCIA TÉCNICA</div>
        <div class="header-number">N°: ${U.esc(relatorio.numero)}</div>
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
      <p style="margin-top:16px;font-size:8px;color:#64748b;text-align:center;">Documento gerado em ${new Date().toLocaleString("pt-BR")} — Nonato Campo App</p>
    </body></html>`;
    openPrint(html, "Relatório " + relatorio.numero);
  }

  function printDespesas(doc, logo) {
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
    .hdr{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #166534;padding-bottom:12px;margin-bottom:16px}
    .hdr img{max-height:48px;max-width:180px}h1{font-size:16px;text-transform:uppercase;color:#14532d}
    table{width:100%;border-collapse:collapse;margin:12px 0}th,td{border:1px solid #ddd;padding:8px;text-align:left}
    th{background:#166534;color:#fff}.total{font-size:14px;font-weight:800;text-align:right;margin-top:12px;color:#14532d}</style></head>
    <body>
      <div class="hdr"><div>${logoHtml(logo)}</div><h1>REGISTRO DE DESPESAS</h1></div>
      <p><strong>Cliente:</strong> ${U.esc(doc.clienteNome)} &nbsp;|&nbsp; <strong>Relatório:</strong> ${U.esc(doc.relatorioNumero || "—")} &nbsp;|&nbsp; <strong>Data:</strong> ${U.fmtDatePt(doc.data)}</p>
      <table><thead><tr><th>#</th><th>Tipo</th><th>Valor</th><th>Descrição</th><th>Cartão</th></tr></thead><tbody>${linhas || "<tr><td colspan='5'>Sem linhas</td></tr>"}</tbody></table>
      <p class="total">Total: € ${total.toFixed(2)}</p>
      <p style="font-size:9px;color:#666;margin-top:20px;text-align:center;">Gerado em ${new Date().toLocaleString("pt-BR")}</p>
    </body></html>`;
    openPrint(html, "Despesas");
  }

  global.NCampoPdf = { printRelatorio, printDespesas };
})(typeof window !== "undefined" ? window : globalThis);
