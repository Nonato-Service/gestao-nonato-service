import { nomesClienteCorrespondem, type RelatorioServicoMin } from './bibliotecaRelatoriosRecovery'

export type ClienteExclusaoAlvo = {
  id: string
  nomeEmpresa?: string
}

export function isClienteBibliotecaOrfaos(id: string): boolean {
  return String(id ?? '').startsWith('bib-orfaos-')
}

/**
 * Relatório pertence ao cliente que está a ser excluído (por id ou nome flexível).
 * Não remove relatórios claramente ligados a outro cliente vivo.
 */
export function relatorioPertenceAoClienteParaExclusao(
  rel: RelatorioServicoMin,
  cliente: ClienteExclusaoAlvo,
  idsOutrosClientes: Set<string>
): boolean {
  const cid = String(rel.clienteId ?? '').trim()
  if (cid && cid === cliente.id) return true

  if (cid && cid !== cliente.id && idsOutrosClientes.has(cid)) return false

  const nomeRel = String(rel.cliente ?? '').trim()
  const nomeCli = String(cliente.nomeEmpresa ?? '').trim()
  if (!nomeRel || !nomeCli) return false
  return nomesClienteCorrespondem(nomeRel, nomeCli)
}

export function coletarIdsRelatoriosClienteParaExclusao(
  cliente: ClienteExclusaoAlvo,
  relatoriosServico: RelatorioServicoMin[],
  todosClientes: { id: string }[]
): string[] {
  const idsOutros = new Set(
    todosClientes.map((c) => c.id).filter((id) => id && id !== cliente.id)
  )
  const ids = new Set<string>()
  for (const r of relatoriosServico) {
    if (r?.id && relatorioPertenceAoClienteParaExclusao(r, cliente, idsOutros)) {
      ids.add(String(r.id))
    }
  }
  return [...ids]
}
