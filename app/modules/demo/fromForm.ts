/** Validação e mapeamento puro do destinatário de demonstração. */

import type { DemoModuleMode, DemoRecipientRecord } from './tipos'

export type DemoRecipientFormPayload = {
  nome: string
  email: string
  observacoes: string
  demoDays: number
  demoModules: Record<string, DemoModuleMode>
  demoPreset?: string
}

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
