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
  'app/modules/desmontados/index.ts',
  'app/modules/idiomas/index.ts',
  'app/modules/pessoas/index.ts',
  'app/modules/manuais/index.ts',
  'app/modules/ficha-cadastral/index.ts',
  'app/modules/tradutor/index.ts',
  'app/modules/conhecimento-tecnico/index.ts',
  'app/modules/demo/index.ts',
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
  if (
    idx.includes('pecaBibliotecaSrcImagemDisplay') &&
    idx.includes('pecaPassaBuscaBibliotecaTexto') &&
    idx.includes('BIBLIOTECA_FILTRO_SEM_CATEGORIA')
  ) {
    ok('módulo biblioteca exporta display/busca UI')
  } else {
    fail('módulo biblioteca sem display (pecaBibliotecaSrc* / pecaPassaBusca)')
  }
  if (!exists('app/modules/biblioteca/display.ts')) {
    fail('falta app/modules/biblioteca/display.ts')
  } else {
    ok('existe app/modules/biblioteca/display.ts')
  }
  if (
    !nma.includes('function pecaBibliotecaSrcImagemDisplay(') &&
    !nma.includes('function pecaPassaBuscaBibliotecaTexto(') &&
    !nma.includes("const BIBLIOTECA_FILTRO_SEM_CATEGORIA = '__sem_categoria__'") &&
    nma.includes('pecaBibliotecaSrcCapaDisplay')
  ) {
    ok('NonatoMainApp usa display da biblioteca do módulo')
  } else {
    fail('NonatoMainApp ainda define display/busca biblioteca localmente')
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
    idx.includes('buildFolhaSemanalContadorHtml') &&
    idx.includes('mesCompetenciaKey') &&
    idx.includes('agruparComprovantesPorData') &&
    idx.includes('buildMensagemEnvioComprovantes')
  ) {
    ok('módulo comprovantes exporta parser/duplicados/folha/periodo/envio')
  } else {
    fail('módulo comprovantes incompleto (index.ts)')
  }
  ;['periodo.ts', 'envioMensagem.ts'].forEach((f) => {
    if (exists(`app/modules/comprovantes/${f}`)) ok(`existe app/modules/comprovantes/${f}`)
    else fail(`falta app/modules/comprovantes/${f}`)
  })
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/comprovantes'") || nma.includes('from "./modules/comprovantes"')) {
    ok('NonatoMainApp importa app/modules/comprovantes')
  } else {
    fail('NonatoMainApp não importa o módulo comprovantes')
  }
  if (
    !nma.includes('const getWeekKey = (dateStr: string)') &&
    !nma.includes('const mesCompetenciaKey = (c: ComprovanteDespesa)') &&
    !nma.includes('const filtradosPorData = (() => {')
  ) {
    ok('NonatoMainApp usa periodo do módulo comprovantes')
  } else {
    fail('NonatoMainApp ainda define periodo/agrupar comprovantes localmente')
  }
  if (
    !nma.includes('NONATO SERVICE\\nRelatório de Comprovantes') &&
    nma.includes('buildMensagemEnvioComprovantes')
  ) {
    ok('NonatoMainApp usa envioMensagem do módulo comprovantes')
  } else {
    fail('NonatoMainApp ainda define templates de envio comprovantes localmente')
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
    idx.includes('enriquecerBlocoEquipamentoPedido') &&
    idx.includes('createEmptyEquipamentoForm') &&
    idx.includes('equipamentoToFormState')
  ) {
    ok('módulo equipamentos exporta relatório/etiquetas/formState')
  } else {
    fail('módulo equipamentos incompleto (index.ts)')
  }
  if (!exists('app/modules/equipamentos/formState.ts')) {
    fail('falta app/modules/equipamentos/formState.ts')
  } else {
    ok('existe app/modules/equipamentos/formState.ts')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/equipamentos'") || nma.includes('from "./modules/equipamentos"')) {
    ok('NonatoMainApp importa app/modules/equipamentos')
  } else {
    fail('NonatoMainApp não importa o módulo equipamentos')
  }
  if (
    !nma.includes('type Equipamento = {') &&
    !nma.includes('type PartEquipamento = {') &&
    !nma.includes('const equipamentoToFormState = (equipamento: Equipamento)') &&
    !nma.includes('function equipamentoClienteIdETecnicoGerado(') &&
    !nma.includes('equipamentoClienteIdETecnicoGerado(') &&
    !nma.includes('idEquipamentoVisivelParaProtocolo(') &&
    nma.includes('createEmptyEquipamentoForm')
  ) {
    ok('NonatoMainApp usa formState/aliases do módulo equipamentos')
  } else {
    fail('NonatoMainApp ainda define Equipamento/formState/aliases localmente')
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
    idx.includes('renderBlocoEquipamentoAgendamentoEstadoVisual') &&
    idx.includes('filterAgendamentosLembrete') &&
    idx.includes('buildMensagemLembreteAgenda')
  ) {
    ok('módulo agenda exporta normalize/datas/clienteEquipamento/estadoVisual/lembreteWA')
  } else {
    fail('módulo agenda incompleto (index.ts)')
  }
  if (!exists('app/modules/agenda/estadoVisual.tsx')) {
    fail('falta app/modules/agenda/estadoVisual.tsx')
  } else {
    ok('existe app/modules/agenda/estadoVisual.tsx')
  }
  if (!exists('app/modules/agenda/lembreteWhatsApp.ts')) {
    fail('falta app/modules/agenda/lembreteWhatsApp.ts')
  } else {
    ok('existe app/modules/agenda/lembreteWhatsApp.ts')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/agenda'") || nma.includes('from "./modules/agenda"')) {
    ok('NonatoMainApp importa app/modules/agenda')
  } else {
    fail('NonatoMainApp não importa o módulo agenda')
  }
  if (
    !nma.includes('function renderBlocoEquipamentoAgendamentoEstadoVisual(') &&
    !nma.includes('function renderBlocoAssuntoPessoalEstadoVisual(') &&
    !nma.includes('const formatTelefoneWhatsApp = (telefone: string)') &&
    !nma.includes('Lembrete Nonato Service:')
  ) {
    ok('NonatoMainApp usa blocos estado visual / lembreteWA do módulo agenda')
  } else {
    fail('NonatoMainApp ainda define renderBloco*EstadoVisual ou lembreteWA localmente')
  }
} catch (e) {
  fail(`módulo agenda: ${e.message}`)
}

