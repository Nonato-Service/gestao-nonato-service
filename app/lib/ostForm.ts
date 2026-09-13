/**
 * I/O de relógio/aleatório/UUID — ids canónicos em `app/modules/orcamentos/ostForm`.
 */
import {
  emptyOstPropostaLinha as emptyOstPropostaLinhaPure,
  newOstEntityId as newOstEntityIdPure,
  normalizeOstPropostaLinha as normalizeOstPropostaLinhaPure,
  normalizeOstPropostaLinhas as normalizeOstPropostaLinhasPure,
  type OstIdDeps,
} from '../modules/orcamentos/ostForm'
import {
  createOstPropostaFromForm as createOstPropostaFromFormPure,
  type CreateOstPropostaFromFormOpts,
} from '../modules/orcamentos/ostFromForm'
import type { OstPropostaLinha, OstPropostaPayload, OstPropostaSalva } from '../modules/orcamentos/ostTipos'

function ostIdDeps(): OstIdDeps {
  return {
    nowMs: Date.now(),
    random: Math.random,
    randomUUID:
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? () => crypto.randomUUID()
        : undefined,
  }
}

/** Injeta Date.now(), Math.random() e crypto.randomUUID() quando existir. */
export function newOstEntityId(): string {
  return newOstEntityIdPure(ostIdDeps())
}

export function emptyOstPropostaLinha(): OstPropostaLinha {
  return emptyOstPropostaLinhaPure(ostIdDeps())
}

export function normalizeOstPropostaLinha(l: Partial<OstPropostaLinha>): OstPropostaLinha {
  return normalizeOstPropostaLinhaPure(l, ostIdDeps())
}

export function normalizeOstPropostaLinhas(
  linhas: readonly Partial<OstPropostaLinha>[] | undefined
): OstPropostaLinha[] {
  return normalizeOstPropostaLinhasPure(linhas, ostIdDeps())
}

/** Injeta relógio/aleatório/UUID no id e nas datas quando o call-site não envia. */
export function createOstPropostaFromForm(
  form: OstPropostaPayload,
  nome: string,
  opts: Omit<CreateOstPropostaFromFormOpts, 'nowMs' | 'random' | 'randomUUID'> = {}
): OstPropostaSalva {
  return createOstPropostaFromFormPure(form, nome, { ...opts, ...ostIdDeps() })
}
