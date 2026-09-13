export const DEMO_DAYS_DEFAULT = 15
export const DEMO_DAYS_MIN = 1
export const DEMO_DAYS_MAX = 90
/** Valor por omissão ao criar novos links (retrocompatível com código existente). */
export const DEMO_DAYS = DEMO_DAYS_DEFAULT
export const DEMO_RECIPIENTS_KEY = 'nonato-demo-link-recipients'

export function clampDemoDays(value: unknown): number {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(n)) return DEMO_DAYS_DEFAULT
  return Math.min(DEMO_DAYS_MAX, Math.max(DEMO_DAYS_MIN, Math.round(n)))
}

export function resolveDemoDaysForRecipient(recipient?: { demoDays?: number } | null): number {
  return clampDemoDays(recipient?.demoDays)
}

/** Utilizador limitado — Gestor Demo (sem acesso de administrador real). */
export const DEMO_VISITOR_USER = {
  id: 'demo-visitor',
  name: 'Gestor Demo',
  email: '',
  role: 'Gestor (Demonstração)',
  isAdmin: false,
  permissions: {
    gestores: true,
    equipamentos: true,
    clientes: true,
    fornecedores: true,
    relatorioServico: true,
    bibliotecaPecas: true,
    agenda: true,
    desmontados: true,
    cadastroServicos: true,
    extras: true,
  },
} as const
