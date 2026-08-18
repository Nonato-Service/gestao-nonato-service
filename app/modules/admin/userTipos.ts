/** Tipo canónico de utilizador (admin / login / menu). */

export type UserPermissions = {
  gestores?: boolean
  equipamentos?: boolean
  clientes?: boolean
  fornecedores?: boolean
  relatorioServico?: boolean
  bibliotecaPecas?: boolean
  agenda?: boolean
  desmontados?: boolean
  cadastroServicos?: boolean
  extras?: boolean
}

export type User = {
  id: string
  name: string
  email: string
  role: string
  isDemoGuest?: boolean
  demoRecipientId?: string
  linkedProfileType?: 'gestor' | 'tecnico' | ''
  linkedProfileId?: string
  password?: string
  isAdmin?: boolean
  permissions?: UserPermissions
  /** Itens do menu visíveis (botão da sidebar → on/off). Sobrepõe permissões legadas quando definido. */
  menuItems?: Record<string, boolean>
  /** Quando true, só aparecem itens explicitamente activos em menuItems. */
  menuItemsConfigured?: boolean
}
