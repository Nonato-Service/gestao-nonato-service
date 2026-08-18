/** Tipos canónicos da gestão de demos (módulos / destinatários). */

export type DemoModuleMode = 'active' | 'teaser' | 'hidden'

export type DemoPackagePreset =
  | 'basic'
  | 'commercial'
  | 'technical'
  | 'partial'
  | 'gestao-nucleo'
  | 'tecnica-clientes'

export type DemoRecipientRecord = {
  id: string
  nome: string
  email: string
  dataEnvio: string
  dataExpiracao?: string
  observacoes?: string
  firstAccessAt?: string
  lastAccessAt?: string
  activationCount?: number
  demoModules?: Record<string, DemoModuleMode>
  demoPreset?: string
  /** Dias de validade após o primeiro «Aceitar e entrar» (definido por si ao criar o link). */
  demoDays?: number
  /** Utilizador gerado automaticamente para o destinatário entrar na demo. */
  demoUsuario?: string
  /** Senha gerada automaticamente (visível só para o administrador). */
  demoSenha?: string
}

export type DemoRecipientStatus = 'pendente' | 'ativo' | 'a-expirar' | 'expirado'

export type DemoRecipientWithState = DemoRecipientRecord & {
  link: string
  status: DemoRecipientStatus
  daysLeft: number | null
}
