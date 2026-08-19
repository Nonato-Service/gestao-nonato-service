/** Tipos do arquivo de relatórios excluídos (cópia de segurança por pasta de cliente). */

import type { FechamentoItem } from '../fechamento/tipos'
import type { RelatorioEquipamento } from '../clientes/equipamentoClienteTipos'
import type { RelatorioServico } from './relatorioServicoForm'

/** Item arquivado ao excluir relatório (cópia de segurança por pasta de cliente). */
export type ItemRelatorioExcluidoArquivo =
  | {
      archiveId: string
      excluidoEm: string
      tipo: 'servico'
      relatorio: RelatorioServico
      fechamentoItens?: FechamentoItem[]
      tinhaFechamentoBiblioteca?: boolean
    }
  | {
      archiveId: string
      excluidoEm: string
      tipo: 'nota-equipamento'
      relatorio: RelatorioEquipamento
      equipamentoModelo?: string
      equipamentoSerie?: string
    }

export type PastaRelatoriosExcluidosCliente = {
  clienteId: string
  clienteNome: string
  itens: ItemRelatorioExcluidoArquivo[]
}

export type RelatoriosExcluidosClientesStorage = {
  pastas: Record<string, PastaRelatoriosExcluidosCliente>
}
