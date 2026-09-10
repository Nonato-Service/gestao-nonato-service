/** Validação, grupo e mapeamento puro do cadastro de serviço. */

import { DEFAULT_SERVICO_GRUPO_ID, ordenarServicoGrupos } from './grupos'
import type { ServicoCadastroGrupo } from './grupos'
import type { ServicoCadastroFormState } from './servicoCadastroForm'
import type { ServicoCadastroItem } from './servicoCadastroTipos'

/** Nome preenchido e valor numérico ≥ 0 (parse no call-site). */
export function isServicoCadastroFormValid(
  form: Pick<ServicoCadastroFormState, 'nome'>,
  valor: number
): boolean {
  return Boolean(String(form?.nome || '').trim()) && valor >= 0 && !Number.isNaN(valor)
}

/** Grupo válido do form, senão o primeiro da lista / default. */
export function resolverGrupoIdServicoCadastro(
  grupoId: string | undefined,
  grupos: ServicoCadastroGrupo[]
): string {
  const idsG = new Set((grupos || []).filter((g) => g && typeof g.id === 'string').map((g) => g.id))
  if (typeof grupoId === 'string' && idsG.has(grupoId)) return grupoId
  return ordenarServicoGrupos(grupos)[0]?.id ?? DEFAULT_SERVICO_GRUPO_ID
}

function camposServicoCadastroFromForm(
  form: ServicoCadastroFormState,
  opts: { grupoId: string; valor: number }
): Omit<ServicoCadastroItem, 'id'> {
  return {
    grupoId: opts.grupoId,
    cod: form.cod || undefined,
    nome: form.nome,
    descricao: form.descricao || undefined,
    valor: opts.valor,
    tipoCobranca: form.tipoCobranca,
    categoria: form.categoria,
  }
}

/** Monta um serviço novo a partir do form (sem I/O / alertas). */
export function createServicoCadastroFromForm(
  form: ServicoCadastroFormState,
  opts: { id: string; grupoId: string; valor: number }
): ServicoCadastroItem {
  return {
    id: opts.id,
    ...camposServicoCadastroFromForm(form, opts),
  }
}

/** Actualiza campos editáveis (preserva id e extras do existente). */
export function updateServicoCadastroFromForm(
  existing: ServicoCadastroItem,
  form: ServicoCadastroFormState,
  opts: { grupoId: string; valor: number }
): ServicoCadastroItem {
  return {
    ...existing,
    ...camposServicoCadastroFromForm(form, opts),
  }
}
