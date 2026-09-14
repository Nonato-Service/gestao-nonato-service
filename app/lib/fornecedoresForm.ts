/**
 * I/O de relógio — form vazio canónico em `app/modules/fornecedores/formState`.
 */
import { emptyFaturaFornecedorFormState as emptyFaturaFornecedorFormStatePure } from '../modules/fornecedores/formState'
import type { FaturaFornecedorFormState } from '../modules/fornecedores/tipos'

/** Injeta Date.now() no mês inicial quando o call-site não envia. */
export function emptyFaturaFornecedorFormState(
  overrides?: Partial<FaturaFornecedorFormState>
): FaturaFornecedorFormState {
  return emptyFaturaFornecedorFormStatePure(overrides, { nowMs: Date.now() })
}
