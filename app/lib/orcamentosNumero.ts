/**
 * I/O de relógio — numeração avulsa canónica em `app/modules/orcamentos/numeroAvulso`.
 */
import {
  gerarProximoNumeroOrcamentoAvulso as gerarProximoNumeroOrcamentoAvulsoPure,
  resolverNumeroOrcamentoAvulsoAoSalvar as resolverNumeroOrcamentoAvulsoAoSalvarPure,
  type OrcamentoAvulsoNumeroRef,
} from '../modules/orcamentos/numeroAvulso'
import { gerarProximoCodigoPedidoRelatorio as gerarProximoCodigoPedidoRelatorioPure } from '../modules/orcamentos/equipamento'
import type { PedidoOrcamentoRef } from '../modules/orcamentos/equipamento'

/** Injeta Date.now() quando a data ISO não traz dia/ano. */
export function gerarProximoNumeroOrcamentoAvulso(
  dataIso: string,
  orcamentosExistentes: OrcamentoAvulsoNumeroRef[],
  excluirId?: string
): string {
  return gerarProximoNumeroOrcamentoAvulsoPure(
    dataIso,
    orcamentosExistentes,
    excluirId,
    Date.now()
  )
}

export function resolverNumeroOrcamentoAvulsoAoSalvar(
  dataIso: string,
  numeroAtual: string,
  orcamentosExistentes: OrcamentoAvulsoNumeroRef[],
  excluirId?: string
): string {
  return resolverNumeroOrcamentoAvulsoAoSalvarPure(
    dataIso,
    numeroAtual,
    orcamentosExistentes,
    excluirId,
    Date.now()
  )
}

/** Injeta Date.now() no ano do código POR-AAAA-NNNN. */
export function gerarProximoCodigoPedidoRelatorio(pedidos: PedidoOrcamentoRef[]): string {
  return gerarProximoCodigoPedidoRelatorioPure(pedidos, Date.now())
}
