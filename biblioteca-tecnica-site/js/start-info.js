/**
 * Informações complementares (mesmo espírito do portal nonato-service.web.app/start).
 * Substitua ou complete os textos com os dados do teu outro software / site / folheto.
 * Este ficheiro é carregado antes de app.js — expõe window.START_INFO.
 */
(function () {
  window.START_INFO = {
    titulo: 'Nonato Service',
    subtitulo: 'Assistência técnica, peças e documentação HOMAG.',
    paragrafo:
      'Centralizamos o conhecimento operacional da oficina: da família de máquinas ao manual certo. Preencha esta secção com os textos do teu sistema atual (horários, filiais, serviços, avisos).',

    destaques: [
      {
        titulo: 'Assistência & peças',
        texto: 'Substitua por informações reais: cobertura, SLA, formulário de pedido de peças, etc.'
      },
      {
        titulo: 'Documentação técnica',
        texto: 'Use esta caixa para reforçar PDFs, esquemas, fichas de segurança ou links internos.'
      },
      {
        titulo: 'Contacto',
        texto: 'Telefone, e-mail e morada — copie do software ou site que quiser manter como referência.'
      }
    ],

    /** Lista simples (opcional) */
    bullets: [
      'Linha HOMAG: seccionadoras, centros de usinagem, coladeiras…',
      'Bíblia local: funciona offline no navegador deste equipamento.'
    ],

    contato: {
      linhas: [
        'Exemplo: +351 XXX XXX XXX',
        'Exemplo: suporte@seudominio.pt'
      ]
    },

    /** Links opcionais [{ "label": "Portal", "href": "https://..." }] */
    links: []
  };
})();
