/**
 * Verificação rápida pós-alteração (sem abrir o browser).
 * Uso: npm run smoke:critico
 */
import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'

const root = process.cwd()
let failed = 0

function ok(msg) {
  console.log(`  ✓ ${msg}`)
}
function fail(msg) {
  failed += 1
  console.error(`  ✗ ${msg}`)
}

function exists(rel) {
  return fs.existsSync(path.join(root, rel))
}

console.log('\n[smoke:critico] Verificação de confiança Nonato Service\n')

// 1) Ficheiros críticos
const critical = [
  'app/NonatoMainApp.tsx',
  'app/utils/cadastroSafety.ts',
  'app/lib/criticalCadastroKeys.ts',
  'app/lib/orcamentosAlfabeto.ts',
  'app/lib/clienteDevedorUtils.ts',
  'app/modules/fechamento/index.ts',
  'app/modules/clientes/index.ts',
  'app/modules/financeiro/index.ts',
  'app/modules/orcamentos/index.ts',
  'app/modules/biblioteca/index.ts',
  'app/modules/relatorios-especiais/index.ts',
  'app/modules/comprovantes/index.ts',
  'app/modules/equipamentos/index.ts',
  'app/modules/relatorio-servico/index.ts',
  'app/modules/agenda/index.ts',
  'app/modules/sidebar/index.ts',
  'app/modules/diario/index.ts',
  'app/modules/protocolo/index.ts',
  'app/modules/checklist/index.ts',
  'app/modules/contabilidade/index.ts',
  'app/modules/sst/index.ts',
  'app/modules/pdf/index.ts',
  'app/modules/admin/index.ts',
  'pwa-version.json',
  'public/sw.js',
  'app/lib/pwaVersion.ts',
]
for (const f of critical) {
  if (exists(f)) ok(`existe ${f}`)
  else fail(`em falta: ${f}`)
}

// 2) PWA versão alinhada
try {
  const pj = JSON.parse(fs.readFileSync(path.join(root, 'pwa-version.json'), 'utf8'))
  const ver = Number(pj.version)
  const pwaTs = fs.readFileSync(path.join(root, 'app/lib/pwaVersion.ts'), 'utf8')
  const sw = fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8')
  if (pwaTs.includes(`PWA_VERSION = ${ver}`) || pwaTs.includes(`PWA_VERSION=${ver}`)) {
    ok(`pwaVersion.ts = v${ver}`)
  } else if (pwaTs.includes(String(ver))) {
    ok(`pwaVersion.ts referencia v${ver}`)
  } else {
    fail(`pwaVersion.ts não alinhado com pwa-version.json (${ver})`)
  }
  if (sw.includes(`v${ver}`) || sw.includes(String(ver))) ok(`sw.js referencia v${ver}`)
  else fail(`sw.js não alinhado com v${ver}`)
} catch (e) {
  fail(`PWA sync: ${e.message}`)
}

// 3) Filtro A–Z usa letra inicial (não qualquer palavra)
try {
  const alfa = fs.readFileSync(path.join(root, 'app/modules/clientes/alfabeto.ts'), 'utf8')
  if (
    alfa.includes('getClienteLetraAlfabeto(c.nomeEmpresa') &&
    alfa.includes('filtrarClientesPorLetraAlfabeto')
  ) {
    ok('filtro A–Z de clientes pela letra inicial')
  } else {
    fail('filtro A–Z pode ter voltado a usar qualquer palavra do nome')
  }
} catch (e) {
  fail(`alfabeto: ${e.message}`)
}

