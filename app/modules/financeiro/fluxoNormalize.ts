import type {
  FechamentoFluxoFinanceiroEntry,
  FechamentoFluxoFinanceiroMap,
  FechamentoSituacaoFatura,
} from './fluxoTipos'

/**
 * Normaliza o mapa persistido do fluxo financeiro (legado string → entry object).
 * `nowIso` fixa `updatedAt` em falta (testes / boot determinístico).
 */
export function normalizeFechamentoFluxoFinanceiroMap(
  raw: unknown,
  nowIso?: string
): FechamentoFluxoFinanceiroMap {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: FechamentoFluxoFinanceiroMap = {}
  const stamp = nowIso ?? new Date().toISOString()
  const rawFlux = raw as Record<string, unknown>
  for (const k of Object.keys(rawFlux)) {
    const v = rawFlux[k]
    if (v === 'enviado_fatura' || v === 'controlo_pagamento') {
      out[k] = v
      continue
    }
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const o = v as Record<string, unknown>
      const etapa =
        o.etapa === 'enviado_fatura' || o.etapa === 'controlo_pagamento'
          ? o.etapa
          : 'controlo_pagamento'
      const modo = o.modo === 'sem_fatura' ? 'sem_fatura' : 'com_fatura'
      const pagamento =
        o.pagamento === 'pago' || o.pagamento === 'devedor' || o.pagamento === 'pendente'
          ? o.pagamento
          : 'pendente'
      const situ = o.situacaoFatura
      const situOk: FechamentoSituacaoFatura | undefined =
        situ === 'emitida' || situ === 'no_prazo' || situ === 'paga' || situ === 'nao_paga'
          ? situ
          : undefined
      const numFat =
        typeof o.numeroFatura === 'string' && o.numeroFatura.trim() ? o.numeroFatura.trim() : ''
      const arquivoAnexo =
        typeof o.arquivoAnexo === 'string' && o.arquivoAnexo.startsWith('data:')
          ? o.arquivoAnexo
          : ''
      /** Aceitar entradas com nº fatura, modo sem_fatura ou pagamento — não descartar só por falta de `modo`. */
      const temSinal =
        Boolean(numFat) ||
        Boolean(arquivoAnexo) ||
        modo === 'sem_fatura' ||
        pagamento === 'pago' ||
        pagamento === 'devedor' ||
        Boolean(situOk) ||
        o.etapa === 'enviado_fatura' ||
        o.etapa === 'controlo_pagamento'
      if (temSinal) {
        const entryLoad: FechamentoFluxoFinanceiroEntry = {
          etapa,
          modo,
          pagamento,
          updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : stamp,
        }
        if (numFat) entryLoad.numeroFatura = numFat
        if (situOk) entryLoad.situacaoFatura = situOk
        if (typeof o.dataVencimentoFatura === 'string' && o.dataVencimentoFatura.trim()) {
          entryLoad.dataVencimentoFatura = o.dataVencimentoFatura.trim()
        }
        if (arquivoAnexo) {
          entryLoad.arquivoAnexo = arquivoAnexo
          if (typeof o.nomeArquivoOriginal === 'string' && o.nomeArquivoOriginal.trim()) {
            entryLoad.nomeArquivoOriginal = o.nomeArquivoOriginal.trim()
          }
          if (typeof o.tipoArquivo === 'string' && o.tipoArquivo.trim()) {
            entryLoad.tipoArquivo = o.tipoArquivo.trim()
          }
        }
        out[k] = entryLoad
      }
    }
  }
  return out
}
