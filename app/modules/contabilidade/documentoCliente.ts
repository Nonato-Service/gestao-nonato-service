import { CONTAB_PRINT_WINDOW_STYLES } from './estilosPrint'
import { escAttr, preEsc, valDash } from './escape'
import type { ClienteContabEnvioModalOpts, ClienteContabLike, ContabLabels } from './tipos'

export type BuildHtmlClienteDadosContabilidadeInput = {
  cliente: ClienteContabLike
  opts?: ClienteContabEnvioModalOpts
  t: ContabLabels
  dataHora: string
  mailtoPrefix: string
  textoPlano: string
}

/** Documento HTML (ficha cliente + pedido) para impressão/PDF — sem `window.open`. */
export function buildHtmlClienteDadosContabilidade(input: BuildHtmlClienteDadosContabilidadeInput): string {
  const { cliente, opts, t, dataHora, mailtoPrefix, textoPlano } = input
  const valorF = (opts?.valorFatura || '').trim()
  const notaF = (opts?.notaFatura || '').trim()
  const anexos = opts?.anexos && opts.anexos.length > 0 ? opts.anexos : []
  const anexosLinhas = anexos.map(f => `${f.name} (${(f.size / 1024).toFixed(1)} KB)`)
  const hasPedido = Boolean(valorF || notaF || anexosLinhas.length)
  const val = valDash
  const lblEmpresa = t.nomeEmpresa || 'Nome da Empresa'
  const lblNif = t.identificacaoFiscal || 'NIF'
  const lblMorada = t.morada || 'Morada'
  const lblLocal = t.localidade || 'Localidade'
  const lblCp = t.codigoPostal || 'Código Postal'
  const lblFreg = t.freguesia || 'Freguesia'
  const lblCons = t.conselho || 'Conselho'
  const lblPais = t.pais || 'País'
  const lblTel = t.telefones || 'Telefones'
  const lblMail = t.email || 'E-mail'
  const lblCont = t.contato || 'Contato'
  const titulo = t.clienteDadosContabilidadeTitulo || 'Dados do cliente — contabilidade / faturação'
  const sub = t.clienteDadosContabilidadeSub || ''
  const lblImprimir = t.imprimirGuardarPDF || 'Imprimir / Guardar como PDF'
  const lblFechar = t.close || 'Fechar'
  const lblEmail = t.clienteDadosContabilidadeEnviarEmail || 'Enviar por e-mail'
  const lblCopiar = t.clienteDadosContabilidadeCopiar || 'Copiar texto'
  const lblCopiado = t.clienteDadosContabilidadeCopiado || 'Texto copiado para a área de transferência.'
  const assuntoMail = t.clienteDadosContabilidadeEmailAssunto || 'Dados de cliente para faturação'
  const emIntroCli =
    t.clienteDadosContabEmailCorpoIntro ||
    'Resumo de dados do cliente. Gerar PDF na janela (Imprimir → Guardar como PDF) e anexar a este e-mail.\n'
  const emFimCli =
    t.clienteDadosContabEmailCorpoFim || '\n(Todos os campos, morada, pedido: PDF ou «Copiar texto».)'
  const notaCorta = notaF.length > 200 ? notaF.slice(0, 197).trim() + '…' : notaF
  const lblPdfCli = t.contabilidadeFechamentoBtnGerarPdf || lblImprimir
  const lblMailCli = t.contabilidadeFechamentoBtnEmail || lblEmail
  const dicaCli =
    t.clienteDadosContabDicaPassos ||
    'Gere o PDF a partir do botão verde; o atalho de e-mail traz resumo. Anexar o PDF no correio. Texto completo: «Copiar».'
  const dicaBlockCli = `<div class="no-print contab-dica">${escAttr(dicaCli)}</div>`
  const textoPlanoEmail = (() => {
    const lin: string[] = [
      emIntroCli.trimEnd(),
      '',
      `${lblEmpresa}: ${val(cliente.nomeEmpresa)}`,
      `${lblNif}: ${val(cliente.numeroContribuicaoFiscal)}`,
    ]
    if (hasPedido) {
      lin.push(
        '',
        `${lblMorada}: ${val(cliente.morada)}`,
        `${lblCp} / ${lblLocal}: ${val(cliente.codigoPostal)} — ${val(cliente.localidade)}`
      )
      if (valorF) lin.push(`${t.contabilidadeFaturaValorLabel || 'Valor'}: ${valorF}`)
      if (notaCorta) lin.push(`${t.contabilidadeFaturaNotaLabel || 'Nota'}: ${notaCorta}`)
      if (anexosLinhas.length) {
        const tit = t.contabilidadeAnexosListaTitulo || 'Ficheiros'
        lin.push(`${tit}:`, ...anexosLinhas.map(x => `  • ${x}`))
      }
    } else {
      lin.push(
        `${lblMorada}: ${val(cliente.morada)}`,
        `${lblCp} / ${lblLocal}: ${val(cliente.codigoPostal)} — ${val(cliente.localidade)}`,
        `${lblTel}: ${val(cliente.telefones)}`,
        `${lblMail}: ${val(cliente.email)}`
      )
    }
    lin.push(emFimCli)
    return lin.join('\n')
  })()
  const docGerado = t.pdfDocumentoGeradoEm || 'Documento gerado em'
  const row = (label: string, cell: string) =>
    `<tr><td style="padding:10px 14px;border:1px solid #c8e6c9;font-weight:700;background:#e8f5e9;width:34%;vertical-align:top">${escAttr(label)}</td><td style="padding:10px 14px;border:1px solid #c8e6c9;vertical-align:top;word-break:break-word">${escAttr(cell)}</td></tr>`
  const rowPed = (label: string, cell: string) =>
    `<tr><td style="padding:10px 14px;border:1px solid #90caf9;font-weight:700;background:#e3f2fd;width:34%;vertical-align:top">${escAttr(label)}</td><td style="padding:10px 14px;border:1px solid #90caf9;vertical-align:top;word-break:break-word;white-space:pre-wrap">${escAttr(cell)}</td></tr>`
  const mainRows = [
    row(lblEmpresa, val(cliente.nomeEmpresa)),
    row(lblNif, val(cliente.numeroContribuicaoFiscal)),
    row(lblMorada, val(cliente.morada)),
    row(lblLocal, val(cliente.localidade)),
    row(lblCp, val(cliente.codigoPostal)),
    row(lblFreg, val(cliente.freguesia)),
    row(lblCons, val(cliente.conselho)),
    row(lblPais, val(cliente.pais)),
    row(lblTel, val(cliente.telefones)),
    row(lblMail, val(cliente.email)),
    row(lblCont, val(cliente.contato)),
  ].join('')
  let pedidoTableHtml = ''
  if (hasPedido) {
    const pTit = t.contabilidadeBlocoPedidoFatura || 'Pedido de faturação / referência'
    const pRows: string[] = []
    if (valorF) pRows.push(rowPed(t.contabilidadeFaturaValorLabel || 'Valor (referência) a faturar', valorF))
    if (notaF) pRows.push(rowPed(t.contabilidadeFaturaNotaLabel || 'Nota / instrução', notaF))
    if (anexosLinhas.length) {
      pRows.push(
        rowPed(
          t.contabilidadeAnexosListaTitulo || 'Ficheiros selecionados p/ anexar',
          anexosLinhas.join('\n')
        )
      )
    }
    pedidoTableHtml = `<div style="margin:20px 0 10px;max-width:100%;box-sizing:border-box"><div style="font-size:15px;font-weight:700;color:#1565c0;word-wrap:break-word">${escAttr(
      pTit
    )}</div></div><div class="contab-scroll"><table class="contab-client-tbl" style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px">${pRows.join('')}</table></div>
      <p style="font-size:12px;color:#0d47a1;line-height:1.4;margin:0 0 16px;word-wrap:break-word">${escAttr(
        t.contabilidadeAnexosInstrucaoCorpo ||
          'O atalho de e-mail não anexa ficheiros. Anexa no teu correio, ou partilha pelo teu aparelho.'
      )}</p>`
  }
  const tableRows = mainRows
  const mailSub = `${assuntoMail}${cliente.nomeEmpresa?.trim() ? ` — ${cliente.nomeEmpresa.trim().slice(0, 60)}` : ''}`
  const mailtoHref = `${mailtoPrefix}?subject=${encodeURIComponent(mailSub)}&body=${encodeURIComponent(textoPlanoEmail)}`
  const headerHtml = `<div style="margin-bottom:20px;padding-bottom:16px;border-bottom:3px solid #00a650;max-width:100%;box-sizing:border-box"><div class="contab-h-title" style="font-size:20px;font-weight:700;color:#00a650;word-wrap:break-word">${escAttr(
    titulo
  )}</div><p class="contab-h-sub" style="margin:10px 0 0;font-size:13px;color:#444;line-height:1.45;word-wrap:break-word">${escAttr(
    sub
  )}</p></div>`
  const tableHtml = `<div class="contab-scroll"><table class="contab-client-tbl" style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:8px">${tableRows}</table></div>${pedidoTableHtml}`
  const rodape = `<div style="margin-top:28px;padding-top:16px;border-top:1px solid #e0e0e0;font-size:11px;color:#666">${escAttr(docGerado)} ${escAttr(dataHora)}</div><div style="font-size:10px;color:#999;margin-top:6px">Nonato Service</div>`
  const preHidden = `<pre id="dados-cli-pre-contab" style="position:absolute;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;margin:0">${preEsc(textoPlano)}</pre>`
  const btns = `<div class="no-print contab-actions"><button type="button" onclick="window.print()" style="padding:12px 16px;background:#00a650;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px">${escAttr(
    lblPdfCli
  )}</button><a href="${escAttr(mailtoHref)}" style="padding:12px 16px;background:#1565c0;color:#fff;border:none;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;font-size:13px">${escAttr(
    lblMailCli
  )}</a><button type="button" data-msg="${escAttr(lblCopiado)}" onclick="(function(b){var el=document.getElementById('dados-cli-pre-contab');var tx=el?el.textContent:'';var m=b.getAttribute('data-msg')||'';if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(tx).then(function(){alert(m);}).catch(function(){window.prompt(m,tx);});}else{window.prompt(m,tx);}})(this)" style="padding:12px 16px;background:#5d4037;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:600;font-size:13px">${escAttr(
    lblCopiar
  )}</button><button type="button" onclick="window.close()" style="padding:12px 16px;background:#37474f;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:13px">${escAttr(
    lblFechar
  )}</button></div>`
  const docTitle = `${titulo} — ${cliente.nomeEmpresa || cliente.id}`.slice(0, 120)
  return `<!DOCTYPE html><html lang="pt"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light only">
<title>${escAttr(docTitle)}</title>
<style>${CONTAB_PRINT_WINDOW_STYLES}</style>
</head><body>${dicaBlockCli}${btns}${preHidden}${headerHtml}${tableHtml}${rodape}</body></html>`
}