// 3b) Módulo fechamento (1.º corte + IVA helpers)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/fechamento/index.ts'), 'utf8')
  if (idx.includes('enriquecerLinhaFechamentoComCadastro') && idx.includes('FECHAMENTO_IDS_FIXOS_TEMPLATE')) {
    ok('módulo fechamento exporta tarifas/linhas')
  } else {
    fail('módulo fechamento incompleto (index.ts)')
  }
  if (idx.includes('totaisFechamentoLiquidoComIva') || idx.includes('FECHAMENTO_IVA_PADRAO')) {
    ok('módulo fechamento exporta IVA')
  } else {
    fail('módulo fechamento sem totaisFechamentoLiquidoComIva / FECHAMENTO_IVA_PADRAO')
  }
  if (
    idx.includes('ordenarServicoGrupos') &&
    idx.includes('migrarServicoLegacyCodNomeDesc') &&
    idx.includes('nomeGrupoTarifaServico')
  ) {
    ok('módulo fechamento exporta grupos de tarifa')
  } else {
    fail('módulo fechamento sem grupos (ordenar/migrar/nomeGrupo)')
  }
  if (idx.includes('buildItensFechamentoBaseRelatorio')) {
    ok('módulo fechamento exporta cobrancaRelatorio')
  } else {
    fail('módulo fechamento sem buildItensFechamentoBaseRelatorio')
  }
  if (
    idx.includes('buildItensFechamentoParaExibirFromSalvos') &&
    idx.includes('filtrarOpcoesServicoLinhaFechamento')
  ) {
    ok('módulo fechamento exporta exibirItens UI')
  } else {
    fail('módulo fechamento sem buildItensFechamentoParaExibirFromSalvos / filtrarOpcoesServicoLinhaFechamento')
  }
  if (
    idx.includes('RESUMO_COBRANCA_DECISAO_KEY') &&
    idx.includes('normalizeFechamentoItensOmitidosMap') &&
    idx.includes('normalizeFechamentoIvaPorRelatorioMap')
  ) {
    ok('módulo fechamento exporta persistMaps')
  } else {
    fail('módulo fechamento sem persistMaps (keys/normalize)')
  }
  if (!exists('app/modules/fechamento/persistMaps.ts')) {
    fail('falta app/modules/fechamento/persistMaps.ts')
  } else {
    ok('existe app/modules/fechamento/persistMaps.ts')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/fechamento'") || nma.includes('from "./modules/fechamento"')) {
    ok('NonatoMainApp importa app/modules/fechamento')
  } else {
    fail('NonatoMainApp não importa o módulo fechamento')
  }
  if (
    !nma.includes("const RESUMO_COBRANCA_DECISAO_KEY =") &&
    !nma.includes("const FECHAMENTO_ITENS_OMITIDOS_KEY =") &&
    nma.includes('normalizeFechamentoItensOmitidosMap')
  ) {
    ok('NonatoMainApp usa persistMaps do módulo fechamento')
  } else {
    fail('NonatoMainApp ainda define keys FECHAMENTO_* localmente / não usa normalize')
  }
} catch (e) {
  fail(`módulo fechamento: ${e.message}`)
}

// 3c) Módulo clientes (2.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/clientes/index.ts'), 'utf8')
  if (
    idx.includes('filtrarClientesPorLetraAlfabeto') &&
    idx.includes('calcularResumoFinanceiroCliente') &&
    idx.includes('ordenarClientesPorNome')
  ) {
    ok('módulo clientes exporta alfabeto/detalhe')
  } else {
    fail('módulo clientes incompleto (index.ts)')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/clientes'") || nma.includes('from "./modules/clientes"')) {
    ok('NonatoMainApp importa app/modules/clientes')
  } else {
    fail('NonatoMainApp não importa o módulo clientes')
  }
} catch (e) {
  fail(`módulo clientes: ${e.message}`)
}

