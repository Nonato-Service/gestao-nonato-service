/** Templates de protocolo — catálogo e montagem de blocos (funções puras, sem I/O). */

import type { ProtocoloBlocoMin } from './tipos'

export type ProtocoloTemplateId = 'diagnostico' | 'antes_depois' | 'intervencao' | 'conclusao'

type TemplateDef = {
  id: ProtocoloTemplateId
  textoInicial?: string
  blocos: Array<Omit<ProtocoloBlocoMin, 'id'> & { tipo: 'texto' | 'imagens' | 'acao' }>
}

const TEMPLATES: Record<ProtocoloTemplateId, TemplateDef> = {
  diagnostico: {
    id: 'diagnostico',
    textoInicial: 'Motivo da visita e estado inicial observado no local.',
    blocos: [
      {
        tipo: 'acao',
        titulo: 'Diagnóstico inicial',
        texto: 'Sintomas reportados, medições e hipótese técnica.',
        imagens: [],
        ordemConteudo: 'texto_primeiro',
      },
      {
        tipo: 'imagens',
        titulo: 'Registo fotográfico',
        imagens: [],
      },
    ],
  },
  antes_depois: {
    id: 'antes_depois',
    blocos: [
      { tipo: 'imagens', titulo: 'Antes da intervenção', imagens: [] },
      { tipo: 'acao', titulo: 'Intervenção realizada', texto: 'Descrição do trabalho executado.', imagens: [], ordemConteudo: 'texto_primeiro' },
      { tipo: 'imagens', titulo: 'Depois da intervenção', imagens: [] },
    ],
  },
  intervencao: {
    id: 'intervencao',
    textoInicial: 'Resumo da intervenção técnica no equipamento/situação descrita.',
    blocos: [
      { tipo: 'texto', titulo: 'Procedimento', texto: 'Passos executados, ferramentas e tempo de paragem.' },
      { tipo: 'texto', titulo: 'Resultado', texto: 'Estado final, testes realizados e observações.' },
      { tipo: 'acao', titulo: 'Evidência visual', texto: '', imagens: [], ordemConteudo: 'imagens_primeiro' },
    ],
  },
  conclusao: {
    id: 'conclusao',
    blocos: [
      { tipo: 'texto', titulo: 'Conclusão', texto: 'Serviço concluído com sucesso. Equipamento operacional.' },
      { tipo: 'texto', titulo: 'Recomendações', texto: 'Manutenção preventiva sugerida e próximos passos.' },
    ],
  },
}

export const PROTOCOLO_TEMPLATE_IDS: ProtocoloTemplateId[] = [
  'diagnostico',
  'antes_depois',
  'intervencao',
  'conclusao',
]

export function blocosDeTemplate(
  templateId: ProtocoloTemplateId,
  newId: () => string
): { textoInicial?: string; blocos: ProtocoloBlocoMin[] } {
  const t = TEMPLATES[templateId]
  if (!t) return { blocos: [] }
  return {
    textoInicial: t.textoInicial,
    blocos: t.blocos.map((b) => ({ ...b, id: newId() })),
  }
}
