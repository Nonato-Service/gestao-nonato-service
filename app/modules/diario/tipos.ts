/** Tipos do Diário de Anotação / pedidos do dia. */

export type DiarioPedidoStatus = 'planeado' | 'em_curso' | 'concluido'

export type DiarioPedidoAnexo = {
  id: string
  nome: string
  dataUrl: string
}

export type DiarioPedidoItem = {
  id: string
  texto: string
  status: DiarioPedidoStatus
  criadoEm: string
  atualizadoEm?: string
  anexos?: DiarioPedidoAnexo[]
  /** Quando a anotação foi criada a partir do cadastro — permite mostrar morada/contactos ao expandir */
  clienteCadastroId?: string
  lembreteAtivo?: boolean
  lembreteIntervaloMinutos?: number
  lembreteProximoEm?: string
  lembreteUltimoEm?: string
}
