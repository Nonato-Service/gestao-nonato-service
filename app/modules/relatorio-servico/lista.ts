import type { ClienteRelatorioLookup, RelatorioServicoNumeroLike } from './tipos'

export function findClienteByRelatorio<T extends ClienteRelatorioLookup>(
  clientes: T[],
  rel: RelatorioServicoNumeroLike
): T | undefined {
  const cid = (rel.clienteId || '').trim()
  if (cid) {
    const byId = clientes.find((c) => c.id === cid)
    if (byId) return byId
  }
  const nome = (rel.cliente || '').trim().toLowerCase()
  if (!nome) return undefined
  return clientes.find((c) => (c.nomeEmpresa || '').trim().toLowerCase() === nome)
}

export function relatorioEstaNaBibliotecaArquivo(
  r: { id: string },
  fechamentosGuardadosBibliotecaIds: string[]
): boolean {
  return fechamentosGuardadosBibliotecaIds.includes(r.id)
}

export function relatorioSaiDaListaPrincipalRelatorios(
  r: RelatorioServicoNumeroLike,
  fechamentosGuardadosBibliotecaIds: string[]
): boolean {
  if (!r.servicoConcluido) return false
  return relatorioEstaNaBibliotecaArquivo(r, fechamentosGuardadosBibliotecaIds)
}

export function relatoriosServicoForaDaBiblioteca<T extends RelatorioServicoNumeroLike>(
  relatoriosServico: T[],
  fechamentosGuardadosBibliotecaIds: string[]
): T[] {
  return relatoriosServico.filter(
    (r) => !relatorioSaiDaListaPrincipalRelatorios(r, fechamentosGuardadosBibliotecaIds)
  )
}
