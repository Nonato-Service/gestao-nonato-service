/**
 * I/O de relógio/UUID — fromForm canónico em `app/modules/manuais/fromForm`.
 */
import {
  createBibliaAnexoFromForm as createBibliaAnexoFromFormPure,
  createManuaisDocumentoFromForm as createManuaisDocumentoFromFormPure,
  createManuaisGrupoFromForm as createManuaisGrupoFromFormPure,
  createManuaisImagemFromForm as createManuaisImagemFromFormPure,
  createManuaisModeloFromForm as createManuaisModeloFromFormPure,
  newManuaisEntityId as newManuaisEntityIdPure,
  type CreateBibliaAnexoFromFormOpts,
  type CreateManuaisDocumentoFromFormOpts,
  type CreateManuaisGrupoFromFormOpts,
  type CreateManuaisImagemFromFormOpts,
  type CreateManuaisModeloFromFormOpts,
} from '../modules/manuais/fromForm'
import type { BibliaAnexo } from '../modules/manuais/bibliaTipos'
import type { ManuaisDocumento, ManuaisGrupo, ManuaisImagem, ManuaisModelo } from '../modules/manuais/tipos'

function manuaisClock() {
  return {
    nowMs: Date.now(),
    randomUUID:
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? () => crypto.randomUUID()
        : undefined,
  }
}

/** Injeta Date.now() / crypto.randomUUID() quando o call-site não envia. */
export function newManuaisEntityId(prefix: string, suffix?: string | number): string {
  return newManuaisEntityIdPure(prefix, suffix, manuaisClock())
}

export function createManuaisGrupoFromForm(
  nome: string,
  familia: string,
  opts: Omit<CreateManuaisGrupoFromFormOpts, 'nowMs' | 'randomUUID'> = {}
): ManuaisGrupo {
  return createManuaisGrupoFromFormPure(nome, familia, { ...opts, ...manuaisClock() })
}

export function createManuaisModeloFromForm(
  nome: string,
  grupoId: string,
  opts: Omit<CreateManuaisModeloFromFormOpts, 'nowMs' | 'randomUUID'> = {}
): ManuaisModelo {
  return createManuaisModeloFromFormPure(nome, grupoId, { ...opts, ...manuaisClock() })
}

export function createManuaisDocumentoFromForm(
  form: Omit<ManuaisDocumento, 'id'>,
  opts: Omit<CreateManuaisDocumentoFromFormOpts, 'nowMs' | 'randomUUID'> = {}
): ManuaisDocumento {
  return createManuaisDocumentoFromFormPure(form, { ...opts, ...manuaisClock() })
}

export function createManuaisImagemFromForm(
  form: Omit<ManuaisImagem, 'id'>,
  opts: Omit<CreateManuaisImagemFromFormOpts, 'nowMs' | 'randomUUID'> = {}
): ManuaisImagem {
  return createManuaisImagemFromFormPure(form, { ...opts, ...manuaisClock() })
}

export function createBibliaAnexoFromForm(
  form: Omit<BibliaAnexo, 'id'>,
  opts: Omit<CreateBibliaAnexoFromFormOpts, 'nowMs' | 'randomUUID'> = {}
): BibliaAnexo {
  return createBibliaAnexoFromFormPure(form, { ...opts, ...manuaisClock() })
}