// 3d) Módulo financeiro (3.º corte + 11.º: período/IVA + 18.º: fluxo tipos/mutações)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/financeiro/index.ts'), 'utf8')
  if (
    idx.includes('calcularClientesDevedores') &&
    idx.includes('isClienteMarcadoDevedor') &&
    idx.includes('refreshDevedoresListaSegura')
  ) {
    ok('módulo financeiro exporta devedores')
  } else {
    fail('módulo financeiro incompleto (index.ts)')
  }
  if (
    idx.includes('buildRelatorioFinanceiroPeriodo') ||
    idx.includes('periodoFinanceiroFromDate')
  ) {
    ok('módulo financeiro exporta período/IVA')
  } else {
    fail('módulo financeiro sem buildRelatorioFinanceiroPeriodo / periodoFinanceiroFromDate')
  }
  if (
    idx.includes('FECHAMENTO_FLUXO_FINANCEIRO_KEY') ||
    idx.includes('applyFechamentoEtapaFinanceiraToMap')
  ) {
    ok('módulo financeiro exporta fluxo tipos/mutações')
  } else {
    fail('módulo financeiro sem FECHAMENTO_FLUXO_FINANCEIRO_KEY / applyFechamentoEtapaFinanceiraToMap')
  }
  if (idx.includes('normalizeFechamentoFluxoFinanceiroMap')) {
    ok('módulo financeiro exporta fluxoNormalize')
  } else {
    fail('módulo financeiro sem normalizeFechamentoFluxoFinanceiroMap')
  }
  if (
    idx.includes('getSinalPagamentoFaturaFornecedor') &&
    idx.includes('getStatusFaturasCliente') &&
    idx.includes('clienteFaturaBadgePropsFromStatus')
  ) {
    ok('módulo financeiro exporta faturaStatus')
  } else {
    fail('módulo financeiro sem faturaStatus')
  }
  if (!exists('app/modules/financeiro/faturaStatus.ts')) {
    fail('falta app/modules/financeiro/faturaStatus.ts')
  } else {
    ok('existe app/modules/financeiro/faturaStatus.ts')
  }
  if (!exists('app/modules/financeiro/fluxoNormalize.ts')) {
    fail('falta app/modules/financeiro/fluxoNormalize.ts')
  } else {
    ok('existe app/modules/financeiro/fluxoNormalize.ts')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/financeiro'") || nma.includes('from "./modules/financeiro"')) {
    ok('NonatoMainApp importa app/modules/financeiro')
  } else {
    fail('NonatoMainApp não importa o módulo financeiro')
  }
  if (nma.includes('calcularClientesDevedores') && nma.includes('refreshDevedoresListaSegura')) {
    ok('NonatoMainApp usa cálculo/proteção de devedores do módulo')
  } else {
    fail('NonatoMainApp não usa calcularClientesDevedores / refreshDevedoresListaSegura')
  }
  if (
    nma.includes('normalizeFechamentoFluxoFinanceiroMap') &&
    !nma.includes('const entryLoad: FechamentoFluxoFinanceiroEntry = {')
  ) {
    ok('NonatoMainApp usa fluxoNormalize do módulo financeiro')
  } else {
    fail('NonatoMainApp ainda normaliza fluxo financeiro inline')
  }
  if (
    !nma.includes('function parseMoedaPtFaturaFornecedor(') &&
    !nma.includes('function sanitizeFaturaFornecedorValorDigitando(') &&
    nma.includes('getSinalPagamentoFaturaFornecedor')
  ) {
    ok('NonatoMainApp usa faturaStatus do módulo financeiro')
  } else {
    fail('NonatoMainApp ainda define parseMoeda/sanitize fatura localmente')
  }
  if (
    idx.includes('buildCorpoEnvioIbanFaturaPecas') &&
    idx.includes('digitosWhatsAppFromTelefonesCliente')
  ) {
    ok('módulo financeiro exporta envioCobranca')
  } else {
    fail('módulo financeiro sem envioCobranca')
  }
  if (!exists('app/modules/financeiro/envioCobranca.ts')) {
    fail('falta app/modules/financeiro/envioCobranca.ts')
  } else {
    ok('existe app/modules/financeiro/envioCobranca.ts')
  }
  if (
    !nma.includes('const primeiroTelefoneSoDigitosCliente =') &&
    !nma.includes('const digitosWhatsAppFromTelefonesCliente =') &&
    nma.includes('buildCorpoEnvioIbanFaturaPecas')
  ) {
    ok('NonatoMainApp usa envioCobranca do módulo financeiro')
  } else {
    fail('NonatoMainApp ainda define telefones/corpo envio localmente')
  }
} catch (e) {
  fail(`módulo financeiro: ${e.message}`)
}

// 3e) Módulo orçamentos (4.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/orcamentos/index.ts'), 'utf8')
  if (
    idx.includes('gerarProximoNumeroOrcamentoAvulso') &&
    idx.includes('criarPedidoSeparacaoFromOrcamento') &&
    idx.includes('mergeOrcamentosGeradosArrays')
  ) {
    ok('módulo orçamentos exporta workflow/avulso')
  } else {
    fail('módulo orçamentos incompleto (index.ts)')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/orcamentos'") || nma.includes('from "./modules/orcamentos"')) {
    ok('NonatoMainApp importa app/modules/orcamentos')
  } else {
    fail('NonatoMainApp não importa o módulo orçamentos')
  }
} catch (e) {
  fail(`módulo orçamentos: ${e.message}`)
}

