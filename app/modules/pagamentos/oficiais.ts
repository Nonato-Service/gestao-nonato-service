/** Destinos oficiais de PAGAMENTOS — Finanças, Segurança Social, Imposto da NSA e IRS. */

import type { EmpresaRecebedora, EmpresaRecebedoraTipo } from './tipos'

export type EmpresaRecebedoraOficialId =
  | 'pag-oficial-financas'
  | 'pag-oficial-seguranca-social'
  | 'pag-oficial-imposto-nsa'
  | 'pag-oficial-irs'

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
    nomeFallback: 'Finanças',
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
]

export function isEmpresaRecebedoraOficial(id: string): boolean {
  return PAGAMENTOS_EMPRESAS_OFICIAIS.some((d) => d.id === id)
}

export type EnsureEmpresasOficiaisPagamentosOpts = {
  nowMs: number
  nomes?: Partial<Record<EmpresaRecebedoraOficialId, string>>
}

/** Junta destinos oficiais em falta. Nunca remove nem substitui cadastros já guardados. */
export function ensureEmpresasOficiaisPagamentos(
  existing: EmpresaRecebedora[],
  opts: EnsureEmpresasOficiaisPagamentosOpts
): { list: EmpresaRecebedora[]; added: number } {
  const list = Array.isArray(existing) ? [...existing] : []
  const have = new Set(list.map((e) => e.id))
  const iso = new Date(opts.nowMs).toISOString()
  let added = 0
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
  return { list, added }
}
