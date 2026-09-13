/**
 * I/O de relógio/aleatório — fromForm canónico em `app/modules/fechamento/grupoFromForm`.
 */
import {
  createServicoCadastroGrupoFromForm as createServicoCadastroGrupoFromFormPure,
  type CreateServicoCadastroGrupoFromFormOpts,
} from '../modules/fechamento/grupoFromForm'
import type { ServicoCadastroGrupo } from '../modules/fechamento/grupos'

/** Injeta Date.now() e Math.random() no id quando o call-site não envia. */
export function createServicoCadastroGrupoFromForm(
  nome: string,
  opts: Omit<CreateServicoCadastroGrupoFromFormOpts, 'nowMs' | 'random'> = {}
): ServicoCadastroGrupo {
  return createServicoCadastroGrupoFromFormPure(nome, { ...opts, nowMs: Date.now(), random: Math.random })
}