// 3f) Módulo biblioteca (5.º corte + 12.º: relatórios lista/árvore)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/biblioteca/index.ts'), 'utf8')
  if (
    idx.includes('garantirNumerosSequenciaPecaBiblioteca') &&
    idx.includes('mergePecasBibliotecaArrays') &&
    idx.includes('isPecasBibliotecaCatalogIncomplete')
  ) {
    ok('módulo biblioteca exporta peças/sequência')
  } else {
    fail('módulo biblioteca incompleto (index.ts)')
  }
  if (
    idx.includes('buildBibliotecaRelatoriosPorCliente') ||
    idx.includes('repararIdsGuardadosBiblioteca')
  ) {
    ok('módulo biblioteca exporta relatórios lista/árvore')
  } else {
    fail('módulo biblioteca sem buildBibliotecaRelatoriosPorCliente / repararIdsGuardadosBiblioteca')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/biblioteca'") || nma.includes('from "./modules/biblioteca"')) {
    ok('NonatoMainApp importa app/modules/biblioteca')
  } else {
    fail('NonatoMainApp não importa o módulo biblioteca')
  }
  if (
    nma.includes('buildBibliotecaRelatoriosPorCliente') &&
    nma.includes('repararIdsGuardadosBiblioteca')
  ) {
    ok('NonatoMainApp usa helpers de biblioteca relatórios')
  } else {
    fail('NonatoMainApp não importa buildBibliotecaRelatoriosPorCliente / repararIdsGuardadosBiblioteca')
  }
  if (
    idx.includes('clipboardLooksLikeCatalogImport') &&
    idx.includes('buildPecaCatalogoUrlFromTemplate')
  ) {
    ok('módulo biblioteca exporta catálogo clipboard/URL')
  } else {
    fail('módulo biblioteca sem clipboardLooksLikeCatalogImport / buildPecaCatalogoUrlFromTemplate')
  }
  if (
    (idx.includes('mapItemToPecaBiblioteca') || idx.includes('buildImportedPecaDescricao')) &&
    idx.includes('separarPecasImportacao')
  ) {
    ok('módulo biblioteca exporta import mappers/dedup')
  } else {
    fail('módulo biblioteca sem mapItemToPecaBiblioteca|buildImportedPecaDescricao + separarPecasImportacao')
  }
  if (idx.includes('parseRawToPecas') || idx.includes('parseRawCatalogItensPlain')) {
    ok('módulo biblioteca exporta import parse (plain/html)')
  } else {
    fail('módulo biblioteca sem parseRawToPecas|parseRawCatalogItensPlain')
  }
  if (nma.includes('parseRawToPecasFromModule')) {
    ok('NonatoMainApp usa parseRawToPecas do módulo biblioteca')
  } else {
    fail('NonatoMainApp não usa parseRawToPecas do módulo biblioteca')
  }
  if (
    idx.includes('aplicarRegrasClassificacaoEmLista') ||
    idx.includes('criarRegraClassificacaoPeca')
  ) {
    ok('módulo biblioteca exporta classificação')
  } else {
    fail('módulo biblioteca sem aplicarRegrasClassificacaoEmLista|criarRegraClassificacaoPeca')
  }
  if (
    nma.includes('aplicarRegrasClassificacaoEmLista') &&
    (nma.includes('criarRegraClassificacaoPeca') || nma.includes('parsePalavrasClassificacao'))
  ) {
    ok('NonatoMainApp usa helpers de classificação da biblioteca')
  } else {
    fail('NonatoMainApp não usa aplicarRegrasClassificacaoEmLista / criarRegraClassificacaoPeca do módulo')
  }
} catch (e) {
  fail(`módulo biblioteca: ${e.message}`)
}

// 3g) Módulo relatórios especiais (6.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/relatorios-especiais/index.ts'), 'utf8')
  if (
    idx.includes('calcularTotaisRelatorioEspecial') &&
    idx.includes('adaptRelatorioEspecialParaFechamentoShape') &&
    idx.includes('filterByDeletedIds') &&
    idx.includes('imprimirRelatorioEspecialPdf')
  ) {
    ok('módulo relatorios-especiais exporta cálculos/fechamento/PDF')
  } else {
    fail('módulo relatorios-especiais incompleto (index.ts)')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (
    nma.includes("from './modules/relatorios-especiais'") ||
    nma.includes('from "./modules/relatorios-especiais"')
  ) {
    ok('NonatoMainApp importa app/modules/relatorios-especiais')
  } else {
    fail('NonatoMainApp não importa o módulo relatorios-especiais')
  }
} catch (e) {
  fail(`módulo relatorios-especiais: ${e.message}`)
}

