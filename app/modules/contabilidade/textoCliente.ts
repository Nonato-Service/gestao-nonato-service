import { valDash } from './escape'
import type { ClienteContabEnvioModalOpts, ClienteContabLike, ContabLabels } from './tipos'

/** Corpo de texto (e-mail, WhatsApp, etc.) com dados + pedido faturação + ficheiros. */
export function construirTextoPlanoClienteDadosContabilidade(
  cliente: ClienteContabLike,
  opts: ClienteContabEnvioModalOpts | undefined,
  t: ContabLabels,
  dataHora: string
): string {
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
  const docGerado = t.pdfDocumentoGeradoEm || 'Documento gerado em'
  const linhas: string[] = [
    titulo,
    '',
    `${lblEmpresa}: ${val(cliente.nomeEmpresa)}`,
    `${lblNif}: ${val(cliente.numeroContribuicaoFiscal)}`,
    `${lblMorada}: ${val(cliente.morada)}`,
    `${lblLocal}: ${val(cliente.localidade)}`,
    `${lblCp}: ${val(cliente.codigoPostal)}`,
    `${lblFreg}: ${val(cliente.freguesia)}`,
    `${lblCons}: ${val(cliente.conselho)}`,
    `${lblPais}: ${val(cliente.pais)}`,
    `${lblTel}: ${val(cliente.telefones)}`,
    `${lblMail}: ${val(cliente.email)}`,
    `${lblCont}: ${val(cliente.contato)}`,
  ]
  if (hasPedido) {
    const subPed = t.contabilidadeBlocoPedidoFatura || 'Pedido de faturação / referência'
    const lVal = t.contabilidadeFaturaValorLabel || 'Valor (referência) a faturar'
    const lNota = t.contabilidadeFaturaNotaLabel || 'Nota / instrução p/ a contabilidade'
    const lAnx =
      t.contabilidadeAnexosListaTitulo || 'Ficheiros a anexar ao e-mail (indicar no aparelho ao enviar):'
    linhas.push(
      '',
      '— ' + subPed + ' —',
      '',
      ...(valorF ? [`${lVal}: ${valorF}`] : []),
      ...(notaF ? [`${lNota}: ${notaF}`] : []),
      ...(anexosLinhas.length ? [lAnx, ...anexosLinhas.map(n => '  • ' + n), ''] : []),
      t.contabilidadeAnexosInstrucaoCorpo ||
        'Nota: o atalho «Enviar por e-mail» do navegador não anexa ficheiros. Anexa-os no programa de e-mail, ou no telemóvel usa Partilhar se o sistema o permitir.',
      '',
    )
  } else {
    linhas.push('')
  }
  linhas.push(`${docGerado} ${dataHora}`)
  return linhas.join('\n')
}
