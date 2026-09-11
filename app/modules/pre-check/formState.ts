/** Formulário vazio do PRE CHECK. */

import type { PreCheckFormState } from './tipos'

export function emptyPreCheckForm(): PreCheckFormState {
  return {
    data: new Date().toISOString().split('T')[0],
    tecnicoResponsavel: '',
    observacoes: '',
    status: 'pendente',
  }
}
