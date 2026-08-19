/** Tipo canónico do cliente (cadastro principal). */

import type { EquipamentoCliente } from './equipamentoClienteTipos'
import type { RelatorioServico } from '../relatorio-servico/relatorioServicoForm'
import type { SolicitacaoDocDevolvidoCliente } from '../sst/tipos'

/** Cliente cadastrado (ficha comercial / equipamentos / vínculos financeiros). */
export type Cliente = {
  id: string
  /** Código legível (ex.: NS000042) — gerado automaticamente */
  codigoCliente?: string
  nomeEmpresa: string
  morada: string
  localidade: string
  conselho: string
  pais: string
  codigoPostal: string
  freguesia: string
  numeroContribuicaoFiscal: string
  telefones: string
  email: string
  contato: string
  photo?: string
  equipamentos: EquipamentoCliente[]
  /** Relatórios de serviço organizados por equipamento */
  relatorios?: { [equipamentoId: string]: RelatorioServico[] }
  /** Indica se o cliente é devedor */
  isDevedor?: boolean
  /** Saldo pendente do cliente */
  saldoPendente?: number
  /** Quantidade de relatórios de serviço com situação «não pago» no fluxo financeiro */
  relatoriosNaoPagoCount?: number
  /** Relatório mais recente (por data) ainda «não pago»/devedor — destaque fino no cadastro até regularizar */
  ultimoRelatorioDevedorId?: string
  /** Formulários de solicitação técnica devolvidos (PDF/imagem), associados ao registo do cliente */
  anexosSolicitacaoServico?: SolicitacaoDocDevolvidoCliente[]
  /** Grupo do Cadastro de Serviços (tabela HTT/KRC/…) aplicada a este cliente */
  grupoTarifaId?: string
  /** KM de ida predefinidos — preenchidos no relatório de serviço ao escolher o cliente */
  kmIdaPadrao?: string
  /** KM de retorno predefinidos — preenchidos no relatório de serviço ao escolher o cliente */
  kmRetornoPadrao?: string
  /** Pessoa física ou jurídica — usado no formulário de cadastro */
  tipoCliente?: 'fisica' | 'juridica'
}
