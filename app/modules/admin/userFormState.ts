/** Estado do formulário de utilizadores (admin) — tipo canónico, sem I/O. */

export type UserFormState = {
  name: string
  email: string
  role: string
  linkedProfileType: 'gestor' | 'tecnico' | ''
  linkedProfileId: string
  password: string
  isAdmin: boolean
  permissions: {
    gestores: boolean
    equipamentos: boolean
    clientes: boolean
    fornecedores: boolean
    relatorioServico: boolean
    bibliotecaPecas: boolean
    agenda: boolean
    desmontados: boolean
    cadastroServicos: boolean
    extras: boolean
  }
  menuItems: Record<string, boolean>
  menuItemsConfigured: boolean
}
