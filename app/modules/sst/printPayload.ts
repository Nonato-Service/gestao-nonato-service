import type {
  SolicitacaoServicoTecnicoPdfData,
  SolicitacaoServicoTecnicoPdfLabels,
} from '../../utils/solicitacaoServicoTecnicoPdf'
import type { SolicitacaoServicoTecnico } from './tipos'
import {
  rotuloNivelUrgenciaSst,
  sstHtmlLangFromUiLanguage,
  sstRefValFromId,
} from './rotulos'

export type SstPrintTr = Record<string, string | undefined>

export type SolicitacaoPrintPayload = {
  labels: SolicitacaoServicoTecnicoPdfLabels
  dataPdf: SolicitacaoServicoTecnicoPdfData
  htmlLang: string
  refVal: string
}

/**
 * Monta labels + dados PDF + idioma HTML a partir do registo e do bundle de tradução.
 * O NMA chama `buildSolicitacaoServicoTecnicoPrintHtml` com o logo.
 */
export function buildSolicitacaoPrintPayload(
  rec: SolicitacaoServicoTecnico,
  tr: SstPrintTr,
  dataCriacaoLocale: string,
  selectedLanguage: string,
  isEnglishUiLang: boolean
): SolicitacaoPrintPayload {
  const dataCriStr = new Date(rec.dataCriacao).toLocaleDateString(dataCriacaoLocale)
  const refVal = sstRefValFromId(rec.id)
  const nivelUrgenciaLabel = rotuloNivelUrgenciaSst(rec.nivelUrgencia, {
    baixa: tr.solicitacaoServicoTecnicoUrgenciaBaixa,
    media: tr.solicitacaoServicoTecnicoUrgenciaMedia,
    alta: tr.solicitacaoServicoTecnicoUrgenciaAlta,
    critica: tr.solicitacaoServicoTecnicoUrgenciaCritica,
  })
  const labels: SolicitacaoServicoTecnicoPdfLabels = {
    docTitleLine1: tr.solicitacaoServicoTecnicoPdfTitleLine1 || 'SOLICITAÇÃO DE',
    docTitleLine2: tr.solicitacaoServicoTecnicoPdfTitleLine2 || 'SERVIÇO TÉCNICO',
    docSubtitle: tr.solicitacaoServicoTecnicoPdfDocSubtitle ?? '',
    emitidoEmLabel: tr.solicitacaoServicoTecnicoPdfEmitidoEm ?? 'Emitido em',
    emitidoEmValue: dataCriStr,
    refLabel: tr.solicitacaoServicoTecnicoPdfRef ?? 'Referência',
    refValue: refVal,
    secEmpresa:
      tr.solicitacaoServicoTecnicoPdfSecEmpresa != null
        ? tr.solicitacaoServicoTecnicoPdfSecEmpresa
        : 'EMPRESA SOLICITANTE',
    secContato: tr.solicitacaoServicoTecnicoPdfSecContato || 'INFORMAÇÕES DE CONTATO',
    secRequisito: tr.solicitacaoServicoTecnicoPdfSecRequisito || 'REQUISITO DO SERVIÇO',
    secEquipamento: tr.solicitacaoServicoTecnicoPdfSecEquipamento || 'EQUIPAMENTO',
    secDisponibilidade: tr.solicitacaoServicoTecnicoPdfSecDisponibilidade || 'DISPONIBILIDADE',
    horarioPreferidoParaServico:
      tr.solicitacaoServicoTecnicoPdfHorarioPreferidoParaServico ||
      tr.solicitacaoServicoTecnicoHorarioPreferido ||
      'Horário preferido para serviço:',
    dataSolicitacaoLabel: tr.solicitacaoServicoTecnicoPdfDataSolicitacao || 'Data da solicitação',
    nomeCliente: tr.solicitacaoServicoTecnicoNomeCliente || 'Nome do cliente',
    identificacaoFiscal: tr.solicitacaoServicoTecnicoIdentificacaoFiscal || 'Identificação fiscal',
    emailContato: tr.solicitacaoServicoTecnicoEmailContato || 'E-mail',
    departamento: tr.solicitacaoServicoTecnicoDepartamento || 'Departamento',
    tipoServico: tr.solicitacaoServicoTecnicoTipoServico || 'Tipo de serviço',
    localServico: tr.solicitacaoServicoTecnicoLocalServico || 'Local do serviço',
    tipoEquipamento: tr.solicitacaoServicoTecnicoTipoEquipamento || 'Tipo',
    marca: tr.solicitacaoServicoTecnicoMarca || 'Marca',
    modelo: tr.solicitacaoServicoTecnicoModelo || 'Modelo',
    numeroSerie: tr.solicitacaoServicoTecnicoNumeroSerie || 'N.º série',
    problemas: tr.solicitacaoServicoTecnicoProblemasApresentados || 'Problemas',
    nivelUrgencia:
      tr.solicitacaoServicoTecnicoPdfNivelUrgenciaCampo ||
      tr.solicitacaoServicoTecnicoNivelUrgencia ||
      'Nível de urgência',
    endereco: tr.solicitacaoServicoTecnicoEndereco || 'Endereço',
    telefone: tr.solicitacaoServicoTecnicoTelefone || 'Telefone',
    responsavel: tr.solicitacaoServicoTecnicoResponsavel || 'Responsável',
    horarioManha: tr.solicitacaoServicoTecnicoHorarioOpcManha || '',
    horarioTarde: tr.solicitacaoServicoTecnicoHorarioOpcTarde || '',
    horarioDia: tr.solicitacaoServicoTecnicoHorarioOpcDia || '',
    horarioNoite: tr.solicitacaoServicoTecnicoHorarioOpcNoite || '',
    horarioLivre: tr.solicitacaoServicoTecnicoHorarioOpcLivre || '',
    secAssinatura: tr.solicitacaoServicoTecnicoPdfSecAssinatura || 'Assinatura do cliente',
    textoLegal: tr.solicitacaoServicoTecnicoPdfTextoLegal || '',
    zonaAssinar: tr.solicitacaoServicoTecnicoPdfZonaAssinar || '',
    nomeLegivel: tr.solicitacaoServicoTecnicoPdfNomeLegivel || '',
    localData: tr.solicitacaoServicoTecnicoPdfLocalData || '',
    rodape: tr.solicitacaoServicoTecnicoPdfRodape || 'Nonato Service',
  }
  const dataPdf: SolicitacaoServicoTecnicoPdfData = {
    id: rec.id,
    nomeCliente: rec.nomeCliente,
    identificacaoFiscal: String(rec.identificacaoFiscal || '').trim(),
    emailContato: String(rec.emailContato || '').trim(),
    departamento: String(rec.departamento || '').trim(),
    tipoServico: String(rec.tipoServico || '').trim(),
    localServico: String(rec.localServico || '').trim(),
    problemasApresentados: rec.problemasApresentados,
    nivelUrgenciaLabel,
    horarioPreferidoKey: String(rec.horarioPreferido || ''),
    tipoEquipamento: rec.tipoEquipamento,
    marca: rec.marca,
    modelo: rec.modelo,
    numeroSerie: rec.numeroSerie,
    endereco: rec.endereco,
    telefone: rec.telefone,
    responsavel: rec.responsavel,
    dataCriacao: rec.dataCriacao,
    dataSolicitacaoStr: dataCriStr,
  }
  const htmlLang = isEnglishUiLang ? 'en' : sstHtmlLangFromUiLanguage(selectedLanguage)
  return { labels, dataPdf, htmlLang, refVal }
}
