import type { SolicitacaoServicoTecnico, SolicitacaoServicoTecnicoFormState } from './tipos'
import { rotuloHorarioPreferidoSst, rotuloNivelUrgenciaSst } from './rotulos'

/** Bundle de tradução mínimo para o corpo de texto SST (chaves opcionais). */
export type SstEnvioTextoTr = Record<string, string | undefined>

/**
 * Corpo de e-mail/WhatsApp/SMS: só campos preenchidos + título.
 * `tr` = bundle do idioma actual (sem importar translations.ts).
 */
export function buildSolicitacaoBody(
  s: SolicitacaoServicoTecnicoFormState | SolicitacaoServicoTecnico,
  tr: SstEnvioTextoTr
): string {
  const labels = {
    nomeCliente: tr.solicitacaoServicoTecnicoNomeCliente ?? 'Nome do cliente',
    identificacaoFiscal: tr.solicitacaoServicoTecnicoIdentificacaoFiscal ?? 'Identificação fiscal',
    emailContato: tr.solicitacaoServicoTecnicoEmailContato ?? 'E-mail',
    departamento: tr.solicitacaoServicoTecnicoDepartamento ?? 'Departamento',
    tipoServico: tr.solicitacaoServicoTecnicoTipoServico ?? 'Tipo de serviço',
    localServico: tr.solicitacaoServicoTecnicoLocalServico ?? 'Local do serviço',
    horarioPreferido: tr.solicitacaoServicoTecnicoHorarioPreferido ?? 'Horário preferencial',
    nivelUrgencia:
      tr.solicitacaoServicoTecnicoPdfNivelUrgenciaCampo ??
      tr.solicitacaoServicoTecnicoNivelUrgencia ??
      'Nível de urgência',
    tipoEquipamento: tr.solicitacaoServicoTecnicoTipoEquipamento ?? 'Tipo de equipamento',
    marca: tr.solicitacaoServicoTecnicoMarca ?? 'Marca',
    modelo: tr.solicitacaoServicoTecnicoModelo ?? 'Modelo',
    numeroSerie: tr.solicitacaoServicoTecnicoNumeroSerie ?? 'Número de série',
    problemas: tr.solicitacaoServicoTecnicoProblemasApresentados ?? 'Problemas apresentados',
    endereco: tr.solicitacaoServicoTecnicoEndereco ?? 'Endereço',
    telefone: tr.solicitacaoServicoTecnicoTelefone ?? 'Telefone',
    responsavel: tr.solicitacaoServicoTecnicoResponsavel ?? 'Responsável',
    assinaturaDesc:
      tr.solicitacaoServicoTecnicoAssinaturaDesc ??
      'O cliente deve assinar e enviar por e-mail ou WhatsApp.',
  }
  const pushVal = (label: string, val?: string) => {
    const v = String(val ?? '').trim()
    return v ? `${label}: ${v}` : ''
  }
  const horarioTxt = rotuloHorarioPreferidoSst(s.horarioPreferido, {
    manha: tr.solicitacaoServicoTecnicoHorarioOpcManha,
    tarde: tr.solicitacaoServicoTecnicoHorarioOpcTarde,
    dia: tr.solicitacaoServicoTecnicoHorarioOpcDia,
    noite: tr.solicitacaoServicoTecnicoHorarioOpcNoite,
    livre: tr.solicitacaoServicoTecnicoHorarioOpcLivre,
  })
  const nivelTxt = rotuloNivelUrgenciaSst(s.nivelUrgencia, {
    baixa: tr.solicitacaoServicoTecnicoUrgenciaBaixa,
    media: tr.solicitacaoServicoTecnicoUrgenciaMedia,
    alta: tr.solicitacaoServicoTecnicoUrgenciaAlta,
    critica: tr.solicitacaoServicoTecnicoUrgenciaCritica,
  })
  const linhas = [
    pushVal(labels.nomeCliente, s.nomeCliente),
    pushVal(labels.identificacaoFiscal, s.identificacaoFiscal),
    pushVal(labels.emailContato, s.emailContato),
    pushVal(labels.departamento, s.departamento),
    pushVal(labels.tipoServico, s.tipoServico),
    pushVal(labels.localServico, s.localServico),
    pushVal(labels.horarioPreferido, horarioTxt),
    pushVal(labels.nivelUrgencia, nivelTxt),
    pushVal(labels.tipoEquipamento, s.tipoEquipamento),
    pushVal(labels.marca, s.marca),
    pushVal(labels.modelo, s.modelo),
    pushVal(labels.numeroSerie, s.numeroSerie),
    pushVal(labels.problemas, s.problemasApresentados),
    pushVal(labels.endereco, s.endereco),
    pushVal(labels.telefone, s.telefone),
    pushVal(labels.responsavel, s.responsavel),
  ].filter(Boolean)
  const titulo = tr.solicitacaoServicoTecnicoTitle || 'SOLICITAÇÃO DE SERVIÇO TÉCNICO'
  const blocoResumo =
    linhas.length > 0
      ? [
          tr.solicitacaoServicoTecnicoResumoTitulo || 'Resumo (só campos preenchidos):',
          '',
          ...linhas,
          '',
          labels.assinaturaDesc,
        ].join('\n')
      : tr.solicitacaoServicoTecnicoBodySomenteAnexo ||
        'Não há campos preenchidos no resumo. Todos os dados estão no documento oficial descarregado (.html): abra esse ficheiro no browser — é o mesmo layout do PDF — ou use Imprimir → Guardar como PDF e anexe o PDF.'
  return [titulo, '', blocoResumo].join('\n')
}