// 3h) Módulo comprovantes (7.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/comprovantes/index.ts'), 'utf8')
  if (
    idx.includes('parseTotalEurosFromReceiptText') &&
    idx.includes('encontrarComprovanteDuplicado') &&
    idx.includes('buildFolhaSemanalContadorHtml')
  ) {
    ok('módulo comprovantes exporta parser/duplicados/folha')
  } else {
    fail('módulo comprovantes incompleto (index.ts)')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/comprovantes'") || nma.includes('from "./modules/comprovantes"')) {
    ok('NonatoMainApp importa app/modules/comprovantes')
  } else {
    fail('NonatoMainApp não importa o módulo comprovantes')
  }
} catch (e) {
  fail(`módulo comprovantes: ${e.message}`)
}

// 3i) Módulo equipamentos (8.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/equipamentos/index.ts'), 'utf8')
  const rel = fs.readFileSync(path.join(root, 'app/modules/equipamentos/relatorio.ts'), 'utf8')
  if (
    rel.includes('resolverIdEquipamentoCliente') &&
    idx.includes('getSequenciaEtiquetasArmazem') &&
    idx.includes('enriquecerBlocoEquipamentoPedido')
  ) {
    ok('módulo equipamentos exporta relatório/etiquetas')
  } else {
    fail('módulo equipamentos incompleto (index.ts)')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/equipamentos'") || nma.includes('from "./modules/equipamentos"')) {
    ok('NonatoMainApp importa app/modules/equipamentos')
  } else {
    fail('NonatoMainApp não importa o módulo equipamentos')
  }
} catch (e) {
  fail(`módulo equipamentos: ${e.message}`)
}

// 3j) Módulo relatório de serviço (10.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/relatorio-servico/index.ts'), 'utf8')
  if (
    idx.includes('sortDiasTrabalhoCronologicamente') &&
    idx.includes('parseRelatorioServicoNumeroDataSeq') &&
    idx.includes('relatoriosServicoForaDaBiblioteca')
  ) {
    ok('módulo relatorio-servico exporta dias/número/lista')
  } else {
    fail('módulo relatorio-servico incompleto (index.ts)')
  }
  if (
    idx.includes('calcularDuracao') &&
    idx.includes('atualizarCalculosDia') &&
    idx.includes('calcularTotais')
  ) {
    ok('módulo relatorio-servico exporta cálculos de dia')
  } else {
    fail('módulo relatorio-servico sem calcularDuracao/atualizarCalculosDia/calcularTotais')
  }
  if (
    idx.includes('normalizePdfModeloPorRelatorioMap') &&
    idx.includes('resolvePdfModeloForRelatorio') &&
    idx.includes('PDF_MODEL_PADRAO_STORAGE_KEY')
  ) {
    ok('módulo relatorio-servico exporta pdfModelo')
  } else {
    fail('módulo relatorio-servico sem pdfModelo')
  }
  if (!exists('app/modules/relatorio-servico/pdfModelo.ts')) {
    fail('falta app/modules/relatorio-servico/pdfModelo.ts')
  } else {
    ok('existe app/modules/relatorio-servico/pdfModelo.ts')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (
    nma.includes("from './modules/relatorio-servico'") ||
    nma.includes('from "./modules/relatorio-servico"')
  ) {
    ok('NonatoMainApp importa app/modules/relatorio-servico')
  } else {
    fail('NonatoMainApp não importa o módulo relatorio-servico')
  }
  if (
    !nma.includes('const calcularDuracao =') &&
    !nma.includes('const atualizarCalculosDia =') &&
    nma.includes('calcularTotais')
  ) {
    ok('NonatoMainApp usa cálculos do módulo relatorio-servico')
  } else {
    fail('NonatoMainApp ainda define calcularDuracao/atualizarCalculosDia localmente')
  }
  if (
    !nma.includes('function normalizePdfModeloPorRelatorioMap(') &&
    !nma.includes('const RELATORIO_SERVICO_PDF_MODELOS = new Set(') &&
    nma.includes('resolvePdfModeloForRelatorio')
  ) {
    ok('NonatoMainApp usa pdfModelo do módulo relatorio-servico')
  } else {
    fail('NonatoMainApp ainda define pdfModelo localmente')
  }
} catch (e) {
  fail(`módulo relatorio-servico: ${e.message}`)
}