// 3l) Módulo sidebar (13.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/sidebar/index.ts'), 'utf8')
  if (
    idx.includes('normalizeSidebarButtons') &&
    (idx.includes('getTabTitleForBundle') || idx.includes('getDefaultSidebarGroup')) &&
    idx.includes('getTabModuleIntroText') &&
    idx.includes('getBottomTabAccentClass') &&
    idx.includes('getHelpContent') &&
    idx.includes('getSidebarGroupLabel') &&
    idx.includes('formatNavBackToHub')
  ) {
    ok('módulo sidebar exporta normalize/hub/tabIntro/hubLabels')
  } else {
    fail('módulo sidebar incompleto (index.ts)')
  }
  if (!exists('app/modules/sidebar/tabIntro.ts')) {
    fail('falta app/modules/sidebar/tabIntro.ts')
  } else {
    ok('existe app/modules/sidebar/tabIntro.ts')
  }
  if (!exists('app/modules/sidebar/hubLabels.ts')) {
    fail('falta app/modules/sidebar/hubLabels.ts')
  } else {
    ok('existe app/modules/sidebar/hubLabels.ts')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/sidebar'") || nma.includes('from "./modules/sidebar"')) {
    ok('NonatoMainApp importa app/modules/sidebar')
  } else {
    fail('NonatoMainApp não importa o módulo sidebar')
  }
  if (
    !nma.includes('mainModuleIntroFallback') &&
    !nma.includes('bottom-tab-item--accent-finance') &&
    nma.includes('getTabModuleIntroTextFromModule') &&
    nma.includes('getSidebarGroupLabelFromModule') &&
    !nma.includes("return safeT?.gestaoTecnicaTitle || 'GESTÃO TÉCNICA'")
  ) {
    ok('NonatoMainApp usa tabIntro/hubLabels do módulo sidebar')
  } else {
    fail('NonatoMainApp ainda define tabIntro/hubLabels localmente')
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
    idx.includes('DIARIO_PEDIDOS_DIA_STORAGE_KEY') &&
    idx.includes('compressImageFileToJpegDataUrl')
  ) {
    ok('módulo diario exporta tipos/anexos/texto/compressImage')
  } else {
    fail('módulo diario incompleto (index.ts)')
  }
  if (!exists('app/modules/diario/compressImage.ts')) {
    fail('falta app/modules/diario/compressImage.ts')
  } else {
    ok('existe app/modules/diario/compressImage.ts')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/diario'") || nma.includes('from "./modules/diario"')) {
    ok('NonatoMainApp importa app/modules/diario')
  } else {
    fail('NonatoMainApp não importa o módulo diario')
  }
  if (!nma.includes('async function compressImageFileToJpegDataUrl(')) {
    ok('NonatoMainApp usa compressImage do módulo diario')
  } else {
    fail('NonatoMainApp ainda define compressImageFileToJpegDataUrl localmente')
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

// 3ab) Módulo admin (36.º corte modularização + 46.º passwords)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/admin/index.ts'), 'utf8')
  if (idx.includes('createEmptyUserForm') && idx.includes('userToFormState')) {
    ok('módulo admin exporta userForm')
  } else {
    fail('módulo admin incompleto (index.ts)')
  }
  if (idx.includes('generatePassword') && idx.includes('PasswordEntry')) {
    ok('módulo admin exporta passwords')
  } else {
    fail('módulo admin incompleto (passwords no index.ts)')
  }
  if (
    idx.includes('LogoRelatorio') &&
    idx.includes('parseLogosRelatoriosArr') &&
    idx.includes('preferRicherLogosRelatorios')
  ) {
    ok('módulo admin exporta logosRelatorio')
  } else {
    fail('módulo admin incompleto (logosRelatorio no index.ts)')
  }
  if (!exists('app/modules/admin/userForm.ts')) {
    fail('falta app/modules/admin/userForm.ts')
  } else {
    ok('existe app/modules/admin/userForm.ts')
  }
  if (!exists('app/modules/admin/passwords.ts')) {
    fail('falta app/modules/admin/passwords.ts')
  } else {
    ok('existe app/modules/admin/passwords.ts')
  }
  if (!exists('app/modules/admin/logosRelatorio.ts')) {
    fail('falta app/modules/admin/logosRelatorio.ts')
  } else {
    ok('existe app/modules/admin/logosRelatorio.ts')
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
  if (
    !nma.includes('type PasswordEntry = {') &&
    !nma.includes('const generatePassword = (length') &&
    nma.includes('generatePassword')
  ) {
    ok('NonatoMainApp usa passwords do módulo admin')
  } else {
    fail('NonatoMainApp ainda define PasswordEntry/generatePassword localmente')
  }
  if (
    !nma.includes('type LogoRelatorio = {') &&
    !nma.includes('const parseLogosRelatoriosArr = (raw') &&
    nma.includes('parseLogosRelatoriosArr') &&
    nma.includes('preferRicherLogosRelatorios')
  ) {
    ok('NonatoMainApp usa logosRelatorio do módulo admin')
  } else {
    fail('NonatoMainApp ainda define LogoRelatorio/parseLogosRelatoriosArr localmente')
  }
  const adminTypes = fs.readFileSync(path.join(root, 'app/components/admin/adminTypes.ts'), 'utf8')
  if (
    adminTypes.includes("from '../../modules/admin/logosRelatorio'") ||
    adminTypes.includes('from "../../modules/admin/logosRelatorio"')
  ) {
    ok('adminTypes re-exporta LogoRelatorio do módulo admin')
  } else {
    fail('adminTypes não re-exporta LogoRelatorio do módulo admin')
  }
} catch (e) {
  fail(`módulo admin: ${e.message}`)
}

// 3ac) Módulo desmontados (45.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/desmontados/index.ts'), 'utf8')
  if (
    idx.includes('createEmptyGrupoDesmontadoForm') &&
    idx.includes('pecaDesmontadaToFormState') &&
    idx.includes('migrateGruposDesmontadosList')
  ) {
    ok('módulo desmontados exporta form/migrate')
  } else {
    fail('módulo desmontados incompleto (index.ts)')
  }
  ;['tipos.ts', 'formState.ts', 'migrate.ts'].forEach((f) => {
    if (exists(`app/modules/desmontados/${f}`)) ok(`existe app/modules/desmontados/${f}`)
    else fail(`falta app/modules/desmontados/${f}`)
  })
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/desmontados'") || nma.includes('from "./modules/desmontados"')) {
    ok('NonatoMainApp importa app/modules/desmontados')
  } else {
    fail('NonatoMainApp não importa o módulo desmontados')
  }
  if (
    !nma.includes('type GrupoDesmontado = {') &&
    !nma.includes('type PecaDesmontada = {') &&
    nma.includes('createEmptyGrupoDesmontadoForm') &&
    nma.includes('migrateGruposDesmontadosList')
  ) {
    ok('NonatoMainApp usa desmontados do módulo')
  } else {
    fail('NonatoMainApp ainda define tipos/form Desmontados localmente')
  }
} catch (e) {
  fail(`módulo desmontados: ${e.message}`)
}

