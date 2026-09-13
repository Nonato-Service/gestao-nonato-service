/**
 * I/O de relógio/aleatório/UUID — ids canónicos em `app/modules/orcamentos/pecasEspeciaisForm`.
 */
import {
  emptyLinhaOrcamentoPecasEsp as emptyLinhaOrcamentoPecasEspPure,
  newPecasEspeciaisEntityId as newPecasEspeciaisEntityIdPure,
  normalizeLinhaOrcamentoPecasEsp as normalizeLinhaOrcamentoPecasEspPure,
  type PecasEspeciaisIdDeps,
} from '../modules/orcamentos/pecasEspeciaisForm'
import {
  createOrcamentoPecasEspeciaisFromForm as createOrcamentoPecasEspeciaisFromFormPure,
  type CreateOrcamentoPecasEspeciaisFromFormOpts,
  type OrcamentoPecasEspeciaisFormPayload,
} from '../modules/orcamentos/pecasEspeciaisFromForm'
import type { LinhaOrcamentoPecasEsp, OrcamentoPecasEspeciaisSalvo } from '../modules/orcamentos/pecasEspeciaisTipos'

function pecasEspeciaisIdDeps(): PecasEspeciaisIdDeps {
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
export function newPecasEspeciaisEntityId(): string {
  return newPecasEspeciaisEntityIdPure(pecasEspeciaisIdDeps())
}

export function emptyLinhaOrcamentoPecasEsp(): LinhaOrcamentoPecasEsp {
  return emptyLinhaOrcamentoPecasEspPure(pecasEspeciaisIdDeps())
}

export function normalizeLinhaOrcamentoPecasEsp(
  l: Partial<LinhaOrcamentoPecasEsp>
): LinhaOrcamentoPecasEsp {
  return normalizeLinhaOrcamentoPecasEspPure(l, pecasEspeciaisIdDeps())
}

/** Injeta relógio/aleatório/UUID no id quando o call-site não envia um. */
export function createOrcamentoPecasEspeciaisFromForm(
  form: OrcamentoPecasEspeciaisFormPayload,
  opts: Omit<CreateOrcamentoPecasEspeciaisFromFormOpts, 'nowMs' | 'random' | 'randomUUID'> = {}
): OrcamentoPecasEspeciaisSalvo {
  return createOrcamentoPecasEspeciaisFromFormPure(form, { ...opts, ...pecasEspeciaisIdDeps() })
}
