/** Formulário vazio do PRE CHECK. */

import type { PreCheckFormState } from './tipos'

export function emptyPreCheckForm(opts: { nowMs: number }): PreCheckFormState {
  return {
    data: new Date(opts.nowMs).toISOString().split('T')[0],
    tecnicoResponsavel: '',
    observacoes: '',
    status: 'pendente',
  }
}