// 3ad) Módulo idiomas (47.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/idiomas/index.ts'), 'utf8')
  if (idx.includes('getLanguages') && idx.includes('Language')) {
    ok('módulo idiomas exporta getLanguages/Language')
  } else {
    fail('módulo idiomas incompleto (index.ts)')
  }
  if (!exists('app/modules/idiomas/languages.ts')) {
    fail('falta app/modules/idiomas/languages.ts')
  } else {
    ok('existe app/modules/idiomas/languages.ts')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/idiomas'") || nma.includes('from "./modules/idiomas"')) {
    ok('NonatoMainApp importa app/modules/idiomas')
  } else {
    fail('NonatoMainApp não importa o módulo idiomas')
  }
  if (
    !nma.includes('type Language = {') &&
    !nma.includes('const getLanguages = (t:') &&
    nma.includes('getLanguages')
  ) {
    ok('NonatoMainApp usa getLanguages do módulo idiomas')
  } else {
    fail('NonatoMainApp ainda define Language/getLanguages localmente')
  }
} catch (e) {
  fail(`módulo idiomas: ${e.message}`)
}

// 3ae) Módulo pessoas (48.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/pessoas/index.ts'), 'utf8')
  if (
    idx.includes('getGestorClasse') &&
    idx.includes('getTecnicoClasse') &&
    idx.includes('emptyGestorForm') &&
    idx.includes('Gestor')
  ) {
    ok('módulo pessoas exporta tipos/form/classes')
  } else {
    fail('módulo pessoas incompleto (index.ts)')
  }
  ;['tipos.ts', 'formState.ts', 'classes.ts'].forEach((f) => {
    if (exists(`app/modules/pessoas/${f}`)) ok(`existe app/modules/pessoas/${f}`)
    else fail(`falta app/modules/pessoas/${f}`)
  })
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/pessoas'") || nma.includes('from "./modules/pessoas"')) {
    ok('NonatoMainApp importa app/modules/pessoas')
  } else {
    fail('NonatoMainApp não importa o módulo pessoas')
  }
  if (
    !nma.includes('type TipoGestor = {') &&
    !nma.includes('type Gestor = {') &&
    !nma.includes('type Tecnico = {') &&
    !nma.includes('const getGestorClasse = ') &&
    nma.includes('getGestorClasse') &&
    nma.includes('getTecnicoTipo')
  ) {
    ok('NonatoMainApp usa pessoas do módulo')
  } else {
    fail('NonatoMainApp ainda define tipos/classes Gestor/Tecnico localmente')
  }
  const libTypes = fs.readFileSync(path.join(root, 'app/lib/pessoaTypes.ts'), 'utf8')
  if (libTypes.includes("from '../modules/pessoas'") || libTypes.includes('from "../modules/pessoas"')) {
    ok('lib/pessoaTypes re-exporta app/modules/pessoas')
  } else {
    fail('lib/pessoaTypes não re-exporta o módulo pessoas')
  }
} catch (e) {
  fail(`módulo pessoas: ${e.message}`)
}

