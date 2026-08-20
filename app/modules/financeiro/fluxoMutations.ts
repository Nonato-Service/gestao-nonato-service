import {
  type FechamentoFluxoFinanceiroEntry,
  type FechamentoFluxoFinanceiroEtapa,
  type FechamentoFluxoFinanceiroMap,
  type FechamentoFluxoFinanceiroPatchOpts,
  type FechamentoSituacaoFatura,
  defaultFluxoEntryParaBiblioteca,
} from './fluxoTipos'
import { relatorioFluxoFinanceiroNaoPago } from './devedorFlags'

export function applyFechamentoEtapaFinanceiraToMap(
  prev: FechamentoFluxoFinanceiroMap,
  relatorioId: string,
  etapa: FechamentoFluxoFinanceiroEtapa,
  opts?: FechamentoFluxoFinanceiroPatchOpts,
  nowIso?: string
): FechamentoFluxoFinanceiroMap {
  const next = { ...prev }
  if (etapa === 'none') {
    delete next[relatorioId]
  } else {
    const curr = next[relatorioId]
    const currObj =
      curr && typeof curr === 'object' && !Array.isArray(curr)
        ? (curr as FechamentoFluxoFinanceiroEntry)
        : null
    const numeroFatura =
      opts?.numeroFatura !== undefined ? opts.numeroFatura : currObj?.numeroFatura
    const situacaoFatura =
      opts?.situacaoFatura !== undefined ? opts.situacaoFatura : currObj?.situacaoFatura
    const dataVencimentoFatura =
      opts?.dataVencimentoFatura !== undefined
        ? opts.dataVencimentoFatura
        : currObj?.dataVencimentoFatura
    let arquivoAnexo: string | undefined
    let nomeArquivoOriginal: string | undefined
    let tipoArquivo: string | undefined
    if (opts?.arquivoAnexo !== undefined) {
      const rawAnexo = String(opts.arquivoAnexo || '').trim()
      if (rawAnexo) {
        arquivoAnexo = rawAnexo
        nomeArquivoOriginal =
          opts.nomeArquivoOriginal !== undefined
            ? String(opts.nomeArquivoOriginal || '').trim() || undefined
            : currObj?.nomeArquivoOriginal
        tipoArquivo =
          opts.tipoArquivo !== undefined
            ? String(opts.tipoArquivo || '').trim() || undefined
            : currObj?.tipoArquivo
      }
      // string vazia → limpar anexo (não copiar do actual)
    } else {
      arquivoAnexo = currObj?.arquivoAnexo
      nomeArquivoOriginal = currObj?.nomeArquivoOriginal
      tipoArquivo = currObj?.tipoArquivo
    }
    const entry: FechamentoFluxoFinanceiroEntry = {
      etapa,
      modo: opts?.modo || currObj?.modo || (etapa === 'enviado_fatura' ? 'com_fatura' : 'com_fatura'),
      pagamento: opts?.pagamento || currObj?.pagamento || 'pendente',
      updatedAt: nowIso ?? new Date().toISOString(),
    }
    if (numeroFatura !== undefined && String(numeroFatura).trim() !== '') {
      entry.numeroFatura = String(numeroFatura).trim()
    }
    if (situacaoFatura !== undefined) entry.situacaoFatura = situacaoFatura
    if (dataVencimentoFatura !== undefined && String(dataVencimentoFatura).trim() !== '') {
      entry.dataVencimentoFatura = String(dataVencimentoFatura).trim()
    }
    if (arquivoAnexo) {
      entry.arquivoAnexo = arquivoAnexo
      if (nomeArquivoOriginal) entry.nomeArquivoOriginal = nomeArquivoOriginal
      if (tipoArquivo) entry.tipoArquivo = tipoArquivo
    }
    next[relatorioId] = entry
  }
  return next
}

export function situacaoFaturaToEtapaOpts(situacao: FechamentoSituacaoFatura): {
  etapa: Exclude<FechamentoFluxoFinanceiroEtapa, 'none'>
  opts: FechamentoFluxoFinanceiroPatchOpts
} {
  if (situacao === 'emitida') {
    return {
      etapa: 'enviado_fatura',
      opts: {
        modo: 'com_fatura',
        pagamento: 'pendente',
        situacaoFatura: 'emitida',
      },
    }
  }
  if (situacao === 'no_prazo') {
    // Preserva `sem_fatura` quando o fechamento é sem fatura (clientes que não faturam)
    return {
      etapa: 'controlo_pagamento',
      opts: {
        pagamento: 'pendente',
        situacaoFatura: 'no_prazo',
      },
    }
  }
  if (situacao === 'paga') {
    return {
      etapa: 'controlo_pagamento',
      opts: {
        pagamento: 'pago',
        situacaoFatura: 'paga',
      },
    }
  }
  return {
    etapa: 'controlo_pagamento',
    opts: {
      pagamento: 'devedor',
      situacaoFatura: 'nao_paga',
    },
  }
}

export function removeFechamentoFluxoIdsFromMap(
  prev: FechamentoFluxoFinanceiroMap,
  relatorioIds: string[]
): { next: FechamentoFluxoFinanceiroMap; changed: boolean } {
  let changed = false
  const next = { ...prev }
  for (const id of relatorioIds) {
    if (id in next) {
      delete next[id]
      changed = true
    }
  }
  return { next, changed }
}

export function ensureDefaultFluxoEntriesForBibliotecaIds(
  prev: FechamentoFluxoFinanceiroMap,
  ids: string[],
  nowIso?: string
): { next: FechamentoFluxoFinanceiroMap; changed: boolean } {
  let changed = false
  const next = { ...prev }
  for (const id of ids) {
    const curr = next[id]
    if (curr && typeof curr === 'object' && !Array.isArray(curr)) continue
    next[id] = defaultFluxoEntryParaBiblioteca(nowIso)
    changed = true
  }
  return { next, changed }
}

/** Alias fino: fluxo «não pago» / devedor (mesmo critério de `relatorioFluxoFinanceiroNaoPago`). */
export function relatorioServicoFluxoFinanceiroPendente(fr: unknown): boolean {
  return relatorioFluxoFinanceiroNaoPago(fr)
}