// 3k) Módulo agenda (11.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/agenda/index.ts'), 'utf8')
  if (
    idx.includes('normalizeTipoAgendamento') &&
    idx.includes('getDatasPeriodoAgendamento') &&
    idx.includes('resolverEquipamentoAgendamentoParaExibicao') &&
    idx.includes('renderBlocoEquipamentoAgendamentoEstadoVisual')
  ) {
    ok('módulo agenda exporta normalize/datas/clienteEquipamento/estadoVisual')
  } else {
    fail('módulo agenda incompleto (index.ts)')
  }
  if (!exists('app/modules/agenda/estadoVisual.tsx')) {
    fail('falta app/modules/agenda/estadoVisual.tsx')
  } else {
    ok('existe app/modules/agenda/estadoVisual.tsx')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/agenda'") || nma.includes('from "./modules/agenda"')) {
    ok('NonatoMainApp importa app/modules/agenda')
  } else {
    fail('NonatoMainApp não importa o módulo agenda')
  }
  if (
    !nma.includes('function renderBlocoEquipamentoAgendamentoEstadoVisual(') &&
    !nma.includes('function renderBlocoAssuntoPessoalEstadoVisual(')
  ) {
    ok('NonatoMainApp usa blocos estado visual do módulo agenda')
  } else {
    fail('NonatoMainApp ainda define renderBloco*EstadoVisual localmente')
  }
} catch (e) {
  fail(`módulo agenda: ${e.message}`)
}

// 3l) Módulo sidebar (13.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/sidebar/index.ts'), 'utf8')
  if (
    idx.includes('normalizeSidebarButtons') &&
    (idx.includes('getTabTitleForBundle') || idx.includes('getDefaultSidebarGroup'))
  ) {
    ok('módulo sidebar exporta normalize/hub')
  } else {
    fail('módulo sidebar incompleto (index.ts)')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/sidebar'") || nma.includes('from "./modules/sidebar"')) {
    ok('NonatoMainApp importa app/modules/sidebar')
  } else {
    fail('NonatoMainApp não importa o módulo sidebar')
  }
} catch (e) {
  fail(`módulo sidebar: ${e.message}`)
}

// 3m) Módulo diario (14.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/diario/index.ts'), 'utf8')
  if (
    idx.includes('normalizeDiarioAnexos') &&
    idx.includes('diarioPedidoTituloECorpo') &&
    idx.includes('DIARIO_PEDIDOS_DIA_STORAGE_KEY')
  ) {
    ok('módulo diario exporta tipos/anexos/texto')
  } else {
    fail('módulo diario incompleto (index.ts)')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/diario'") || nma.includes('from "./modules/diario"')) {
    ok('NonatoMainApp importa app/modules/diario')
  } else {
    fail('NonatoMainApp não importa o módulo diario')
  }
} catch (e) {
  fail(`módulo diario: ${e.message}`)
}

// 3n) Módulo protocolo (16.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/protocolo/index.ts'), 'utf8')
  if (
    idx.includes('ensureProtocoloBlocosIds') &&
    idx.includes('newProtocoloBlocoId') &&
    idx.includes('ProtocoloBloco')
  ) {
    ok('módulo protocolo exporta tipos/blocos')
  } else {
    fail('módulo protocolo incompleto (index.ts)')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/protocolo'") || nma.includes('from "./modules/protocolo"')) {
    ok('NonatoMainApp importa app/modules/protocolo')
  } else {
    fail('NonatoMainApp não importa o módulo protocolo')
  }
  const intel = fs.readFileSync(path.join(root, 'app/lib/protocoloInteligente.ts'), 'utf8')
  if (intel.includes("from '../modules/protocolo'") || intel.includes('from "../modules/protocolo"')) {
    ok('protocoloInteligente usa app/modules/protocolo')
  } else {
    fail('protocoloInteligente não importa o módulo protocolo')
  }
} catch (e) {
  fail(`módulo protocolo: ${e.message}`)
}

