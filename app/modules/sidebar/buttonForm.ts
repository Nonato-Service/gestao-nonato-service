/** Formulário de botão da barra lateral — estado vazio e mapeamento. */

import type { SidebarButton } from './tipos'

export type SidebarButtonFormState = {
  name: string
  action: string
}

export function emptySidebarButtonForm(): SidebarButtonFormState {
  return { name: '', action: '' }
}

export function sidebarButtonToForm(
  button: Pick<SidebarButton, 'name' | 'action'>
): SidebarButtonFormState {
  return { name: button.name, action: button.action }
}
