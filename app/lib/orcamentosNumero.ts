/**
 * I/O de relógio — numeração avulsa canónica em `app/modules/orcamentos/numeroAvulso`.
 */
import {
  gerarProximoNumeroOrcamentoAvulso as gerarProximoNumeroOrcamentoAvulsoPure,
  resolverNumeroOrcamentoAvulsoAoSalvar as resolverNumeroOrcamentoAvulsoAoSalvarPure,
  type OrcamentoAvulsoNumeroRef,
} from '../modules/orcamentos/numeroAvulso'

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