// 3o) Módulo checklist (19.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/checklist/index.ts'), 'utf8')
  if (
    idx.includes('buildChecklistGeradoRecord') &&
    idx.includes('buildManutencoesDoGrupo') &&
    idx.includes('mapManutencaoParaFormulario') &&
    idx.includes('GrupoChecklist')
  ) {
    ok('módulo checklist exporta tipos/gerar mappers')
  } else {
    fail('módulo checklist incompleto (index.ts)')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/checklist'") || nma.includes('from "./modules/checklist"')) {
    ok('NonatoMainApp importa app/modules/checklist')
  } else {
    fail('NonatoMainApp não importa o módulo checklist')
  }
  if (
    nma.includes('buildChecklistGeradoRecord') &&
    nma.includes('buildPecasArmazemFromChecklist') &&
    !nma.includes('type GrupoChecklist = {')
  ) {
    ok('NonatoMainApp usa mappers do checklist (sem typedef local GrupoChecklist)')
  } else {
    fail('NonatoMainApp não usa mappers do checklist / ainda tem typedef local')
  }
  const libTypes = fs.readFileSync(path.join(root, 'app/lib/checklistTypes.ts'), 'utf8')
  if (libTypes.includes("from '../modules/checklist'") || libTypes.includes('from "../modules/checklist"')) {
    ok('lib/checklistTypes re-exporta app/modules/checklist')
  } else {
    fail('lib/checklistTypes não re-exporta o módulo checklist')
  }
} catch (e) {
  fail(`módulo checklist: ${e.message}`)
}

// 3p) Módulo contabilidade (20.º corte modularização — print/HTML)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/contabilidade/index.ts'), 'utf8')
  if (
    (idx.includes('buildHtmlClienteDadosContabilidade') &&
      idx.includes('buildHtmlFechamentoContabilidade')) ||
    (idx.includes('CONTAB_PRINT_WINDOW_STYLES') && idx.includes('construirTextoPlanoClienteDadosContabilidade'))
  ) {
    ok('módulo contabilidade exporta print/HTML builders')
  } else {
    fail('módulo contabilidade incompleto (index.ts)')
  }
  if (
    idx.includes('CONTAB_PRINT_WINDOW_STYLES') &&
    idx.includes('construirTextoPlanoClienteDadosContabilidade') &&
    idx.includes('mailtoPrefixContabilidade')
  ) {
    ok('módulo contabilidade exporta estilos/texto/mailto')
  } else {
    fail('módulo contabilidade sem CONTAB_PRINT_WINDOW_STYLES / construirTextoPlano / mailto')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/contabilidade'") || nma.includes('from "./modules/contabilidade"')) {
    ok('NonatoMainApp importa app/modules/contabilidade')
  } else {
    fail('NonatoMainApp não importa o módulo contabilidade')
  }
  if (
    nma.includes('buildHtmlClienteDadosContabilidade') &&
    nma.includes('buildHtmlFechamentoContabilidade') &&
    !nma.includes('const CONTAB_PRINT_WINDOW_STYLES =')
  ) {
    ok('NonatoMainApp usa builders contabilidade (sem CONTAB_PRINT_WINDOW_STYLES local)')
  } else {
    fail('NonatoMainApp não usa builders / ainda tem CONTAB_PRINT_WINDOW_STYLES local')
  }
} catch (e) {
  fail(`módulo contabilidade: ${e.message}`)
}

