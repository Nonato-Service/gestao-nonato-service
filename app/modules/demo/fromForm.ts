/** Validação e mapeamento puro do destinatário de demonstração. */

import type { DemoRecipientFormState } from './formState'
import type { DemoRecipientRecord } from './tipos'

export type DemoRecipientFormPayload = DemoRecipientFormState

export function isDemoRecipientFormValid(form: Pick<DemoRecipientFormPayload, 'nome'>): boolean {
  return Boolean(form.nome.trim())
}

export type CreateDemoRecipientFromFormOpts = {
  id?: string
  dataEnvio?: string
  demoUsuario?: string
  demoSenha?: string
}

export function createDemoRecipientFromForm(
  form: DemoRecipientFormPayload,
  opts: CreateDemoRecipientFromFormOpts = {}
): DemoRecipientRecord {
  return {
    id: opts.id ?? `demo-${Date.now()}`,
    nome: form.nome.trim(),
    email: form.email.trim(),
    dataEnvio: opts.dataEnvio ?? new Date().toISOString(),
    observacoes: form.observacoes.trim() || undefined,
    demoDays: form.demoDays,
    demoModules: form.demoModules,
    demoPreset: form.demoPreset || 'custom',
    demoUsuario: opts.demoUsuario,
    demoSenha: opts.demoSenha,
  }
}