// 3af) Módulo manuais (49.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/manuais/index.ts'), 'utf8')
  if (idx.includes('ManuaisGrupo') && idx.includes('ManuaisModelo') && idx.includes('EquipamentoManuaisRef')) {
    ok('módulo manuais exporta tipos')
  } else {
    fail('módulo manuais incompleto (index.ts)')
  }
  if (!exists('app/modules/manuais/tipos.ts')) {
    fail('falta app/modules/manuais/tipos.ts')
  } else {
    ok('existe app/modules/manuais/tipos.ts')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/manuais'") || nma.includes('from "./modules/manuais"')) {
    ok('NonatoMainApp importa app/modules/manuais')
  } else {
    fail('NonatoMainApp não importa o módulo manuais')
  }
  if (
    !nma.includes('type ManuaisGrupo = {') &&
    !nma.includes('type ManuaisModelo = {') &&
    nma.includes('ManuaisGrupo') &&
    nma.includes('ManuaisModelo')
  ) {
    ok('NonatoMainApp usa tipos manuais do módulo')
  } else {
    fail('NonatoMainApp ainda define ManuaisGrupo/ManuaisModelo localmente')
  }
  const libTypes = fs.readFileSync(path.join(root, 'app/lib/manuaisTypes.ts'), 'utf8')
  if (libTypes.includes("from '../modules/manuais'") || libTypes.includes('from "../modules/manuais"')) {
    ok('lib/manuaisTypes re-exporta app/modules/manuais')
  } else {
    fail('lib/manuaisTypes não re-exporta o módulo manuais')
  }
} catch (e) {
  fail(`módulo manuais: ${e.message}`)
}

