/** Destinos oficiais de PAGAMENTOS — Finanças, Segurança Social, Imposto da NSA e IRS. */

import type { EmpresaRecebedora, EmpresaRecebedoraTipo, PagamentoMetodo } from './tipos'

export type EmpresaRecebedoraOficialId =
  | 'pag-oficial-financas'
  | 'pag-oficial-seguranca-social'
  | 'pag-oficial-imposto-nsa'
  | 'pag-oficial-irs'
  | 'pag-oficial-contadora'
  | 'pag-oficial-advogada'

export type EmpresaRecebedoraOficialDef = {
  id: EmpresaRecebedoraOficialId
  tipo: Exclude<EmpresaRecebedoraTipo, 'outra'>
  nomeKey: string
  nomeFallback: string
}

export const PAGAMENTOS_EMPRESAS_OFICIAIS: readonly EmpresaRecebedoraOficialDef[] = [
  {
    id: 'pag-oficial-financas',
    tipo: 'financas',
    nomeKey: 'pagamentosEmpresaFinancas',
    nomeFallback: 'Autoridade Tributária',
  },
  {
    id: 'pag-oficial-seguranca-social',
    tipo: 'seguranca-social',
    nomeKey: 'pagamentosEmpresaSegurancaSocial',
    nomeFallback: 'Segurança Social',
  },
  {
    id: 'pag-oficial-imposto-nsa',
    tipo: 'imposto-nsa',
    nomeKey: 'pagamentosEmpresaImpostoNsa',
    nomeFallback: 'Imposto da NSA',
  },
  {
    id: 'pag-oficial-irs',
    tipo: 'irs',
    nomeKey: 'pagamentosEmpresaIrs',
    nomeFallback: 'Pagamento do IRS',
  },
  {
    id: 'pag-oficial-contadora',
    tipo: 'contadora',
    nomeKey: 'pagamentosEmpresaContadora',
    nomeFallback: 'Contadora',
  },
  {
    id: 'pag-oficial-advogada',
    tipo: 'advogada',
    nomeKey: 'pagamentosEmpresaAdvogada',
    nomeFallback: 'Advogada',
  },
]

export function isDestinoTransferenciaBancaria(id: string): boolean {
  return id === 'pag-oficial-contadora' || id === 'pag-oficial-advogada'
}

export function metodoPadraoPagamento(id: string): PagamentoMetodo {
  return isDestinoTransferenciaBancaria(id) ? 'transferencia' : 'referencia'
}

export function isEmpresaRecebedoraOficial(id: string): boolean {
  return PAGAMENTOS_EMPRESAS_OFICIAIS.some((d) => d.id === id)
}

export type EnsureEmpresasOficiaisPagamentosOpts = {
  nowMs: number
  nomes?: Partial<Record<EmpresaRecebedoraOficialId, string>>
}

const NOMES_ANTIGOS_FINANCAS = new Set([
  'Finanças',
  'Hacienda',
  'Finances',
  'Finanze',
  'Finanzen',
  'Tax office',
])

/** Junta destinos oficiais em falta. Nunca remove cadastros; só actualiza o nome antigo de Finanças. */
export function ensureEmpresasOficiaisPagamentos(
  existing: EmpresaRecebedora[],
  opts: EnsureEmpresasOficiaisPagamentosOpts
): { list: EmpresaRecebedora[]; added: number; changed: number } {
  const list = Array.isArray(existing) ? existing.map((e) => ({ ...e })) : []
  const have = new Set(list.map((e) => e.id))
  const iso = new Date(opts.nowMs).toISOString()
  let added = 0
  let changed = 0
  for (const def of PAGAMENTOS_EMPRESAS_OFICIAIS) {
    if (have.has(def.id)) continue
    const nome = (opts.nomes?.[def.id] || '').trim() || def.nomeFallback
    list.push({
      id: def.id,
      nome,
      tipo: def.tipo,
      criadoEm: iso,
      atualizadoEm: iso,
    })
    added += 1
  }
  const nomeFinancas = (opts.nomes?.['pag-oficial-financas'] || '').trim() || 'Autoridade Tributária'
  for (const item of list) {
    if (item.id !== 'pag-oficial-financas') continue
    const atual = (item.nome || '').trim()
    if (NOMES_ANTIGOS_FINANCAS.has(atual) && atual !== nomeFinancas) {
      item.nome = nomeFinancas
      item.atualizadoEm = iso
      changed += 1
    }
  }
  return { list, added, changed }
}