// 3z) Módulo sst (28.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/sst/index.ts'), 'utf8')
  if (
    idx.includes('emptySolicitacaoServicoTecnicoFormState') &&
    idx.includes('enriquecerSolicitacaoComClienteCadastrado') &&
    idx.includes('mergeClienteSelecionadoSst') &&
    idx.includes('patchEquipamentoClienteChave') &&
    idx.includes('buildSolicitacaoBody') &&
    idx.includes('buildSolicitacaoPrintPayload') &&
    idx.includes('formatDataSstLista')
  ) {
    ok('módulo sst exporta tipos/form/mappers/envio/print')
  } else {
    fail('módulo sst incompleto (index.ts)')
  }
  ;['tipos.ts', 'formState.ts', 'clienteMappers.ts', 'rotulos.ts', 'envioTexto.ts', 'printPayload.ts'].forEach((f) => {
    if (exists(`app/modules/sst/${f}`)) ok(`existe app/modules/sst/${f}`)
    else fail(`falta app/modules/sst/${f}`)
  })
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/sst'") || nma.includes('from "./modules/sst"')) {
    ok('NonatoMainApp importa app/modules/sst')
  } else {
    fail('NonatoMainApp não importa o módulo sst')
  }
  if (
    !nma.includes('type SolicitacaoServicoTecnico = {') &&
    !nma.includes('const emptySolicitacaoServicoTecnicoFormState =') &&
    !nma.includes('const buildSolicitacaoBody = (s: SolicitacaoServicoTecnico)') &&
    !nma.includes('const fmtDataSst = (iso?: string)')
  ) {
    ok('NonatoMainApp usa SST tipos/form/envio/print do módulo')
  } else {
    fail('NonatoMainApp ainda define SST localmente (tipos/form/envio/print)')
  }
} catch (e) {
  fail(`módulo sst: ${e.message}`)
}

// 3aa) Módulo pdf (34.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/pdf/index.ts'), 'utf8')
  if (
    idx.includes('getLogoHtmlForSituation') &&
    idx.includes('getLogoHtmlForReport') &&
    idx.includes('resolvePdfLogoHtmlBySelectedId')
  ) {
    ok('módulo pdf exporta logos')
  } else {
    fail('módulo pdf incompleto (index.ts)')
  }
  if (!exists('app/modules/pdf/logos.ts')) {
    fail('falta app/modules/pdf/logos.ts')
  } else {
    ok('existe app/modules/pdf/logos.ts')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/pdf'") || nma.includes('from "./modules/pdf"')) {
    ok('NonatoMainApp importa app/modules/pdf')
  } else {
    fail('NonatoMainApp não importa o módulo pdf')
  }
  if (
    !nma.includes('const logoImgHtmlFromDataUrl =') &&
    !nma.includes('const resolveLogoPrincipalDataUrl =') &&
    nma.includes('pdfLogoResolveCtx')
  ) {
    ok('NonatoMainApp usa logos do módulo pdf')
  } else {
    fail('NonatoMainApp ainda define resolução de logos PDF localmente')
  }
} catch (e) {
  fail(`módulo pdf: ${e.message}`)
}

// 3ab) Módulo admin (36.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/admin/index.ts'), 'utf8')
  if (idx.includes('createEmptyUserForm') && idx.includes('userToFormState')) {
    ok('módulo admin exporta userForm')
  } else {
    fail('módulo admin incompleto (index.ts)')
  }
  if (!exists('app/modules/admin/userForm.ts')) {
    fail('falta app/modules/admin/userForm.ts')
  } else {
    ok('existe app/modules/admin/userForm.ts')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/admin'") || nma.includes('from "./modules/admin"')) {
    ok('NonatoMainApp importa app/modules/admin')
  } else {
    fail('NonatoMainApp não importa o módulo admin')
  }
  if (
    !nma.includes('const createEmptyUserForm = (): UserFormState') &&
    !nma.includes('const userToFormState = (user: User') &&
    !nma.includes('type UserFormState = {')
  ) {
    ok('NonatoMainApp usa userForm do módulo admin')
  } else {
    fail('NonatoMainApp ainda define createEmptyUserForm/userToFormState/UserFormState localmente')
  }
} catch (e) {
  fail(`módulo admin: ${e.message}`)
}

// 4) i18n
const i18n = spawnSync('node', ['scripts/check-i18n-keys.mjs'], {
  cwd: root,
  encoding: 'utf8',
  shell: true,
})
if (i18n.status === 0) ok('i18n:check — chaves alinhadas')
else fail(`i18n:check falhou\n${i18n.stdout || ''}${i18n.stderr || ''}`)

console.log('')
if (failed > 0) {
  console.error(`[smoke:critico] FALHOU — ${failed} problema(s). Não publique até corrigir.\n`)
  process.exit(1)
}
console.log('[smoke:critico] OK — pode seguir para teste manual curto (Admin → Checklist de confiança).\n')
process.exit(0)