// 3ag) Módulo ficha-cadastral (50.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/ficha-cadastral/index.ts'), 'utf8')
  if (
    idx.includes('FichaCadastral') &&
    idx.includes('emptyFichaCadastral') &&
    idx.includes('normalizeFichaCadastral')
  ) {
    ok('módulo ficha-cadastral exporta tipos/helpers')
  } else {
    fail('módulo ficha-cadastral incompleto (index.ts)')
  }
  for (const f of ['tipos.ts', 'formState.ts']) {
    if (exists(`app/modules/ficha-cadastral/${f}`)) ok(`existe app/modules/ficha-cadastral/${f}`)
    else fail(`falta app/modules/ficha-cadastral/${f}`)
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/ficha-cadastral'") || nma.includes('from "./modules/ficha-cadastral"')) {
    ok('NonatoMainApp importa app/modules/ficha-cadastral')
  } else {
    fail('NonatoMainApp não importa o módulo ficha-cadastral')
  }
  if (
    !nma.includes('type FichaCadastral = {') &&
    !nma.includes('type FichaCadastralBancaria = {') &&
    nma.includes('FichaCadastral') &&
    nma.includes('emptyFichaCadastral') &&
    nma.includes('normalizeFichaCadastral')
  ) {
    ok('NonatoMainApp usa ficha-cadastral do módulo')
  } else {
    fail('NonatoMainApp ainda define FichaCadastral localmente ou não usa helpers')
  }
  const libTypes = fs.readFileSync(path.join(root, 'app/lib/fichaCadastralTypes.ts'), 'utf8')
  if (libTypes.includes("from '../modules/ficha-cadastral'") || libTypes.includes('from "../modules/ficha-cadastral"')) {
    ok('lib/fichaCadastralTypes re-exporta app/modules/ficha-cadastral')
  } else {
    fail('lib/fichaCadastralTypes não re-exporta o módulo ficha-cadastral')
  }
} catch (e) {
  fail(`módulo ficha-cadastral: ${e.message}`)
}

