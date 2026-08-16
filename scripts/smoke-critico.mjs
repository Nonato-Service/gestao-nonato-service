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
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/fechamento'") || nma.includes('from "./modules/fechamento"')) {
    ok('NonatoMainApp importa app/modules/fechamento')
  } else {
    fail('NonatoMainApp não importa o módulo fechamento')
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

// 3d) Módulo financeiro (3.º corte + 11.º: período/IVA)
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

// 3f) Módulo biblioteca (5.º corte modularização)
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
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/biblioteca'") || nma.includes('from "./modules/biblioteca"')) {
    ok('NonatoMainApp importa app/modules/biblioteca')
  } else {
    fail('NonatoMainApp não importa o módulo biblioteca')
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
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (
    nma.includes("from './modules/relatorio-servico'") ||
    nma.includes('from "./modules/relatorio-servico"')
  ) {
    ok('NonatoMainApp importa app/modules/relatorio-servico')
  } else {
    fail('NonatoMainApp não importa o módulo relatorio-servico')
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
    idx.includes('resolverEquipamentoAgendamentoParaExibicao')
  ) {
    ok('módulo agenda exporta normalize/datas/clienteEquipamento')
  } else {
    fail('módulo agenda incompleto (index.ts)')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/agenda'") || nma.includes('from "./modules/agenda"')) {
    ok('NonatoMainApp importa app/modules/agenda')
  } else {
    fail('NonatoMainApp não importa o módulo agenda')
  }
} catch (e) {
  fail(`módulo agenda: ${e.message}`)
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
