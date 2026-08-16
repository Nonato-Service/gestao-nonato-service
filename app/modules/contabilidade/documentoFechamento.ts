import type { FechamentoItem } from '../fechamento'
import { CONTAB_PRINT_WINDOW_STYLES } from './estilosPrint'
import { escAttr, preEsc, valDash } from './escape'
import type {
  ClienteContabLike,
  ContabLabels,
  FechamentoIvaTotaisContab,
  RelatorioContabLike,
} from './tipos'

export type BuildHtmlFechamentoContabilidadeInput = {
  relatorio: RelatorioContabLike
  itens: FechamentoItem[]
  clienteFiscal?: ClienteContabLike | null
  t: ContabLabels
  dataHora: string
  mailtoPrefix: string
  /** Resultado de `totaisFechamentoLiquidoComIva` (injectado). */
  ivContab: FechamentoIvaTotaisContab
  /** Código de linha já resolvido (ex.: via `servicoCodParaExibicao`). */
  resolveItemCod: (item: FechamentoItem) => string
}

/** Documento HTML de fechamento para contabilidade — sem `window.open`. */
export function buildHtmlFechamentoContabilidade(input: BuildHtmlFechamentoContabilidadeInput): string {
  const { relatorio, itens, clienteFiscal, t, dataHora, mailtoPrefix, ivContab, resolveItemCod } = input
  const val = valDash
  const titulo = t.contabilidadeFechamentoDocTitulo || 'Fechamento para contabilidade / fatura'
  const sub = t.contabilidadeFechamentoDocSub || ''
  const lblImprimir = t.imprimirGuardarPDF || 'Imprimir / Guardar como PDF'
  const lblFechar = t.close || 'Fechar'
  const lblEmail = t.clienteDadosContabilidadeEnviarEmail || 'Enviar por e-mail'
  const lblCopiar = t.clienteDadosContabilidadeCopiar || 'Copiar texto'
  const lblCopiado = t.clienteDadosContabilidadeCopiado || 'Texto copiado para a área de transferência.'
  const docGerado = t.pdfDocumentoGeradoEm || 'Documento gerado em'
  const lblCliente = t.cliente || 'Cliente'
  const lblNum = t.numeroRelatorio || 'Nº Relatório'
  const lblEquip = t.equipamento || 'Equipamento'
  const lblData = t.data || 'Data'
  const lblCod = t.codigoOuCod || 'COD'
  const lblDesc = t.descricao || 'Descrição'
  const lblQtd = t.quantidade || 'Quantidade'
  const lblVu = t.valorUnitario || 'Valor unit.'
  const lblTot = t.total || 'Total'
  const lblSoma = t.somaTotal || 'Total geral'
  const blocoFiscal = t.contabilidadeBlocoClienteFiscal || 'Dados fiscais do cliente (cadastro)'
  const total = ivContab.comIva
  const linhasItens = itens.map(i => {
    const cod = resolveItemCod(i)
    const desc = (i.descricao || '').trim() || '—'
    const infoExtra = (i.infoAdicional || '').trim()
    const descCompleta = infoExtra ? `${desc} (${infoExtra})` : desc
    const qtd =
      i.tipoCobranca === 'hora'
        ? `${i.quantidade.toFixed(2)} h`
        : i.tipoCobranca === 'km'
          ? `${i.quantidade.toFixed(0)} km`
          : String(i.quantidade)
    const vl = i.id === 'diarias' && i.cobrarDiaria === false ? 0 : i.valorTotal
    return `  • ${cod} — ${descCompleta} | ${qtd} × ${i.valorUnitario.toFixed(2)} € = ${vl.toFixed(2)} €`
  })
  const textoPlano = [
    titulo,
    sub ? `${sub}\n` : '',
    `${lblNum}: ${relatorio.numero}`,
    `${lblCliente}: ${relatorio.cliente}`,
    `${lblEquip}: ${relatorio.maquinaModelo || ''}`.trim(),
    `${lblData}: ${relatorio.data}`,
    '',
    ...(clienteFiscal
      ? [
          `— ${blocoFiscal} —`,
          `${t.nomeEmpresa || 'Empresa'}: ${val(clienteFiscal.nomeEmpresa)}`,
          `${t.identificacaoFiscal || 'NIF'}: ${val(clienteFiscal.numeroContribuicaoFiscal)}`,
          `${t.morada || 'Morada'}: ${val(clienteFiscal.morada)}`,
          `${t.codigoPostal || 'CP'}: ${val(clienteFiscal.codigoPostal)} ${val(clienteFiscal.localidade)}`.trim(),
          `${t.email || 'E-mail'}: ${val(clienteFiscal.email)}`,
          `${t.telefones || 'Telefones'}: ${val(clienteFiscal.telefones)}`,
          '',
        ]
      : []),
    `${t.itensCobrancaFechamento || 'Itens a cobrar'}:`,
    ...linhasItens,
    '',
    `${t.totalSemIva || 'Total s/ IVA'}: ${ivContab.liquido.toFixed(2)} €`,
    ...(ivContab.incluir && ivContab.iva > 0.0001
      ? [
          `${t.valorIva || 'IVA'} (${ivContab.taxa}%): ${ivContab.iva.toFixed(2)} €`,
          `${t.totalComIva || 'Total com IVA'}: ${total.toFixed(2)} €`,
        ]
      : [`${lblSoma}: ${total.toFixed(2)} €`]),
    '',
    `${docGerado} ${dataHora}`,
  ]
    .filter(Boolean)
    .join('\n')

  const emIntro =
    t.contabilidadeFechamentoEmailCorpoIntro ||
    'Segue resumo para a contabilidade. Anexar ficheiro PDF: na janela, botão verde → Imprimir → Guardar como PDF; depois anexar a este e-mail.\n\n'
  const emFim =
    t.contabilidadeFechamentoEmailCorpoFim ||
    '\n(Detalhe e linhas: no ficheiro PDF, ou com «Copiar texto» na mesma janela.)\n'
  const resumoFiscalShort = clienteFiscal
    ? [
        `${t.nomeEmpresa || 'Empresa'}: ${val(clienteFiscal.nomeEmpresa)}`,
        `${t.identificacaoFiscal || 'NIF'}: ${val(clienteFiscal.numeroContribuicaoFiscal)}`,
      ].join('\n')
    : ''
  const textoPlanoEmail = (() => {
    const a: string[] = [
      emIntro.trimEnd(),
      '',
      `${lblNum}: ${relatorio.numero}`,
      `${lblCliente}: ${relatorio.cliente}`,
      `${lblEquip}: ${relatorio.maquinaModelo || ''}`.trim(),
      `${lblData}: ${relatorio.data}`,
      '',
    ]
    if (resumoFiscalShort) {
      a.push(resumoFiscalShort, '')
    }
    a.push(`${t.totalSemIva || 'Total s/ IVA'}: ${ivContab.liquido.toFixed(2)} €`)
    if (ivContab.incluir && ivContab.iva > 0.0001) {
      a.push(
        `${t.valorIva || 'IVA'} (${ivContab.taxa}%): ${ivContab.iva.toFixed(2)} €`,
        `${t.totalComIva || 'Total com IVA'}: ${total.toFixed(2)} €`
      )
    } else {
      a.push(`${t.somaTotal || t.totalComIva || 'Total a cobrar'}: ${total.toFixed(2)} €`)
    }
    a.push(emFim)
    return a.join('\n')
  })()
  const rowsHtml = itens
    .map(item => {
      const cod = escAttr(resolveItemCod(item))
      const desc = escAttr((item.descricao || '').trim() || '—')
      const qtd = escAttr(
        item.tipoCobranca === 'hora'
          ? `${item.quantidade.toFixed(2)} h`
          : item.tipoCobranca === 'km'
            ? `${item.quantidade.toFixed(0)} km`
            : String(item.quantidade)
      )
      const totalLinha = item.id === 'diarias' && item.cobrarDiaria === false ? 0 : item.valorTotal
      return `<tr><td style="padding:8px 10px;border:1px solid #c8e6c9;font-weight:600">${cod}</td><td style="padding:8px 10px;border:1px solid #c8e6c9">${desc}</td><td style="padding:8px 10px;border:1px solid #c8e6c9;text-align:right">${qtd}</td><td style="padding:8px 10px;border:1px solid #c8e6c9;text-align:right">${item.valorUnitario.toFixed(2)} €</td><td style="padding:8px 10px;border:1px solid #c8e6c9;text-align:right;font-weight:700">${totalLinha.toFixed(2)} €</td></tr>`
    })
    .join('')
  const footIvaRows =
    ivContab.incluir && ivContab.iva > 0.0001
      ? `<tr><td colspan="4" style="padding:8px 10px;border:1px solid #a5d6a7;text-align:right;background:#fafafa">${escAttr(t.totalSemIva || 'Total s/ IVA')}</td><td style="padding:8px 10px;border:1px solid #a5d6a7;text-align:right;font-weight:600;background:#fafafa">${ivContab.liquido.toFixed(2)} €</td></tr><tr><td colspan="4" style="padding:8px 10px;border:1px solid #a5d6a7;text-align:right;background:#fafafa">${escAttr(t.valorIva || 'IVA')} (${ivContab.taxa}%)</td><td style="padding:8px 10px;border:1px solid #a5d6a7;text-align:right;font-weight:600;background:#fafafa">${ivContab.iva.toFixed(2)} €</td></tr><tr><td colspan="4" style="padding:10px;border:1px solid #a5d6a7;text-align:right;font-weight:700;background:#f1f8e9">${escAttr(t.totalComIva || 'Total com IVA')}</td><td style="padding:10px;border:1px solid #a5d6a7;text-align:right;font-weight:800;background:#f1f8e9">${total.toFixed(2)} €</td></tr>`
      : `<tr><td colspan="4" style="padding:10px;border:1px solid #a5d6a7;text-align:right;font-weight:700;background:#f1f8e9">${escAttr(lblSoma)}</td><td style="padding:10px;border:1px solid #a5d6a7;text-align:right;font-weight:800;background:#f1f8e9">${total.toFixed(2)} €</td></tr>`
  const tableHtml = `<div class="contab-scroll"><table class="contab-items-table" style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:0"><thead><tr><th style="padding:10px;border:1px solid #a5d6a7;background:#e8f5e9;text-align:left">${escAttr(lblCod)}</th><th style="padding:10px;border:1px solid #a5d6a7;background:#e8f5e9;text-align:left">${escAttr(lblDesc)}</th><th style="padding:10px;border:1px solid #a5d6a7;background:#e8f5e9;text-align:right">${escAttr(lblQtd)}</th><th style="padding:10px;border:1px solid #a5d6a7;background:#e8f5e9;text-align:right">${escAttr(lblVu)}</th><th style="padding:10px;border:1px solid #a5d6a7;background:#e8f5e9;text-align:right">${escAttr(lblTot)}</th></tr></thead><tbody>${rowsHtml}</tbody><tfoot>${footIvaRows}</tfoot></table></div>`
  const infoRel = `<div class="contab-info-card" style="margin-bottom:16px;padding:14px;border-radius:10px;background:#f1f8e9;border:1px solid #c8e6c9;font-size:13px;line-height:1.5"><div style="word-wrap:break-word"><strong>${escAttr(lblNum)}:</strong> ${escAttr(relatorio.numero)}</div><div style="word-wrap:break-word"><strong>${escAttr(lblCliente)}:</strong> ${escAttr(relatorio.cliente)}</div><div style="word-wrap:break-word"><strong>${escAttr(lblEquip)}:</strong> ${escAttr(`${relatorio.maquinaModelo || ''}`.trim())}</div><div><strong>${escAttr(lblData)}:</strong> ${escAttr(relatorio.data)}</div></div>`
  const rowFiscalHtml = (a: string, b: string) =>
    `<tr><td style="padding:6px 8px;color:#666;width:34%">${a}</td><td style="padding:6px 8px;font-weight:600">${b}</td></tr>`
  let fiscalHtml = ''
  if (clienteFiscal) {
    fiscalHtml = `<div class="contab-fiscal" style="margin-bottom:18px;padding:14px;border-radius:10px;background:#fff8e1;border:1px solid #ffcc80"><div style="font-weight:700;color:#e65100;margin-bottom:8px;word-wrap:break-word">${escAttr(blocoFiscal)}</div><div class="contab-scroll"><table class="contab-client-tbl" style="width:100%;font-size:12px">${rowFiscalHtml(escAttr(t.nomeEmpresa || 'Empresa'), escAttr(val(clienteFiscal.nomeEmpresa)))}${rowFiscalHtml(escAttr(t.identificacaoFiscal || 'NIF'), escAttr(val(clienteFiscal.numeroContribuicaoFiscal)))}${rowFiscalHtml(escAttr(t.morada || 'Morada'), escAttr(val(clienteFiscal.morada)))}${rowFiscalHtml(escAttr(t.email || 'E-mail'), escAttr(val(clienteFiscal.email)))}${rowFiscalHtml(escAttr(t.telefones || 'Telefones'), escAttr(val(clienteFiscal.telefones)))}</table></div></div>`
  }
  const assuntoMail = `${t.contabilidadeFechamentoEmailAssunto || 'Fechamento para faturação'} — ${relatorio.numero}`
  const mailtoHref = `${mailtoPrefix}?subject=${encodeURIComponent(assuntoMail)}&body=${encodeURIComponent(textoPlanoEmail)}`
  const dicaFech =
    t.contabilidadeFechamentoDicaPassos ||
    'O documento formal é o PDF: Imprimir → Guardar como PDF, depois anexar no e-mail. O atalho de e-mail traz um resumo no texto; linhas e totais a fundo estão no PDF ou em «Copiar texto».'
  const lblPdfFech = t.contabilidadeFechamentoBtnGerarPdf || lblImprimir
  const lblMailFech = t.contabilidadeFechamentoBtnEmail || lblEmail
  const dicaBlock = `<div class="no-print contab-dica">${escAttr(dicaFech)}</div>`
  const headerHtml = `<div style="margin-bottom:16px;padding-bottom:14px;border-bottom:3px solid #00a650;max-width:100%;box-sizing:border-box"><div class="contab-h-title" style="font-size:19px;font-weight:700;color:#00a650;word-wrap:break-word">${escAttr(
    titulo
  )}</div><p class="contab-h-sub" style="margin:8px 0 0;font-size:12px;color:#555;line-height:1.45;word-wrap:break-word">${escAttr(sub)}</p></div>`
  const rodape = `<div style="margin-top:20px;padding-top:12px;border-top:1px solid #e0e0e0;font-size:11px;color:#666">${escAttr(docGerado)} ${escAttr(dataHora)}</div><div style="font-size:10px;color:#999;margin-top:4px">Nonato Service</div>`
  const preHidden = `<pre id="fech-contab-pre" style="position:absolute;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;margin:0">${preEsc(textoPlano)}</pre>`
  const btns = `<div class="no-print contab-actions"><button type="button" onclick="window.print()" style="padding:12px 16px;background:#00a650;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px">${escAttr(
    lblPdfFech
  )}</button><a href="${escAttr(mailtoHref)}" style="padding:12px 16px;background:#1565c0;color:#fff;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;font-size:13px">${escAttr(
    lblMailFech
  )}</a><button type="button" data-msg="${escAttr(lblCopiado)}" onclick="(function(b){var el=document.getElementById('fech-contab-pre');var tx=el?el.textContent:'';var m=b.getAttribute('data-msg')||'';if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(tx).then(function(){alert(m);}).catch(function(){window.prompt(m,tx);});}else{window.prompt(m,tx);}})(this)" style="padding:12px 16px;background:#5d4037;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px">${escAttr(
    lblCopiar
  )}</button><button type="button" onclick="window.close()" style="padding:12px 16px;background:#37474f;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px">${escAttr(
    lblFechar
  )}</button></div>`
  const docTitle = `${titulo} — ${relatorio.numero}`.slice(0, 120)
  return `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light only">
<title>${escAttr(docTitle)}</title>
<style>${CONTAB_PRINT_WINDOW_STYLES}</style>
</head><body>${dicaBlock}${btns}${preHidden}${headerHtml}${infoRel}${fiscalHtml}${tableHtml}${rodape}</body></html>`
}