// 3ah) Módulo tradutor (51.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/tradutor/index.ts'), 'utf8')
  if (
    idx.includes('TranslatorLibraryEntry') &&
    idx.includes('normalizeTranslatorLibrary') &&
    idx.includes('filterLibraryByLangPair') &&
    idx.includes('findLibraryMatch') &&
    idx.includes('libraryEntryExists') &&
    idx.includes('createTranslatorLibraryEntry')
  ) {
    ok('módulo tradutor exporta tipos/helpers')
  } else {
    fail('módulo tradutor incompleto (index.ts)')
  }
  for (const f of ['tipos.ts', 'library.ts']) {
    if (exists(`app/modules/tradutor/${f}`)) ok(`existe app/modules/tradutor/${f}`)
    else fail(`falta app/modules/tradutor/${f}`)
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/tradutor'") || nma.includes('from "./modules/tradutor"')) {
    ok('NonatoMainApp importa app/modules/tradutor')
  } else {
    fail('NonatoMainApp não importa o módulo tradutor')
  }
  if (
    !nma.includes('type TranslatorLibraryEntry = {') &&
    nma.includes('TranslatorLibraryEntry') &&
    nma.includes('normalizeTranslatorLibrary') &&
    nma.includes('filterLibraryByLangPair') &&
    nma.includes('findLibraryMatch') &&
    nma.includes('libraryEntryExists') &&
    nma.includes('createTranslatorLibraryEntry')
  ) {
    ok('NonatoMainApp usa tradutor do módulo')
  } else {
    fail('NonatoMainApp ainda define TranslatorLibraryEntry localmente ou não usa helpers')
  }
  const libTypes = fs.readFileSync(path.join(root, 'app/lib/translatorLibraryTypes.ts'), 'utf8')
  if (libTypes.includes("from '../modules/tradutor'") || libTypes.includes('from "../modules/tradutor"')) {
    ok('lib/translatorLibraryTypes re-exporta app/modules/tradutor')
  } else {
    fail('lib/translatorLibraryTypes não re-exporta o módulo tradutor')
  }
} catch (e) {
  fail(`módulo tradutor: ${e.message}`)
}

// 3ai) Módulo conhecimento-tecnico (52.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/conhecimento-tecnico/index.ts'), 'utf8')
  if (
    idx.includes('ConhecimentoTecnicoEntry') &&
    idx.includes('normalizeConhecimentoTecnicos') &&
    idx.includes('filterConhecimentoByTecnico') &&
    idx.includes('conhecimentoEntryExists') &&
    idx.includes('createConhecimentoTecnicoEntry') &&
    idx.includes('computeTecnicoStats') &&
    idx.includes('buildTiposEquipamentoOpcoes')
  ) {
    ok('módulo conhecimento-tecnico exporta tipos/helpers')
  } else {
    fail('módulo conhecimento-tecnico incompleto (index.ts)')
  }
  for (const f of ['tipos.ts', 'entries.ts']) {
    if (exists(`app/modules/conhecimento-tecnico/${f}`)) ok(`existe app/modules/conhecimento-tecnico/${f}`)
    else fail(`falta app/modules/conhecimento-tecnico/${f}`)
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (
    nma.includes("from './modules/conhecimento-tecnico'") ||
    nma.includes('from "./modules/conhecimento-tecnico"')
  ) {
    ok('NonatoMainApp importa app/modules/conhecimento-tecnico')
  } else {
    fail('NonatoMainApp não importa o módulo conhecimento-tecnico')
  }
  if (
    !nma.includes('type ConhecimentoTecnicoEntry = {') &&
    nma.includes('ConhecimentoTecnicoEntry') &&
    nma.includes('normalizeConhecimentoTecnicos')
  ) {
    ok('NonatoMainApp usa conhecimento-tecnico do módulo')
  } else {
    fail('NonatoMainApp ainda define ConhecimentoTecnicoEntry localmente ou não usa normalize')
  }
  const content = fs.readFileSync(path.join(root, 'app/components/ConhecimentoTecnicosContent.tsx'), 'utf8')
  if (
    content.includes("from '../modules/conhecimento-tecnico'") ||
    content.includes('from "../modules/conhecimento-tecnico"')
  ) {
    ok('ConhecimentoTecnicosContent importa app/modules/conhecimento-tecnico')
  } else {
    fail('ConhecimentoTecnicosContent não importa o módulo conhecimento-tecnico')
  }
  if (
    !content.includes('export type ConhecimentoTecnicoEntry = {') &&
    content.includes('createConhecimentoTecnicoEntry') &&
    content.includes('computeTecnicoStats') &&
    content.includes('buildTiposEquipamentoOpcoes')
  ) {
    ok('ConhecimentoTecnicosContent usa helpers do módulo')
  } else {
    fail('ConhecimentoTecnicosContent ainda define o tipo localmente ou não usa helpers')
  }
  const libTypes = fs.readFileSync(path.join(root, 'app/lib/conhecimentoTecnicoTypes.ts'), 'utf8')
  if (
    libTypes.includes("from '../modules/conhecimento-tecnico'") ||
    libTypes.includes('from "../modules/conhecimento-tecnico"')
  ) {
    ok('lib/conhecimentoTecnicoTypes re-exporta app/modules/conhecimento-tecnico')
  } else {
    fail('lib/conhecimentoTecnicoTypes não re-exporta o módulo conhecimento-tecnico')
  }
} catch (e) {
  fail(`módulo conhecimento-tecnico: ${e.message}`)
}

// 3ak) Módulo demo (54.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/demo/index.ts'), 'utf8')
  if (
    idx.includes('DemoModuleMode') &&
    idx.includes('pickValidDemoModuleModes') &&
    idx.includes('countActiveModules') &&
    idx.includes('isDemoModuleMode')
  ) {
    ok('módulo demo exporta tipos + modulesMode')
  } else {
    fail('módulo demo incompleto (index.ts)')
  }
  for (const f of ['tipos.ts', 'modulesMode.ts', 'index.ts']) {
    if (exists(`app/modules/demo/${f}`)) ok(`existe app/modules/demo/${f}`)
    else fail(`falta app/modules/demo/${f}`)
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/demo'") || nma.includes('from "./modules/demo"')) {
    ok('NonatoMainApp importa app/modules/demo')
  } else {
    fail('NonatoMainApp não importa o módulo demo')
  }
  if (
    !nma.includes("type DemoModuleMode = 'active'") &&
    !nma.includes('type DemoModuleMode = "active"') &&
    nma.includes('DemoModuleMode')
  ) {
    ok('NonatoMainApp usa DemoModuleMode do módulo demo')
  } else {
    fail('NonatoMainApp ainda define DemoModuleMode localmente')
  }
  const gestao = fs.readFileSync(path.join(root, 'app/components/GestaoDemosContent.tsx'), 'utf8')
  if (
    gestao.includes("from '../modules/demo'") ||
    gestao.includes('from "../modules/demo"')
  ) {
    ok('GestaoDemosContent importa tipos de app/modules/demo')
  } else {
    fail('GestaoDemosContent não importa app/modules/demo')
  }
  const libDemo = fs.readFileSync(path.join(root, 'app/lib/demoManagement.ts'), 'utf8')
  if (
    (libDemo.includes("from '../modules/demo'") || libDemo.includes('from "../modules/demo"')) &&
    !libDemo.includes("export type DemoModuleMode = 'active'") &&
    libDemo.includes('pickValidDemoModuleModes')
  ) {
    ok('lib/demoManagement re-exporta app/modules/demo')
  } else {
    fail('lib/demoManagement não re-exporta o módulo demo / ainda define DemoModuleMode')
  }
} catch (e) {
  fail(`módulo demo: ${e.message}`)
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
