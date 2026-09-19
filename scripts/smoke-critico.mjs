/**
 * Verificação rápida pós-alteração (sem abrir o browser).
 * Uso: npm run smoke:critico
 */
import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

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
  'app/lib/listaUiLote.ts',
  'scripts/runtime-fase4.mjs',
  'app/lib/formatMoney.ts',
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
  'app/modules/fornecedores/index.ts',
  'app/modules/comunicacao/index.ts',
  'app/modules/ordem-preparacao/index.ts',
  'app/modules/pre-check/index.ts',
  'app/modules/pagamentos-contador/index.ts',
  'app/modules/registro-despesas/index.ts',
    'app/modules/ui/index.ts',
    'pwa-version.json',
    'public/sw.js',
    'public/acesso.html',
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

// 2a) Sintaxe do monólito — o Railway falha no webpack se JSX estiver partido
try {
  const ts = require('typescript')
  const src = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  const parsed = ts.transpileModule(src, {
    fileName: 'NonatoMainApp.tsx',
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.Preserve, target: ts.ScriptTarget.ES2020 },
  })
  const syntaxErrs = (parsed.diagnostics || []).filter(
    (d) => d.category === ts.DiagnosticCategory.Error
  )
  if (syntaxErrs.length === 0) {
    ok('NonatoMainApp.tsx sem erro de sintaxe')
  } else {
    const first = syntaxErrs[0]
    let loc = ''
    if (first.file && first.start != null) {
      const p = first.file.getLineAndCharacterOfPosition(first.start)
      loc = `${p.line + 1}:${p.character + 1} `
    }
    fail(`sintaxe NonatoMainApp.tsx: ${loc}${ts.flattenDiagnosticMessageText(first.messageText, ' ')}`)
  }
} catch (e) {
  fail(`parse NonatoMainApp: ${e.message}`)
}

// 2b) Formato monetário único (14.087,50 €) — SoT em financeiro/money
try {
  const money = fs.readFileSync(path.join(root, 'app/modules/financeiro/money.ts'), 'utf8')
  const moneyLib = fs.readFileSync(path.join(root, 'app/lib/formatMoney.ts'), 'utf8')
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  const servicoValor = fs.readFileSync(path.join(root, 'app/modules/fechamento/servicoValor.ts'), 'utf8')
  if (
    money.includes('formatMoneyEUR') &&
    money.includes('formatMoneyNumber') &&
    money.includes('parseMoneyInput') &&
    money.includes("replace(/\\B(?=(\\d{3})+(?!\\d))/g, '.')")
  ) {
    ok('formatMoney: helper com milhar ponto e decimal vírgula')
  } else {
    fail('formatMoney.ts incompleto (esperado 14.087,50)')
  }
  if (
    moneyLib.includes("from '../modules/financeiro/money'") &&
    !moneyLib.includes('export function formatMoneyEUR')
  ) {
    ok('lib/formatMoney só reexporta financeiro/money')
  } else {
    fail('lib/formatMoney ainda implementa formatMoney')
  }
  if (nma.includes("from './modules/financeiro'") && nma.includes('formatMoneyEUR(fechTotIva')) {
    ok('NonatoMainApp usa formatMoneyEUR nos totais de fechamento')
  } else {
    fail('NonatoMainApp sem formatMoneyEUR no fechamento')
  }
  if (
    servicoValor.includes("from '../financeiro/money'") &&
    servicoValor.includes('formatMoneyNumber') &&
    servicoValor.includes('parseMoneyInput')
  ) {
    ok('fechamento/servicoValor usa formatMoney (display ≠ parse)')
  } else {
    fail('servicoValor sem formatMoney')
  }
} catch (e) {
  fail(`formatMoney: ${e.message}`)
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
  if (idx.includes('tipoLinhaFechamentoFixa') && idx.includes('agruparItensFechamentoPorCliente')) {
    ok('módulo fechamento exporta linhas agrupadas por cliente')
  } else {
    fail('módulo fechamento sem tipoLinhaFechamentoFixa / agruparItensFechamentoPorCliente')
  }
  if (
    idx.includes('buildItensFechamentoParaExibirFromSalvos') &&
    idx.includes('filtrarOpcoesServicoLinhaFechamento') &&
    idx.includes('resolverQuantidadeLinhaFechamentoExibir') &&
    idx.includes('htmlGruposFechamentoPdf') &&
    idx.includes('FECHAMENTO_PDF_PRINT_CSS_GRUPOS') &&
    idx.includes('deduplicarOpcoesServicoFechamento')
  ) {
    ok('módulo fechamento exporta exibirItens UI')
  } else {
    fail('módulo fechamento sem buildItensFechamentoParaExibirFromSalvos / filtrarOpcoesServicoLinhaFechamento')
  }
  {
    const exibirItensSrc = fs.readFileSync(path.join(root, 'app/modules/fechamento/exibirItens.ts'), 'utf8')
    if (exibirItensSrc.includes("String(item.grupoKey || '').trim()") && exibirItensSrc.includes('item.quantidade')) {
      ok('fechamento: horas por cliente usam a quantidade actual do relatório')
    } else {
      fail('fechamento ainda pode ficar com horas antigas da Ferwood')
    }
    if (
      exibirItensSrc.includes('deduplicarOpcoesServicoFechamento') &&
      exibirItensSrc.includes('poolOpcoesServicoDoGrupo') &&
      !exibirItensSrc.includes('list.filter(servicoElegivelAnexarManualFechamento)')
    ) {
      ok('fechamento: anexar item usa só o grupo de tarifa sem repetidos')
    } else {
      fail('fechamento ainda mistura cadastros de outros grupos no select de itens')
    }
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
  if (idx.includes('mesclarComprovantesEmItensFechamento')) {
    ok('módulo fechamento exporta comprovantesMerge')
  } else {
    fail('módulo fechamento sem mesclarComprovantesEmItensFechamento')
  }
  if (!exists('app/modules/fechamento/comprovantesMerge.ts')) {
    fail('falta app/modules/fechamento/comprovantesMerge.ts')
  } else {
    ok('existe app/modules/fechamento/comprovantesMerge.ts')
  }
  if (!exists('app/modules/fechamento/persistMaps.ts')) {
    fail('falta app/modules/fechamento/persistMaps.ts')
  } else {
    ok('existe app/modules/fechamento/persistMaps.ts')
  }
  if (
    idx.includes('isServicoCadastroFormValid') &&
    idx.includes('createServicoCadastroFromForm') &&
    idx.includes('updateServicoCadastroFromForm') &&
    idx.includes('servicoCadastroToFormState') &&
    exists('app/modules/fechamento/servicoCadastroTipos.ts') &&
    exists('app/modules/fechamento/servicoCadastroForm.ts') &&
    exists('app/modules/fechamento/servicoCadastroFromForm.ts')
  ) {
    ok('módulo fechamento exporta ServicoCadastro form/fromForm')
  } else {
    fail('módulo fechamento sem ServicoCadastro form/fromForm')
  }
  const libServicos = fs.readFileSync(path.join(root, 'app/lib/servicosCadastroUtils.ts'), 'utf8')
  if (libServicos.includes("from '../modules/fechamento'") && libServicos.includes('ServicoCadastroItem')) {
    ok('servicosCadastroUtils reexporta ServicoCadastroItem do módulo fechamento')
  } else {
    fail('servicosCadastroUtils sem reexport do tipo ServicoCadastroItem')
  }
  const cadastroServicos = fs.readFileSync(path.join(root, 'app/components/CadastroServicosContent.tsx'), 'utf8')
  if (
    idx.includes('TEMPLATE_SERVICOS_PADRAO') &&
    idx.includes('coletarCodigosMatriz') &&
    idx.includes('servicoPorCodNoGrupo') &&
    exists('app/modules/fechamento/servicosPadrao.ts')
  ) {
    ok('módulo fechamento exporta servicosPadrao')
  } else {
    fail('módulo fechamento sem servicosPadrao')
  }
  if (
    libServicos.includes('TEMPLATE_SERVICOS_PADRAO') &&
    !libServicos.includes("cod: 'HTT'") &&
    !libServicos.includes('export function coletarCodigosMatriz')
  ) {
    ok('lib/servicosCadastroUtils só reexporta servicosPadrao')
  } else {
    fail('lib/servicosCadastroUtils ainda implementa o template de serviços')
  }
  if (
    cadastroServicos.includes("from '../modules/fechamento'") &&
    cadastroServicos.includes('coletarCodigosMatriz') &&
    !cadastroServicos.includes("from '../lib/servicosCadastroUtils'")
  ) {
    ok('CadastroServicosContent usa servicosPadrao do módulo fechamento')
  } else {
    fail('CadastroServicosContent ainda importa servicosCadastroUtils do lib')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/fechamento'") || nma.includes('from "./modules/fechamento"')) {
    ok('NonatoMainApp importa app/modules/fechamento')
  } else {
    fail('NonatoMainApp não importa o módulo fechamento')
  }
  if (nma.includes('agruparItensFechamentoPorCliente') && nma.includes('fechamentoAdicionarItemNesteCliente')) {
    ok('NonatoMainApp fecha relatório especial por cliente de trabalho')
  } else {
    fail('NonatoMainApp sem fechamento especial por cliente (agruparItens / extras por bloco)')
  }
  if (
    nma.includes('htmlGruposFechamentoPdf') &&
    !nma.includes('lastGkPdf') &&
    !nma.includes('lastGkBib')
  ) {
    ok('PDF de fechamento junta horas e extras no mesmo cliente')
  } else {
    fail('PDF de fechamento ainda parte o mesmo cliente em blocos separados')
  }
  if (
    nma.includes('setServicoGrupoSelecionadoId(grupoId)') &&
    cadastroServicos.includes('valorInput: servicoValorInput')
  ) {
    ok('cadastro de serviços mostra o grupo do item recém-gravado')
  } else {
    fail('cadastro de serviços não selecciona o grupo após gravar o item')
  }
  if (nma.includes('TEMPLATE_SERVICOS_PADRAO') && !nma.includes("from './lib/servicosCadastroUtils'")) {
    ok('NonatoMainApp usa TEMPLATE_SERVICOS_PADRAO do módulo fechamento')
  } else {
    fail('NonatoMainApp ainda importa servicosCadastroUtils do lib')
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
  if (
    nma.includes('isServicoCadastroFormValid') &&
    nma.includes('createServicoCadastroFromForm') &&
    nma.includes('updateServicoCadastroFromForm') &&
    nma.includes('servicoCadastroToFormState')
  ) {
    ok('NonatoMainApp usa ServicoCadastro fromForm do módulo fechamento')
  } else {
    fail('NonatoMainApp ainda mapeia ServicoCadastro no sítio')
  }
  if (
    idx.includes('isServicoCadastroGrupoNomeValid') &&
    idx.includes('createServicoCadastroGrupoFromForm') &&
    idx.includes('updateServicoCadastroGrupoNomeFromForm') &&
    exists('app/modules/fechamento/grupoFromForm.ts')
  ) {
    ok('módulo fechamento exporta ServicoCadastroGrupo fromForm')
  } else {
    fail('módulo fechamento sem ServicoCadastroGrupo fromForm')
  }
  if (
    nma.includes('isServicoCadastroGrupoNomeValid') &&
    nma.includes('createServicoCadastroGrupoFromForm') &&
    nma.includes('updateServicoCadastroGrupoNomeFromForm')
  ) {
    ok('NonatoMainApp usa ServicoCadastroGrupo fromForm do módulo')
  } else {
    fail('NonatoMainApp ainda mapeia ServicoCadastroGrupo no sítio')
  }
  const grpFromForm = fs.readFileSync(path.join(root, 'app/modules/fechamento/grupoFromForm.ts'), 'utf8')
  const libFechGrp = exists('app/lib/fechamentoGrupoFromForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/fechamentoGrupoFromForm.ts'), 'utf8')
    : ''
  if (
    grpFromForm.includes('nowMs: number') &&
    !grpFromForm.includes('Date.now()') &&
    !grpFromForm.includes('Math.random')
  ) {
    ok('módulo fechamento grupoFromForm é puro (relógio/aleatório injectados)')
  } else {
    fail('módulo fechamento/grupoFromForm ainda usa Date.now ou Math.random')
  }
  if (
    libFechGrp.includes('createServicoCadastroGrupoFromForm as createServicoCadastroGrupoFromFormPure') &&
    nma.includes("from './lib/fechamentoGrupoFromForm'")
  ) {
    ok('NonatoMainApp usa grupo de fechamento fromForm via lib')
  } else {
    fail('lib/fechamentoGrupoFromForm ainda não envolve o grupo fromForm')
  }
  if (idx.includes('CadastroServicoSavePayload')) {
    ok('módulo fechamento exporta CadastroServicoSavePayload')
  } else {
    fail('módulo fechamento sem CadastroServicoSavePayload')
  }
  const cadServ = fs.readFileSync(path.join(root, 'app/components/CadastroServicosContent.tsx'), 'utf8')
  if (
    (cadServ.includes("from '../modules/fechamento'") || cadServ.includes('from "../modules/fechamento"')) &&
    cadServ.includes('ServicoCadastroFormState') &&
    cadServ.includes('emptyServicoCadastroFormState') &&
    !cadServ.includes('type ServicoFormDraft = {') &&
    !cadServ.includes('export type CadastroServicoSavePayload = {')
  ) {
    ok('CadastroServicosContent usa ServicoCadastroFormState do módulo fechamento')
  } else {
    fail('CadastroServicosContent ainda define ServicoFormDraft/payload no sítio')
  }
  if (nma.includes('Partial<CadastroServicoSavePayload>')) {
    ok('NonatoMainApp usa CadastroServicoSavePayload do módulo fechamento')
  } else {
    fail('NonatoMainApp ainda tipa handleSaveServico no sítio')
  }
  if (
    idx.includes('RelatorioCobrancaGrupoMin') &&
    idx.includes('buildRelatorioCobrancaGruposOpcoes') &&
    idx.includes('rotuloRelatorioCobrancaGrupoOption') &&
    idx.includes('findServicoHttNoGrupo') &&
    exists('app/modules/fechamento/cobrancaGrupos.ts')
  ) {
    ok('módulo fechamento exporta RelatorioCobrancaGrupoMin')
  } else {
    fail('módulo fechamento sem RelatorioCobrancaGrupoMin')
  }
  const cobrAcoes = fs.readFileSync(path.join(root, 'app/components/RelatorioCobrancaAcoes.tsx'), 'utf8')
  if (
    (cobrAcoes.includes("from '../modules/fechamento'") || cobrAcoes.includes('from "../modules/fechamento"')) &&
    cobrAcoes.includes('rotuloRelatorioCobrancaGrupoOption') &&
    !cobrAcoes.includes('export type RelatorioCobrancaGrupoMin = {') &&
    !cobrAcoes.includes('g.httLabel ? ` — ${g.httLabel}`')
  ) {
    ok('RelatorioCobrancaAcoes usa RelatorioCobrancaGrupoMin do módulo fechamento')
  } else {
    fail('RelatorioCobrancaAcoes ainda define RelatorioCobrancaGrupoMin no sítio')
  }
  if (
    nma.includes('buildRelatorioCobrancaGruposOpcoes') &&
    nma.includes('rotuloRelatorioCobrancaGrupoOption') &&
    nma.includes('findServicoHttNoGrupo') &&
    !nma.includes('httLabel: httVal != null ? `HTT ${httVal} €`') &&
    !nma.includes('httVal != null ? ` — HTT ${httVal} €`')
  ) {
    ok('NonatoMainApp usa buildRelatorioCobrancaGruposOpcoes do módulo')
  } else {
    fail('NonatoMainApp ainda monta opções Tipo de cobrança no sítio')
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
    idx.includes('ordenarClientesPorNome') &&
    idx.includes('ClientePrioritario') &&
    idx.includes('emptyClientePrioritarioForm') &&
    idx.includes('clientePrioritarioToForm') &&
    idx.includes('createClientePrioritarioFromForm') &&
    idx.includes('updateClientePrioritarioFromForm') &&
    idx.includes('isClientePrioritarioFormValid') &&
    idx.includes('clientePrioritarioFormCompleteness') &&
    idx.includes('formatClientePrioritarioAddress') &&
    idx.includes('createEmptyEquipamentoClienteForm') &&
    idx.includes('createEmptyRelatorioEquipamentoForm') &&
    idx.includes('Cliente') &&
    idx.includes('ClienteFormState') &&
    idx.includes('emptyClienteFormState') &&
    idx.includes('clienteToForm') &&
    idx.includes('createClienteFromForm') &&
    idx.includes('updateClienteFromForm') &&
    idx.includes('isClienteFormValid') &&
    idx.includes('encontrarClienteDuplicadoCadastro') &&
    idx.includes('isEquipamentoClienteFormValid') &&
    idx.includes('createEquipamentoClienteFromForm') &&
    idx.includes('updateEquipamentoClienteFromForm') &&
    idx.includes('equipamentoClienteSerieDuplicada') &&
    idx.includes('equipamentoClienteIdDuplicado') &&
    idx.includes('resolverIndiceEquipamentoClienteEdicao')
  ) {
    ok('módulo clientes exporta alfabeto/detalhe/prioritário/equipamentoCliente/Cliente/ClienteFormState')
  } else {
    fail('módulo clientes incompleto (index.ts)')
  }
  for (const f of [
    'prioritarioTipos.ts',
    'prioritarioForm.ts',
    'equipamentoClienteTipos.ts',
    'equipamentoClienteForm.ts',
    'clienteTipos.ts',
    'clienteFormState.ts',
    'clienteFromForm.ts',
    'cadastroDuplicado.ts',
    'equipamentoClienteFromForm.ts',
  ]) {
    if (exists(`app/modules/clientes/${f}`)) ok(`existe app/modules/clientes/${f}`)
    else fail(`falta app/modules/clientes/${f}`)
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/clientes'") || nma.includes('from "./modules/clientes"')) {
    ok('NonatoMainApp importa app/modules/clientes')
  } else {
    fail('NonatoMainApp não importa o módulo clientes')
  }
  if (
    !nma.includes('type ClientePrioritario = {') &&
    nma.includes('emptyClientePrioritarioForm') &&
    nma.includes('clientePrioritarioToForm') &&
    nma.includes('createClientePrioritarioFromForm') &&
    nma.includes('updateClientePrioritarioFromForm') &&
    nma.includes('isClientePrioritarioFormValid')
  ) {
    ok('NonatoMainApp usa ClientePrioritario do módulo clientes')
  } else {
    fail('NonatoMainApp ainda define ClientePrioritario localmente ou não usa helpers do módulo')
  }
  const prioForm = fs.readFileSync(path.join(root, 'app/modules/clientes/prioritarioForm.ts'), 'utf8')
  const libPrioFromForm = exists('app/lib/clientePrioritarioFromForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/clientePrioritarioFromForm.ts'), 'utf8')
    : ''
  if (prioForm.includes('nowMs: number') && !prioForm.includes('Date.now()')) {
    ok('módulo clientes createClientePrioritarioFromForm é puro (relógio injectado)')
  } else {
    fail('módulo clientes/prioritarioForm ainda usa Date.now')
  }
  if (
    libPrioFromForm.includes("from '../modules/clientes/prioritarioForm'") &&
    libPrioFromForm.includes('createClientePrioritarioFromForm as createClientePrioritarioFromFormPure') &&
    libPrioFromForm.includes('Date.now()')
  ) {
    ok('lib/clientePrioritarioFromForm só envolve o relógio do prioritário')
  } else {
    fail('lib/clientePrioritarioFromForm ainda não envolve createClientePrioritarioFromForm')
  }
  if (nma.includes("from './lib/clientePrioritarioFromForm'")) {
    ok('NonatoMainApp usa createClientePrioritarioFromForm via lib')
  } else {
    fail('NonatoMainApp não importa createClientePrioritarioFromForm do lib')
  }
  if (
    idx.includes('createEmptyEquipamentoClienteForm') &&
    idx.includes('createEmptyRelatorioEquipamentoForm') &&
    idx.includes('isRelatorioEquipamentoFormValid') &&
    idx.includes('createRelatorioEquipamentoFromForm') &&
    idx.includes('relatorioEquipamentoToForm') &&
    idx.includes('EquipamentoCliente') &&
    idx.includes('RelatorioEquipamento') &&
    exists('app/modules/clientes/relatorioEquipamentoFromForm.ts')
  ) {
    ok('módulo clientes exporta EquipamentoCliente / RelatorioEquipamento / forms vazios')
  } else {
    fail('módulo clientes sem EquipamentoCliente / RelatorioEquipamento / createEmpty*')
  }
  if (
    idx.includes('RelatorioEquipamentoHistorico') &&
    idx.includes('ClienteEquipamentoHistVista') &&
    idx.includes('relatorioTemPecas') &&
    idx.includes('todasPecasRelatorio') &&
    exists('app/modules/clientes/relatorioHistorico.ts')
  ) {
    ok('módulo clientes exporta RelatorioEquipamentoHistorico')
  } else {
    fail('módulo clientes sem RelatorioEquipamentoHistorico')
  }
  const histPanel = fs.readFileSync(path.join(root, 'app/components/ClienteEquipamentoHistoricoPanel.tsx'), 'utf8')
  if (
    (histPanel.includes("from '../modules/clientes'") || histPanel.includes('from "../modules/clientes"')) &&
    histPanel.includes('relatorioTemPecas') &&
    histPanel.includes('todasPecasRelatorio') &&
    !histPanel.includes('export type RelatorioEquipamentoHistorico = {')
  ) {
    ok('HistoricoPanel usa RelatorioEquipamentoHistorico do módulo clientes')
  } else {
    fail('HistoricoPanel ainda define RelatorioEquipamentoHistorico no sítio')
  }
  const hubEq = fs.readFileSync(path.join(root, 'app/components/ClienteEquipamentoHub.tsx'), 'utf8')
  if (
    (hubEq.includes("from '../modules/clientes'") || hubEq.includes('from "../modules/clientes"')) &&
    hubEq.includes('RelatorioEquipamentoHistorico') &&
    !hubEq.includes('type RelatorioEquipamentoHistorico,')
  ) {
    ok('ClienteEquipamentoHub usa RelatorioEquipamentoHistorico do módulo clientes')
  } else {
    fail('ClienteEquipamentoHub ainda importa RelatorioEquipamentoHistorico do painel')
  }
  if (
    idx.includes('ClienteFaturaListItem') &&
    idx.includes('rotuloEquipamentoFatura') &&
    idx.includes('faturaSemEquipamentoUtil') &&
    exists('app/modules/clientes/faturaLista.ts')
  ) {
    ok('módulo clientes exporta ClienteFaturaListItem')
  } else {
    fail('módulo clientes sem ClienteFaturaListItem')
  }
  const fatLista = fs.readFileSync(path.join(root, 'app/components/ClienteFaturasSection.tsx'), 'utf8')
  if (
    (fatLista.includes("from '../modules/clientes'") || fatLista.includes('from "../modules/clientes"')) &&
    fatLista.includes('rotuloEquipamentoFatura') &&
    fatLista.includes('faturaSemEquipamentoUtil') &&
    !fatLista.includes('export type ClienteFaturaListItem = {')
  ) {
    ok('ClienteFaturasSection usa ClienteFaturaListItem do módulo clientes')
  } else {
    fail('ClienteFaturasSection ainda define ClienteFaturaListItem no sítio')
  }
  if (
    idx.includes('ClienteListaLinhasData') &&
    idx.includes('buildClienteInfAdicional') &&
    idx.includes('formatNifClienteExibicao') &&
    exists('app/modules/clientes/listaLinhas.ts')
  ) {
    ok('módulo clientes exporta ClienteListaLinhasData')
  } else {
    fail('módulo clientes sem ClienteListaLinhasData')
  }
  const listaLinhas = fs.readFileSync(path.join(root, 'app/components/ClienteListaLinhas.tsx'), 'utf8')
  if (
    (listaLinhas.includes("from '../modules/clientes'") || listaLinhas.includes('from "../modules/clientes"')) &&
    listaLinhas.includes('buildClienteInfAdicional') &&
    !listaLinhas.includes('export type ClienteListaLinhasData = {')
  ) {
    ok('ClienteListaLinhas usa ClienteListaLinhasData do módulo clientes')
  } else {
    fail('ClienteListaLinhas ainda define ClienteListaLinhasData no sítio')
  }
  const identChips = fs.readFileSync(path.join(root, 'app/components/ClienteIdentidadeChips.tsx'), 'utf8')
  if (
    (identChips.includes("from '../modules/clientes'") || identChips.includes('from "../modules/clientes"')) &&
    identChips.includes('formatNifClienteExibicao') &&
    !identChips.includes('export function formatNifClienteExibicao(')
  ) {
    ok('ClienteIdentidadeChips re-exporta formatNifClienteExibicao do módulo')
  } else {
    fail('ClienteIdentidadeChips ainda define formatNifClienteExibicao no sítio')
  }
  if (
    idx.includes('formatClienteIdentidadeTexto') &&
    idx.includes('ClienteIdentidadeTexto')
  ) {
    ok('módulo clientes exporta formatClienteIdentidadeTexto')
  } else {
    fail('módulo clientes sem formatClienteIdentidadeTexto')
  }
  if (
    identChips.includes('formatClienteIdentidadeTexto') &&
    !identChips.includes('export function formatClienteIdentidadeTexto(')
  ) {
    ok('ClienteIdentidadeChips re-exporta formatClienteIdentidadeTexto do módulo')
  } else {
    fail('ClienteIdentidadeChips ainda define formatClienteIdentidadeTexto no sítio')
  }
  const opeIdent = fs.readFileSync(path.join(root, 'app/components/OrcamentoPecasEspeciaisContent.tsx'), 'utf8')
  if (
    (opeIdent.includes("from '../modules/clientes'") || opeIdent.includes('from "../modules/clientes"')) &&
    opeIdent.includes('formatClienteIdentidadeTexto')
  ) {
    ok('OrcamentoPecasEspeciaisContent usa formatClienteIdentidadeTexto do módulo clientes')
  } else {
    fail('OrcamentoPecasEspeciaisContent ainda importa identidade dos chips')
  }
  if (
    idx.includes('ClienteDetalheData') &&
    exists('app/modules/clientes/detalhe.ts')
  ) {
    ok('módulo clientes exporta ClienteDetalheData')
  } else {
    fail('módulo clientes sem ClienteDetalheData')
  }
  const detView = fs.readFileSync(path.join(root, 'app/components/ClienteDetalheView.tsx'), 'utf8')
  if (
    (detView.includes("from '../modules/clientes'") || detView.includes('from "../modules/clientes"')) &&
    detView.includes('ClienteDetalheData') &&
    !detView.includes('export type ClienteDetalheData = {')
  ) {
    ok('ClienteDetalheView usa ClienteDetalheData do módulo clientes')
  } else {
    fail('ClienteDetalheView ainda define ClienteDetalheData no sítio')
  }
  if (
    idx.includes('DocumentoEnvioClienteConfig') &&
    idx.includes('AbrirEnvioDocumentoClienteOpts') &&
    idx.includes('buildDocumentoEnvioClienteConfig') &&
    exists('app/modules/clientes/envioDocumento.ts')
  ) {
    ok('módulo clientes exporta envio de documento ao cliente')
  } else {
    fail('módulo clientes sem envioDocumento')
  }
  const envioModal = fs.readFileSync(path.join(root, 'app/components/DocumentoEnvioClienteModal.tsx'), 'utf8')
  if (
    (envioModal.includes("from '../modules/clientes'") || envioModal.includes('from "../modules/clientes"')) &&
    envioModal.includes('DocumentoEnvioClienteConfig') &&
    !envioModal.includes('export type DocumentoEnvioClienteConfig = {')
  ) {
    ok('DocumentoEnvioClienteModal usa DocumentoEnvioClienteConfig do módulo clientes')
  } else {
    fail('DocumentoEnvioClienteModal ainda define DocumentoEnvioClienteConfig no sítio')
  }
  const envioCtx = fs.readFileSync(path.join(root, 'app/context/DocumentoEnvioClienteContext.tsx'), 'utf8')
  if (
    (envioCtx.includes("from '../modules/clientes'") || envioCtx.includes('from "../modules/clientes"')) &&
    envioCtx.includes('buildDocumentoEnvioClienteConfig') &&
    !envioCtx.includes('export type AbrirEnvioDocumentoClienteOpts = {')
  ) {
    ok('DocumentoEnvioClienteContext usa buildDocumentoEnvioClienteConfig do módulo')
  } else {
    fail('DocumentoEnvioClienteContext ainda define AbrirEnvioDocumentoClienteOpts no sítio')
  }
  if (
    idx.includes('ClienteAlfabetoPickerLabels') &&
    idx.includes('ClienteAlfabetoPickerAction') &&
    idx.includes('formatClienteAlfabetoPickerMeta') &&
    idx.includes('letrasAlfabetoParaListaNomes') &&
    exists('app/modules/clientes/alfabetoPicker.ts')
  ) {
    ok('módulo clientes exporta picker A–Z de clientes')
  } else {
    fail('módulo clientes sem alfabetoPicker')
  }
  const alfaPicker = fs.readFileSync(path.join(root, 'app/components/ClienteAlfabetoPicker.tsx'), 'utf8')
  if (
    (alfaPicker.includes("from '../modules/clientes'") || alfaPicker.includes('from "../modules/clientes"')) &&
    alfaPicker.includes('formatClienteAlfabetoPickerMeta') &&
    alfaPicker.includes('letrasAlfabetoParaListaNomes') &&
    alfaPicker.includes('clientes-alfa-prompt') &&
    !alfaPicker.includes('export type ClienteAlfabetoPickerLabels = {') &&
    !alfaPicker.includes('export type ClienteAlfabetoPickerAction = {')
  ) {
    ok('ClienteAlfabetoPicker usa tipos/meta do módulo clientes')
  } else {
    fail('ClienteAlfabetoPicker ainda define tipos/meta no sítio')
  }
  if (
    idx.includes('AlfabetoIndiceBuscaLabels') &&
    idx.includes('formatAlfabetoIndiceBuscaMeta') &&
    exists('app/modules/clientes/indiceBusca.ts')
  ) {
    ok('módulo clientes exporta índice A–Z genérico')
  } else {
    fail('módulo clientes sem indiceBusca')
  }
  const indiceBusca = fs.readFileSync(path.join(root, 'app/components/AlfabetoIndiceBusca.tsx'), 'utf8')
  if (
    (indiceBusca.includes("from '../modules/clientes'") || indiceBusca.includes('from "../modules/clientes"')) &&
    indiceBusca.includes('formatAlfabetoIndiceBuscaMeta') &&
    !indiceBusca.includes('export type AlfabetoIndiceBuscaLabels = {')
  ) {
    ok('AlfabetoIndiceBusca usa tipos/meta do módulo clientes')
  } else {
    fail('AlfabetoIndiceBusca ainda define tipos/meta no sítio')
  }
  if (
    nma.includes('createEmptyEquipamentoClienteForm') &&
    nma.includes('createEmptyRelatorioEquipamentoForm') &&
    nma.includes('isRelatorioEquipamentoFormValid') &&
    nma.includes('createRelatorioEquipamentoFromForm') &&
    nma.includes('updateRelatorioEquipamentoFromForm') &&
    nma.includes('relatorioEquipamentoToForm') &&
    !nma.includes('type RelatorioEquipamento = {') &&
    !nma.includes('type EquipamentoCliente = {')
  ) {
    ok('NonatoMainApp usa EquipamentoCliente/RelatorioEquipamento do módulo clientes')
  } else {
    fail('NonatoMainApp ainda define EquipamentoCliente/RelatorioEquipamento localmente ou não usa createEmpty*')
  }
  const relEqFromForm = fs.readFileSync(path.join(root, 'app/modules/clientes/relatorioEquipamentoFromForm.ts'), 'utf8')
  const libRelEqFromForm = exists('app/lib/relatorioEquipamentoFromForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/relatorioEquipamentoFromForm.ts'), 'utf8')
    : ''
  if (
    relEqFromForm.includes('nowMs: number') &&
    !relEqFromForm.includes('Date.now()') &&
    !relEqFromForm.includes('new Date().toLocaleString')
  ) {
    ok('módulo clientes createRelatorioEquipamentoFromForm é puro (relógio injectado)')
  } else {
    fail('módulo clientes/relatorioEquipamentoFromForm ainda usa Date.now')
  }
  if (
    libRelEqFromForm.includes("from '../modules/clientes/relatorioEquipamentoFromForm'") &&
    libRelEqFromForm.includes('createRelatorioEquipamentoFromForm as createRelatorioEquipamentoFromFormPure') &&
    libRelEqFromForm.includes('Date.now()')
  ) {
    ok('lib/relatorioEquipamentoFromForm só envolve o relógio do relatório do equipamento')
  } else {
    fail('lib/relatorioEquipamentoFromForm ainda não envolve createRelatorioEquipamentoFromForm')
  }
  if (nma.includes("from './lib/relatorioEquipamentoFromForm'")) {
    ok('NonatoMainApp usa createRelatorioEquipamentoFromForm via lib')
  } else {
    fail('NonatoMainApp não importa createRelatorioEquipamentoFromForm do lib')
  }
  if (
    idx.includes('export type { Cliente }') &&
    nma.includes('Cliente') &&
    !nma.includes('type Cliente = {')
  ) {
    ok('NonatoMainApp usa Cliente do módulo clientes')
  } else {
    fail('NonatoMainApp ainda define Cliente localmente ou módulo não exporta Cliente')
  }
  if (
    idx.includes('export type { ClienteFormState }') &&
    idx.includes('emptyClienteFormState') &&
    idx.includes('clienteToForm') &&
    idx.includes('createClienteFromForm') &&
    idx.includes('updateClienteFromForm') &&
    idx.includes('isClienteFormValid') &&
    nma.includes('emptyClienteFormState') &&
    nma.includes('clienteToForm') &&
    nma.includes('createClienteFromForm') &&
    nma.includes('updateClienteFromForm') &&
    nma.includes('isClienteFormValid') &&
    nma.includes('encontrarClienteDuplicadoCadastro') &&
    nma.includes('ClienteFormState') &&
    !nma.includes('type ClienteFormState = {') &&
    exists('app/modules/clientes/clienteFormState.ts') &&
    exists('app/modules/clientes/clienteFromForm.ts') &&
    exists('app/modules/clientes/cadastroDuplicado.ts')
  ) {
    ok('NonatoMainApp usa ClienteFormState/empty/toForm/fromForm/valid/duplicado do módulo clientes')
  } else {
    fail('NonatoMainApp ainda valida/duplica Cliente no sítio ou módulo incompleto')
  }
  const clienteFromForm = fs.readFileSync(path.join(root, 'app/modules/clientes/clienteFromForm.ts'), 'utf8')
  const libClienteFromForm = exists('app/lib/clienteFromForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/clienteFromForm.ts'), 'utf8')
    : ''
  if (clienteFromForm.includes('nowMs: number') && !clienteFromForm.includes('Date.now()')) {
    ok('módulo clientes createClienteFromForm é puro (relógio injectado)')
  } else {
    fail('módulo clientes/clienteFromForm ainda usa Date.now')
  }
  if (
    libClienteFromForm.includes("from '../modules/clientes/clienteFromForm'") &&
    libClienteFromForm.includes('createClienteFromForm as createClienteFromFormPure') &&
    libClienteFromForm.includes('Date.now()')
  ) {
    ok('lib/clienteFromForm só envolve o relógio de createClienteFromForm')
  } else {
    fail('lib/clienteFromForm ainda não envolve createClienteFromForm')
  }
  if (nma.includes("from './lib/clienteFromForm'")) {
    ok('NonatoMainApp usa createClienteFromForm via lib')
  } else {
    fail('NonatoMainApp não importa createClienteFromForm do lib')
  }
  const dupSrc = fs.readFileSync(path.join(root, 'app/modules/clientes/cadastroDuplicado.ts'), 'utf8')
  if (
    dupSrc.includes('saoNomesClienteIguais') &&
    dupSrc.includes('eVarianteNomeClienteComExtra') &&
    dupSrc.includes('Ferwood ≠ Ferwood Manuel') &&
    dupSrc.includes('Nome exacto NÃO bloqueia enquanto se escreve') &&
    dupSrc.includes("nomeEmpresa: ''")
  ) {
    ok('cadastroDuplicado: nome igual só se o texto inteiro coincidir')
  } else {
    fail('cadastroDuplicado sem igualdade exacta de nome (Ferwood ≠ Ferwood Manuel)')
  }
  {
    const norm = (nome) =>
      String(nome ?? '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    const iguais = (a, b) => {
      const na = norm(a)
      const nb = norm(b)
      return Boolean(na && nb && na === nb)
    }
    const casos = [
      [iguais('FERWOOD', 'ferwood'), true],
      [iguais('Ferwood.', 'ferwood'), true],
      [iguais('ferwood', 'ferwood manuel'), false],
      [iguais('ferwood jose', 'ferwood maria'), false],
      [iguais('ferwood  manuel', 'Ferwood Manuel'), true],
    ]
    if (casos.every(([obtido, esperado]) => obtido === esperado)) {
      ok('regra de nome: Ferwood Manuel não é duplicado de Ferwood')
    } else {
      fail('regra de nome falhou nos casos Ferwood / Ferwood Manuel')
    }
  }
  if (
    idx.includes('isEquipamentoClienteFormValid') &&
    idx.includes('createEquipamentoClienteFromForm') &&
    idx.includes('updateEquipamentoClienteFromForm') &&
    idx.includes('equipamentoClienteSerieDuplicada') &&
    nma.includes('isEquipamentoClienteFormValid') &&
    nma.includes('createEquipamentoClienteFromForm') &&
    nma.includes('updateEquipamentoClienteFromForm') &&
    nma.includes('equipamentoClienteSerieDuplicada') &&
    nma.includes('equipamentoClienteIdDuplicado') &&
    nma.includes('resolverIndiceEquipamentoClienteEdicao') &&
    exists('app/modules/clientes/equipamentoClienteFromForm.ts')
  ) {
    ok('NonatoMainApp usa EquipamentoCliente fromForm/valid/duplicado do módulo clientes')
  } else {
    fail('NonatoMainApp ainda mapeia EquipamentoCliente no sítio ou módulo incompleto')
  }
  const dupLib = fs.readFileSync(path.join(root, 'app/lib/clienteCadastroDuplicadoUtils.ts'), 'utf8')
  if (dupLib.includes("from '../modules/clientes'")) {
    ok('clienteCadastroDuplicadoUtils re-exporta o módulo clientes')
  } else {
    fail('lib/clienteCadastroDuplicadoUtils ainda não aponta para o módulo clientes')
  }
  if (
    idx.includes('ClienteExclusaoAlvo') &&
    idx.includes('isClienteBibliotecaOrfaos') &&
    idx.includes('coletarIdsRelatoriosClienteParaExclusao') &&
    exists('app/modules/clientes/exclusao.ts')
  ) {
    ok('módulo clientes exporta ClienteExclusaoAlvo')
  } else {
    fail('módulo clientes sem exclusao')
  }
  const libExclusao = fs.readFileSync(path.join(root, 'app/lib/clienteExclusao.ts'), 'utf8')
  if (
    libExclusao.includes("from '../modules/clientes/exclusao'") &&
    !libExclusao.includes('export type ClienteExclusaoAlvo = {') &&
    nma.includes('ClienteExclusaoAlvo') &&
    nma.includes('isClienteBibliotecaOrfaos') &&
    nma.includes('coletarIdsRelatoriosClienteParaExclusao') &&
    !nma.includes("from './lib/clienteExclusao'")
  ) {
    ok('NonatoMainApp usa ClienteExclusaoAlvo do módulo clientes')
  } else {
    fail('ClienteExclusao ainda definido em lib ou importado pelo NMA via lib')
  }
  if (
    idx.includes('garantirCodigosClientes') &&
    idx.includes('gerarProximoCodigoCliente') &&
    idx.includes('codigoClienteExibicao') &&
    exists('app/modules/clientes/codigo.ts')
  ) {
    ok('módulo clientes exporta codigo')
  } else {
    fail('módulo clientes sem codigo')
  }
  const libCodigo = fs.readFileSync(path.join(root, 'app/lib/clienteCodigoUtils.ts'), 'utf8')
  const listaLinhasSrc = fs.readFileSync(path.join(root, 'app/modules/clientes/listaLinhas.ts'), 'utf8')
  const buscaSrc = fs.readFileSync(path.join(root, 'app/modules/clientes/busca.ts'), 'utf8')
  if (
    libCodigo.includes("from '../modules/clientes/codigo'") &&
    !libCodigo.includes("export const CLIENTE_CODIGO_PREFIX = 'NS'") &&
    !libCodigo.includes('export function garantirCodigosClientes<') &&
    listaLinhasSrc.includes("from './codigo'") &&
    buscaSrc.includes("from './codigo'") &&
    nma.includes('garantirCodigosClientes') &&
    nma.includes('gerarProximoCodigoCliente') &&
    nma.includes('codigoClienteExibicao') &&
    !nma.includes("from './lib/clienteCodigoUtils'")
  ) {
    ok('NMA/lista/busca usam codigo do módulo clientes')
  } else {
    fail('clienteCodigoUtils ainda definido em lib ou NMA não usa o módulo')
  }
  if (
    idx.includes('EnderecoMapsParts') &&
    idx.includes('buildEnderecoMapsQuery') &&
    idx.includes('buildGoogleMapsSearchUrl') &&
    exists('app/modules/clientes/enderecoMaps.ts')
  ) {
    ok('módulo clientes exporta enderecoMaps')
  } else {
    fail('módulo clientes sem enderecoMaps')
  }
  const libMaps = fs.readFileSync(path.join(root, 'app/lib/enderecoMapsUtils.ts'), 'utf8')
  const cadastroForm = fs.readFileSync(path.join(root, 'app/components/ClienteCadastroForm.tsx'), 'utf8')
  const gpsNav = fs.readFileSync(path.join(root, 'app/components/ClienteGpsNavButton.tsx'), 'utf8')
  const mapsActions = fs.readFileSync(path.join(root, 'app/components/ClienteEnderecoMapsActions.tsx'), 'utf8')
  if (
    libMaps.includes("from '../modules/clientes/enderecoMaps'") &&
    !libMaps.includes('export type EnderecoMapsParts = {') &&
    !libMaps.includes('export function buildEnderecoMapsQuery(') &&
    cadastroForm.includes("from '../modules/clientes/enderecoMaps'") &&
    gpsNav.includes("from '../modules/clientes/enderecoMaps'") &&
    mapsActions.includes("from '../modules/clientes/enderecoMaps'") &&
    !cadastroForm.includes("from '../lib/enderecoMapsUtils'") &&
    !gpsNav.includes("from '../lib/enderecoMapsUtils'") &&
    !mapsActions.includes("from '../lib/enderecoMapsUtils'")
  ) {
    ok('formulário/GPS/Maps usam enderecoMaps do módulo clientes')
  } else {
    fail('enderecoMaps ainda definido em lib ou ecrãs não usam o módulo')
  }
  if (
    idx.includes('ClienteContactoEnvio') &&
    idx.includes('prefillContactFromCliente') &&
    idx.includes('findClienteParaEnvio') &&
    idx.includes('buildWhatsAppUrl') &&
    exists('app/modules/clientes/contactoEnvio.ts')
  ) {
    ok('módulo clientes exporta contactoEnvio')
  } else {
    fail('módulo clientes sem contactoEnvio')
  }
  const libContacto = fs.readFileSync(path.join(root, 'app/lib/clienteContactEnvio.ts'), 'utf8')
  if (
    libContacto.includes("from '../modules/clientes/contactoEnvio'") &&
    libContacto.includes('export function abrirUrlExterna(') &&
    !libContacto.includes('export function prefillContactFromCliente(') &&
    !libContacto.includes('export function findClienteParaEnvio(') &&
    nma.includes('prefillContactFromCliente') &&
    !nma.includes("from './lib/clienteContactEnvio'") &&
    envioCtx.includes('findClienteParaEnvio') &&
    !envioCtx.includes("from '../lib/clienteContactEnvio'") &&
    envioModal.includes('buildWhatsAppUrl') &&
    envioModal.includes('prefillContactFromCliente') &&
    envioModal.includes('abrirEmailCliente') &&
    envioModal.includes("from '../lib/clienteContactEnvio'")
  ) {
    ok('NMA/contexto/modal usam contactoEnvio do módulo clientes')
  } else {
    fail('contactoEnvio ainda definido em lib ou consumidores não usam o módulo')
  }
  if (
    idx.includes('NomeAlfabetoRow') &&
    idx.includes('filtrarPorNomeBusca') &&
    idx.includes('agruparPorLetraNome') &&
    exists('app/modules/clientes/nomeAlfabeto.ts')
  ) {
    ok('módulo clientes exporta nomeAlfabeto')
  } else {
    fail('módulo clientes sem nomeAlfabeto')
  }
  const libNomeAz = fs.readFileSync(path.join(root, 'app/lib/nomeAlfabetoBusca.ts'), 'utf8')
  if (
    libNomeAz.includes("from '../modules/clientes/nomeAlfabeto'") &&
    !libNomeAz.includes('export type NomeAlfabetoRow = {') &&
    !libNomeAz.includes('export function filtrarPorNomeBusca<') &&
    nma.includes('filtrarPorNomeBusca') &&
    nma.includes('getLetraAlfabetoNome') &&
    !nma.includes("from './lib/nomeAlfabetoBusca'") &&
    indiceBusca.includes('filtrarPorNomeBusca') &&
    indiceBusca.includes('NomeAlfabetoRow') &&
    !indiceBusca.includes("from '../lib/nomeAlfabetoBusca'")
  ) {
    ok('NMA/AlfabetoIndiceBusca usam nomeAlfabeto do módulo clientes')
  } else {
    fail('nomeAlfabeto ainda definido em lib ou consumidores não usam o módulo')
  }
  const libMerge = fs.readFileSync(path.join(root, 'app/lib/clienteMergeUtils.ts'), 'utf8')
  const dataStorage = fs.readFileSync(path.join(root, 'app/utils/dataStorage.ts'), 'utf8')
  if (
    idx.includes('mergeNonatoClientesDeferServerLocal') &&
    idx.includes('dedupeEquipamentosClientePorSerie') &&
    idx.includes('mergeEquipamentosClienteLists') &&
    exists('app/modules/clientes/merge.ts')
  ) {
    ok('módulo clientes exporta merge')
  } else {
    fail('módulo clientes sem merge')
  }
  if (
    libMerge.includes("from '../modules/clientes/merge'") &&
    !libMerge.includes('export function mergeNonatoClientesDeferServerLocal(') &&
    !libMerge.includes('function pickBetterField(')
  ) {
    ok('lib/clienteMergeUtils só reexporta clientes/merge')
  } else {
    fail('lib/clienteMergeUtils ainda implementa o merge')
  }
  if (
    nma.includes('mergeNonatoClientesDeferServerLocal') &&
    nma.includes('dedupeEquipamentosClientePorSerie') &&
    !nma.includes("from './lib/clienteMergeUtils'") &&
    dataStorage.includes("from '../lib/clienteMergeUtils'")
  ) {
    ok('NMA usa merge do módulo clientes; dataStorage via lib')
  } else {
    fail('NMA/dataStorage sem merge canónico de clientes')
  }
} catch (e) {
  fail(`módulo clientes: ${e.message}`)
}

{
  const bootSrc = fs.readFileSync(path.join(root, 'app/utils/dataStorage.ts'), 'utf8')
  const nmaBoot = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (
    bootSrc.includes('preferServer?: boolean') &&
    bootSrc.includes("source: 'local'") &&
    bootSrc.includes('localFirst') &&
    nmaBoot.includes('preferServer: true') &&
    nmaBoot.includes('skipDemoBootstrapFast') &&
    nmaBoot.includes("bootLoad.source !== 'local'")
  ) {
    ok('arranque: dados locais primeiro (servidor em segundo plano, biblioteca intacta)')
  } else {
    fail('arranque ainda espera o bundle completo do servidor antes de pintar')
  }
}

{
  const acessoHtml = exists('public/acesso.html')
    ? fs.readFileSync(path.join(root, 'public/acesso.html'), 'utf8')
    : ''
  const swAcesso = fs.readFileSync(path.join(root, 'public/sw.js'), 'utf8')
  const nextCfg = fs.readFileSync(path.join(root, 'next.config.js'), 'utf8')
  const atalho = fs.readFileSync(path.join(root, 'scripts/criar-atalho-gestao.ps1'), 'utf8')
  const installSrc = fs.readFileSync(path.join(root, 'app/components/InstallPrompt.tsx'), 'utf8')
  const nmaAcesso = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (
    acessoHtml.includes('data-ns-acesso="1"') &&
    acessoHtml.includes('data-ns-acesso-enter') &&
    acessoHtml.includes('ENTRAR NO SISTEMA')
  ) {
    ok('página /acesso.html — lançador de acesso')
  } else {
    fail('public/acesso.html em falta ou incompleto')
  }
  if (swAcesso.includes("url.pathname === '/acesso'") && swAcesso.includes("cache: 'no-store'")) {
    ok('SW: /acesso sem cache (sempre versão nova)')
  } else {
    fail('sw.js não trata /acesso como network-only')
  }
  if (nextCfg.includes("source: '/acesso'") && nextCfg.includes("destination: '/acesso.html'")) {
    ok('rewrite /acesso → /acesso.html')
  } else {
    fail('next.config.js sem rewrite /acesso')
  }
  if (atalho.includes('/acesso')) {
    ok('atalho do PC aponta para /acesso')
  } else {
    fail('criar-atalho-gestao.ps1 ainda aponta só para /')
  }
  if (atalho.includes('LOCALAPPDATA') && atalho.includes('microsoft-edge:')) {
    ok('atalho do PC abre Edge/Chrome, não o Firefox')
  } else {
    fail('atalho do PC ainda pode cair no browser predefinido (Firefox)')
  }
  if (acessoHtml.includes('microsoft-edge:')) {
    ok('página /acesso abre no Edge a partir do Firefox no Windows')
  } else {
    fail('acesso.html não força Edge no Windows')
  }
  if (acessoHtml.includes('data-ns-acesso-full') && acessoHtml.includes('requestFullscreen')) {
    ok('página /acesso tem opção de ecrã inteiro')
  } else {
    fail('acesso.html sem botão de ecrã inteiro')
  }
  if (
    acessoHtml.includes('installHelp') &&
    acessoHtml.includes('execCommand') &&
    acessoHtml.includes('copyAccessLink')
  ) {
    ok('página /acesso: Instalar e Copiar com fallback (não ficam mudos)')
  } else {
    fail('acesso.html: Instalar/Copiar ainda podem não fazer nada')
  }
  if (atalho.includes('start-fullscreen') && atalho.includes('Ecra inteiro')) {
    ok('atalho do PC inclui ecrã inteiro')
  } else {
    fail('criar-atalho-gestao.ps1 sem atalho de ecrã inteiro')
  }
  if (
    installSrc.includes('toggleFullscreen') &&
    nmaAcesso.includes('toggle-ecra-inteiro') &&
    nmaAcesso.includes('sidebar-extra-lang-cluster') &&
    !installSrc.includes('data-ns-fullscreen-fab')
  ) {
    ok('botão Ocupar toda a tela na barra lateral (sem ocupar a área de trabalho)')
  } else {
    fail('opção de ecrã inteiro em falta na barra lateral ou ainda há botão flutuante')
  }
  if (
    installSrc.includes('openAcessoModal') &&
    installSrc.includes('canShowAcesso') &&
    nmaAcesso.includes('openAcessoModal') &&
    nmaAcesso.includes('acessoAparelhoBtn')
  ) {
    ok('botão Acesso neste aparelho (sidebar + modal)')
  } else {
    fail('botão de acesso não está na sidebar/modal')
  }
}

try {
  const stockSrc = exists('app/components/CadastroPecasStockContent.tsx')
    ? fs.readFileSync(path.join(root, 'app/components/CadastroPecasStockContent.tsx'), 'utf8')
    : ''
  const stockKeys = fs.readFileSync(path.join(root, 'app/lib/criticalCadastroKeys.ts'), 'utf8')
  const nmaStock = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  const mergeStock = fs.readFileSync(path.join(root, 'app/modules/sidebar/merge.ts'), 'utf8')
  if (
    stockSrc.includes('PECAS_STOCK_STORAGE_KEY') &&
    stockSrc.includes("aba === 'biblioteca'") &&
    stockSrc.includes('BibliotecaPecasGaleriaCategorias') &&
    !stockSrc.includes('importacao') &&
    !stockSrc.includes('beforeinstallprompt') &&
    stockKeys.includes('nonato-pecas-stock') &&
    nmaStock.includes('open-cadastro-pecas-stock') &&
    nmaStock.includes('CadastroPecasStockContent') &&
    mergeStock.includes('cadastro-pecas-stock-default')
  ) {
    ok('cadastro de peças do stock (sem importação, dados isolados)')
  } else {
    fail('cadastro de peças do stock incompleto ou ainda com importação')
  }
} catch (e) {
  fail(`cadastro de peças do stock: ${e && e.message ? e.message : e}`)
}

try {
  const gateSrc = exists('app/components/SessaoGateDialog.tsx')
    ? fs.readFileSync(path.join(root, 'app/components/SessaoGateDialog.tsx'), 'utf8')
    : ''
  const nmaGate = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  const cssGate = fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8')
  const i18nGate = JSON.parse(fs.readFileSync(path.join(root, 'app/i18n/messages/pt-BR.json'), 'utf8'))
  if (
    gateSrc.includes("variant === 'acesso'") &&
    nmaGate.includes('executarSaidaDoPrograma') &&
    nmaGate.includes('pedirAcessarPrograma') &&
    nmaGate.includes('nonato-sessao-encerrada') &&
    nmaGate.includes('SessaoGateDialog') &&
    cssGate.includes('.ns-sessao-gate') &&
    i18nGate.sairDoPrograma &&
    i18nGate.acessarPrograma
  ) {
    ok('saída e acesso oficiais (portão obrigatório)')
  } else {
    fail('saída/acesso oficiais incompletos')
  }
} catch (e) {
  fail(`saída/acesso oficiais: ${e && e.message ? e.message : e}`)
}

try {
  const cssVisual = fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8')
  if (cssVisual.includes('Visual Pro v487') && cssVisual.includes('organização e hierarquia do programa')) {
    ok('visual profissional do programa (v487)')
  } else {
    fail('camada visual profissional v487 em falta')
  }
} catch (e) {
  fail(`visual profissional: ${e && e.message ? e.message : e}`)
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
  if (
    idx.includes('formatMoneyEUR') &&
    idx.includes('parseMoneyInput') &&
    exists('app/modules/financeiro/money.ts')
  ) {
    ok('módulo financeiro exporta money')
  } else {
    fail('módulo financeiro sem money')
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
  if (
    idx.includes('isFaturaPecasFormValid') &&
    idx.includes('createFaturaPecasFromForm') &&
    idx.includes('updateFaturaPecasFromForm') &&
    idx.includes('faturaPecasToFormState') &&
    exists('app/modules/financeiro/faturaPecasForm.ts') &&
    exists('app/modules/financeiro/faturaPecasFromForm.ts')
  ) {
    ok('módulo financeiro exporta FaturaPecas form/fromForm')
  } else {
    fail('módulo financeiro sem FaturaPecas form/fromForm')
  }
  if (
    nma.includes('isFaturaPecasFormValid') &&
    nma.includes('createFaturaPecasFromForm') &&
    nma.includes('updateFaturaPecasFromForm') &&
    nma.includes('faturaPecasToFormState')
  ) {
    ok('NonatoMainApp usa FaturaPecas fromForm do módulo financeiro')
  } else {
    fail('NonatoMainApp ainda mapeia FaturaPecas no sítio')
  }
  if (
    idx.includes('isOrdemServicoFormValid') &&
    idx.includes('createOrdemServicoFromForm') &&
    idx.includes('updateOrdemServicoFromForm') &&
    idx.includes('ordemServicoToFormState') &&
    exists('app/modules/financeiro/ordemServicoForm.ts') &&
    exists('app/modules/financeiro/ordemServicoFromForm.ts')
  ) {
    ok('módulo financeiro exporta OrdemServico form/fromForm')
  } else {
    fail('módulo financeiro sem OrdemServico form/fromForm')
  }
  if (
    nma.includes('isOrdemServicoFormValid') &&
    nma.includes('createOrdemServicoFromForm') &&
    nma.includes('updateOrdemServicoFromForm') &&
    nma.includes('ordemServicoToFormState')
  ) {
    ok('NonatoMainApp usa OrdemServico fromForm do módulo financeiro')
  } else {
    fail('NonatoMainApp ainda mapeia OrdemServico no sítio')
  }
  const fatForm = fs.readFileSync(path.join(root, 'app/modules/financeiro/faturaPecasForm.ts'), 'utf8')
  const osForm = fs.readFileSync(path.join(root, 'app/modules/financeiro/ordemServicoForm.ts'), 'utf8')
  const libFinForm = exists('app/lib/financeiroForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/financeiroForm.ts'), 'utf8')
    : ''
  if (
    fatForm.includes('nowMs: number') &&
    !fatForm.includes('new Date().toISOString()') &&
    osForm.includes('nowMs: number') &&
    !osForm.includes('new Date().toISOString()')
  ) {
    ok('módulo financeiro formState é puro (relógio injectado)')
  } else {
    fail('módulo financeiro faturaPecasForm/ordemServicoForm ainda usa new Date()')
  }
  if (
    libFinForm.includes('emptyFaturaPecasFormState as emptyFaturaPecasFormStatePure') &&
    libFinForm.includes('emptyOrdemServicoFormState as emptyOrdemServicoFormStatePure') &&
    nma.includes("from './lib/financeiroForm'")
  ) {
    ok('NonatoMainApp usa forms vazios financeiro via lib')
  } else {
    fail('lib/financeiroForm ainda não envolve os forms vazios')
  }
  const calcDev = fs.readFileSync(path.join(root, 'app/modules/financeiro/calcularDevedores.ts'), 'utf8')
  const buildPer = fs.readFileSync(path.join(root, 'app/modules/financeiro/buildPeriodo.ts'), 'utf8')
  if (
    calcDev.includes('agora: Date') &&
    !calcDev.includes('agora ?? new Date()') &&
    !buildPer.includes('agora ?? new Date()')
  ) {
    ok('módulo financeiro devedores/periodo é puro (relógio injectado)')
  } else {
    fail('módulo financeiro calcularDevedores/buildPeriodo ainda usa new Date() por omissão')
  }
  if (
    libFinForm.includes('calcularClientesDevedores as calcularClientesDevedoresPure') &&
    libFinForm.includes('buildRelatorioFinanceiroPeriodo as buildRelatorioFinanceiroPeriodoPure')
  ) {
    ok('lib/financeiroForm envolve o relógio de devedores/periodo')
  } else {
    fail('lib/financeiroForm ainda não envolve calcularClientesDevedores / buildRelatorioFinanceiroPeriodo')
  }
  const fatStatus = fs.readFileSync(path.join(root, 'app/modules/financeiro/faturaStatus.ts'), 'utf8')
  const fluxoNorm = fs.readFileSync(path.join(root, 'app/modules/financeiro/fluxoNormalize.ts'), 'utf8')
  const fluxoMut = fs.readFileSync(path.join(root, 'app/modules/financeiro/fluxoMutations.ts'), 'utf8')
  const fluxoTipos = fs.readFileSync(path.join(root, 'app/modules/financeiro/fluxoTipos.ts'), 'utf8')
  const finPeriodo = fs.readFileSync(path.join(root, 'app/modules/financeiro/periodo.ts'), 'utf8')
  if (
    fatStatus.includes('hojeMs: number') &&
    !fatStatus.includes('hojeRef ? new Date(hojeRef) : new Date()') &&
    fluxoNorm.includes('nowIso: string') &&
    !fluxoNorm.includes('nowIso ?? new Date().toISOString()') &&
    fluxoMut.includes('nowIso: string') &&
    !fluxoMut.includes('nowIso ?? new Date().toISOString()') &&
    fluxoTipos.includes('nowIso: string') &&
    !fluxoTipos.includes('nowIso ?? new Date().toISOString()') &&
    finPeriodo.includes('nowMs: number') &&
    !finPeriodo.includes('if (!m) return new Date()')
  ) {
    ok('módulo financeiro faturaStatus/fluxo/periodo é puro (relógio injectado)')
  } else {
    fail('módulo financeiro faturaStatus/fluxo/periodo ainda usa new Date() por omissão')
  }
  if (
    libFinForm.includes('getSinalPagamentoFaturaFornecedor as getSinalPagamentoFaturaFornecedorPure') &&
    libFinForm.includes('normalizeFechamentoFluxoFinanceiroMap as normalizeFechamentoFluxoFinanceiroMapPure') &&
    libFinForm.includes('financeiroReferenciaDateFromFiltros as financeiroReferenciaDateFromFiltrosPure') &&
    nma.includes("from './lib/financeiroForm'")
  ) {
    ok('NonatoMainApp usa faturaStatus/fluxo/periodo via lib')
  } else {
    fail('lib/financeiroForm ainda não envolve faturaStatus/fluxo/periodo')
  }
  const faturaAnexo = fs.readFileSync(path.join(root, 'app/modules/financeiro/faturaAnexo.ts'), 'utf8')
  const libFaturaAnexo = exists('app/lib/financeiroFaturaAnexo.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/financeiroFaturaAnexo.ts'), 'utf8')
    : ''
  if (
    !faturaAnexo.includes('window.open') &&
    !faturaAnexo.includes('FileReader') &&
    libFaturaAnexo.includes('window.open') &&
    libFaturaAnexo.includes('FileReader') &&
    nma.includes("from './lib/financeiroFaturaAnexo'")
  ) {
    ok('NonatoMainApp abre anexo de fatura via lib')
  } else {
    fail('lib/financeiroFaturaAnexo ainda não envolve abrirFaturaAnexoDataUrl')
  }
} catch (e) {
  fail(`módulo financeiro: ${e.message}`)
}

// 3e) Módulo orçamentos (4.º corte + 58.º: PedidoOrcamento / buildFromRelatorio)
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
  if (
    idx.includes('PedidoOrcamento') &&
    idx.includes('buildPedidoOrcamentoFromRelatorio') &&
    idx.includes('relatorioTemPecasParaPedidoOrcamento')
  ) {
    ok('módulo orçamentos exporta PedidoOrcamento + buildFromRelatorio')
  } else {
    fail('módulo orçamentos incompleto (pedidoRelatorio no index.ts)')
  }
  for (const f of ['pedidoRelatorioTipos.ts', 'pedidoRelatorio.ts']) {
    if (exists(`app/modules/orcamentos/${f}`)) ok(`existe app/modules/orcamentos/${f}`)
    else fail(`falta app/modules/orcamentos/${f}`)
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/orcamentos'") || nma.includes('from "./modules/orcamentos"')) {
    ok('NonatoMainApp importa app/modules/orcamentos')
  } else {
    fail('NonatoMainApp não importa o módulo orçamentos')
  }
  if (
    !nma.includes('type PedidoOrcamento = {') &&
    nma.includes('buildPedidoOrcamentoFromRelatorio') &&
    nma.includes('relatorioTemPecasParaPedidoOrcamento')
  ) {
    ok('NonatoMainApp usa PedidoOrcamento do módulo orçamentos')
  } else {
    fail('NonatoMainApp ainda define PedidoOrcamento localmente ou não usa helpers do módulo')
  }
  const workflowSrc = fs.readFileSync(path.join(root, 'app/modules/orcamentos/workflow.ts'), 'utf8')
  const libWorkflow = fs.readFileSync(path.join(root, 'app/lib/orcamentoWorkflow.ts'), 'utf8')
  if (
    workflowSrc.includes('nowMs: number') &&
    !workflowSrc.includes('Date.now()') &&
    !workflowSrc.includes('new Date().toISOString()')
  ) {
    ok('módulo orçamentos criarPedidoSeparacaoFromOrcamento é puro (relógio injectado)')
  } else {
    fail('módulo orçamentos/workflow ainda usa Date.now')
  }
  if (
    libWorkflow.includes('criarPedidoSeparacaoFromOrcamento as criarPedidoSeparacaoFromOrcamentoPure') &&
    libWorkflow.includes('criarPedidoSeparacaoFromOrcamentoPure(orc, pecasBiblioteca, Date.now())')
  ) {
    ok('lib/orcamentoWorkflow só envolve o relógio da separação')
  } else {
    fail('lib/orcamentoWorkflow ainda reexporta criarPedidoSeparacaoFromOrcamento sem wrapper')
  }
  if (nma.includes("from './lib/orcamentoWorkflow'")) {
    ok('NonatoMainApp usa criarPedidoSeparacaoFromOrcamento via lib')
  } else {
    fail('NonatoMainApp não importa criarPedidoSeparacaoFromOrcamento do lib')
  }
  if (
    workflowSrc.includes('EQUIPAMENTO_ORCAMENTOS_CHANGED_EVENT') &&
    !workflowSrc.includes('window.dispatchEvent') &&
    !workflowSrc.includes('typeof window')
  ) {
    ok('módulo orçamentos notify de orçamentos é só o nome do evento')
  } else {
    fail('módulo orçamentos/workflow ainda usa window no notify')
  }
  if (
    libWorkflow.includes('export function notifyEquipamentoOrcamentosChanged(') &&
    libWorkflow.includes('window.dispatchEvent') &&
    libWorkflow.includes('EQUIPAMENTO_ORCAMENTOS_CHANGED_EVENT')
  ) {
    ok('lib/orcamentoWorkflow envolve o window do notify de orçamentos')
  } else {
    fail('lib/orcamentoWorkflow ainda não implementa notifyEquipamentoOrcamentosChanged')
  }
  if (nma.includes('criarPedidoSeparacaoFromOrcamento, notifyEquipamentoOrcamentosChanged')) {
    ok('NonatoMainApp usa notifyEquipamentoOrcamentosChanged via lib')
  } else {
    fail('NonatoMainApp ainda importa notifyEquipamentoOrcamentosChanged do módulo')
  }
  const pedidoRel = fs.readFileSync(path.join(root, 'app/modules/orcamentos/pedidoRelatorio.ts'), 'utf8')
  const libPedidoRel = exists('app/lib/pedidoOrcamentoRelatorio.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/pedidoOrcamentoRelatorio.ts'), 'utf8')
    : ''
  if (
    pedidoRel.includes('nowMs: number') &&
    !pedidoRel.includes('Date.now()') &&
    !pedidoRel.includes('new Date().toISOString()')
  ) {
    ok('módulo orçamentos buildPedidoOrcamentoFromRelatorio é puro (relógio injectado)')
  } else {
    fail('módulo orçamentos/pedidoRelatorio ainda usa Date.now')
  }
  if (
    libPedidoRel.includes("from '../modules/orcamentos/pedidoRelatorio'") &&
    libPedidoRel.includes('buildPedidoOrcamentoFromRelatorio as buildPedidoOrcamentoFromRelatorioPure') &&
    libPedidoRel.includes('Date.now()')
  ) {
    ok('lib/pedidoOrcamentoRelatorio só envolve o relógio do pedido')
  } else {
    fail('lib/pedidoOrcamentoRelatorio ainda não envolve buildPedidoOrcamentoFromRelatorio')
  }
  if (nma.includes("from './lib/pedidoOrcamentoRelatorio'")) {
    ok('NonatoMainApp usa buildPedidoOrcamentoFromRelatorio via lib')
  } else {
    fail('NonatoMainApp não importa buildPedidoOrcamentoFromRelatorio do lib')
  }
  if (
    nma.includes('persistTipoOrcamentoAvulsoSession') &&
    nma.includes('gravarTipoOrcamentoSessionSync')
  ) {
    ok('Orçamentos: tipo sobrevive a remount via sessionStorage')
  } else {
    fail('Orçamentos: falta persistência sync do tipo (regressão do seletor TIPO DE ORÇAMENTO)')
  }
  const rascunhoAvulso = fs.readFileSync(path.join(root, 'app/modules/orcamentos/rascunhoAvulso.ts'), 'utf8')
  const libRascunhoAvulso = exists('app/lib/orcamentoAvulsoRascunho.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/orcamentoAvulsoRascunho.ts'), 'utf8')
    : ''
  if (
    idx.includes('parseOrcamentoAvulsoRascunhoRaw') &&
    rascunhoAvulso.includes('nowMs: number') &&
    !rascunhoAvulso.includes('sessionStorage.getItem') &&
    !rascunhoAvulso.includes('sessionStorage.setItem') &&
    !rascunhoAvulso.includes('typeof window')
  ) {
    ok('módulo orçamentos rascunhoAvulso é puro (sessionStorage no lib)')
  } else {
    fail('módulo orçamentos/rascunhoAvulso ainda usa sessionStorage')
  }
  if (
    libRascunhoAvulso.includes('parseOrcamentoAvulsoRascunhoRaw') &&
    libRascunhoAvulso.includes('sessionStorage') &&
    libRascunhoAvulso.includes('Date.now()')
  ) {
    ok('lib/orcamentoAvulsoRascunho envolve sessionStorage do rascunho avulso')
  } else {
    fail('lib/orcamentoAvulsoRascunho ainda não envolve o rascunho avulso')
  }
  if (nma.includes("from './lib/orcamentoAvulsoRascunho'")) {
    ok('NonatoMainApp usa rascunho avulso via lib')
  } else {
    fail('NonatoMainApp não importa o rascunho avulso do lib')
  }
  if (
    idx.includes('montarRascunhoTipoOrcamento') &&
    rascunhoAvulso.includes('export function montarRascunhoTipoOrcamento') &&
    !rascunhoAvulso.includes('sessionStorage.getItem') &&
    !rascunhoAvulso.includes('sessionStorage.setItem')
  ) {
    ok('módulo orçamentos montarRascunhoTipoOrcamento é puro')
  } else {
    fail('módulo orçamentos/rascunhoAvulso ainda não exporta montarRascunhoTipoOrcamento puro')
  }
  if (
    libRascunhoAvulso.includes('montarRascunhoTipoOrcamento') &&
    libRascunhoAvulso.includes('lerOrcamentoAvulsoRascunhoSession() || fallback') &&
    libRascunhoAvulso.includes('gravarTipoOrcamentoSessionSync') &&
    libRascunhoAvulso.includes('{ sync: true }')
  ) {
    ok('lib/orcamentoAvulsoRascunho envolve gravarTipoOrcamentoSessionSync')
  } else {
    fail('lib/orcamentoAvulsoRascunho ainda não envolve gravarTipoOrcamentoSessionSync')
  }
  if (
    nma.includes('(orcamento.itens || []).length') &&
    nma.includes('(orcamento.itens || []).map') &&
    !nma.includes('orcamento.itens.length > 0') &&
    !nma.includes('orcamento.itens.map((item, index)')
  ) {
    ok('Orçamentos gerados: itens protegidos contra undefined (lista/histórico)')
  } else {
    fail('Orçamentos gerados: ainda há orcamento.itens.length/map sem fallback []')
  }
  if (
    idx.includes('OrcamentoPecasEspeciaisSalvo') &&
    idx.includes('emptyLinhaOrcamentoPecasEsp') &&
    idx.includes('createOrcamentoPecasEspeciaisFromForm') &&
    exists('app/modules/orcamentos/pecasEspeciaisTipos.ts') &&
    exists('app/modules/orcamentos/pecasEspeciaisForm.ts') &&
    exists('app/modules/orcamentos/pecasEspeciaisFromForm.ts')
  ) {
    ok('módulo orçamentos exporta peças especiais tipos/fromForm')
  } else {
    fail('módulo orçamentos sem peças especiais fromForm')
  }
  const ope = fs.readFileSync(path.join(root, 'app/components/OrcamentoPecasEspeciaisContent.tsx'), 'utf8')
  if (
    (ope.includes("from '../modules/orcamentos'") || ope.includes('from "../modules/orcamentos"')) &&
    ope.includes('emptyLinhaOrcamentoPecasEsp') &&
    ope.includes('createOrcamentoPecasEspeciaisFromForm') &&
    !ope.includes('export type LinhaOrcamentoPecasEsp = {')
  ) {
    ok('OrcamentoPecasEspeciaisContent usa fromForm do módulo orçamentos')
  } else {
    fail('OrcamentoPecasEspeciaisContent ainda define linha/salvo no sítio')
  }
  const pecasEspeciaisForm = fs.readFileSync(path.join(root, 'app/modules/orcamentos/pecasEspeciaisForm.ts'), 'utf8')
  const libPecasEspeciaisForm = exists('app/lib/pecasEspeciaisForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/pecasEspeciaisForm.ts'), 'utf8')
    : ''
  if (
    pecasEspeciaisForm.includes('nowMs: number') &&
    pecasEspeciaisForm.includes('random: () => number') &&
    !pecasEspeciaisForm.includes('Date.now()') &&
    !pecasEspeciaisForm.includes('Math.random') &&
    !pecasEspeciaisForm.includes('crypto')
  ) {
    ok('módulo orçamentos pecasEspeciaisForm é puro (relógio/aleatório injectados)')
  } else {
    fail('módulo orçamentos/pecasEspeciaisForm ainda usa Date.now, Math.random ou crypto')
  }
  if (
    libPecasEspeciaisForm.includes("from '../modules/orcamentos/pecasEspeciaisForm'") &&
    libPecasEspeciaisForm.includes('newPecasEspeciaisEntityId as newPecasEspeciaisEntityIdPure') &&
    libPecasEspeciaisForm.includes('emptyLinhaOrcamentoPecasEsp as emptyLinhaOrcamentoPecasEspPure') &&
    libPecasEspeciaisForm.includes('Date.now()') &&
    libPecasEspeciaisForm.includes('Math.random')
  ) {
    ok('lib/pecasEspeciaisForm só envolve relógio/aleatório das peças especiais')
  } else {
    fail('lib/pecasEspeciaisForm ainda não envolve os ids das peças especiais')
  }
  if (ope.includes("from '../lib/pecasEspeciaisForm'")) {
    ok('OrcamentoPecasEspeciaisContent usa peças especiais form via lib')
  } else {
    fail('OrcamentoPecasEspeciaisContent não importa peças especiais form do lib')
  }
  const pecasEspeciaisFromForm = fs.readFileSync(
    path.join(root, 'app/modules/orcamentos/pecasEspeciaisFromForm.ts'),
    'utf8'
  )
  if (
    pecasEspeciaisFromForm.includes('nowMs: number') &&
    !pecasEspeciaisFromForm.includes('new Date().toISOString()') &&
    !pecasEspeciaisFromForm.includes('Date.now()')
  ) {
    ok('módulo orçamentos pecasEspeciaisFromForm é puro (relógio injectado)')
  } else {
    fail('módulo orçamentos/pecasEspeciaisFromForm ainda usa new Date()')
  }
  if (
    idx.includes('PedidoAvulsoGuardado') &&
    idx.includes('emptyEquipamentoBlocoPedido') &&
    idx.includes('createPedidoAvulsoFromForm') &&
    exists('app/modules/orcamentos/pedidoAvulsoTipos.ts') &&
    exists('app/modules/orcamentos/pedidoAvulsoForm.ts') &&
    exists('app/modules/orcamentos/pedidoAvulsoFromForm.ts')
  ) {
    ok('módulo orçamentos exporta pedido avulso tipos/fromForm')
  } else {
    fail('módulo orçamentos sem pedido avulso fromForm')
  }
  const poa = fs.readFileSync(path.join(root, 'app/components/PedidoOrcamentosAvulsoContent.tsx'), 'utf8')
  if (
    (poa.includes("from '../modules/orcamentos'") || poa.includes('from "../modules/orcamentos"')) &&
    poa.includes('emptyEquipamentoBlocoPedido') &&
    poa.includes('createPedidoAvulsoFromForm') &&
    poa.includes('createPecaPedidoFromForm') &&
    !poa.includes('export type PedidoAvulsoGuardado = {')
  ) {
    ok('PedidoOrcamentosAvulsoContent usa fromForm do módulo orçamentos')
  } else {
    fail('PedidoOrcamentosAvulsoContent ainda define pedido avulso no sítio')
  }
  const pedidoAvulsoFromForm = fs.readFileSync(path.join(root, 'app/modules/orcamentos/pedidoAvulsoFromForm.ts'), 'utf8')
  const libPedidoAvulsoFromForm = exists('app/lib/pedidoAvulsoFromForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/pedidoAvulsoFromForm.ts'), 'utf8')
    : ''
  if (
    pedidoAvulsoFromForm.includes('nowMs: number') &&
    !pedidoAvulsoFromForm.includes('Date.now()') &&
    !pedidoAvulsoFromForm.includes('new Date().toISOString()')
  ) {
    ok('módulo orçamentos pedidoAvulsoFromForm é puro (relógio injectado)')
  } else {
    fail('módulo orçamentos/pedidoAvulsoFromForm ainda usa Date.now')
  }
  if (
    libPedidoAvulsoFromForm.includes("from '../modules/orcamentos/pedidoAvulsoFromForm'") &&
    libPedidoAvulsoFromForm.includes('createPecaPedidoFromForm as createPecaPedidoFromFormPure') &&
    libPedidoAvulsoFromForm.includes('createPedidoAvulsoFromForm as createPedidoAvulsoFromFormPure') &&
    libPedidoAvulsoFromForm.includes('Date.now()')
  ) {
    ok('lib/pedidoAvulsoFromForm só envolve o relógio do pedido avulso')
  } else {
    fail('lib/pedidoAvulsoFromForm ainda não envolve o pedido avulso fromForm')
  }
  if (poa.includes("from '../lib/pedidoAvulsoFromForm'")) {
    ok('PedidoOrcamentosAvulsoContent usa pedido avulso fromForm via lib')
  } else {
    fail('PedidoOrcamentosAvulsoContent não importa pedido avulso fromForm do lib')
  }
  const pedidoAvulsoForm = fs.readFileSync(path.join(root, 'app/modules/orcamentos/pedidoAvulsoForm.ts'), 'utf8')
  const libPedidoAvulsoForm = exists('app/lib/pedidoAvulsoForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/pedidoAvulsoForm.ts'), 'utf8')
    : ''
  if (
    pedidoAvulsoForm.includes('nowMs: number') &&
    pedidoAvulsoForm.includes('random: () => number') &&
    !pedidoAvulsoForm.includes('Date.now()') &&
    !pedidoAvulsoForm.includes('Math.random')
  ) {
    ok('módulo orçamentos pedidoAvulsoForm é puro (relógio/aleatório injectados)')
  } else {
    fail('módulo orçamentos/pedidoAvulsoForm ainda usa Date.now ou Math.random')
  }
  if (
    libPedidoAvulsoForm.includes("from '../modules/orcamentos/pedidoAvulsoForm'") &&
    libPedidoAvulsoForm.includes('newPedidoAvulsoEntityId as newPedidoAvulsoEntityIdPure') &&
    libPedidoAvulsoForm.includes('emptyEquipamentoBlocoPedido as emptyEquipamentoBlocoPedidoPure') &&
    libPedidoAvulsoForm.includes('Date.now()') &&
    libPedidoAvulsoForm.includes('Math.random')
  ) {
    ok('lib/pedidoAvulsoForm só envolve relógio/aleatório do pedido avulso')
  } else {
    fail('lib/pedidoAvulsoForm ainda não envolve os ids do pedido avulso')
  }
  if (poa.includes("from '../lib/pedidoAvulsoForm'")) {
    ok('PedidoOrcamentosAvulsoContent usa emptyEquipamentoBlocoPedido via lib')
  } else {
    fail('PedidoOrcamentosAvulsoContent não importa emptyEquipamentoBlocoPedido do lib')
  }
  if (
    idx.includes('OstPropostaSalva') &&
    idx.includes('emptyOstPropostaLinha') &&
    idx.includes('createOstPropostaFromForm') &&
    exists('app/modules/orcamentos/ostTipos.ts') &&
    exists('app/modules/orcamentos/ostForm.ts') &&
    exists('app/modules/orcamentos/ostFromForm.ts')
  ) {
    ok('módulo orçamentos exporta OST tipos/fromForm')
  } else {
    fail('módulo orçamentos sem OST fromForm')
  }
  const ostUi = fs.readFileSync(path.join(root, 'app/components/OrcamentoServicoTecnicoContent.tsx'), 'utf8')
  const ostIo = fs.readFileSync(path.join(root, 'app/components/orcamentoOstPropostas.ts'), 'utf8')
  if (
    (ostUi.includes("from '../modules/orcamentos'") || ostUi.includes('from "../modules/orcamentos"')) &&
    ostUi.includes('emptyOstPropostaLinha') &&
    ostUi.includes('createOstPropostaFromForm') &&
    !ostUi.includes('export type ServicoOrcamentoLinha = {') &&
    (ostIo.includes("from '../modules/orcamentos'") || ostIo.includes('from "../modules/orcamentos"')) &&
    !ostIo.includes('export type OstPropostaSalva = {')
  ) {
    ok('OST UI/I/O usa tipos/fromForm do módulo orçamentos')
  } else {
    fail('OST ainda define proposta/linha no sítio')
  }
  const ostForm = fs.readFileSync(path.join(root, 'app/modules/orcamentos/ostForm.ts'), 'utf8')
  const ostFromForm = fs.readFileSync(path.join(root, 'app/modules/orcamentos/ostFromForm.ts'), 'utf8')
  const libOstForm = exists('app/lib/ostForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/ostForm.ts'), 'utf8')
    : ''
  if (
    ostForm.includes('nowMs: number') &&
    ostForm.includes('random: () => number') &&
    !ostForm.includes('Date.now()') &&
    !ostForm.includes('Math.random') &&
    !ostForm.includes('crypto')
  ) {
    ok('módulo orçamentos ostForm é puro (relógio/aleatório injectados)')
  } else {
    fail('módulo orçamentos/ostForm ainda usa Date.now, Math.random ou crypto')
  }
  if (
    ostFromForm.includes('nowMs: number') &&
    !ostFromForm.includes('new Date().toISOString()') &&
    !ostFromForm.includes('Date.now()')
  ) {
    ok('módulo orçamentos ostFromForm é puro (relógio injectado)')
  } else {
    fail('módulo orçamentos/ostFromForm ainda usa new Date()')
  }
  if (
    libOstForm.includes("from '../modules/orcamentos/ostForm'") &&
    libOstForm.includes('newOstEntityId as newOstEntityIdPure') &&
    libOstForm.includes('createOstPropostaFromForm as createOstPropostaFromFormPure') &&
    libOstForm.includes('Date.now()') &&
    libOstForm.includes('Math.random')
  ) {
    ok('lib/ostForm só envolve relógio/aleatório do OST')
  } else {
    fail('lib/ostForm ainda não envolve os ids/datas do OST')
  }
  if (ostUi.includes("from '../lib/ostForm'")) {
    ok('OrcamentoServicoTecnicoContent usa OST form via lib')
  } else {
    fail('OrcamentoServicoTecnicoContent não importa OST form do lib')
  }
  if (
    idx.includes('OrcamentoGeradoItem') &&
    idx.includes('resolverNomeClienteOrcamentoGerado') &&
    exists('app/modules/orcamentos/geradoTipos.ts')
  ) {
    ok('módulo orçamentos exporta OrcamentoGeradoItem')
  } else {
    fail('módulo orçamentos sem OrcamentoGeradoItem')
  }
  const ogBrowse = fs.readFileSync(path.join(root, 'app/components/OrcamentosGeradosBrowse.tsx'), 'utf8')
  if (
    (ogBrowse.includes("from '../modules/orcamentos'") || ogBrowse.includes('from "../modules/orcamentos"')) &&
    ogBrowse.includes('resolverNomeClienteOrcamentoGerado') &&
    !ogBrowse.includes('export type OrcamentoGeradoItem = {')
  ) {
    ok('OrcamentosGeradosBrowse usa OrcamentoGeradoItem do módulo orçamentos')
  } else {
    fail('OrcamentosGeradosBrowse ainda define OrcamentoGeradoItem no sítio')
  }
  if (
    idx.includes('buildOrcamentoConfirmacaoPdfHtml') &&
    idx.includes('OrcamentoConfirmacaoKind') &&
    exists('app/modules/orcamentos/confirmacaoPdf.ts')
  ) {
    ok('módulo orçamentos exporta confirmacaoPdf')
  } else {
    fail('módulo orçamentos sem confirmacaoPdf')
  }
  const libOrcConf = fs.readFileSync(path.join(root, 'app/lib/pdfOrcamentoConfirmacao.ts'), 'utf8')
  if (
    libOrcConf.includes("from '../modules/orcamentos/confirmacaoPdf'") &&
    libOrcConf.includes('Date.now()') &&
    !libOrcConf.includes('function metaTableRows(')
  ) {
    ok('lib/pdfOrcamentoConfirmacao só envolve o relógio da confirmação')
  } else {
    fail('lib/pdfOrcamentoConfirmacao ainda implementa o HTML da confirmação')
  }
  if (
    idx.includes('resolverEmpresaPedidoOrcamentoPdf') &&
    idx.includes('EMPRESA_NONATO_DEFAULT') &&
    exists('app/modules/orcamentos/empresaPdf.ts')
  ) {
    ok('módulo orçamentos exporta empresaPdf')
  } else {
    fail('módulo orçamentos sem empresaPdf')
  }
  const libOrcPdf = fs.readFileSync(path.join(root, 'app/lib/orcamentoPdfPro.ts'), 'utf8')
  if (
    libOrcPdf.includes("from '../modules/orcamentos/empresaPdf'") &&
    !libOrcPdf.includes('export function clienteParaEmpresaPdf(') &&
    !libOrcPdf.includes('export function resolverEmpresaPedidoOrcamentoPdf(') &&
    !libOrcPdf.includes('export const EMPRESA_NONATO_DEFAULT')
  ) {
    ok('lib/orcamentoPdfPro só reexporta empresaPdf do módulo')
  } else {
    fail('lib/orcamentoPdfPro ainda implementa o bloco de empresa')
  }
  if (
    idx.includes('buildOrcamentoPdfShell') &&
    idx.includes('ORCAMENTO_PDF_PRO_CSS') &&
    exists('app/modules/orcamentos/pdfProShell.ts')
  ) {
    ok('módulo orçamentos exporta pdfProShell')
  } else {
    fail('módulo orçamentos sem pdfProShell')
  }
  if (
    libOrcPdf.includes("from '../modules/orcamentos/pdfProShell'") &&
    !libOrcPdf.includes('export function buildOrcamentoPdfShell(') &&
    !libOrcPdf.includes('export const ORCAMENTO_PDF_PRO_CSS')
  ) {
    ok('lib/orcamentoPdfPro só reexporta pdfProShell do módulo')
  } else {
    fail('lib/orcamentoPdfPro ainda implementa o CSS/wrap do PDF')
  }
  if (idx.includes('fmtDataPdf') && exists('app/modules/orcamentos/fmtDataPdf.ts')) {
    ok('módulo orçamentos exporta fmtDataPdf')
  } else {
    fail('módulo orçamentos sem fmtDataPdf')
  }
  if (
    libOrcPdf.includes("from '../modules/orcamentos/fmtDataPdf'") &&
    libOrcPdf.includes('Date.now()') &&
    !libOrcPdf.includes("new Date().toLocaleDateString('pt-PT')")
  ) {
    ok('lib/orcamentoPdfPro só envolve o relógio de fmtDataPdf')
  } else {
    fail('lib/orcamentoPdfPro ainda implementa a formatação de data do PDF')
  }
  const numAvulso = fs.readFileSync(path.join(root, 'app/modules/orcamentos/numeroAvulso.ts'), 'utf8')
  const libOrcNum = exists('app/lib/orcamentosNumero.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/orcamentosNumero.ts'), 'utf8')
    : ''
  if (
    numAvulso.includes('nowMs: number') &&
    !numAvulso.includes('const now = new Date()')
  ) {
    ok('módulo orçamentos numeroAvulso é puro (relógio injectado)')
  } else {
    fail('módulo orçamentos/numeroAvulso ainda usa new Date()')
  }
  if (
    libOrcNum.includes('gerarProximoNumeroOrcamentoAvulso as gerarProximoNumeroOrcamentoAvulsoPure') &&
    nma.includes("from './lib/orcamentosNumero'")
  ) {
    ok('NonatoMainApp usa numeração avulsa via lib')
  } else {
    fail('lib/orcamentosNumero ainda não envolve gerarProximoNumeroOrcamentoAvulso')
  }
  const eqOrc = fs.readFileSync(path.join(root, 'app/modules/orcamentos/equipamento.ts'), 'utf8')
  if (
    eqOrc.includes('nowMs: number') &&
    !eqOrc.includes('new Date().getFullYear()')
  ) {
    ok('módulo orçamentos equipamento é puro (relógio injectado)')
  } else {
    fail('módulo orçamentos/equipamento ainda usa new Date().getFullYear()')
  }
  if (
    libOrcNum.includes('gerarProximoCodigoPedidoRelatorio as gerarProximoCodigoPedidoRelatorioPure') &&
    nma.includes('gerarProximoCodigoPedidoRelatorio')
  ) {
    ok('NonatoMainApp usa código POR via lib')
  } else {
    fail('lib/orcamentosNumero ainda não envolve gerarProximoCodigoPedidoRelatorio')
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
  const libHomag = fs.readFileSync(path.join(root, 'app/lib/parseHomagClipboard.ts'), 'utf8')
  const parsePlain = fs.readFileSync(path.join(root, 'app/modules/biblioteca/importParsePlain.ts'), 'utf8')
  const parseHtml = fs.readFileSync(path.join(root, 'app/modules/biblioteca/importParseHtml.ts'), 'utf8')
  const clip = fs.readFileSync(path.join(root, 'app/modules/biblioteca/catalogClipboard.ts'), 'utf8')
  if (
    idx.includes('parseHomagPlainTextCatalog') &&
    idx.includes('looksLikeHomagClipboard') &&
    idx.includes('mergeHomagClipboardItems') &&
    exists('app/modules/biblioteca/homagClipboard.ts')
  ) {
    ok('módulo biblioteca exporta homagClipboard')
  } else {
    fail('módulo biblioteca sem homagClipboard')
  }
  if (
    libHomag.includes("from '../modules/biblioteca/homagClipboard'") &&
    !libHomag.includes('export function parseHomagPlainTextCatalog(')
  ) {
    ok('lib/parseHomagClipboard só reexporta biblioteca/homagClipboard')
  } else {
    fail('lib/parseHomagClipboard ainda implementa o parser HOMAG')
  }
  if (
    nma.includes('parseHomagPlainTextCatalog') &&
    !nma.includes("from './lib/parseHomagClipboard'") &&
    parsePlain.includes("from './homagClipboard'") &&
    parseHtml.includes("from './homagClipboard'") &&
    clip.includes("from './homagClipboard'")
  ) {
    ok('NMA/import parse usam homagClipboard do módulo biblioteca')
  } else {
    fail('consumidores ainda importam parseHomagClipboard do lib')
  }
  const libHomagExport = fs.readFileSync(path.join(root, 'app/lib/mergeHomagExport.ts'), 'utf8')
  if (
    idx.includes('parseHomagExportJson') &&
    idx.includes('mergeHomagExportIntoBiblioteca') &&
    exists('app/modules/biblioteca/homagExport.ts')
  ) {
    ok('módulo biblioteca exporta homagExport')
  } else {
    fail('módulo biblioteca sem homagExport')
  }
  if (
    libHomagExport.includes("from '../modules/biblioteca/homagExport'") &&
    libHomagExport.includes('Date.now()') &&
    libHomagExport.includes('Math.random()') &&
    !libHomagExport.includes('export function parseHomagExportJson(')
  ) {
    ok('lib/mergeHomagExport só envolve relógio/aleatório do módulo')
  } else {
    fail('lib/mergeHomagExport ainda implementa o merge HOMAG')
  }
  if (
    nma.includes('parseHomagExportJson') &&
    nma.includes('mergeHomagExportIntoBiblioteca') &&
    nma.includes("from './lib/mergeHomagExport'") &&
    !nma.includes('import { mergeHomagExportIntoBiblioteca, parseHomagExportJson }')
  ) {
    ok('NonatoMainApp usa parseHomagExportJson do módulo e merge via lib')
  } else {
    fail('NonatoMainApp sem homagExport do módulo/lib')
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
  if (!exists('app/modules/biblioteca/pecaTipos.ts')) {
    fail('falta app/modules/biblioteca/pecaTipos.ts')
  } else {
    ok('existe app/modules/biblioteca/pecaTipos.ts')
  }
  if (!exists('app/modules/biblioteca/pecaForm.ts')) {
    fail('falta app/modules/biblioteca/pecaForm.ts')
  } else {
    ok('existe app/modules/biblioteca/pecaForm.ts')
  }
  if (
    idx.includes('createEmptyPecaBibliotecaForm') &&
    idx.includes('PecaBiblioteca') &&
    idx.includes('CategoriaPeca') &&
    idx.includes('SubcategoriaPeca')
  ) {
    ok('módulo biblioteca exporta tipos canónicos / form vazio peça')
  } else {
    fail('módulo biblioteca sem createEmptyPecaBibliotecaForm / PecaBiblioteca / CategoriaPeca')
  }
  if (
    nma.includes('createEmptyPecaBibliotecaForm') &&
    !nma.includes('type CategoriaPeca = {') &&
    !nma.includes('type PecaBiblioteca = {')
  ) {
    ok('NonatoMainApp usa tipos/form peça da biblioteca do módulo')
  } else {
    fail('NonatoMainApp ainda define CategoriaPeca/PecaBiblioteca localmente ou não usa createEmptyPecaBibliotecaForm')
  }
  if (
    idx.includes('isPecaBibliotecaFormValid') &&
    idx.includes('createPecaBibliotecaFromForm') &&
    idx.includes('updatePecaBibliotecaFromForm') &&
    exists('app/modules/biblioteca/pecaFromForm.ts')
  ) {
    ok('módulo biblioteca exporta PecaBiblioteca form/fromForm')
  } else {
    fail('módulo biblioteca sem PecaBiblioteca form/fromForm')
  }
  if (
    nma.includes('isPecaBibliotecaFormValid') &&
    nma.includes('createPecaBibliotecaFromForm') &&
    nma.includes('updatePecaBibliotecaFromForm')
  ) {
    ok('NonatoMainApp usa PecaBiblioteca fromForm do módulo')
  } else {
    fail('NonatoMainApp ainda mapeia PecaBiblioteca no sítio')
  }
  if (
    idx.includes('isCategoriaPecaFormValid') &&
    idx.includes('createCategoriaPecaFromForm') &&
    idx.includes('inserirCategoriaPecaAposRef') &&
    idx.includes('isSubcategoriaPecaFormValid') &&
    idx.includes('createSubcategoriaPecaFromForm') &&
    idx.includes('inserirSubcategoriaPecaAposRef') &&
    exists('app/modules/biblioteca/categoriaFromForm.ts')
  ) {
    ok('módulo biblioteca exporta CategoriaPeca/SubcategoriaPeca fromForm')
  } else {
    fail('módulo biblioteca sem CategoriaPeca/SubcategoriaPeca fromForm')
  }
  if (
    nma.includes('isCategoriaPecaFormValid') &&
    nma.includes('createCategoriaPecaFromForm') &&
    nma.includes('inserirCategoriaPecaAposRef') &&
    nma.includes('isSubcategoriaPecaFormValid') &&
    nma.includes('createSubcategoriaPecaFromForm') &&
    nma.includes('inserirSubcategoriaPecaAposRef')
  ) {
    ok('NonatoMainApp usa CategoriaPeca/SubcategoriaPeca fromForm do módulo')
  } else {
    fail('NonatoMainApp ainda mapeia CategoriaPeca/SubcategoriaPeca no sítio')
  }
  const pecaFromForm = fs.readFileSync(path.join(root, 'app/modules/biblioteca/pecaFromForm.ts'), 'utf8')
  const catFromForm = fs.readFileSync(path.join(root, 'app/modules/biblioteca/categoriaFromForm.ts'), 'utf8')
  const classif = fs.readFileSync(path.join(root, 'app/modules/biblioteca/classificacao.ts'), 'utf8')
  const libBibFromForm = exists('app/lib/bibliotecaFromForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/bibliotecaFromForm.ts'), 'utf8')
    : ''
  if (
    pecaFromForm.includes('nowMs: number') &&
    pecaFromForm.includes('random: () => number') &&
    !pecaFromForm.includes('Date.now()') &&
    !pecaFromForm.includes('Math.random') &&
    !pecaFromForm.includes('new Date().toISOString()') &&
    catFromForm.includes('nowMs: number') &&
    !catFromForm.includes('Date.now()')
  ) {
    ok('módulo biblioteca peca/categoria fromForm é puro (relógio/aleatório injectados)')
  } else {
    fail('módulo biblioteca pecaFromForm/categoriaFromForm ainda usa Date.now ou Math.random')
  }
  if (
    classif.includes('nowMs: number') &&
    !classif.includes('Date.now()') &&
    !classif.includes('Math.random') &&
    !classif.includes('new Date().toISOString()')
  ) {
    ok('módulo biblioteca classificacao é puro (relógio/aleatório injectados)')
  } else {
    fail('módulo biblioteca/classificacao ainda usa Date.now, Math.random ou new Date()')
  }
  if (
    libBibFromForm.includes('createPecaBibliotecaFromForm as createPecaBibliotecaFromFormPure') &&
    libBibFromForm.includes('createCategoriaPecaFromForm as createCategoriaPecaFromFormPure') &&
    libBibFromForm.includes('createSubcategoriaPecaFromForm as createSubcategoriaPecaFromFormPure') &&
    libBibFromForm.includes('criarRegraClassificacaoPeca as criarRegraClassificacaoPecaPure') &&
    libBibFromForm.includes('createEmptyPecaBibliotecaForm as createEmptyPecaBibliotecaFormPure') &&
    nma.includes("from './lib/bibliotecaFromForm'")
  ) {
    ok('NonatoMainApp usa biblioteca fromForm via lib')
  } else {
    fail('lib/bibliotecaFromForm ainda não envolve o fromForm')
  }
  const importMappers = fs.readFileSync(path.join(root, 'app/modules/biblioteca/importMappers.ts'), 'utf8')
  const importParse = fs.readFileSync(path.join(root, 'app/modules/biblioteca/importParse.ts'), 'utf8')
  const libBibImport = exists('app/lib/bibliotecaImport.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/bibliotecaImport.ts'), 'utf8')
    : ''
  if (
    importMappers.includes('nowMs: number') &&
    importMappers.includes('random: () => number') &&
    !importMappers.includes('Date.now()') &&
    !importMappers.includes('Math.random') &&
    importParse.includes('MapItemToPecaBibliotecaOpts') &&
    !importParse.includes('Date.now()')
  ) {
    ok('módulo biblioteca importMappers/importParse é puro (relógio/aleatório injectados)')
  } else {
    fail('módulo biblioteca importMappers/importParse ainda usa Date.now ou Math.random')
  }
  if (
    libBibImport.includes('mapItemToPecaBiblioteca as mapItemToPecaBibliotecaPure') &&
    libBibImport.includes('parseRawToPecas as parseRawToPecasPure') &&
    nma.includes("from './lib/bibliotecaImport'")
  ) {
    ok('NonatoMainApp usa importação da biblioteca via lib')
  } else {
    fail('lib/bibliotecaImport ainda não envolve o parse/map de importação')
  }
  const pecaForm = fs.readFileSync(path.join(root, 'app/modules/biblioteca/pecaForm.ts'), 'utf8')
  if (
    pecaForm.includes('nowMs: number') &&
    !pecaForm.includes('new Date().toISOString()')
  ) {
    ok('módulo biblioteca pecaForm é puro (relógio injectado)')
  } else {
    fail('módulo biblioteca/pecaForm ainda usa new Date()')
  }
  const pecasBackup = fs.readFileSync(path.join(root, 'app/modules/biblioteca/pecasBackup.ts'), 'utf8')
  const libPecasBackup = exists('app/lib/bibliotecaPecasBackup.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/bibliotecaPecasBackup.ts'), 'utf8')
    : ''
  const adminPecasBackup = exists('app/components/admin/AdminPecasBackupSection.tsx')
    ? fs.readFileSync(path.join(root, 'app/components/admin/AdminPecasBackupSection.tsx'), 'utf8')
    : ''
  if (
    pecasBackup.includes('nowMs: number') &&
    !pecasBackup.includes('new Date().toISOString()') &&
    !pecasBackup.includes('date = new Date()')
  ) {
    ok('módulo biblioteca pecasBackup é puro (relógio injectado)')
  } else {
    fail('módulo biblioteca/pecasBackup ainda usa new Date()')
  }
  if (
    libPecasBackup.includes('buildPecasBackupPayload as buildPecasBackupPayloadPure') &&
    adminPecasBackup.includes("from '../../lib/bibliotecaPecasBackup'")
  ) {
    ok('AdminPecasBackupSection usa backup de peças via lib')
  } else {
    fail('lib/bibliotecaPecasBackup ainda não envolve o backup de peças')
  }
  if (
    !pecasBackup.includes('document.createElement') &&
    libPecasBackup.includes('downloadJsonBlob') &&
    adminPecasBackup.includes('downloadJsonBlob')
  ) {
    ok('AdminPecasBackupSection descarrega JSON via lib')
  } else {
    fail('lib/bibliotecaPecasBackup ainda não envolve downloadJsonBlob')
  }
  const avisoMod = fs.readFileSync(path.join(root, 'app/modules/biblioteca/aviso.ts'), 'utf8')
  const libAviso = exists('app/lib/bibliotecaAviso.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/bibliotecaAviso.ts'), 'utf8')
    : ''
  const syncMod = fs.readFileSync(path.join(root, 'app/modules/biblioteca/syncCoordinator.ts'), 'utf8')
  const libSync = exists('app/lib/pecasBibliotecaSyncCoordinator.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/pecasBibliotecaSyncCoordinator.ts'), 'utf8')
    : ''
  if (
    avisoMod.includes('readItem: (key: string) => string | null') &&
    !avisoMod.includes('localStorage') &&
    !avisoMod.includes('Notification') &&
    libAviso.includes('localStorage') &&
    nma.includes("from './lib/bibliotecaAviso'")
  ) {
    ok('NonatoMainApp usa aviso de biblioteca via lib')
  } else {
    fail('lib/bibliotecaAviso ainda não envolve storage/notificação')
  }
  if (
    syncMod.includes('matchMedia: (query: string) => boolean') &&
    !syncMod.includes('window.matchMedia') &&
    libSync.includes('window.matchMedia') &&
    nma.includes("from './lib/pecasBibliotecaSyncCoordinator'")
  ) {
    ok('NonatoMainApp detecta biblioteca mobile via lib')
  } else {
    fail('lib/pecasBibliotecaSyncCoordinator ainda não envolve isBibliotecaMobileDevice')
  }
  const completeMod = fs.readFileSync(path.join(root, 'app/modules/biblioteca/completeness.ts'), 'utf8')
  const libComplete = exists('app/lib/pecasBibliotecaCompleteness.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/pecasBibliotecaCompleteness.ts'), 'utf8')
    : ''
  if (
    completeMod.includes('readItem: BibliotecaStorageGet') &&
    !completeMod.includes('localStorage') &&
    libComplete.includes('localStorage.getItem') &&
    nma.includes("from './lib/pecasBibliotecaCompleteness'")
  ) {
    ok('NonatoMainApp usa cache de peças via lib')
  } else {
    fail('lib/pecasBibliotecaCompleteness ainda não envolve getCachedPecasBibliotecaServerTotal')
  }
  if (
    syncMod.includes('readItem?: (key: string) => string | null') &&
    libSync.includes('shouldRejectPartialPecasSave as shouldRejectPartialPecasSavePure')
  ) {
    ok('lib/pecasBibliotecaSyncCoordinator envolve shouldRejectPartialPecasSave')
  } else {
    fail('lib/pecasBibliotecaSyncCoordinator ainda não envolve shouldRejectPartialPecasSave')
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
    idx.includes('buildRelatorioEspecialPdfHtml') &&
    idx.includes('defaultRelatorioEspecialPdfSecoes') &&
    idx.includes('normalizeRelatorioEspecialPdfSecoes') &&
    idx.includes('temAlgumaSecaoPdfEspecial') &&
    idx.includes('diaContaComoDiariaEspecial') &&
    idx.includes('dedupeRelatoriosEspeciais') &&
    idx.includes('upsertRelatorioEspecialNaLista') &&
    idx.includes('calcularTotaisFechamentoEspecialPorCliente') &&
    idx.includes('deveSepararFechamentoEspecialPorCliente') &&
    idx.includes('chaveLocalDiaTrabalhoEspecial') &&
    idx.includes('FECHAMENTO_ESPECIAL_GRUPO_ARMAZEM') &&
    idx.includes('rotuloLocalDiaTrabalhoEspecial') &&
    idx.includes('rotuloEquipamentoDiaComClientesEspecial') &&
    idx.includes('coletarOpcoesLocalDiaEspecial') &&
    idx.includes('opcoesEquipamentoSelectDiaEspecial') &&
    idx.includes('aplicarSelecaoEquipamentoDiaEspecial') &&
    idx.includes('formatHorasGrupoFechamentoEspecial')
  ) {
    ok('módulo relatorios-especiais exporta cálculos/fechamento/PDF')
  } else {
    fail('módulo relatorios-especiais incompleto (index.ts)')
  }
  const hub = fs.readFileSync(path.join(root, 'app/components/RelatorioEspecialHub.tsx'), 'utf8')
  {
    const eqDia = exists('app/modules/relatorios-especiais/equipamentosDia.ts')
      ? fs.readFileSync(path.join(root, 'app/modules/relatorios-especiais/equipamentosDia.ts'), 'utf8')
      : ''
    if (
      eqDia.includes('opcoesEquipamentoSelectDiaEspecial') &&
      eqDia.includes('equipamentosClienteParaSelectRelatorio') &&
      eqDia.includes('PREFIXO_OPCAO_CADASTRO_DIA') &&
      !eqDia.includes('Date.now()') &&
      !eqDia.includes('Math.random')
    ) {
      ok('relatório especial: select do dia usa cadastro do cliente do local')
    } else {
      fail('select do dia do relatório especial ainda não lê o cadastro do cliente')
    }
    if (
      hub.includes('opcoesEquipamentoSelectDiaEspecial') &&
      hub.includes('aplicarSelecaoEquipamentoDiaEspecial') &&
      !hub.includes('opcoesSelectEquipamentoDia')
    ) {
      ok('hub especial: horas do dia ligadas ao cadastro do local')
    } else {
      fail('hub especial ainda lista só equipamentos já no relatório')
    }
  }
  const reTipos = fs.readFileSync(path.join(root, 'app/modules/relatorios-especiais/tipos.ts'), 'utf8')
  const libReTypes = exists('app/lib/relatorioEspecialTypes.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/relatorioEspecialTypes.ts'), 'utf8')
    : ''
  if (
    reTipos.includes('nowMs: number') &&
    !reTipos.includes('Date.now()') &&
    !reTipos.includes('Math.random')
  ) {
    ok('módulo relatorios-especiais tipos é puro (relógio/aleatório injectados)')
  } else {
    fail('módulo relatorios-especiais/tipos ainda usa Date.now ou Math.random')
  }
  if (
    libReTypes.includes('criarDiaTrabalhoEspecialVazio as criarDiaTrabalhoEspecialVazioPure') &&
    libReTypes.includes('criarRelatorioEspecialVazio as criarRelatorioEspecialVazioPure') &&
    hub.includes("from '../lib/relatorioEspecialTypes'")
  ) {
    ok('RelatorioEspecialHub usa tipos vazios via lib')
  } else {
    fail('lib/relatorioEspecialTypes ainda não envolve os formulários vazios')
  }
  const reShared = fs.readFileSync(path.join(root, 'app/modules/relatorios-especiais/shared.ts'), 'utf8')
  const libReShared = exists('app/lib/relatorioEspecialShared.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/relatorioEspecialShared.ts'), 'utf8')
    : ''
  if (
    reShared.includes('nowMs: number') &&
    !reShared.includes('date = new Date()') &&
    !reShared.includes('Date.now()')
  ) {
    ok('módulo relatorios-especiais shared é puro (relógio injectado)')
  } else {
    fail('módulo relatorios-especiais/shared ainda usa new Date() por omissão')
  }
  if (
    libReShared.includes('dataLocalHojeISO as dataLocalHojeISOPure') &&
    hub.includes("from '../lib/relatorioEspecialShared'")
  ) {
    ok('RelatorioEspecialHub usa dataLocalHojeISO via lib')
  } else {
    fail('lib/relatorioEspecialShared ainda não envolve dataLocalHojeISO')
  }
  const pdfMod = fs.readFileSync(path.join(root, 'app/modules/relatorios-especiais/pdf.ts'), 'utf8')
  const libRePdf = exists('app/lib/relatorioEspecialPdf.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/relatorioEspecialPdf.ts'), 'utf8')
    : ''
  if (
    pdfMod.includes('nowMs: number') &&
    pdfMod.includes('buildRelatorioEspecialPdfHtml') &&
    !pdfMod.includes('window.open') &&
    !pdfMod.includes('new Date().toLocaleString') &&
    libRePdf.includes('buildRelatorioEspecialPdfHtml') &&
    libRePdf.includes('window.open') &&
    hub.includes("from '../lib/relatorioEspecialPdf'")
  ) {
    ok('RelatorioEspecialHub usa PDF via lib (relógio e janela injectados)')
  } else {
    fail('lib/relatorioEspecialPdf ainda não envolve build/imprimirRelatorioEspecialPdf')
  }
  if (
    pdfMod.includes('secoes.infos') &&
    pdfMod.includes('secoes.equipamentos') &&
    pdfMod.includes('secoes.dias') &&
    pdfMod.includes('secoes.resumo') &&
    pdfMod.includes('secoes.observacoes') &&
    hub.includes('pedirExportComSecoes') &&
    hub.includes('modalEscolhaSecoesPdf')
  ) {
    ok('relatorios-especiais: escolha de secções no PDF/Email/WhatsApp')
  } else {
    fail('relatorios-especiais sem escolha de secções antes do PDF/envio')
  }
  if (
    hub.includes('upsertRelatorioEspecialNaLista') &&
    hub.includes('encontrarRelatorioEspecialParaUpsert') &&
    !hub.includes('[...relatorios, preparado]')
  ) {
    ok('RelatorioEspecialHub: guardar dia faz upsert (não cria cartão duplicado)')
  } else {
    fail('RelatorioEspecialHub ainda faz push de relatório ao guardar (risco de duplicados)')
  }
  const dedupeFile = fs.readFileSync(path.join(root, 'app/modules/relatorios-especiais/dedupe.ts'), 'utf8')
  if (
    dedupeFile.includes('dedupeRelatoriosEspeciais') &&
    dedupeFile.includes('riquezaRelatorioEspecial') &&
    dedupeFile.includes('upsertRelatorioEspecialNaLista')
  ) {
    ok('relatorios-especiais: dedupe por id/número mantém cópia mais rica')
  } else {
    fail('relatorios-especiais sem dedupe seguro de duplicados')
  }
  if (
    hub.includes('totalDiariasUi') &&
    hub.includes('relatorio-especial-horas-block__meta--diarias') &&
    hub.includes('diaContaComoDiariaEspecial') &&
    hub.includes('adicionarRetornoMesmoDia')
  ) {
    ok('RelatorioEspecialHub unifica TOTAL DE DIÁRIAS no CONTROLE e Resumo')
  } else {
    fail('RelatorioEspecialHub sem contador unificado de diárias / retorno mesmo dia')
  }
  if (
    hub.includes('BibliotecaHubPainelRecolhivel') &&
    hub.includes('modulo="relatorio-especial"') &&
    hub.includes('re-form-basicas') &&
    hub.includes('re-form-equipamentos') &&
    hub.includes('re-form-dias') &&
    hub.includes('re-form-resumo') &&
    hub.includes('re-form-observacoes')
  ) {
    ok('RelatorioEspecialHub: painéis retraíveis com seta (padrão BibliotecaHubPainel)')
  } else {
    fail('RelatorioEspecialHub sem painéis retraíveis BibliotecaHubPainelRecolhivel')
  }
  if (
    hub.includes('coletarDiasSemMaquinaResumo') &&
    hub.includes('equipamentoFmt') &&
    hub.includes('relatorio-especial-resumo-viagem__equip') &&
    hub.includes('relatorio-especial-tecnicos-chips') &&
    hub.includes('tecnicosOpcoes') &&
    !hub.includes("origem: 'tecnico' | 'gestor'")
  ) {
    ok('RelatorioEspecialHub: viagem com equipamento destacado + chips só de técnico')
  } else {
    fail('RelatorioEspecialHub sem destaque de equipamento na viagem ou chips de técnico')
  }
  if (
    hub.includes('labelOptsCadastro') &&
    hub.includes('prepararEquipamentosRelatorioParaEdicao') &&
    hub.includes('relatorioEspecialHoraTrabalhada') &&
    hub.includes('horasPorEquipamento') &&
    hub.includes('opcoesEquipamentoSelectDiaEspecial') &&
    hub.includes('aplicarSelecaoEquipamentoDiaEspecial')
  ) {
    ok('RelatorioEspecialHub: select Hora trabalhada enriquece série do cadastro')
  } else {
    fail('RelatorioEspecialHub select Hora trabalhada sem enrich de série do cadastro')
  }
  if (
    hub.includes('relatorioEspecialLocalDia') &&
    hub.includes('relatorioEspecialClienteInstalacao') &&
    hub.includes('clienteInstalacaoId') &&
    hub.includes('relatorioEspecialInstalacaoSemDia') &&
    hub.includes('TabelaResumoPorClienteEspecial') &&
    hub.includes('calcularTotaisFechamentoEspecialPorCliente')
  ) {
    ok('RelatorioEspecialHub: local do dia + cliente de instalação no armazém')
  } else {
    fail('RelatorioEspecialHub sem local do dia / cliente de instalação')
  }
  {
    const i18nKeysLocal = [
      'relatorioEspecialClienteInstalacao',
      'relatorioEspecialClienteInstalacaoVazio',
      'relatorioEspecialClienteInstalacaoHint',
      'relatorioEspecialLocalDia',
      'relatorioEspecialLocalDiaHerdar',
      'relatorioEspecialLocalArmazem',
      'relatorioEspecialLocalDiaHint',
      'relatorioEspecialLocalOndeEquipamento',
      'relatorioEspecialLocalOutroCliente',
      'relatorioEspecialInstalacaoSemDia',
      'relatorioEspecialResumoPorCliente',
      'relatorioEspecialResumoHorasCliente',
    ]
    const missLocal = []
    for (const lang of ['pt-BR', 'es', 'fr', 'it', 'de', 'en']) {
      const o = JSON.parse(fs.readFileSync(path.join(root, `app/i18n/messages/${lang}.json`), 'utf8'))
      for (const k of i18nKeysLocal) {
        if (!o[k] || !String(o[k]).trim()) missLocal.push(`${lang}.${k}`)
      }
    }
    if (missLocal.length) fail(`i18n local/instalação especial em falta: ${missLocal.join(', ')}`)
    else ok('i18n: local do dia e cliente de instalação nos 6 idiomas')
  }
  {
    const nmaEsp = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
    if (
      nmaEsp.includes('await saveData(RELATORIOS_ESPECIAIS_STORAGE_KEY, listaLimpa, true, false)') &&
      !nmaEsp.includes('await saveData(RELATORIOS_ESPECIAIS_STORAGE_KEY, listaLimpa, true, true)')
    ) {
      ok('guardar relatório especial confirma no aparelho (servidor em segundo plano)')
    } else {
      fail('guardar relatório especial ainda espera o servidor (awaitServer=true)')
    }
  }
  {
    const relEq = fs.readFileSync(path.join(root, 'app/modules/equipamentos/relatorio.ts'), 'utf8')
    if (
      relEq.includes('preferirEquipamentoClienteComSerie') &&
      relEq.includes('encontrarEquipamentoClientePorRefRelatorio') &&
      relEq.includes('preservarVinculoClienteLinhaEquipamentoRelatorio') &&
      relEq.includes('idsComSerieReal')
    ) {
      ok('equipamentos: match cadastro prefere série real vs fantasma 0000000000')
    } else {
      fail('equipamentos sem preferência de série real no match do cadastro')
    }
  }
  const calc = fs.readFileSync(path.join(root, 'app/modules/relatorios-especiais/calculos.ts'), 'utf8')
  if (
    calc.includes('equipamentosContextoDiaEspecial') &&
    calc.includes('equipamentoFmt') &&
    calc.includes('clienteFmt') &&
    calc.includes('contextoFmt')
  ) {
    ok('calculos especiais: dias sem máquina com contexto equipamento/cliente')
  } else {
    fail('calculos especiais sem contexto de viagem no resumo')
  }
  {
    const fechCli = fs.readFileSync(path.join(root, 'app/modules/relatorios-especiais/fechamentoPorCliente.ts'), 'utf8')
    if (
      fechCli.includes('fundirGrupoPrincipalNaOficinaFechamentoEspecial') &&
      fechCli.includes('tratarPrincipalComoOficina') &&
      fechCli.includes('ensureGrupo') &&
      fechCli.includes('calcularTotaisRelatorioEspecial') &&
      fechCli.includes('almocoJaAplicadoPorData')
    ) {
      ok('fechamento especial: horas por cliente não se perdem e batem com o total')
    } else {
      fail('fechamento especial ainda pode perder horas do cliente principal')
    }
    const pdfEsp = fs.readFileSync(path.join(root, 'app/modules/relatorios-especiais/pdf.ts'), 'utf8')
    if (pdfEsp.includes('buildResumoPorClienteHtml') && pdfEsp.includes('relatorioEspecialResumoPorCliente')) {
      ok('PDF especial: resumo de horas por cliente')
    } else {
      fail('PDF especial sem resumo de horas por cliente')
    }
  }
  if (
    calc.includes('indiceLinhaAlmocoActiva') &&
    calc.includes('distribuirAlmocoPorLinhaEquipamentoDia') &&
    calc.includes('almocoDescontadoMinutos') &&
    !calc.includes('proporcionalmente ao tempo bruto')
  ) {
    ok('calculos especiais: almoço numa só máquina activa (sem rateio proporcional)')
  } else {
    fail('calculos especiais ainda rateiam almoço proporcionalmente entre máquinas')
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
  const deletedMod = fs.readFileSync(path.join(root, 'app/modules/relatorios-especiais/deleted.ts'), 'utf8')
  const libDeleted = exists('app/lib/relatorioEspecialDeleted.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/relatorioEspecialDeleted.ts'), 'utf8')
    : ''
  if (
    deletedMod.includes('raw: string | null') &&
    !deletedMod.includes('localStorage') &&
    libDeleted.includes('localStorage.getItem') &&
    nma.includes("from './lib/relatorioEspecialDeleted'")
  ) {
    ok('NonatoMainApp lê tombstones de relatórios especiais via lib')
  } else {
    fail('lib/relatorioEspecialDeleted ainda não envolve readDeletedIdsFromLocalStorage')
  }
} catch (e) {
  fail(`módulo relatorios-especiais: ${e.message}`)
}

{
  const manualHtml = exists('public/MANUAL-USO-NONATO-SERVICE.html')
    ? fs.readFileSync(path.join(root, 'public/MANUAL-USO-NONATO-SERVICE.html'), 'utf8')
    : ''
  const gestorRoute = exists('app/api/pdf/manual-gestor/route.ts')
    ? fs.readFileSync(path.join(root, 'app/api/pdf/manual-gestor/route.ts'), 'utf8')
    : ''
  const shotPages = exists('scripts/lib/manualScreenshotPages.mjs')
    ? fs.readFileSync(path.join(root, 'scripts/lib/manualScreenshotPages.mjs'), 'utf8')
    : ''
  const ptHelp = exists('app/i18n/messages/pt-BR.json')
    ? fs.readFileSync(path.join(root, 'app/i18n/messages/pt-BR.json'), 'utf8')
    : ''
  const reading = exists('app/lib/manualProgramaReadingOrder.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/manualProgramaReadingOrder.ts'), 'utf8')
    : ''
  if (
    manualHtml.includes('/manual/assets/pt-BR/clientes-default/01.png') &&
    manualHtml.includes('/manual/assets/pt-BR/relatorio-servico-default/01.png') &&
    manualHtml.includes('Local deste dia') &&
    gestorRoute.includes('MANUAL-USO-NONATO-SERVICE.html') &&
    shotPages.includes('app/modules/sidebar/menuPermissions.ts') &&
    ptHelp.includes('helpRelatorioEspecial') &&
    reading.includes('relatorio-especial-default')
  ) {
    ok('manual de uso com capturas reais do programa + Relatórios Especiais')
  } else {
    fail('manual de uso desactualizado ou sem capturas reais')
  }
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
  if (
    idx.includes('isComprovanteDespesaClienteNomeValid') &&
    idx.includes('createComprovanteDespesaFromForm') &&
    idx.includes('emptyComprovanteDespesaForm') &&
    idx.includes('dadosDuplicadoComprovanteFromForm') &&
    exists('app/modules/comprovantes/fromForm.ts') &&
    exists('app/modules/comprovantes/formState.ts')
  ) {
    ok('módulo comprovantes exporta ComprovanteDespesa form/fromForm')
  } else {
    fail('módulo comprovantes sem ComprovanteDespesa form/fromForm')
  }
  if (
    nma.includes('isComprovanteDespesaClienteNomeValid') &&
    nma.includes('createComprovanteDespesaFromForm') &&
    nma.includes('emptyComprovanteDespesaForm') &&
    nma.includes('dadosDuplicadoComprovanteFromForm')
  ) {
    ok('NonatoMainApp usa ComprovanteDespesa fromForm do módulo')
  } else {
    fail('NonatoMainApp ainda mapeia ComprovanteDespesa no sítio')
  }
  const compFromForm = fs.readFileSync(path.join(root, 'app/modules/comprovantes/fromForm.ts'), 'utf8')
  const libCompFromForm = exists('app/lib/comprovantesFromForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/comprovantesFromForm.ts'), 'utf8')
    : ''
  if (
    compFromForm.includes('nowMs: number') &&
    !compFromForm.includes('Date.now()') &&
    !compFromForm.includes('new Date().toISOString()')
  ) {
    ok('módulo comprovantes fromForm é puro (relógio injectado)')
  } else {
    fail('módulo comprovantes/fromForm ainda usa Date.now ou new Date()')
  }
  if (
    libCompFromForm.includes('createComprovanteDespesaFromForm as createComprovanteDespesaFromFormPure') &&
    libCompFromForm.includes('emptyComprovanteDespesaForm as emptyComprovanteDespesaFormPure') &&
    nma.includes("from './lib/comprovantesFromForm'")
  ) {
    ok('NonatoMainApp usa comprovante fromForm via lib')
  } else {
    fail('lib/comprovantesFromForm ainda não envolve o comprovante fromForm')
  }
  const compPeriodo = fs.readFileSync(path.join(root, 'app/modules/comprovantes/periodo.ts'), 'utf8')
  const compEnvio = fs.readFileSync(path.join(root, 'app/modules/comprovantes/envioMensagem.ts'), 'utf8')
  if (
    compPeriodo.includes('nowMs: number') &&
    !compPeriodo.includes('now: Date = new Date()') &&
    compEnvio.includes('reportDate: Date') &&
    !compEnvio.includes('reportDate = new Date()')
  ) {
    ok('módulo comprovantes periodo/envio é puro (relógio injectado)')
  } else {
    fail('módulo comprovantes periodo/envioMensagem ainda usa new Date() por omissão')
  }
  if (
    libCompFromForm.includes('mesesRollingCompetenciaKeys as mesesRollingCompetenciaKeysPure') &&
    libCompFromForm.includes('buildMensagemEnvioComprovantes as buildMensagemEnvioComprovantesPure')
  ) {
    ok('lib/comprovantesFromForm envolve o relógio de periodo/envio')
  } else {
    fail('lib/comprovantesFromForm ainda não envolve mesesRolling / envioMensagem')
  }
  const folhaPdf = fs.readFileSync(path.join(root, 'app/modules/comprovantes/folhaSemanalPdf.ts'), 'utf8')
  const libFolhaPdf = exists('app/lib/comprovantesFolhaSemanalPdf.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/comprovantesFolhaSemanalPdf.ts'), 'utf8')
    : ''
  if (
    folhaPdf.includes('nowMs: number') &&
    !folhaPdf.includes('Date.now()') &&
    !folhaPdf.includes('new Date().toLocaleDateString')
  ) {
    ok('módulo comprovantes folhaSemanalPdf é puro (relógio injectado)')
  } else {
    fail('módulo comprovantes/folhaSemanalPdf ainda usa Date.now ou new Date()')
  }
  if (
    !folhaPdf.includes('window.open') &&
    libFolhaPdf.includes('window.open') &&
    libFolhaPdf.includes('abrirFolhaSemanalContadorPdf') &&
    nma.includes("from './lib/comprovantesFolhaSemanalPdf'")
  ) {
    ok('NonatoMainApp abre folha semanal PDF via lib')
  } else {
    fail('lib/comprovantesFolhaSemanalPdf ainda não envolve abrirFolhaSemanalContadorPdf')
  }
  if (
    libFolhaPdf.includes('buildFolhaSemanalContadorHtml as buildFolhaSemanalContadorHtmlPure') &&
    nma.includes("from './lib/comprovantesFolhaSemanalPdf'")
  ) {
    ok('NonatoMainApp usa folha semanal PDF via lib')
  } else {
    fail('lib/comprovantesFolhaSemanalPdf ainda não envolve buildFolhaSemanalContadorHtml')
  }
  const compFormState = fs.readFileSync(path.join(root, 'app/modules/comprovantes/formState.ts'), 'utf8')
  const clientesAtivos = fs.readFileSync(path.join(root, 'app/modules/comprovantes/clientesAtivos.ts'), 'utf8')
  const libCompHoje = exists('app/lib/comprovanteClientesAtivosHoje.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/comprovanteClientesAtivosHoje.ts'), 'utf8')
    : ''
  if (
    compFormState.includes('nowMs: number') &&
    !compFormState.includes('new Date().toISOString()') &&
    clientesAtivos.includes('nowMs: number') &&
    !clientesAtivos.includes('Date.now()') &&
    !clientesAtivos.includes('new Date().toISOString()')
  ) {
    ok('módulo comprovantes formState/clientesAtivos é puro (relógio injectado)')
  } else {
    fail('módulo comprovantes formState/clientesAtivos ainda usa Date.now ou new Date()')
  }
  if (
    libCompHoje.includes('horaAtualLocal as horaAtualLocalPure') &&
    nma.includes("from './lib/comprovanteClientesAtivosHoje'")
  ) {
    ok('NonatoMainApp usa hora/clientes ativos via lib')
  } else {
    fail('lib/comprovanteClientesAtivosHoje ainda não envolve o relógio')
  }
  if (
    idx.includes('formCompComClienteSugerido') &&
    idx.includes('EstadoClienteParaFormComp')
  ) {
    ok('módulo comprovantes exporta formCompComClienteSugerido')
  } else {
    fail('módulo comprovantes sem formCompComClienteSugerido')
  }
  if (
    nma.includes('formCompComClienteSugerido') &&
    !nma.includes('const formCompComClienteSugerido = (')
  ) {
    ok('NonatoMainApp usa formCompComClienteSugerido do módulo')
  } else {
    fail('NonatoMainApp ainda define formCompComClienteSugerido no sítio')
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
    rel.includes('formatarLabelEquipamentoSelectCurto') &&
    rel.includes('opcaoEquipamentoClienteSelectRelatorio') &&
    rel.includes('equipamentoIdPlaceholderInvalido') &&
    rel.includes('resolverSegmentoSerieEquipamento') &&
    rel.includes('encontrarEquipamentoClientePorRefRelatorio') &&
    rel.includes('serieSnapshotRelatorioUtil') &&
    idx.includes('getSequenciaEtiquetasArmazem') &&
    idx.includes('enriquecerBlocoEquipamentoPedido') &&
    idx.includes('createEmptyEquipamentoForm') &&
    idx.includes('equipamentoToFormState') &&
    idx.includes('isEquipamentoFormValid') &&
    idx.includes('createEquipamentoFromForm') &&
    idx.includes('updateEquipamentoFromForm') &&
    idx.includes('equipamentoIdDuplicado') &&
    idx.includes('isHistoricoEquipamentoFormValid') &&
    idx.includes('createHistoricoEquipamentoFromForm') &&
    idx.includes('emptyHistoricoEquipamentoForm') &&
    idx.includes('isItemInclusoFormValid') &&
    idx.includes('createItemInclusoFromForm') &&
    idx.includes('updateItemInclusoFromForm') &&
    idx.includes('emptyItemInclusoForm')
  ) {
    ok('módulo equipamentos exporta relatório/etiquetas/formState')
  } else {
    fail('módulo equipamentos incompleto (index.ts)')
  }
  const etqMod = fs.readFileSync(path.join(root, 'app/modules/equipamentos/etiquetas.ts'), 'utf8')
  const libEtq = exists('app/lib/equipamentosEtiquetas.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/equipamentosEtiquetas.ts'), 'utf8')
    : ''
  const nmaEq = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (
    etqMod.includes('buildEtiquetasArmazemPrintHtml') &&
    !etqMod.includes('window.open') &&
    libEtq.includes('window.open') &&
    nmaEq.includes("from './lib/equipamentosEtiquetas'")
  ) {
    ok('NonatoMainApp imprime etiquetas via lib')
  } else {
    fail('lib/equipamentosEtiquetas ainda não envolve openPrintEtiquetasArmazem')
  }
  {
    const mergeUtils = fs.readFileSync(path.join(root, 'app/modules/clientes/merge.ts'), 'utf8')
    if (
      mergeUtils.includes('mergeEquipamentoClienteSameId') &&
      mergeUtils.includes('pickBetterField') &&
      !mergeUtils.includes('byId.set(k, { ...byId.get(k)!, ...e })')
    ) {
      ok('merge equipamentos: mesmo ID não clobber com fantasma do servidor')
    } else {
      fail('merge equipamentos ainda sobrescreve local com spread cego do servidor')
    }
    const formState = fs.readFileSync(path.join(root, 'app/modules/equipamentos/formState.ts'), 'utf8')
    if (
      formState.includes('Clonar tudo') &&
      formState.includes('[...equipamento.photoLibrary]') &&
      formState.includes('equipamento.itemsIncluded.map')
    ) {
      ok('formState equipamento clona arrays (sem mutar cadastro ao editar)')
    } else {
      fail('formState equipamento ainda partilha referências com o cadastro')
    }
  }
  // Regressão label: ID · modelo · série (nunca inverter; série só de campo dedicado / cadastro)
  {
    const equipamentoIdETecnicoGerado = (id) => {
      const t = String(id ?? '').trim()
      if (!t) return true
      if (/^eqc-/i.test(t)) return true
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89abAB][0-9a-f]{3}-[0-9a-f]{12}$/i.test(t)
    }
    const equipamentoIdPlaceholderInvalido = (id) => {
      const t = String(id ?? '').trim()
      if (!t) return true
      return /^0+$/.test(t)
    }
    const segmentoIdEquipamentoExibivel = (valor) => {
      const t = String(valor ?? '').trim()
      if (!t || equipamentoIdPlaceholderInvalido(t)) return ''
      return t
    }
    const resolverSegmentoSerieEquipamento = (eq) => {
      if (eq == null || typeof eq !== 'object') return ''
      for (const c of [eq.numeroMaquina, eq.numeroSerie, eq.nSerie, eq.serie, eq.serialNumber]) {
        const s = segmentoIdEquipamentoExibivel(c)
        if (s) return s
      }
      return ''
    }
    const serieSnapshotRelatorioUtil = (eq) => {
      if (eq == null || typeof eq !== 'object') return ''
      const id = String(eq.equipamentoId ?? eq.id ?? '').trim()
      for (const c of [eq.numeroMaquina, eq.numeroSerie]) {
        const s = segmentoIdEquipamentoExibivel(c)
        if (!s) continue
        if (id && s.toLowerCase() === id.toLowerCase()) continue
        return s
      }
      return ''
    }
    const segmentoIdProprioEquipamentoParaLabel = (idRaw) => {
      const id = segmentoIdEquipamentoExibivel(idRaw)
      if (!id || equipamentoIdETecnicoGerado(id)) return ''
      return id
    }
    const preferirEquipamentoClienteComSerie = (candidatos, seriePreferida = '') => {
      if (candidatos.length === 0) return null
      if (candidatos.length === 1) return candidatos[0]
      const pref = String(seriePreferida || '')
        .trim()
        .toLowerCase()
      if (pref) {
        const exact = candidatos.find(
          (e) => segmentoIdEquipamentoExibivel(e.numeroSerie).toLowerCase() === pref
        )
        if (exact) return exact
      }
      const comSerie = candidatos.filter((e) => segmentoIdEquipamentoExibivel(e.numeroSerie))
      return comSerie[0] || candidatos[0]
    }
    const encontrarEquipamentoClientePorRefRelatorio = (eq, clienteEquipamentos) => {
      const list = (Array.isArray(clienteEquipamentos) ? clienteEquipamentos : []).filter(
        (e) => e != null && typeof e === 'object'
      )
      const alvo = String(eq.equipamentoId ?? '').trim().toLowerCase()
      const snSnap = serieSnapshotRelatorioUtil(eq)
      const candidatos = []
      for (const e of list) {
        const id = String(e?.id ?? '').trim().toLowerCase()
        const sn = String(e?.numeroSerie ?? '').trim().toLowerCase()
        if ((alvo && (id === alvo || sn === alvo)) || (snSnap && sn === snSnap.toLowerCase())) {
          candidatos.push(e)
        }
      }
      return preferirEquipamentoClienteComSerie(candidatos, snSnap)
    }
    const formatarLabelEquipamentoSelectCurto = (eq, idx = 0, opts) => {
      if (eq == null || typeof eq !== 'object') return `#${idx + 1}`
      const cli = opts?.equipamentosCliente
      const match =
        Array.isArray(cli) && cli.length > 0
          ? encontrarEquipamentoClientePorRefRelatorio(eq, cli)
          : null
      const id =
        segmentoIdProprioEquipamentoParaLabel(String(eq.equipamentoId ?? eq.id ?? '').trim()) ||
        (match ? segmentoIdProprioEquipamentoParaLabel(String(match.id ?? '').trim()) : '')
      let serie =
        (match ? segmentoIdEquipamentoExibivel(match.numeroSerie) : '') ||
        serieSnapshotRelatorioUtil(eq) ||
        resolverSegmentoSerieEquipamento(eq)
      if (serie && id && serie.toLowerCase() === id.toLowerCase()) serie = ''
      const modelo =
        String(eq.maquinaModelo ?? '').trim() ||
        (match
          ? `${String(match.modelo ?? '').trim()} ${String(match.marca ?? '').trim()}`.trim()
          : '') ||
        `${String(eq.modelo ?? '').trim()} ${String(eq.marca ?? '').trim()}`.trim()
      const parts = []
      if (id) parts.push(id)
      if (modelo) parts.push(modelo)
      if (serie) parts.push(serie)
      return parts.length > 0 ? parts.join(' · ') : `#${idx + 1}`
    }
    const casoA = formatarLabelEquipamentoSelectCurto({
      id: 'S_001321',
      modelo: 'KFL',
      marca: 'HOMAG',
      numeroSerie: '0000000000',
    })
    const casoB = formatarLabelEquipamentoSelectCurto({
      equipamentoId: 'S_001321',
      maquinaModelo: 'KFL HOMAG',
      numeroMaquina: '',
    })
    const casoC = formatarLabelEquipamentoSelectCurto({
      equipamentoId: '42',
      maquinaModelo: 'KFL HOMAG',
      numeroMaquina: 'S_001321',
    })
    const casoD = formatarLabelEquipamentoSelectCurto(
      {
        equipamentoId: 'S_001321',
        maquinaModelo: 'KFL HOMAG',
        numeroMaquina: '',
      },
      0,
      {
        equipamentosCliente: [
          {
            id: 'S_001321',
            modelo: 'PROFI KF 20/23/PU/25',
            marca: 'HOMAG',
            numeroSerie: '0-201-13-9672',
          },
        ],
      }
    )
    const casoE = formatarLabelEquipamentoSelectCurto({
      equipamentoId: '008323',
      maquinaModelo: 'KDF 860 C HOMAG',
      numeroMaquina: '0-261-06-6191',
    })
    // Fantasma sem série primeiro + cartão real com a mesma ID (regressão KFL).
    const casoF = formatarLabelEquipamentoSelectCurto(
      {
        equipamentoId: 'S_001321',
        maquinaModelo: 'KFL HOMAG',
        numeroMaquina: '',
      },
      0,
      {
        equipamentosCliente: [
          { id: 'S_001321', modelo: 'KFL', marca: 'HOMAG', numeroSerie: '0000000000' },
          {
            id: 'S_001321',
            modelo: 'PROFI KF 20/23/PU/25',
            marca: 'HOMAG',
            numeroSerie: '0-201-13-9672',
          },
        ],
      }
    )
    if (
      casoA === 'S_001321 · KFL HOMAG' &&
      casoB === 'S_001321 · KFL HOMAG' &&
      casoC === '42 · KFL HOMAG · S_001321' &&
      casoD === 'S_001321 · KFL HOMAG · 0-201-13-9672' &&
      casoE === '008323 · KDF 860 C HOMAG · 0-261-06-6191' &&
      casoF === 'S_001321 · KFL HOMAG · 0-201-13-9672'
    ) {
      ok('label equipamento: ID·modelo·série (+ série do cadastro)')
    } else {
      fail(
        `label equipamento regressão: A=${casoA} B=${casoB} C=${casoC} D=${casoD} E=${casoE} F=${casoF}`
      )
    }
  }
  if (!exists('app/modules/equipamentos/formState.ts')) {
    fail('falta app/modules/equipamentos/formState.ts')
  } else {
    ok('existe app/modules/equipamentos/formState.ts')
  }
  if (!exists('app/modules/equipamentos/equipamentoFromForm.ts')) {
    fail('falta app/modules/equipamentos/equipamentoFromForm.ts')
  } else {
    ok('existe app/modules/equipamentos/equipamentoFromForm.ts')
  }
  if (!exists('app/modules/equipamentos/historicoFromForm.ts')) {
    fail('falta app/modules/equipamentos/historicoFromForm.ts')
  } else {
    ok('existe app/modules/equipamentos/historicoFromForm.ts')
  }
  if (!exists('app/modules/equipamentos/itemInclusoFromForm.ts')) {
    fail('falta app/modules/equipamentos/itemInclusoFromForm.ts')
  } else {
    ok('existe app/modules/equipamentos/itemInclusoFromForm.ts')
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
    nma.includes('createEmptyEquipamentoForm') &&
    nma.includes('isEquipamentoFormValid') &&
    nma.includes('createEquipamentoFromForm') &&
    nma.includes('updateEquipamentoFromForm') &&
    nma.includes('equipamentoIdDuplicado') &&
    nma.includes('isHistoricoEquipamentoFormValid') &&
    nma.includes('createHistoricoEquipamentoFromForm') &&
    nma.includes('emptyHistoricoEquipamentoForm') &&
    nma.includes('isItemInclusoFormValid') &&
    nma.includes('createItemInclusoFromForm') &&
    nma.includes('updateItemInclusoFromForm') &&
    nma.includes('emptyItemInclusoForm')
  ) {
    ok('NonatoMainApp usa formState/aliases/fromForm do módulo equipamentos')
  } else {
    fail('NonatoMainApp ainda define Equipamento/formState/aliases/fromForm localmente')
  }
  const histFromForm = fs.readFileSync(path.join(root, 'app/modules/equipamentos/historicoFromForm.ts'), 'utf8')
  const itemFromForm = fs.readFileSync(path.join(root, 'app/modules/equipamentos/itemInclusoFromForm.ts'), 'utf8')
  const libEqFromForm = exists('app/lib/equipamentosFromForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/equipamentosFromForm.ts'), 'utf8')
    : ''
  if (
    histFromForm.includes('nowMs: number') &&
    !histFromForm.includes('Date.now()') &&
    !histFromForm.includes('new Date().toISOString()') &&
    itemFromForm.includes('nowMs: number') &&
    !itemFromForm.includes('Date.now()')
  ) {
    ok('módulo equipamentos historico/itemIncluso fromForm é puro (relógio injectado)')
  } else {
    fail('módulo equipamentos historicoFromForm/itemInclusoFromForm ainda usa Date.now ou new Date()')
  }
  if (
    libEqFromForm.includes('createHistoricoEquipamentoFromForm as createHistoricoEquipamentoFromFormPure') &&
    libEqFromForm.includes('createItemInclusoFromForm as createItemInclusoFromFormPure') &&
    nma.includes("from './lib/equipamentosFromForm'")
  ) {
    ok('NonatoMainApp usa equipamentos fromForm via lib')
  } else {
    fail('lib/equipamentosFromForm ainda não envolve o fromForm')
  }
  const relatorioEq = fs.readFileSync(path.join(root, 'app/modules/equipamentos/relatorio.ts'), 'utf8')
  const libEqRelatorio = exists('app/lib/equipamentosRelatorio.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/equipamentosRelatorio.ts'), 'utf8')
    : ''
  if (
    relatorioEq.includes('nowMs: number') &&
    relatorioEq.includes('random: () => number') &&
    !relatorioEq.includes('Date.now()') &&
    !relatorioEq.includes('Math.random')
  ) {
    ok('módulo equipamentos relatorio baixa-venda é puro (relógio/aleatório injectados)')
  } else {
    fail('módulo equipamentos/relatorio ainda usa Date.now ou Math.random na baixa')
  }
  if (
    libEqRelatorio.includes('aplicarBaixaVendaEquipamentosArmazemRelatorio as aplicarBaixaVendaEquipamentosArmazemRelatorioPure') &&
    nma.includes("from './lib/equipamentosRelatorio'")
  ) {
    ok('NonatoMainApp usa baixa-venda de equipamentos via lib')
  } else {
    fail('lib/equipamentosRelatorio ainda não envolve a baixa por venda')
  }
  if (
    idx.includes('resolverNumeroEquipamentoPdf') &&
    idx.includes('resolverSerieEquipamentoPdf') &&
    exists('app/modules/equipamentos/pdfNumero.ts')
  ) {
    ok('módulo equipamentos exporta pdfNumero')
  } else {
    fail('módulo equipamentos sem pdfNumero')
  }
  const libOrcPdf = fs.readFileSync(path.join(root, 'app/lib/orcamentoPdfPro.ts'), 'utf8')
  const pedAvulso = fs.readFileSync(path.join(root, 'app/modules/equipamentos/pedidoAvulso.ts'), 'utf8')
  if (
    libOrcPdf.includes("from '../modules/equipamentos/pdfNumero'") &&
    !libOrcPdf.includes('export function resolverNumeroEquipamentoPdf(') &&
    pedAvulso.includes("from './pdfNumero'") &&
    !pedAvulso.includes("from '../../lib/orcamentoPdfPro'")
  ) {
    ok('lib/pedidoAvulso usam pdfNumero do módulo equipamentos')
  } else {
    fail('resolverNumeroEquipamentoPdf ainda implementado em orcamentoPdfPro ou pedidoAvulso via lib')
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
    idx.includes('calcularTotais') &&
    idx.includes('contarDiariasDatasUnicas') &&
    idx.includes('diaContaComoDiariaServico')
  ) {
    ok('módulo relatorio-servico exporta cálculos de dia')
  } else {
    fail('módulo relatorio-servico sem calcularDuracao/atualizarCalculosDia/calcularTotais/diárias únicas')
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
  if (
    idx.includes('createEmptyPecaSubstituicaoForm') &&
    idx.includes('PecaSubstituicao')
  ) {
    ok('módulo relatorio-servico exporta PecaSubstituicao / createEmptyPecaSubstituicaoForm')
  } else {
    fail('módulo relatorio-servico sem PecaSubstituicao / createEmptyPecaSubstituicaoForm')
  }
  if (!exists('app/modules/relatorio-servico/pecaSubstituicao.ts')) {
    fail('falta app/modules/relatorio-servico/pecaSubstituicao.ts')
  } else {
    ok('existe app/modules/relatorio-servico/pecaSubstituicao.ts')
  }
  if (
    nma.includes('createEmptyPecaSubstituicaoForm') &&
    !nma.includes('type PecaSubstituicao = {')
  ) {
    ok('NonatoMainApp usa PecaSubstituicao do módulo relatorio-servico')
  } else {
    fail('NonatoMainApp ainda define PecaSubstituicao localmente ou não usa createEmptyPecaSubstituicaoForm')
  }
  if (
    idx.includes('isPecaSubstituicaoFormValid') &&
    idx.includes('createPecaSubstituicaoFromForm') &&
    idx.includes('createPecaSubstituicaoFromBiblioteca') &&
    idx.includes('pecaSubstituicaoCodigoDuplicado') &&
    exists('app/modules/relatorio-servico/pecaSubstituicaoFromForm.ts')
  ) {
    ok('módulo relatorio-servico exporta PecaSubstituicao form/fromForm')
  } else {
    fail('módulo relatorio-servico sem PecaSubstituicao form/fromForm')
  }
  if (
    nma.includes('isPecaSubstituicaoFormValid') &&
    nma.includes('createPecaSubstituicaoFromForm') &&
    nma.includes('createPecaSubstituicaoFromBiblioteca') &&
    nma.includes('pecaSubstituicaoCodigoDuplicado')
  ) {
    ok('NonatoMainApp usa PecaSubstituicao fromForm do módulo')
  } else {
    fail('NonatoMainApp ainda mapeia PecaSubstituicao no sítio')
  }
  if (
    idx.includes('createEmptyDiaTrabalhoForm')
  ) {
    ok('módulo relatorio-servico exporta createEmptyDiaTrabalhoForm')
  } else {
    fail('módulo relatorio-servico sem createEmptyDiaTrabalhoForm')
  }
  if (!exists('app/modules/relatorio-servico/diaTrabalhoForm.ts')) {
    fail('falta app/modules/relatorio-servico/diaTrabalhoForm.ts')
  } else {
    ok('existe app/modules/relatorio-servico/diaTrabalhoForm.ts')
  }
  if (
    nma.includes('createEmptyDiaTrabalhoForm') &&
    (nma.match(/setNovoDiaTrabalho\(\s*\{/g) || []).length <= 1
  ) {
    ok('NonatoMainApp usa createEmptyDiaTrabalhoForm nos resets de DiaTrabalho')
  } else {
    fail('NonatoMainApp ainda tem resets literais de DiaTrabalho vazio ou não importa createEmptyDiaTrabalhoForm')
  }
  if (
    idx.includes('isDiaTrabalhoFormValid') &&
    idx.includes('createDiaTrabalhoFromForm') &&
    idx.includes('updateDiaTrabalhoFromForm') &&
    idx.includes('emptyDiaTrabalhoFormWithKmPadrao') &&
    exists('app/modules/relatorio-servico/diaTrabalhoFromForm.ts')
  ) {
    ok('módulo relatorio-servico exporta DiaTrabalho form/fromForm')
  } else {
    fail('módulo relatorio-servico sem DiaTrabalho form/fromForm')
  }
  if (
    nma.includes('isDiaTrabalhoFormValid') &&
    nma.includes('createDiaTrabalhoFromForm') &&
    nma.includes('updateDiaTrabalhoFromForm') &&
    nma.includes('emptyDiaTrabalhoFormWithKmPadrao')
  ) {
    ok('NonatoMainApp usa DiaTrabalho fromForm do módulo')
  } else {
    fail('NonatoMainApp ainda mapeia DiaTrabalho no sítio')
  }
  if (
    idx.includes('criarEquipamentoRelatorioVazio') &&
    idx.includes('createEmptyEquipamentoRelatorioForm') &&
    idx.includes('RelatorioEquipamentoRef')
  ) {
    ok('módulo relatorio-servico exporta RelatorioEquipamentoRef / criarEquipamentoRelatorioVazio')
  } else {
    fail('módulo relatorio-servico sem RelatorioEquipamentoRef / criarEquipamentoRelatorioVazio')
  }
  if (!exists('app/modules/relatorio-servico/equipamentoRelatorioForm.ts')) {
    fail('falta app/modules/relatorio-servico/equipamentoRelatorioForm.ts')
  } else {
    ok('existe app/modules/relatorio-servico/equipamentoRelatorioForm.ts')
  }
  if (
    nma.includes('criarEquipamentoRelatorioVazio') &&
    !nma.includes('function criarEquipamentoRelatorioVazio(')
  ) {
    ok('NonatoMainApp usa criarEquipamentoRelatorioVazio do módulo relatorio-servico')
  } else {
    fail('NonatoMainApp ainda define criarEquipamentoRelatorioVazio localmente ou não importa')
  }
  const eqRelForm = fs.readFileSync(path.join(root, 'app/modules/relatorio-servico/equipamentoRelatorioForm.ts'), 'utf8')
  if (
    eqRelForm.includes('nowMs: number') &&
    !eqRelForm.includes('Date.now()') &&
    !eqRelForm.includes('Math.random')
  ) {
    ok('módulo relatorio-servico equipamentoRelatorioForm é puro (relógio/aleatório injectados)')
  } else {
    fail('módulo relatorio-servico/equipamentoRelatorioForm ainda usa Date.now ou Math.random')
  }
  if (
    idx.includes('createEmptyRelatorioServicoForm') &&
    idx.includes('RelatorioServico')
  ) {
    ok('módulo relatorio-servico exporta RelatorioServico / createEmptyRelatorioServicoForm')
  } else {
    fail('módulo relatorio-servico sem RelatorioServico / createEmptyRelatorioServicoForm')
  }
  if (!exists('app/modules/relatorio-servico/relatorioServicoForm.ts')) {
    fail('falta app/modules/relatorio-servico/relatorioServicoForm.ts')
  } else {
    ok('existe app/modules/relatorio-servico/relatorioServicoForm.ts')
  }
  if (
    nma.includes('createEmptyRelatorioServicoForm') &&
    !nma.includes('type RelatorioServico = {')
  ) {
    ok('NonatoMainApp usa RelatorioServico do módulo relatorio-servico')
  } else {
    fail('NonatoMainApp ainda define RelatorioServico localmente ou não importa createEmptyRelatorioServicoForm')
  }
  if (
    idx.includes('isRelatorioServicoFormValid') &&
    idx.includes('relatorioServicoFormMissing') &&
    idx.includes('createRelatorioServicoFromForm') &&
    idx.includes('updateRelatorioServicoFromForm') &&
    exists('app/modules/relatorio-servico/relatorioServicoFromForm.ts')
  ) {
    ok('módulo relatorio-servico exporta RelatorioServico form/fromForm')
  } else {
    fail('módulo relatorio-servico sem RelatorioServico form/fromForm')
  }
  if (
    nma.includes('isRelatorioServicoFormValid') &&
    nma.includes('relatorioServicoFormMissing') &&
    nma.includes('createRelatorioServicoFromForm') &&
    nma.includes('updateRelatorioServicoFromForm')
  ) {
    ok('NonatoMainApp usa RelatorioServico fromForm do módulo')
  } else {
    fail('NonatoMainApp ainda mapeia RelatorioServico no sítio')
  }
  const pecaSubFromForm = fs.readFileSync(path.join(root, 'app/modules/relatorio-servico/pecaSubstituicaoFromForm.ts'), 'utf8')
  const diaFromForm = fs.readFileSync(path.join(root, 'app/modules/relatorio-servico/diaTrabalhoFromForm.ts'), 'utf8')
  const rsFromForm = fs.readFileSync(path.join(root, 'app/modules/relatorio-servico/relatorioServicoFromForm.ts'), 'utf8')
  const libRsFromForm = exists('app/lib/relatorioServicoFromForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/relatorioServicoFromForm.ts'), 'utf8')
    : ''
  if (
    pecaSubFromForm.includes('nowMs: number') &&
    pecaSubFromForm.includes('random: () => number') &&
    !pecaSubFromForm.includes('Date.now()') &&
    !pecaSubFromForm.includes('Math.random') &&
    diaFromForm.includes('nowMs: number') &&
    !diaFromForm.includes('Date.now()') &&
    !diaFromForm.includes('Math.random') &&
    !diaFromForm.includes('new Date().toISOString()') &&
    rsFromForm.includes('nowMs: number') &&
    !rsFromForm.includes('Date.now()')
  ) {
    ok('módulo relatorio-servico fromForm é puro (relógio/aleatório injectados)')
  } else {
    fail('módulo relatorio-servico fromForm ainda usa Date.now, Math.random ou new Date()')
  }
  const diaForm = fs.readFileSync(path.join(root, 'app/modules/relatorio-servico/diaTrabalhoForm.ts'), 'utf8')
  const rsForm = fs.readFileSync(path.join(root, 'app/modules/relatorio-servico/relatorioServicoForm.ts'), 'utf8')
  if (
    diaForm.includes('nowMs: number') &&
    !diaForm.includes('new Date().toISOString()') &&
    rsForm.includes('nowMs: number') &&
    !rsForm.includes('new Date().toISOString()')
  ) {
    ok('módulo relatorio-servico form vazio é puro (relógio injectado)')
  } else {
    fail('módulo relatorio-servico diaTrabalhoForm/relatorioServicoForm ainda usa new Date()')
  }
  if (
    libRsFromForm.includes('createPecaSubstituicaoFromForm as createPecaSubstituicaoFromFormPure') &&
    libRsFromForm.includes('createDiaTrabalhoFromForm as createDiaTrabalhoFromFormPure') &&
    libRsFromForm.includes('createRelatorioServicoFromForm as createRelatorioServicoFromFormPure') &&
    libRsFromForm.includes('criarEquipamentoRelatorioVazio as criarEquipamentoRelatorioVazioPure') &&
    libRsFromForm.includes('createEmptyDiaTrabalhoForm as createEmptyDiaTrabalhoFormPure') &&
    libRsFromForm.includes('createEmptyRelatorioServicoForm as createEmptyRelatorioServicoFormPure') &&
    nma.includes("from './lib/relatorioServicoFromForm'")
  ) {
    ok('NonatoMainApp usa relatorio-servico fromForm via lib')
  } else {
    fail('lib/relatorioServicoFromForm ainda não envolve o fromForm')
  }
  const rsNumero = fs.readFileSync(path.join(root, 'app/modules/relatorio-servico/numero.ts'), 'utf8')
  if (
    rsNumero.includes('nowMs: number') &&
    !rsNumero.includes('const d = new Date()')
  ) {
    ok('módulo relatorio-servico numero é puro (relógio injectado)')
  } else {
    fail('módulo relatorio-servico/numero ainda usa new Date() por omissão')
  }
  if (
    libRsFromForm.includes('dataIsoParaYYYYMMDDRelatorio as dataIsoParaYYYYMMDDRelatorioPure')
  ) {
    ok('lib/relatorioServicoFromForm envolve dataIsoParaYYYYMMDDRelatorio')
  } else {
    fail('lib/relatorioServicoFromForm ainda não envolve o número AAAAMMDD')
  }
  if (
    idx.includes('ItemRelatorioExcluidoArquivo') &&
    idx.includes('PastaRelatoriosExcluidosCliente') &&
    idx.includes('RelatoriosExcluidosClientesStorage')
  ) {
    ok('módulo relatorio-servico exporta tipos de relatórios excluídos')
  } else {
    fail('módulo relatorio-servico sem tipos ItemRelatorioExcluidoArquivo / Pasta / Storage')
  }
  if (!exists('app/modules/relatorio-servico/excluidosArquivo.ts')) {
    fail('falta app/modules/relatorio-servico/excluidosArquivo.ts')
  } else {
    ok('existe app/modules/relatorio-servico/excluidosArquivo.ts')
  }
  if (
    nma.includes('ItemRelatorioExcluidoArquivo') &&
    !nma.includes('type ItemRelatorioExcluidoArquivo =')
  ) {
    ok('NonatoMainApp usa ItemRelatorioExcluidoArquivo do módulo relatorio-servico')
  } else {
    fail('NonatoMainApp ainda define ItemRelatorioExcluidoArquivo localmente ou não importa')
  }
  if (
    idx.includes('wrapRelatorioServicoPrintDocument') &&
    idx.includes('RELATORIO_SERVICO_PDF_TOOLBAR_CSS') &&
    exists('app/modules/relatorio-servico/pdfShell.ts')
  ) {
    ok('módulo relatorio-servico exporta pdfShell')
  } else {
    fail('módulo relatorio-servico sem pdfShell')
  }
  const libRsPdfShell = fs.readFileSync(path.join(root, 'app/lib/relatorioServicoPdfShell.ts'), 'utf8')
  if (
    libRsPdfShell.includes("from '../modules/relatorio-servico/pdfShell'") &&
    !libRsPdfShell.includes('export function wrapRelatorioServicoPrintDocument(') &&
    !libRsPdfShell.includes('export const RELATORIO_SERVICO_PDF_TOOLBAR_CSS')
  ) {
    ok('lib/relatorioServicoPdfShell só reexporta pdfShell do módulo')
  } else {
    fail('lib/relatorioServicoPdfShell ainda implementa o wrap HTML')
  }
  if (
    nma.includes('wrapRelatorioServicoPrintDocument') &&
    nma.includes("from './lib/relatorioServicoPdfShell'")
  ) {
    ok('NonatoMainApp usa wrap do relatório via lib')
  } else {
    fail('NonatoMainApp deixou de usar wrapRelatorioServicoPrintDocument')
  }
  if (
    idx.includes('buildRelatorioServicoSummaryCardsHtml') &&
    idx.includes('formatHorasResumoPdf') &&
    exists('app/modules/relatorio-servico/pdfResumo.ts')
  ) {
    ok('módulo relatorio-servico exporta pdfResumo')
  } else {
    fail('módulo relatorio-servico sem pdfResumo')
  }
  const libRsPrint = fs.readFileSync(path.join(root, 'app/lib/relatorioServicoPdfPrintCss.ts'), 'utf8')
  if (
    libRsPrint.includes("from '../modules/relatorio-servico/pdfResumo'") &&
    !libRsPrint.includes('export function formatHorasResumoPdf(') &&
    !libRsPrint.includes('export function buildRelatorioServicoSummaryCardsHtml(')
  ) {
    ok('lib/relatorioServicoPdfPrintCss só reexporta pdfResumo do módulo')
  } else {
    fail('lib/relatorioServicoPdfPrintCss ainda implementa o resumo tipográfico')
  }
  if (
    idx.includes('buildRelatorioServicoPdfHeaderHtml') &&
    idx.includes('buildRelatorioServicoPdfMetaSectionHtml') &&
    exists('app/modules/relatorio-servico/pdfMeta.ts')
  ) {
    ok('módulo relatorio-servico exporta pdfMeta')
  } else {
    fail('módulo relatorio-servico sem pdfMeta')
  }
  if (
    libRsPrint.includes("from '../modules/relatorio-servico/pdfMeta'") &&
    !libRsPrint.includes('export function buildRelatorioServicoPdfHeaderHtml(') &&
    !libRsPrint.includes('export function buildRelatorioServicoPdfMetaSectionHtml(')
  ) {
    ok('lib/relatorioServicoPdfPrintCss só reexporta pdfMeta do módulo')
  } else {
    fail('lib/relatorioServicoPdfPrintCss ainda implementa o cabeçalho/meta HTML')
  }
  if (
    idx.includes('RELATORIO_SERVICO_PDF_PRINT_CSS') &&
    exists('app/modules/relatorio-servico/pdfPrintCss.ts')
  ) {
    ok('módulo relatorio-servico exporta pdfPrintCss')
  } else {
    fail('módulo relatorio-servico sem pdfPrintCss')
  }
  if (
    libRsPrint.includes("from '../modules/relatorio-servico/pdfPrintCss'") &&
    !libRsPrint.includes('export const RELATORIO_SERVICO_PDF_PRINT_CSS =')
  ) {
    ok('lib/relatorioServicoPdfPrintCss só reexporta pdfPrintCss do módulo')
  } else {
    fail('lib/relatorioServicoPdfPrintCss ainda implementa o CSS de impressão')
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
    idx.includes('expandirIntervaloDatasContinuo') &&
    idx.includes('agendamentoCaiNoAnoMes') &&
    idx.includes('statusOperacionalAgenda') &&
    idx.includes('renderLegendaEstadosAgenda') &&
    idx.includes('resolverEquipamentoAgendamentoParaExibicao') &&
    idx.includes('renderBlocoEquipamentoAgendamentoEstadoVisual') &&
    idx.includes('filterAgendamentosLembrete') &&
    idx.includes('buildMensagemLembreteAgenda') &&
    idx.includes('encontrarConflitoClienteMesmoDia') &&
    idx.includes('encontrarConflitoTecnicoMesmoDia') &&
    idx.includes('encontrarConflitoTecnicoEmAndamento') &&
    idx.includes('isStatusOperacionalAtivo') &&
    idx.includes('coresAgendamentoVisual') &&
    idx.includes('corFundoMarcadorLegendaAgenda') &&
    idx.includes('estiloBotaoRapidoStatusOperacional') &&
    idx.includes('estiloFundoCardAgendaLista') &&
    idx.includes('temConflitosAgendaLegados') &&
    idx.includes('intervalosSobrepoem')
  ) {
    ok('módulo agenda exporta normalize/datas/clienteEquipamento/estadoVisual/lembreteWA/conflito/cores')
  } else {
    fail('módulo agenda incompleto (index.ts)')
  }
  if (!exists('app/modules/agenda/conflitoAgenda.ts')) {
    fail('falta app/modules/agenda/conflitoAgenda.ts')
  } else {
    const confSrc = fs.readFileSync(path.join(root, 'app/modules/agenda/conflitoAgenda.ts'), 'utf8')
    if (
      confSrc.includes('encontrarConflitoClienteMesmoDia') &&
      confSrc.includes('encontrarConflitoTecnicoMesmoDia') &&
      confSrc.includes('encontrarConflitoTecnicoEmAndamento') &&
      confSrc.includes('mesmoTecnicoAgendamento') &&
      confSrc.includes('intervalosSobrepoem') &&
      confSrc.includes('mesmoClienteAgendamento')
    ) {
      ok('módulo agenda conflitoAgenda: overlap + um em-andamento por técnico')
    } else {
      fail('módulo agenda conflitoAgenda incompleto')
    }
  }
  if (!exists('app/modules/agenda/conflitoCliente.ts')) {
    fail('falta app/modules/agenda/conflitoCliente.ts (reexport)')
  } else {
    ok('existe app/modules/agenda/conflitoCliente.ts (compat)')
  }
  const datasSrc = fs.readFileSync(path.join(root, 'app/modules/agenda/datas.ts'), 'utf8')
  if (
    datasSrc.includes('expandirIntervaloDatasContinuo') &&
    datasSrc.includes('agendamentoCaiNoAnoMes')
  ) {
    ok('módulo agenda datas: intervalo contínuo + cai no mês')
  } else {
    fail('módulo agenda datas sem expandirIntervaloDatasContinuo/agendamentoCaiNoAnoMes')
  }
  const normSrc = fs.readFileSync(path.join(root, 'app/modules/agenda/normalize.ts'), 'utf8')
  if (normSrc.includes('statusOperacionalAgenda') && normSrc.includes('isStatusOperacionalAtivo') && normSrc.includes('statusFromOperacional')) {
    ok('módulo agenda normalize: estado operacional técnico')
  } else {
    fail('módulo agenda normalize sem statusOperacionalAgenda/isStatusOperacionalAtivo')
  }
  if (!exists('app/modules/agenda/estilo.ts')) {
    fail('falta app/modules/agenda/estilo.ts')
  } else {
    const estSrc = fs.readFileSync(path.join(root, 'app/modules/agenda/estilo.ts'), 'utf8')
    if (
      estSrc.includes('coresAgendamentoVisual') &&
      estSrc.includes('corFundoMarcadorLegendaAgenda') &&
      estSrc.includes('estiloBotaoRapidoStatusOperacional') &&
      estSrc.includes('estiloFundoCardAgendaLista')
    ) {
      ok('módulo agenda estilo: cores por status real + legenda completa')
    } else {
      fail('módulo agenda estilo incompleto (cores/botões/legenda)')
    }
  }
  if (!exists('app/modules/agenda/estadoVisual.tsx')) {
    fail('falta app/modules/agenda/estadoVisual.tsx')
  } else {
    const evSrc = fs.readFileSync(path.join(root, 'app/modules/agenda/estadoVisual.tsx'), 'utf8')
    if (
      evSrc.includes('agendaLegendaSecaoEstados') &&
      evSrc.includes('agendaLegendaSecaoTipos') &&
      evSrc.includes("'confirmado'") &&
      evSrc.includes("'pendente'") &&
      evSrc.includes("'pre-agendamento'")
    ) {
      ok('módulo agenda estadoVisual: legenda estados+tipos completa')
    } else {
      fail('módulo agenda estadoVisual: legenda incompleta (faltam confirmado/pendente/pré)')
    }
  }
  if (!exists('app/modules/agenda/lembreteWhatsApp.ts')) {
    fail('falta app/modules/agenda/lembreteWhatsApp.ts')
  } else {
    ok('existe app/modules/agenda/lembreteWhatsApp.ts')
  }
  if (!exists('app/components/AgendaSecaoRecolhivel.tsx')) {
    fail('falta app/components/AgendaSecaoRecolhivel.tsx')
  } else {
    const secoesSrc = fs.readFileSync(path.join(root, 'app/components/AgendaSecaoRecolhivel.tsx'), 'utf8')
    if (!secoesSrc.includes('export function AgendaSecaoRecolhivel') || !secoesSrc.includes('export function AgendaListaToolbar')) {
      fail('AgendaSecaoRecolhivel sem exports esperados')
    } else {
      ok('existe app/components/AgendaSecaoRecolhivel.tsx (toolbar + secção)')
    }
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
    !nma.includes('Lembrete Nonato Service:') &&
    nma.includes('encontrarConflitoClienteMesmoDia') &&
    nma.includes('encontrarConflitoTecnicoMesmoDia') &&
    nma.includes('encontrarConflitoTecnicoEmAndamento') &&
    nma.includes('isStatusOperacionalAtivo') &&
    nma.includes('estiloBotaoRapidoStatusOperacional') &&
    nma.includes('estiloFundoCardAgendaLista') &&
    nma.includes('temConflitosAgendaLegados')
  ) {
    ok('NonatoMainApp usa blocos estado visual / lembreteWA / conflitoAgenda do módulo agenda')
  } else {
    fail('NonatoMainApp ainda define renderBloco*EstadoVisual ou lembreteWA localmente, ou falta conflitoAgenda')
  }
  if (
    idx.includes('isAgendamentoFormValid') &&
    idx.includes('createAgendamentoFromForm') &&
    idx.includes('updateAgendamentoFromForm') &&
    idx.includes('agendamentoToFormState') &&
    exists('app/modules/agenda/agendamentoForm.ts') &&
    exists('app/modules/agenda/agendamentoFromForm.ts')
  ) {
    ok('módulo agenda exporta Agendamento form/fromForm')
  } else {
    fail('módulo agenda sem Agendamento form/fromForm')
  }
  const agendaForm = fs.readFileSync(path.join(root, 'app/modules/agenda/agendamentoForm.ts'), 'utf8')
  const libAgendaForm = exists('app/lib/agendaForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/agendaForm.ts'), 'utf8')
    : ''
  if (
    agendaForm.includes('nowMs: number') &&
    !agendaForm.includes('new Date().toISOString()')
  ) {
    ok('módulo agenda agendamentoForm é puro (relógio injectado)')
  } else {
    fail('módulo agenda/agendamentoForm ainda usa new Date()')
  }
  if (
    libAgendaForm.includes('emptyAgendamentoFormState as emptyAgendamentoFormStatePure') &&
    nma.includes("from './lib/agendaForm'")
  ) {
    ok('NonatoMainApp usa emptyAgendamentoFormState via lib')
  } else {
    fail('lib/agendaForm ainda não envolve o form vazio')
  }
  const lembreteWa = fs.readFileSync(path.join(root, 'app/modules/agenda/lembreteWhatsApp.ts'), 'utf8')
  if (
    lembreteWa.includes('now: Date') &&
    !lembreteWa.includes('now: Date = new Date()')
  ) {
    ok('módulo agenda lembreteWhatsApp é puro (relógio injectado)')
  } else {
    fail('módulo agenda/lembreteWhatsApp ainda usa new Date() por omissão')
  }
  if (
    libAgendaForm.includes('filterAgendamentosLembrete as filterAgendamentosLembretePure')
  ) {
    ok('lib/agendaForm envolve o filtro de lembretes')
  } else {
    fail('lib/agendaForm ainda não envolve filterAgendamentosLembrete')
  }
  if (
    nma.includes('isAgendamentoFormValid') &&
    nma.includes('createAgendamentoFromForm') &&
    nma.includes('updateAgendamentoFromForm') &&
    nma.includes('agendamentoToFormState')
  ) {
    ok('NonatoMainApp usa Agendamento fromForm do módulo agenda')
  } else {
    fail('NonatoMainApp ainda mapeia Agendamento no sítio')
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
    idx.includes('getSidebarGroupSub') &&
    idx.includes('formatNavBackToHub') &&
    idx.includes('getSidebarActionGlyph')
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
  const gruposSrc = fs.readFileSync(path.join(root, 'app/modules/sidebar/grupos.ts'), 'utf8')
  const navGlyphs = exists('app/modules/sidebar/navGlyphs.ts')
    ? fs.readFileSync(path.join(root, 'app/modules/sidebar/navGlyphs.ts'), 'utf8')
    : ''
  if (
    navGlyphs.includes('open-clientes') &&
    navGlyphs.includes('open-fornecedores') &&
    navGlyphs.includes('open-gestores') &&
    gruposSrc.includes("'gestores-default'") &&
    gruposSrc.includes('parceiros-comercial')
  ) {
    ok('sidebar: ícones de acção e cadastros (clientes/fornecedores/técnicos)')
  } else {
    fail('sidebar sem ícones de acção ou gestores fora de cadastros')
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
  if (
    idx.includes('isSidebarButtonFormValid') &&
    idx.includes('createSidebarButtonFromForm') &&
    idx.includes('updateSidebarButtonFromForm') &&
    idx.includes('sidebarButtonToForm') &&
    exists('app/modules/sidebar/buttonForm.ts') &&
    exists('app/modules/sidebar/buttonFromForm.ts')
  ) {
    ok('módulo sidebar exporta SidebarButton form/fromForm')
  } else {
    fail('módulo sidebar sem SidebarButton form/fromForm')
  }
  if (
    nma.includes('isSidebarButtonFormValid') &&
    nma.includes('createSidebarButtonFromForm') &&
    nma.includes('updateSidebarButtonFromForm') &&
    nma.includes('sidebarButtonToForm')
  ) {
    ok('NonatoMainApp usa SidebarButton fromForm do módulo sidebar')
  } else {
    fail('NonatoMainApp ainda mapeia SidebarButton no sítio')
  }
  if (
    idx.includes('HubPainelModulo') &&
    idx.includes('HubPainelStatus') &&
    idx.includes('hubPainelLsKey') &&
    exists('app/modules/sidebar/hubPainel.ts')
  ) {
    ok('módulo sidebar exporta HubPainelModulo')
  } else {
    fail('módulo sidebar sem hubPainel')
  }
  const hubPainelUi = fs.readFileSync(path.join(root, 'app/components/BibliotecaHubPainelRecolhivel.tsx'), 'utf8')
  if (
    (hubPainelUi.includes("from '../modules/sidebar'") || hubPainelUi.includes('from "../modules/sidebar"')) &&
    hubPainelUi.includes('hubPainelLsKey') &&
    !hubPainelUi.includes("export type HubPainelModulo = 'biblioteca'") &&
    !hubPainelUi.includes("export type HubPainelStatus = 'ok'")
  ) {
    ok('BibliotecaHubPainelRecolhivel usa HubPainel do módulo sidebar')
  } else {
    fail('BibliotecaHubPainelRecolhivel ainda define HubPainel no sítio')
  }
  const adminTypesSrc = fs.readFileSync(path.join(root, 'app/components/admin/adminTypes.ts'), 'utf8')
  const menuPermsMod = fs.readFileSync(path.join(root, 'app/modules/sidebar/menuPermissions.ts'), 'utf8')
  if (
    adminTypesSrc.includes("from '../../modules/sidebar/tipos'") &&
    !adminTypesSrc.includes('export type SidebarGroup =') &&
    !adminTypesSrc.includes('export type SidebarButton = {') &&
    menuPermsMod.includes("from './tipos'")
  ) {
    ok('adminTypes reexporta SidebarGroup/SidebarButton do módulo sidebar')
  } else {
    fail('SidebarGroup/SidebarButton ainda definidos em adminTypes')
  }
  if (
    idx.includes('VisualId') &&
    idx.includes('SHOWCASE_MENU') &&
    idx.includes('showcaseNavItemClass') &&
    exists('app/modules/sidebar/showcaseVisual.ts')
  ) {
    ok('módulo sidebar exporta VisualId/SHOWCASE_MENU')
  } else {
    fail('módulo sidebar sem showcaseVisual')
  }
  const showcaseUi = fs.readFileSync(path.join(root, 'app/components/DashboardShowcaseSlideVisual.tsx'), 'utf8')
  if (
    (showcaseUi.includes("from '../modules/sidebar'") || showcaseUi.includes('from "../modules/sidebar"')) &&
    showcaseUi.includes('SHOWCASE_MENU') &&
    showcaseUi.includes('showcaseNavItemClass') &&
    !showcaseUi.includes('export type VisualId =')
  ) {
    ok('DashboardShowcaseSlideVisual usa VisualId do módulo sidebar')
  } else {
    fail('VisualId ainda definido em DashboardShowcaseSlideVisual')
  }
  if (
    idx.includes('ShowcaseSlide') &&
    idx.includes('buildShowcaseSlides') &&
    idx.includes('SHOWCASE_SLIDE_DEFS') &&
    exists('app/modules/sidebar/showcaseSlides.ts')
  ) {
    ok('módulo sidebar exporta ShowcaseSlide')
  } else {
    fail('módulo sidebar sem showcaseSlides')
  }
  const showcaseEntry = fs.readFileSync(path.join(root, 'app/components/DashboardEntryShowcase.tsx'), 'utf8')
  if (
    (showcaseEntry.includes("from '../modules/sidebar'") || showcaseEntry.includes('from "../modules/sidebar"')) &&
    showcaseEntry.includes('buildShowcaseSlides') &&
    !showcaseEntry.includes('type Slide = {')
  ) {
    ok('DashboardEntryShowcase usa buildShowcaseSlides do módulo sidebar')
  } else {
    fail('DashboardEntryShowcase ainda define slides no sítio')
  }
  if (
    idx.includes('SIDEBAR_MENU_MODULES') &&
    idx.includes('canAccessSidebarMenuItem') &&
    idx.includes('ensureUserMenuPolicy') &&
    exists('app/modules/sidebar/menuPermissions.ts')
  ) {
    ok('módulo sidebar exporta menuPermissions')
  } else {
    fail('módulo sidebar sem menuPermissions')
  }
  const libMenuPerms = fs.readFileSync(path.join(root, 'app/lib/sidebarMenuPermissions.ts'), 'utf8')
  const nmaSidebar = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  const userFormPanelSb = fs.readFileSync(path.join(root, 'app/components/admin/AdminUserFormPanel.tsx'), 'utf8')
  const userFormSrc = fs.readFileSync(path.join(root, 'app/modules/admin/userForm.ts'), 'utf8')
  if (
    libMenuPerms.includes("from '../modules/sidebar/menuPermissions'") &&
    !libMenuPerms.includes('export const SIDEBAR_MENU_MODULES') &&
    !libMenuPerms.includes('export function canAccessSidebarMenuItem(') &&
    menuPermsMod.includes("from '../admin/userPermissions'") &&
    nmaSidebar.includes('canAccessSidebarMenuItem') &&
    nmaSidebar.includes('ensureUserMenuPolicy') &&
    !nmaSidebar.includes("from './lib/sidebarMenuPermissions'") &&
    userFormPanelSb.includes('SIDEBAR_MENU_MODULES') &&
    (userFormPanelSb.includes("from '../../modules/sidebar'") || userFormPanelSb.includes('from "../../modules/sidebar"')) &&
    userFormSrc.includes("from '../sidebar/menuPermissions'")
  ) {
    ok('NMA/admin usam menuPermissions do módulo sidebar')
  } else {
    fail('sidebarMenuPermissions ainda definido em lib ou consumidores não usam o módulo')
  }
  const libSidebarMerge = fs.readFileSync(path.join(root, 'app/lib/sidebarMergeUtils.ts'), 'utf8')
  const dataStorageSb = fs.readFileSync(path.join(root, 'app/utils/dataStorage.ts'), 'utf8')
  if (
    idx.includes('mergeSidebarButtonsDeferLocal') &&
    idx.includes('repairSidebarButtonsFromCatalog') &&
    idx.includes('SIDEBAR_BUTTON_CATALOG') &&
    exists('app/modules/sidebar/merge.ts')
  ) {
    ok('módulo sidebar exporta merge')
  } else {
    fail('módulo sidebar sem merge')
  }
  if (
    libSidebarMerge.includes("from '../modules/sidebar/merge'") &&
    !libSidebarMerge.includes('export function mergeSidebarButtonsDeferLocal(') &&
    !libSidebarMerge.includes('export const SIDEBAR_BUTTON_CATALOG')
  ) {
    ok('lib/sidebarMergeUtils só reexporta sidebar/merge')
  } else {
    fail('lib/sidebarMergeUtils ainda implementa o merge')
  }
  if (
    nmaSidebar.includes('mergeSidebarButtonsDeferLocal') &&
    nmaSidebar.includes('repairSidebarButtonsFromCatalog') &&
    !nmaSidebar.includes("from './lib/sidebarMergeUtils'") &&
    dataStorageSb.includes("from '../lib/sidebarMergeUtils'")
  ) {
    ok('NMA usa merge do módulo sidebar; dataStorage via lib')
  } else {
    fail('NMA ainda importa sidebarMergeUtils do lib')
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
    idx.includes('COMPRESS_IMAGE_MAX_W')
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
  const compressMod = fs.readFileSync(path.join(root, 'app/modules/diario/compressImage.ts'), 'utf8')
  const libCompress = exists('app/lib/diarioCompressImage.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/diarioCompressImage.ts'), 'utf8')
    : ''
  if (
    !compressMod.includes('document.createElement') &&
    !compressMod.includes('createImageBitmap') &&
    libCompress.includes('document.createElement') &&
    nma.includes("from './lib/diarioCompressImage'")
  ) {
    ok('NonatoMainApp comprime imagens do diário via lib')
  } else {
    fail('lib/diarioCompressImage ainda não envolve compressImageFileToJpegDataUrl')
  }
  if (
    idx.includes('isDiarioPedidoConteudoValid') &&
    idx.includes('createDiarioPedidoFromForm') &&
    idx.includes('updateDiarioPedidoFromForm') &&
    idx.includes('buildDiarioPedidoTexto') &&
    exists('app/modules/diario/fromForm.ts')
  ) {
    ok('módulo diario exporta DiarioPedido fromForm')
  } else {
    fail('módulo diario sem DiarioPedido fromForm')
  }
  if (
    nma.includes('isDiarioPedidoConteudoValid') &&
    nma.includes('createDiarioPedidoFromForm') &&
    nma.includes('updateDiarioPedidoFromForm') &&
    nma.includes('buildDiarioPedidoTexto')
  ) {
    ok('NonatoMainApp usa DiarioPedido fromForm do módulo')
  } else {
    fail('NonatoMainApp ainda mapeia DiarioPedido no sítio')
  }
  const diarioFromForm = fs.readFileSync(path.join(root, 'app/modules/diario/fromForm.ts'), 'utf8')
  const libDiarioFromForm = exists('app/lib/diarioFromForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/diarioFromForm.ts'), 'utf8')
    : ''
  if (
    diarioFromForm.includes('nowMs: number') &&
    !diarioFromForm.includes('Date.now()') &&
    !diarioFromForm.includes('Math.random') &&
    !diarioFromForm.includes('new Date().toISOString()')
  ) {
    ok('módulo diario fromForm é puro (relógio/aleatório injectados)')
  } else {
    fail('módulo diario/fromForm ainda usa Date.now ou Math.random')
  }
  if (
    libDiarioFromForm.includes('createDiarioPedidoFromForm as createDiarioPedidoFromFormPure') &&
    libDiarioFromForm.includes('Date.now()') &&
    libDiarioFromForm.includes('Math.random')
  ) {
    ok('lib/diarioFromForm só envolve relógio/aleatório do diário')
  } else {
    fail('lib/diarioFromForm ainda não envolve o diário fromForm')
  }
  if (nma.includes("from './lib/diarioFromForm'")) {
    ok('NonatoMainApp usa diário fromForm via lib')
  } else {
    fail('NonatoMainApp não importa diário fromForm do lib')
  }
  const lembreteLib = fs.readFileSync(path.join(root, 'app/lib/diarioLembrete.ts'), 'utf8')
  const picker = fs.readFileSync(path.join(root, 'app/components/DiarioLembreteIntervalPicker.tsx'), 'utf8')
  if (
    idx.includes('formatDiarioLembreteIntervalo') &&
    idx.includes('isDiarioLembreteDue') &&
    idx.includes('clearDiarioLembreteOnConcluido') &&
    exists('app/modules/diario/lembrete.ts')
  ) {
    ok('módulo diario exporta lembrete')
  } else {
    fail('módulo diario sem lembrete')
  }
  if (
    lembreteLib.includes("from '../modules/diario/lembrete'") &&
    lembreteLib.includes('requestDiarioNotificationPermission') &&
    lembreteLib.includes('showDiarioBrowserNotification') &&
    !lembreteLib.includes('export const DIARIO_LEMBRETE_INTERVALOS_MIN')
  ) {
    ok('lib/diarioLembrete só envolve relógio/notificação do módulo')
  } else {
    fail('lib/diarioLembrete ainda implementa o lembrete')
  }
  if (
    nma.includes('formatDiarioLembreteIntervalo') &&
    nma.includes('isDiarioLembreteDue') &&
    nma.includes('clearDiarioLembreteOnConcluido') &&
    nma.includes('requestDiarioNotificationPermission') &&
    nma.includes("from './lib/diarioLembrete'")
  ) {
    ok('NonatoMainApp usa lembrete do módulo diario')
  } else {
    fail('NonatoMainApp sem lembrete do módulo diario')
  }
  if (picker.includes("from '../modules/diario'") && !picker.includes("from '../lib/diarioLembrete'")) {
    ok('DiarioLembreteIntervalPicker usa lembrete do módulo diario')
  } else {
    fail('DiarioLembreteIntervalPicker ainda importa diarioLembrete do lib')
  }
} catch (e) {
  fail(`módulo diario: ${e.message}`)
}

// 3m2) Módulo ui (182.º corte: lote de listas)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/ui/index.ts'), 'utf8')
  const lote = fs.readFileSync(path.join(root, 'app/modules/ui/listaLote.ts'), 'utf8')
  const loteLib = fs.readFileSync(path.join(root, 'app/lib/listaUiLote.ts'), 'utf8')
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (
    idx.includes('LISTA_UI_LOTE') &&
    idx.includes('limiteListaUi') &&
    exists('app/modules/ui/listaLote.ts')
  ) {
    ok('módulo ui exporta listaLote')
  } else {
    fail('módulo ui sem listaLote')
  }
  if (lote.includes('export const LISTA_UI_LOTE = 40') && lote.includes('export function limiteListaUi')) {
    ok('ui/listaLote define lote de ecrã')
  } else {
    fail('ui/listaLote incompleto')
  }
  if (
    loteLib.includes("from '../modules/ui/listaLote'") &&
    !loteLib.includes('export const LISTA_UI_LOTE = 40')
  ) {
    ok('lib/listaUiLote só reexporta ui/listaLote')
  } else {
    fail('lib/listaUiLote ainda implementa o lote')
  }
  if (nma.includes("from './modules/ui'") && nma.includes('LISTA_UI_LOTE') && !nma.includes("from './lib/listaUiLote'")) {
    ok('NonatoMainApp usa listaLote do módulo ui')
  } else {
    fail('NonatoMainApp ainda importa listaUiLote do lib')
  }
} catch (e) {
  fail(`módulo ui: ${e.message}`)
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
  if (
    idx.includes('isProtocoloServicoFormValid') &&
    idx.includes('createProtocoloServicoFromForm') &&
    idx.includes('updateProtocoloServicoFromForm') &&
    idx.includes('emptyProtocoloServicoForm') &&
    exists('app/modules/protocolo/formState.ts') &&
    exists('app/modules/protocolo/fromForm.ts')
  ) {
    ok('módulo protocolo exporta ProtocoloServico form/fromForm')
  } else {
    fail('módulo protocolo sem ProtocoloServico form/fromForm')
  }
  if (
    nma.includes('protocoloServicoFormMissing') &&
    nma.includes('createProtocoloServicoFromForm') &&
    nma.includes('updateProtocoloServicoFromForm')
  ) {
    ok('NonatoMainApp usa ProtocoloServico fromForm do módulo')
  } else {
    fail('NonatoMainApp ainda mapeia ProtocoloServico no sítio')
  }
  if (
    idx.includes('ProtocoloIntelFiltroChip') &&
    idx.includes('avaliarCompletudeProtocolo') &&
    idx.includes('aplicarFiltroInteligenteChip') &&
    idx.includes('PROTOCOLO_FILTRO_CHIPS') &&
    exists('app/modules/protocolo/intelFiltro.ts')
  ) {
    ok('módulo protocolo exporta intelFiltro')
  } else {
    fail('módulo protocolo sem intelFiltro')
  }
  const intelFiltroLib = fs.readFileSync(path.join(root, 'app/lib/protocoloInteligente.ts'), 'utf8')
  const intelFiltroMod = fs.readFileSync(path.join(root, 'app/modules/protocolo/intelFiltro.ts'), 'utf8')
  if (
    intelFiltroLib.includes("from '../modules/protocolo/intelFiltro'") &&
    !intelFiltroLib.includes('export type ProtocoloFormMin = {') &&
    intelFiltroLib.includes('aplicarFiltroInteligenteChip as aplicarFiltroInteligenteChipPure') &&
    intelFiltroMod.includes('nowMs: number') &&
    !intelFiltroMod.includes('Date.now()') &&
    nma.includes('aplicarFiltroInteligenteChip') &&
    nma.includes("from './lib/protocoloInteligente'") &&
    nma.includes('avaliarCompletudeProtocolo') &&
    nma.includes('PROTOCOLO_FILTRO_CHIPS')
  ) {
    ok('NonatoMainApp usa intelFiltro do módulo protocolo')
  } else {
    fail('intelFiltro ainda definido em lib ou NMA não usa o módulo')
  }
  if (
    idx.includes('rotuloProtocoloIntelFiltroChip') &&
    idx.includes('rotuloProtocoloTemplate') &&
    idx.includes('rotulosProtocoloWizardPassos') &&
    idx.includes('ProtocoloIntelFiltroChips') &&
    idx.includes('ProtocoloCompletudeBar') &&
    exists('app/modules/protocolo/intelLabels.ts') &&
    exists('app/modules/protocolo/intelChips.tsx') &&
    exists('app/modules/protocolo/intelCompletude.tsx')
  ) {
    ok('módulo protocolo exporta intelLabels/chips/completude UI')
  } else {
    fail('módulo protocolo sem intelLabels/chips/completude')
  }
  if (
    nma.includes('rotuloProtocoloTemplate') &&
    nma.includes('rotulosProtocoloWizardPassos') &&
    nma.includes('ProtocoloIntelFiltroChips') &&
    nma.includes('ProtocoloCompletudeBar') &&
    !nma.includes('const protoChipLabel') &&
    !nma.includes('const protoTemplateLabel')
  ) {
    ok('NonatoMainApp usa chips/completude/rótulos do módulo protocolo')
  } else {
    fail('NonatoMainApp ainda define protoChipLabel/protoTemplateLabel no sítio')
  }
  if (
    idx.includes('ProtocoloTemplateGrid') &&
    idx.includes('ProtocoloCockpitLanes') &&
    exists('app/modules/protocolo/intelTemplatesUi.tsx') &&
    exists('app/modules/protocolo/intelLanes.tsx')
  ) {
    ok('módulo protocolo exporta template grid e lanes UI')
  } else {
    fail('módulo protocolo sem intelTemplatesUi/intelLanes')
  }
  if (
    nma.includes('ProtocoloTemplateGrid') &&
    nma.includes('ProtocoloCockpitLanes') &&
    !nma.includes('proto-template-grid') &&
    !nma.includes('proto-cockpit-lanes')
  ) {
    ok('NonatoMainApp usa template grid e lanes do módulo protocolo')
  } else {
    fail('NonatoMainApp ainda define grelha de modelos ou lanes de protocolo no sítio')
  }
  if (
    idx.includes('ProtocoloCockpitWizardSteps') &&
    exists('app/modules/protocolo/intelWizard.tsx') &&
    nma.includes('ProtocoloCockpitWizardSteps') &&
    !nma.includes('proto-cockpit-rail__steps')
  ) {
    ok('NonatoMainApp usa wizard steps do módulo protocolo')
  } else {
    fail('módulo protocolo sem intelWizard ou NMA ainda define os passos no sítio')
  }
  if (
    idx.includes('ProtocoloCockpitEmpty') &&
    idx.includes('ProtocoloCockpitGroup') &&
    exists('app/modules/protocolo/intelEmpty.tsx') &&
    exists('app/modules/protocolo/intelGroup.tsx')
  ) {
    ok('módulo protocolo exporta empty e group do cockpit')
  } else {
    fail('módulo protocolo sem intelEmpty/intelGroup')
  }
  if (
    nma.includes('ProtocoloCockpitEmpty') &&
    nma.includes('ProtocoloCockpitGroup') &&
    nma.includes('rotuloProtocoloEnviadoVia') &&
    nma.includes('rotuloProtocoloPdfModelo') &&
    nma.includes('mensagemProtocoloListaVaziaExec') &&
    !nma.includes('proto-cockpit-empty') &&
    !nma.includes('proto-cockpit-group')
  ) {
    ok('NonatoMainApp usa empty/group/rótulos do módulo protocolo')
  } else {
    fail('NonatoMainApp ainda define empty/group/viaLabel de protocolo no sítio')
  }
  if (
    idx.includes('ProtocoloCockpitCardTags') &&
    idx.includes('ProtocoloArquivoNav') &&
    idx.includes('ProtocoloArquivoClienteHead') &&
    exists('app/modules/protocolo/intelCardTags.tsx') &&
    exists('app/modules/protocolo/intelArquivoNav.tsx') &&
    exists('app/modules/protocolo/intelArquivoCliente.tsx')
  ) {
    ok('módulo protocolo exporta tags, nav e cabeçalho de arquivo')
  } else {
    fail('módulo protocolo sem intelCardTags/intelArquivoNav/intelArquivoCliente')
  }
  if (
    nma.includes('ProtocoloCockpitCardTags') &&
    nma.includes('ProtocoloArquivoNav') &&
    nma.includes('ProtocoloArquivoClienteSection') &&
    nma.includes('rotuloProtocoloArquivoMeta') &&
    !nma.includes('proto-cockpit-card__tags') &&
    !nma.includes('proto-arquivo-nav') &&
    !nma.includes('proto-arquivo-cliente')
  ) {
    ok('NonatoMainApp usa tags/nav/arquivo cliente do módulo protocolo')
  } else {
    fail('NonatoMainApp ainda define tags/nav/arquivo cliente de protocolo no sítio')
  }
  if (
    idx.includes('ProtocoloPdfModeloSelect') &&
    idx.includes('ProtocoloCockpitCardQuick') &&
    exists('app/modules/protocolo/intelPdfModeloSelect.tsx') &&
    exists('app/modules/protocolo/intelCardQuick.tsx')
  ) {
    ok('módulo protocolo exporta select de modelo PDF e acções rápidas do cartão')
  } else {
    fail('módulo protocolo sem intelPdfModeloSelect/intelCardQuick')
  }
  if (
    nma.includes('ProtocoloPdfModeloSelect') &&
    nma.includes('ProtocoloCockpitCardQuick') &&
    !nma.includes('proto-cockpit-card__quick')
  ) {
    ok('NonatoMainApp usa select PDF e acções rápidas do módulo protocolo')
  } else {
    fail('NonatoMainApp ainda define select/quick de protocolo no sítio')
  }
  if (
    idx.includes('ProtocoloTemplateId') &&
    idx.includes('PROTOCOLO_TEMPLATE_IDS') &&
    idx.includes('blocosDeTemplate') &&
    exists('app/modules/protocolo/intelTemplates.ts')
  ) {
    ok('módulo protocolo exporta intelTemplates')
  } else {
    fail('módulo protocolo sem intelTemplates')
  }
  if (
    intelFiltroLib.includes("from '../modules/protocolo/intelTemplates'") &&
    !intelFiltroLib.includes("export type ProtocoloTemplateId = 'diagnostico'") &&
    !intelFiltroLib.includes('export function blocosDeTemplate(') &&
    nma.includes('blocosDeTemplate') &&
    nma.includes('PROTOCOLO_TEMPLATE_IDS') &&
    nma.includes('ProtocoloTemplateId')
  ) {
    ok('NonatoMainApp usa intelTemplates do módulo protocolo')
  } else {
    fail('intelTemplates ainda definido em lib ou NMA não usa o módulo')
  }
  if (
    idx.includes('historicoProtocolosCliente') &&
    idx.includes('pecasMaisUsadasHistorico') &&
    exists('app/modules/protocolo/intelHistorico.ts')
  ) {
    ok('módulo protocolo exporta intelHistorico')
  } else {
    fail('módulo protocolo sem intelHistorico')
  }
  if (
    intelFiltroLib.includes("from '../modules/protocolo/intelHistorico'") &&
    !intelFiltroLib.includes('export function historicoProtocolosCliente<') &&
    !intelFiltroLib.includes('export function pecasMaisUsadasHistorico(') &&
    nma.includes('historicoProtocolosCliente') &&
    nma.includes('pecasMaisUsadasHistorico')
  ) {
    ok('NonatoMainApp usa intelHistorico do módulo protocolo')
  } else {
    fail('intelHistorico ainda definido em lib ou NMA não usa o módulo')
  }
  if (
    idx.includes('ProtocoloRelatorioServicoMin') &&
    idx.includes('relatoriosServicoParaProtocolo') &&
    idx.includes('sugerirRelatorioServicoId') &&
    exists('app/modules/protocolo/intelRelatorio.ts')
  ) {
    ok('módulo protocolo exporta intelRelatorio')
  } else {
    fail('módulo protocolo sem intelRelatorio')
  }
  if (
    intelFiltroLib.includes("from '../modules/protocolo/intelRelatorio'") &&
    !intelFiltroLib.includes('export type RelatorioServicoMin = {') &&
    !intelFiltroLib.includes('export function relatoriosServicoParaProtocolo(') &&
    nma.includes('relatoriosServicoParaProtocolo') &&
    nma.includes('sugerirRelatorioServicoId')
  ) {
    ok('NonatoMainApp usa intelRelatorio do módulo protocolo')
  } else {
    fail('intelRelatorio ainda definido em lib ou NMA não usa o módulo')
  }
  if (
    idx.includes('ProtocoloArquivoItem') &&
    idx.includes('normalizeProtocoloStatus') &&
    idx.includes('agruparProtocolosExecutadosPorClienteEData') &&
    exists('app/modules/protocolo/intelArquivo.ts')
  ) {
    ok('módulo protocolo exporta intelArquivo')
  } else {
    fail('módulo protocolo sem intelArquivo')
  }
  if (
    intelFiltroLib.includes("from '../modules/protocolo/intelArquivo'") &&
    !intelFiltroLib.includes('export function normalizeProtocoloStatus(') &&
    !intelFiltroLib.includes('export function agruparProtocolosExecutadosPorClienteEData<') &&
    nma.includes('protocoloEstaEmExecucao') &&
    nma.includes('agruparProtocolosExecutadosPorClienteEData')
  ) {
    ok('NonatoMainApp usa intelArquivo do módulo protocolo')
  } else {
    fail('intelArquivo ainda definido em lib ou NMA não usa o módulo')
  }
  if (
    nma.includes('emptyProtocoloServicoForm') &&
    nma.includes('protocoloServicoToForm') &&
    !nma.includes('protocoloFormVazio') &&
    !nma.includes('formRascunhoDeProtocolo')
  ) {
    ok('NonatoMainApp usa empty/toForm canónicos do módulo protocolo')
  } else {
    fail('NonatoMainApp ainda usa aliases protocoloFormVazio/formRascunhoDeProtocolo')
  }
  const protoBlocos = fs.readFileSync(path.join(root, 'app/modules/protocolo/blocos.ts'), 'utf8')
  const protoFromForm = fs.readFileSync(path.join(root, 'app/modules/protocolo/fromForm.ts'), 'utf8')
  const libProtoBlocos = exists('app/lib/protocoloBlocos.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/protocoloBlocos.ts'), 'utf8')
    : ''
  const libProtoFromForm = exists('app/lib/protocoloFromForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/protocoloFromForm.ts'), 'utf8')
    : ''
  if (
    protoBlocos.includes('nowMs: number') &&
    protoBlocos.includes('random: () => number') &&
    !protoBlocos.includes('Date.now()') &&
    !protoBlocos.includes('Math.random') &&
    !protoBlocos.includes('crypto')
  ) {
    ok('módulo protocolo/blocos é puro (relógio/aleatório injectados)')
  } else {
    fail('módulo protocolo/blocos ainda usa Date.now, Math.random ou crypto')
  }
  if (
    protoFromForm.includes('nowMs: number') &&
    !protoFromForm.includes('Date.now()') &&
    !protoFromForm.includes('Math.random') &&
    !protoFromForm.includes('new Date().toISOString()')
  ) {
    ok('módulo protocolo/fromForm é puro (relógio injectado)')
  } else {
    fail('módulo protocolo/fromForm ainda usa Date.now ou new Date()')
  }
  if (
    libProtoBlocos.includes('newProtocoloBlocoId as newProtocoloBlocoIdPure') &&
    libProtoBlocos.includes('Date.now()') &&
    libProtoFromForm.includes('createProtocoloServicoFromForm as createProtocoloServicoFromFormPure') &&
    libProtoFromForm.includes('Date.now()')
  ) {
    ok('lib protocolo envolve ids/fromForm do protocolo')
  } else {
    fail('lib protocolo ainda não envolve ids/fromForm')
  }
  if (
    nma.includes("from './lib/protocoloBlocos'") &&
    nma.includes("from './lib/protocoloFromForm'")
  ) {
    ok('NonatoMainApp usa protocolo ids/fromForm via lib')
  } else {
    fail('NonatoMainApp não importa protocolo ids/fromForm do lib')
  }
  if (
    idx.includes('clampProtocoloPdfModelo') &&
    idx.includes('PROTOCOLO_PDF_MODELO_PADRAO') &&
    idx.includes('PROTOCOLO_SERVICO_PDF_MODELOS_MAX') &&
    exists('app/modules/protocolo/pdfModelo.ts')
  ) {
    ok('módulo protocolo exporta pdfModelo')
  } else {
    fail('módulo protocolo sem pdfModelo')
  }
  const themesSrc = fs.readFileSync(path.join(root, 'app/utils/protocoloServicoPdfThemes.ts'), 'utf8')
  const fromFormSrc = fs.readFileSync(path.join(root, 'app/modules/protocolo/fromForm.ts'), 'utf8')
  const protoMapSrc = fs.readFileSync(path.join(root, 'app/modules/pdf/modeloProtocoloMap.ts'), 'utf8')
  if (
    themesSrc.includes("from '../modules/protocolo/pdfModelo'") &&
    !themesSrc.includes('export function clampProtocoloPdfModelo(') &&
    fromFormSrc.includes("from './pdfModelo'") &&
    protoMapSrc.includes("from '../protocolo/pdfModelo'") &&
    nma.includes('clampProtocoloPdfModelo') &&
    nma.includes('PROTOCOLO_PDF_MODELO_PADRAO') &&
    !nma.includes("from './utils/protocoloServicoPdfThemes'")
  ) {
    ok('NMA/fromForm/mapa usam pdfModelo do módulo protocolo')
  } else {
    fail('clampProtocoloPdfModelo ainda definido em utils ou consumidores não usam o módulo')
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
  if (
    idx.includes('isChecklistTemplateFormValid') &&
    idx.includes('createChecklistTemplateFromForm') &&
    idx.includes('updateChecklistTemplateFromForm') &&
    idx.includes('checklistTemplateToForm') &&
    exists('app/modules/checklist/templateForm.ts') &&
    exists('app/modules/checklist/templateFromForm.ts')
  ) {
    ok('módulo checklist exporta ChecklistTemplate form/fromForm')
  } else {
    fail('módulo checklist sem ChecklistTemplate form/fromForm')
  }
  if (
    nma.includes('isChecklistTemplateFormValid') &&
    nma.includes('createChecklistTemplateFromForm') &&
    nma.includes('updateChecklistTemplateFromForm') &&
    nma.includes('checklistTemplateToForm')
  ) {
    ok('NonatoMainApp usa ChecklistTemplate fromForm do módulo checklist')
  } else {
    fail('NonatoMainApp ainda mapeia ChecklistTemplate no sítio')
  }
  if (
    idx.includes('isGrupoChecklistFormValid') &&
    idx.includes('createGrupoChecklistFromForm') &&
    idx.includes('updateGrupoChecklistFromForm') &&
    idx.includes('grupoChecklistToForm') &&
    exists('app/modules/checklist/grupoForm.ts') &&
    exists('app/modules/checklist/grupoFromForm.ts')
  ) {
    ok('módulo checklist exporta GrupoChecklist form/fromForm')
  } else {
    fail('módulo checklist sem GrupoChecklist form/fromForm')
  }
  if (
    nma.includes('isGrupoChecklistFormValid') &&
    nma.includes('createGrupoChecklistFromForm') &&
    nma.includes('updateGrupoChecklistFromForm') &&
    nma.includes('emptyGrupoChecklistForm')
  ) {
    ok('NonatoMainApp usa GrupoChecklist fromForm do módulo checklist')
  } else {
    fail('NonatoMainApp ainda mapeia GrupoChecklist no sítio')
  }
  if (
    idx.includes('isManutencaoChecklistFormValid') &&
    idx.includes('createManutencaoChecklistFromForm') &&
    idx.includes('updateManutencaoChecklistFromForm') &&
    idx.includes('manutencaoChecklistToForm') &&
    exists('app/modules/checklist/manutencaoForm.ts') &&
    exists('app/modules/checklist/manutencaoFromForm.ts')
  ) {
    ok('módulo checklist exporta ManutencaoChecklist form/fromForm')
  } else {
    fail('módulo checklist sem ManutencaoChecklist form/fromForm')
  }
  if (
    nma.includes('isManutencaoChecklistFormValid') &&
    nma.includes('createManutencaoChecklistFromForm') &&
    nma.includes('updateManutencaoChecklistFromForm') &&
    nma.includes('emptyManutencaoChecklistForm')
  ) {
    ok('NonatoMainApp usa ManutencaoChecklist fromForm do módulo checklist')
  } else {
    fail('NonatoMainApp ainda mapeia ManutencaoChecklist no sítio')
  }
  const tplFromForm = fs.readFileSync(path.join(root, 'app/modules/checklist/templateFromForm.ts'), 'utf8')
  const grpFromForm = fs.readFileSync(path.join(root, 'app/modules/checklist/grupoFromForm.ts'), 'utf8')
  const manFromForm = fs.readFileSync(path.join(root, 'app/modules/checklist/manutencaoFromForm.ts'), 'utf8')
  const libChecklistFromForm = exists('app/lib/checklistFromForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/checklistFromForm.ts'), 'utf8')
    : ''
  if (
    tplFromForm.includes('nowMs: number') &&
    !tplFromForm.includes('Date.now()') &&
    !tplFromForm.includes('new Date().toISOString()') &&
    grpFromForm.includes('nowMs: number') &&
    !grpFromForm.includes('Date.now()') &&
    !grpFromForm.includes('new Date().toISOString()') &&
    manFromForm.includes('nowMs: number') &&
    !manFromForm.includes('Date.now()') &&
    !manFromForm.includes('new Date().toISOString()')
  ) {
    ok('módulo checklist template/grupo/manutencao fromForm é puro')
  } else {
    fail('módulo checklist fromForm ainda usa Date.now ou new Date()')
  }
  if (
    libChecklistFromForm.includes('createChecklistTemplateFromForm as createChecklistTemplateFromFormPure') &&
    libChecklistFromForm.includes('createGrupoChecklistFromForm as createGrupoChecklistFromFormPure') &&
    libChecklistFromForm.includes('createManutencaoChecklistFromForm as createManutencaoChecklistFromFormPure') &&
    libChecklistFromForm.includes('Date.now()')
  ) {
    ok('lib/checklistFromForm só envolve o relógio do checklist')
  } else {
    fail('lib/checklistFromForm ainda não envolve o checklist fromForm')
  }
  if (nma.includes("from './lib/checklistFromForm'")) {
    ok('NonatoMainApp usa checklist fromForm via lib')
  } else {
    fail('NonatoMainApp não importa checklist fromForm do lib')
  }
  const gerarMappers = fs.readFileSync(path.join(root, 'app/modules/checklist/gerarMappers.ts'), 'utf8')
  if (
    gerarMappers.includes('nowMs: number') &&
    !gerarMappers.includes('Date.now()') &&
    !gerarMappers.includes('new Date().toISOString()')
  ) {
    ok('módulo checklist gerarMappers é puro (relógio injectado)')
  } else {
    fail('módulo checklist/gerarMappers ainda usa Date.now ou new Date()')
  }
  if (
    libChecklistFromForm.includes('buildManutencoesDoGrupo as buildManutencoesDoGrupoPure') &&
    libChecklistFromForm.includes('buildChecklistGeradoRecord as buildChecklistGeradoRecordPure') &&
    libChecklistFromForm.includes('buildPecasArmazemFromChecklist as buildPecasArmazemFromChecklistPure')
  ) {
    ok('lib/checklistFromForm envolve os mappers de geração')
  } else {
    fail('lib/checklistFromForm ainda não envolve gerarMappers')
  }
  const salvoFromForm = fs.readFileSync(path.join(root, 'app/modules/checklist/salvoFromForm.ts'), 'utf8')
  const itemTrabFromForm = fs.readFileSync(path.join(root, 'app/modules/checklist/itemTrabalhoFromForm.ts'), 'utf8')
  const basicoTipos = fs.readFileSync(path.join(root, 'app/modules/checklist/basicoTipos.ts'), 'utf8')
  if (
    salvoFromForm.includes('nowMs: number') &&
    !salvoFromForm.includes('Date.now()') &&
    !salvoFromForm.includes('new Date().toISOString()') &&
    itemTrabFromForm.includes('nowMs: number') &&
    !itemTrabFromForm.includes('Date.now()') &&
    !itemTrabFromForm.includes('new Date().toISOString()') &&
    basicoTipos.includes('nowMs: number') &&
    !basicoTipos.includes('Date.now()') &&
    !basicoTipos.includes('Math.random')
  ) {
    ok('módulo checklist salvo/item/basico é puro (relógio injectado)')
  } else {
    fail('módulo checklist salvo/item/basico ainda usa Date.now ou Math.random')
  }
  if (
    idx.includes('isChecklistSalvoFormValid') &&
    idx.includes('createChecklistSalvoFromForm') &&
    exists('app/modules/checklist/salvoFromForm.ts')
  ) {
    ok('módulo checklist exporta ChecklistSalvo fromForm')
  } else {
    fail('módulo checklist sem ChecklistSalvo fromForm')
  }
  if (
    nma.includes('isChecklistSalvoFormValid') &&
    nma.includes('createChecklistSalvoFromForm')
  ) {
    ok('NonatoMainApp usa ChecklistSalvo fromForm do módulo')
  } else {
    fail('NonatoMainApp ainda mapeia ChecklistSalvo no sítio')
  }
  if (
    idx.includes('CriacaoChecklistItemForm') &&
    idx.includes('emptyCriacaoChecklistItemForm') &&
    idx.includes('createItemTrabalhoCriacaoFromForm') &&
    exists('app/modules/checklist/itemTrabalhoForm.ts') &&
    exists('app/modules/checklist/itemTrabalhoFromForm.ts')
  ) {
    ok('módulo checklist exporta ItemTrabalhoCriacao form/fromForm')
  } else {
    fail('módulo checklist sem ItemTrabalhoCriacao form/fromForm')
  }
  const fgCk = fs.readFileSync(path.join(root, 'app/components/FamiliasGruposChecklistContent.tsx'), 'utf8')
  if (
    (fgCk.includes("from '../modules/checklist'") || fgCk.includes('from "../modules/checklist"')) &&
    fgCk.includes('emptyCriacaoChecklistItemForm') &&
    fgCk.includes('createItemTrabalhoCriacaoFromForm') &&
    fgCk.includes('itemTrabalhoCriacaoToForm') &&
    !fgCk.includes('export type CriacaoChecklistItemForm = {')
  ) {
    ok('FamiliasGruposChecklistContent usa ItemTrabalho fromForm do módulo')
  } else {
    fail('FamiliasGruposChecklistContent ainda mapeia item de trabalho no sítio')
  }
  if (nma.includes('emptyCriacaoChecklistItemForm')) {
    ok('NonatoMainApp usa emptyCriacaoChecklistItemForm do módulo')
  } else {
    fail('NonatoMainApp ainda monta criacaoChecklistItemForm no sítio')
  }
  if (
    idx.includes('ChecklistBasicoInstancia') &&
    idx.includes('CHECKLIST_BASICO_STORAGE_KEY') &&
    idx.includes('newChecklistBasicoId') &&
    exists('app/modules/checklist/basicoTipos.ts')
  ) {
    ok('módulo checklist exporta ChecklistBasicoInstancia')
  } else {
    fail('módulo checklist sem basicoTipos')
  }
  const libBasico = fs.readFileSync(path.join(root, 'app/lib/checklistBasicoTypes.ts'), 'utf8')
  const ckBasicoUi = fs.readFileSync(path.join(root, 'app/components/ChecklistBasicoContent.tsx'), 'utf8')
  if (
    libBasico.includes("from '../modules/checklist/basicoTipos'") &&
    !libBasico.includes('export type ChecklistBasicoInstancia = {') &&
    (ckBasicoUi.includes("from '../modules/checklist'") || ckBasicoUi.includes('from "../modules/checklist"')) &&
    ckBasicoUi.includes('ChecklistBasicoInstancia') &&
    ckBasicoUi.includes('newChecklistBasicoId')
  ) {
    ok('ChecklistBasicoContent usa tipos do módulo checklist')
  } else {
    fail('ChecklistBasico ainda definido em lib ou no componente')
  }
  if (ckBasicoUi.includes("from '../lib/checklistBasicoTypes'")) {
    ok('ChecklistBasicoContent usa newChecklistBasicoId via lib')
  } else {
    fail('ChecklistBasicoContent não importa newChecklistBasicoId do lib')
  }
  if (fgCk.includes("from '../lib/checklistFromForm'")) {
    ok('FamiliasGruposChecklistContent usa itemTrabalho fromForm via lib')
  } else {
    fail('FamiliasGruposChecklistContent não importa itemTrabalho fromForm do lib')
  }
  if (
    idx.includes('ChecklistBasicoEquipamentoResumo') &&
    idx.includes('checklistBasicoEquipamentoKey') &&
    idx.includes('checklistBasicoEquipamentoLabel') &&
    exists('app/modules/checklist/basicoEquipamento.ts')
  ) {
    ok('módulo checklist exporta basicoEquipamento')
  } else {
    fail('módulo checklist sem basicoEquipamento')
  }
  if (
    ckBasicoUi.includes('ChecklistBasicoEquipamentoResumo') &&
    ckBasicoUi.includes('checklistBasicoEquipamentoKey') &&
    ckBasicoUi.includes('checklistBasicoEquipamentoLabel') &&
    !ckBasicoUi.includes('type EquipamentoClienteResumo = {') &&
    !ckBasicoUi.includes('function equipamentoClienteKey(') &&
    !ckBasicoUi.includes('function equipamentoLabel(')
  ) {
    ok('ChecklistBasicoContent usa basicoEquipamento do módulo')
  } else {
    fail('EquipamentoClienteResumo ainda definido no ChecklistBasicoContent')
  }
  if (
    idx.includes('buildChecklistBasicoPrintHtml') &&
    idx.includes('buildChecklistBasicoEnvioTexto') &&
    idx.includes('telefoneDigitsParaWa') &&
    exists('app/modules/checklist/basicoPdf.ts')
  ) {
    ok('módulo checklist exporta basicoPdf')
  } else {
    fail('módulo checklist sem basicoPdf')
  }
  const libBasicoPdf = fs.readFileSync(path.join(root, 'app/lib/checklistBasicoPdf.ts'), 'utf8')
  if (
    libBasicoPdf.includes("from '../modules/checklist/basicoPdf'") &&
    libBasicoPdf.includes('window.open') &&
    !libBasicoPdf.includes('export function buildChecklistBasicoPrintHtml(') &&
    !libBasicoPdf.includes('export function buildChecklistBasicoEnvioTexto(') &&
    !libBasicoPdf.includes('function telefoneDigitsParaWa(')
  ) {
    ok('lib/checklistBasicoPdf só envolve window; builders no módulo')
  } else {
    fail('lib/checklistBasicoPdf ainda implementa o HTML/texto do PDF')
  }
  if (ckBasicoUi.includes("from '../lib/checklistBasicoPdf'") && ckBasicoUi.includes('openChecklistBasicoPrint')) {
    ok('ChecklistBasicoContent abre PDF via lib (window)')
  } else {
    fail('ChecklistBasicoContent deixou de usar openChecklistBasicoPrint do lib')
  }
} catch (e) {
  fail(`módulo checklist: ${e.message}`)
}

// 3p-op) Módulo ordem-preparacao (93.º corte — form/fromForm)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/ordem-preparacao/index.ts'), 'utf8')
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (
    idx.includes('isOrdemPreparacaoFormValid') &&
    idx.includes('createOrdemPreparacaoFromForm') &&
    idx.includes('updateOrdemPreparacaoFromForm') &&
    idx.includes('ordemPreparacaoToForm') &&
    idx.includes('emptyOrdemPreparacaoForm') &&
    exists('app/modules/ordem-preparacao/tipos.ts') &&
    exists('app/modules/ordem-preparacao/formState.ts') &&
    exists('app/modules/ordem-preparacao/fromForm.ts')
  ) {
    ok('módulo ordem-preparacao exporta form/fromForm')
  } else {
    fail('módulo ordem-preparacao sem form/fromForm')
  }
  if (
    nma.includes("from './modules/ordem-preparacao'") &&
    nma.includes('isOrdemPreparacaoFormValid') &&
    nma.includes('createOrdemPreparacaoFromForm') &&
    nma.includes('updateOrdemPreparacaoFromForm') &&
    nma.includes('emptyOrdemPreparacaoForm') &&
    nma.includes('ordemPreparacaoToForm')
  ) {
    ok('NonatoMainApp usa OrdemPreparacao fromForm do módulo')
  } else {
    fail('NonatoMainApp ainda mapeia OrdemPreparacao no sítio')
  }
  if (
    idx.includes('createFormularioChecklistFromOrdem') &&
    idx.includes('FormularioChecklistFromOrdem') &&
    exists('app/modules/ordem-preparacao/formularioChecklistFromOrdem.ts')
  ) {
    ok('módulo ordem-preparacao exporta createFormularioChecklistFromOrdem')
  } else {
    fail('módulo ordem-preparacao sem createFormularioChecklistFromOrdem')
  }
  if (nma.includes('createFormularioChecklistFromOrdem')) {
    ok('NonatoMainApp usa createFormularioChecklistFromOrdem do módulo')
  } else {
    fail('NonatoMainApp ainda mapeia formulário de ordem no sítio')
  }
  const opFromForm = fs.readFileSync(path.join(root, 'app/modules/ordem-preparacao/fromForm.ts'), 'utf8')
  const formChkFromOrdem = fs.readFileSync(
    path.join(root, 'app/modules/ordem-preparacao/formularioChecklistFromOrdem.ts'),
    'utf8'
  )
  const libOpFromForm = exists('app/lib/ordemPreparacaoFromForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/ordemPreparacaoFromForm.ts'), 'utf8')
    : ''
  if (
    opFromForm.includes('nowMs: number') &&
    !opFromForm.includes('Date.now()') &&
    !opFromForm.includes('new Date().toISOString()') &&
    formChkFromOrdem.includes('nowMs: number') &&
    !formChkFromOrdem.includes('Date.now()') &&
    !formChkFromOrdem.includes('Math.random') &&
    !formChkFromOrdem.includes('new Date().toISOString()')
  ) {
    ok('módulo ordem-preparacao fromForm é puro (relógio/aleatório injectados)')
  } else {
    fail('módulo ordem-preparacao fromForm ainda usa Date.now, Math.random ou new Date()')
  }
  if (
    libOpFromForm.includes('createOrdemPreparacaoFromForm as createOrdemPreparacaoFromFormPure') &&
    libOpFromForm.includes('createFormularioChecklistFromOrdem as createFormularioChecklistFromOrdemPure') &&
    nma.includes("from './lib/ordemPreparacaoFromForm'")
  ) {
    ok('NonatoMainApp usa ordem-preparacao fromForm via lib')
  } else {
    fail('lib/ordemPreparacaoFromForm ainda não envolve o fromForm')
  }
} catch (e) {
  fail(`módulo ordem-preparacao: ${e.message}`)
}

// 3p-pc) Módulo pre-check (101.º corte — tipos/form/fromForm)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/pre-check/index.ts'), 'utf8')
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (
    idx.includes('isPreCheckFormValid') &&
    idx.includes('createPreCheckFromForm') &&
    idx.includes('emptyPreCheckForm') &&
    idx.includes('PreCheck') &&
    exists('app/modules/pre-check/tipos.ts') &&
    exists('app/modules/pre-check/formState.ts') &&
    exists('app/modules/pre-check/fromForm.ts')
  ) {
    ok('módulo pre-check exporta tipos/form/fromForm')
  } else {
    fail('módulo pre-check sem tipos/form/fromForm')
  }
  if (
    nma.includes("from './modules/pre-check'") &&
    nma.includes('isPreCheckFormValid') &&
    nma.includes('createPreCheckFromForm') &&
    nma.includes('emptyPreCheckForm')
  ) {
    ok('NonatoMainApp usa PreCheck fromForm do módulo')
  } else {
    fail('NonatoMainApp ainda mapeia PreCheck no sítio')
  }
  const pcFromForm = fs.readFileSync(path.join(root, 'app/modules/pre-check/fromForm.ts'), 'utf8')
  const libPcFromForm = exists('app/lib/preCheckFromForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/preCheckFromForm.ts'), 'utf8')
    : ''
  if (
    pcFromForm.includes('nowMs: number') &&
    pcFromForm.includes('random: () => number') &&
    !pcFromForm.includes('Date.now()') &&
    !pcFromForm.includes('Math.random')
  ) {
    ok('módulo pre-check fromForm é puro (relógio/aleatório injectados)')
  } else {
    fail('módulo pre-check/fromForm ainda usa Date.now ou Math.random')
  }
  const pcFormState = fs.readFileSync(path.join(root, 'app/modules/pre-check/formState.ts'), 'utf8')
  if (
    pcFormState.includes('nowMs: number') &&
    !pcFormState.includes('new Date().toISOString()')
  ) {
    ok('módulo pre-check formState é puro (relógio injectado)')
  } else {
    fail('módulo pre-check/formState ainda usa new Date()')
  }
  if (
    libPcFromForm.includes('createPreCheckFromForm as createPreCheckFromFormPure') &&
    libPcFromForm.includes('emptyPreCheckForm as emptyPreCheckFormPure') &&
    nma.includes("from './lib/preCheckFromForm'")
  ) {
    ok('NonatoMainApp usa PreCheck fromForm via lib')
  } else {
    fail('lib/preCheckFromForm ainda não envolve o fromForm')
  }
} catch (e) {
  fail(`módulo pre-check: ${e.message}`)
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
  if (
    idx.includes('createSolicitacaoServicoTecnicoFromForm') &&
    idx.includes('updateSolicitacaoServicoTecnicoFromForm') &&
    idx.includes('solicitacaoServicoTecnicoToForm') &&
    exists('app/modules/sst/fromForm.ts')
  ) {
    ok('módulo sst exporta SolicitacaoServicoTecnico form/fromForm')
  } else {
    fail('módulo sst sem SolicitacaoServicoTecnico form/fromForm')
  }
  if (
    nma.includes('createSolicitacaoServicoTecnicoFromForm') &&
    nma.includes('updateSolicitacaoServicoTecnicoFromForm') &&
    nma.includes('solicitacaoServicoTecnicoToForm')
  ) {
    ok('NonatoMainApp usa SolicitacaoServicoTecnico fromForm do módulo')
  } else {
    fail('NonatoMainApp ainda mapeia SolicitacaoServicoTecnico no sítio')
  }
  const sstFromForm = fs.readFileSync(path.join(root, 'app/modules/sst/fromForm.ts'), 'utf8')
  const libSstFromForm = exists('app/lib/sstFromForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/sstFromForm.ts'), 'utf8')
    : ''
  if (
    sstFromForm.includes('nowMs: number') &&
    !sstFromForm.includes('Date.now()') &&
    !sstFromForm.includes('new Date().toISOString()')
  ) {
    ok('módulo sst fromForm é puro (relógio injectado)')
  } else {
    fail('módulo sst/fromForm ainda usa Date.now ou new Date()')
  }
  if (
    libSstFromForm.includes('createSolicitacaoServicoTecnicoFromForm as createSolicitacaoServicoTecnicoFromFormPure') &&
    libSstFromForm.includes('Date.now()')
  ) {
    ok('lib/sstFromForm só envolve o relógio do SST')
  } else {
    fail('lib/sstFromForm ainda não envolve o SST fromForm')
  }
  if (nma.includes("from './lib/sstFromForm'")) {
    ok('NonatoMainApp usa SST fromForm via lib')
  } else {
    fail('NonatoMainApp não importa SST fromForm do lib')
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
  const logosSrc = fs.readFileSync(path.join(root, 'app/modules/pdf/logos.ts'), 'utf8')
  const libPdfLogos = exists('app/lib/pdfLogos.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/pdfLogos.ts'), 'utf8')
    : ''
  if (
    logosSrc.includes('readItem?: PdfLogoStorageGet') &&
    !logosSrc.includes('localStorage') &&
    libPdfLogos.includes('localStorage.getItem') &&
    nma.includes("from './lib/pdfLogos'")
  ) {
    ok('NonatoMainApp resolve logos PDF via lib')
  } else {
    fail('lib/pdfLogos ainda não envolve localStorage dos logos')
  }
  if (
    idx.includes('PdfLogoSituationId') &&
    idx.includes('PDF_LOGO_SITUATIONS') &&
    idx.includes('pdfLogoSituationAccent') &&
    idx.includes('resolvePdfLogoSituation') &&
    exists('app/modules/pdf/logoSituations.ts')
  ) {
    ok('módulo pdf exporta PdfLogoSituationId')
  } else {
    fail('módulo pdf sem logoSituations')
  }
  const libSit = fs.readFileSync(path.join(root, 'app/lib/adminPdfLogoSituations.ts'), 'utf8')
  const logosHub = fs.readFileSync(path.join(root, 'app/components/admin/AdminLogosHub.tsx'), 'utf8')
  if (
    logosSrc.includes("from './logoSituations'") &&
    !logosSrc.includes("from '../../lib/adminPdfLogoSituations'") &&
    libSit.includes("from '../modules/pdf/logoSituations'") &&
    !libSit.includes('export type PdfLogoSituationId =') &&
    logosHub.includes('pdfLogoSituationAccent') &&
    logosHub.includes('resolvePdfLogoSituation') &&
    !logosHub.includes('const PDF_ACCENT')
  ) {
    ok('lib/AdminLogosHub usam logoSituations do módulo pdf')
  } else {
    fail('PdfLogoSituation ainda definido em lib ou AdminLogosHub')
  }
  if (
    idx.includes('PDF_MODELO_PADRAO') &&
    idx.includes('normalizePdfModelo') &&
    idx.includes('pdfModeloBodyClass') &&
    exists('app/modules/pdf/modelos.ts')
  ) {
    ok('módulo pdf exporta modelos')
  } else {
    fail('módulo pdf sem modelos')
  }
  const libModelos = fs.readFileSync(path.join(root, 'app/lib/pdfModelTypes.ts'), 'utf8')
  const pickerModelos = fs.readFileSync(path.join(root, 'app/components/RelatorioPdfModeloPicker.tsx'), 'utf8')
  const rsPdfModelo = fs.readFileSync(path.join(root, 'app/modules/relatorio-servico/pdfModelo.ts'), 'utf8')
  if (
    libModelos.includes("from '../modules/pdf/modelos'") &&
    !libModelos.includes('export const PDF_MODELO_PADRAO =') &&
    !libModelos.includes('export function normalizePdfModelo(') &&
    pickerModelos.includes('normalizePdfModelo') &&
    (pickerModelos.includes("from '../modules/pdf'") || pickerModelos.includes('from "../modules/pdf"')) &&
    rsPdfModelo.includes("from '../pdf/modelos'") &&
    nma.includes('pdfModeloBodyClass') &&
    !nma.includes("from './lib/pdfModelTypes'")
  ) {
    ok('NMA/picker/relatorio-servico usam modelos do módulo pdf')
  } else {
    fail('pdfModelTypes ainda definido em lib ou consumidores não usam o módulo')
  }
  if (
    idx.includes('pdfModeloToProtocoloNum') &&
    idx.includes('protocoloNumToPdfModelo') &&
    idx.includes('PDF_MODELO_TO_PROTOCOLO_NUM') &&
    exists('app/modules/pdf/modeloProtocoloMap.ts')
  ) {
    ok('módulo pdf exporta modeloProtocoloMap')
  } else {
    fail('módulo pdf sem modeloProtocoloMap')
  }
  const libProtoMap = fs.readFileSync(path.join(root, 'app/lib/pdfModelProtocoloMap.ts'), 'utf8')
  if (
    libProtoMap.includes("from '../modules/pdf/modeloProtocoloMap'") &&
    !libProtoMap.includes('export const PDF_MODELO_TO_PROTOCOLO_NUM') &&
    !libProtoMap.includes('export function pdfModeloToProtocoloNum(') &&
    nma.includes('pdfModeloToProtocoloNum') &&
    nma.includes('protocoloNumToPdfModelo') &&
    !nma.includes("from './lib/pdfModelProtocoloMap'")
  ) {
    ok('NonatoMainApp usa modeloProtocoloMap do módulo pdf')
  } else {
    fail('modeloProtocoloMap ainda definido em lib ou NMA não usa o módulo')
  }
  if (
    idx.includes('PDF_STORAGE_KEYS') &&
    idx.includes('PdfStorageDomain') &&
    exists('app/modules/pdf/storageKeys.ts')
  ) {
    ok('módulo pdf exporta storageKeys')
  } else {
    fail('módulo pdf sem storageKeys')
  }
  const libStorage = fs.readFileSync(path.join(root, 'app/lib/pdfModelStorage.ts'), 'utf8')
  if (
    libStorage.includes("from '../modules/pdf/storageKeys'") &&
    !libStorage.includes("relatorios: 'nonato-relatorios-pdf-modelo'") &&
    rsPdfModelo.includes("from '../pdf/storageKeys'") &&
    !rsPdfModelo.includes("from '../../lib/pdfModelStorage'")
  ) {
    ok('lib/relatorio-servico usam PDF_STORAGE_KEYS do módulo pdf')
  } else {
    fail('PDF_STORAGE_KEYS ainda definido em lib ou consumidores não usam o módulo')
  }
  if (
    idx.includes('orcamentoPdfThemeCss') &&
    idx.includes('relatorioPdfThemeCss') &&
    idx.includes('documentPdfThemeCss') &&
    exists('app/modules/pdf/themes.ts')
  ) {
    ok('módulo pdf exporta themes')
  } else {
    fail('módulo pdf sem themes')
  }
  const libThemes = fs.readFileSync(path.join(root, 'app/lib/pdfDocumentThemes.ts'), 'utf8')
  if (
    libThemes.includes("from '../modules/pdf/themes'") &&
    !libThemes.includes('export function orcamentoPdfThemeCss(') &&
    !libThemes.includes('export function relatorioPdfThemeCss(') &&
    !libThemes.includes('export function documentPdfThemeCss(')
  ) {
    ok('lib/pdfDocumentThemes só reexporta themes do módulo pdf')
  } else {
    fail('lib/pdfDocumentThemes ainda implementa os temas CSS')
  }
  if (
    idx.includes('escapePdfHtml') &&
    idx.includes('buildPdfDocumentHeaderHtml') &&
    idx.includes('PDF_DOCUMENT_LAYOUT_CSS') &&
    exists('app/modules/pdf/documentLayout.ts')
  ) {
    ok('módulo pdf exporta documentLayout')
  } else {
    fail('módulo pdf sem documentLayout')
  }
  const libLayout = fs.readFileSync(path.join(root, 'app/lib/pdfDocumentLayout.ts'), 'utf8')
  if (
    libLayout.includes("from '../modules/pdf/documentLayout'") &&
    !libLayout.includes('export function escapePdfHtml(') &&
    !libLayout.includes('export function buildPdfDocumentHeaderHtml(') &&
    !libLayout.includes('export const PDF_DOCUMENT_LAYOUT_CSS')
  ) {
    ok('lib/pdfDocumentLayout só reexporta documentLayout do módulo pdf')
  } else {
    fail('lib/pdfDocumentLayout ainda implementa o layout HTML')
  }
  if (
    idx.includes('buildPdfHtmlDocument') &&
    idx.includes('buildPdfHeaderForDoc') &&
    idx.includes('PDF_SHELL_EXTRA_CSS') &&
    exists('app/modules/pdf/documentShell.ts')
  ) {
    ok('módulo pdf exporta documentShell')
  } else {
    fail('módulo pdf sem documentShell')
  }
  const libShell = fs.readFileSync(path.join(root, 'app/lib/pdfDocumentShell.ts'), 'utf8')
  if (
    libShell.includes("from '../modules/pdf/documentShell'") &&
    !libShell.includes('export function buildPdfHtmlDocument(') &&
    !libShell.includes('export function resolvePdfHeaderVariant(') &&
    !libShell.includes('export const PDF_SHELL_EXTRA_CSS')
  ) {
    ok('lib/pdfDocumentShell só reexporta documentShell do módulo pdf')
  } else {
    fail('lib/pdfDocumentShell ainda implementa o shell HTML')
  }
} catch (e) {
  fail(`módulo pdf: ${e.message}`)
}

// 3ab) Módulo admin (36.º corte + 46.º passwords + 53.º logos + 59.º User/fromForm)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/admin/index.ts'), 'utf8')
  if (idx.includes('createEmptyUserForm') && idx.includes('userToFormState')) {
    ok('módulo admin exporta userForm')
  } else {
    fail('módulo admin incompleto (index.ts)')
  }
  if (
    idx.includes('User') &&
    idx.includes('UserPermissions') &&
    idx.includes('createUserFromForm') &&
    idx.includes('updateUserFromForm')
  ) {
    ok('módulo admin exporta User + create/update fromForm')
  } else {
    fail('módulo admin incompleto (User/fromForm no index.ts)')
  }
  if (idx.includes('generatePassword') && idx.includes('PasswordEntry')) {
    ok('módulo admin exporta passwords')
  } else {
    fail('módulo admin incompleto (passwords no index.ts)')
  }
  if (
    idx.includes('isPasswordFormValid') &&
    idx.includes('createPasswordFromForm') &&
    idx.includes('emptyPasswordForm') &&
    exists('app/modules/admin/passwordForm.ts') &&
    exists('app/modules/admin/passwordFromForm.ts')
  ) {
    ok('módulo admin exporta Password form/fromForm')
  } else {
    fail('módulo admin sem Password form/fromForm')
  }
  if (
    idx.includes('LogoRelatorio') &&
    idx.includes('parseLogosRelatoriosArr') &&
    idx.includes('preferRicherLogosRelatorios') &&
    idx.includes('resolveLogoLabel')
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
  if (!exists('app/modules/admin/userTipos.ts')) {
    fail('falta app/modules/admin/userTipos.ts')
  } else {
    ok('existe app/modules/admin/userTipos.ts')
  }
  if (!exists('app/modules/admin/userFromForm.ts')) {
    fail('falta app/modules/admin/userFromForm.ts')
  } else {
    ok('existe app/modules/admin/userFromForm.ts')
  }
  if (!exists('app/modules/admin/userFormState.ts')) {
    fail('falta app/modules/admin/userFormState.ts')
  } else {
    ok('existe app/modules/admin/userFormState.ts')
  }
  const adminTypesSrc = fs.readFileSync(path.join(root, 'app/components/admin/adminTypes.ts'), 'utf8')
  const userFormSrc = fs.readFileSync(path.join(root, 'app/modules/admin/userForm.ts'), 'utf8')
  const userFromFormSrc = fs.readFileSync(path.join(root, 'app/modules/admin/userFromForm.ts'), 'utf8')
  if (
    idx.includes('UserFormState') &&
    adminTypesSrc.includes("from '../../modules/admin/userFormState'") &&
    !adminTypesSrc.includes('export type UserFormState = {') &&
    !userFormSrc.includes("from '../../components/admin/adminTypes'") &&
    !userFromFormSrc.includes("from '../../components/admin/adminTypes'")
  ) {
    ok('módulo admin define UserFormState (adminTypes só reexporta)')
  } else {
    fail('UserFormState ainda vive no componente adminTypes')
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
  if (!exists('app/modules/admin/logoDrafts.ts')) {
    fail('falta app/modules/admin/logoDrafts.ts')
  } else {
    ok('existe app/modules/admin/logoDrafts.ts')
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
    !nma.includes('type User = {') &&
    nma.includes('createUserFromForm') &&
    nma.includes('updateUserFromForm')
  ) {
    ok('NonatoMainApp usa User + fromForm do módulo admin')
  } else {
    fail('NonatoMainApp ainda define User localmente ou não usa create/updateUserFromForm')
  }
  const userFromForm = fs.readFileSync(path.join(root, 'app/modules/admin/userFromForm.ts'), 'utf8')
  const libAdminUsers = exists('app/lib/adminUsers.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/adminUsers.ts'), 'utf8')
    : ''
  if (
    userFromForm.includes('nowMs: number') &&
    !userFromForm.includes('Date.now()')
  ) {
    ok('módulo admin createUserFromForm é puro (relógio injectado)')
  } else {
    fail('módulo admin/userFromForm ainda usa Date.now')
  }
  if (
    libAdminUsers.includes("from '../modules/admin/userFromForm'") &&
    libAdminUsers.includes('createUserFromForm as createUserFromFormPure') &&
    libAdminUsers.includes('Date.now()')
  ) {
    ok('lib/adminUsers só envolve o relógio de createUserFromForm')
  } else {
    fail('lib/adminUsers ainda não envolve createUserFromForm')
  }
  if (nma.includes("from './lib/adminUsers'")) {
    ok('NonatoMainApp usa createUserFromForm via lib')
  } else {
    fail('NonatoMainApp não importa createUserFromForm do lib')
  }
  if (
    !nma.includes('type PasswordEntry = {') &&
    !nma.includes('const generatePassword = (length') &&
    nma.includes('generatePassword') &&
    nma.includes('isPasswordFormValid') &&
    nma.includes('createPasswordFromForm') &&
    nma.includes('emptyPasswordForm')
  ) {
    ok('NonatoMainApp usa passwords/fromForm do módulo admin')
  } else {
    fail('NonatoMainApp ainda define PasswordEntry/generatePassword localmente ou não usa fromForm')
  }
  const pwdMod = fs.readFileSync(path.join(root, 'app/modules/admin/passwords.ts'), 'utf8')
  const libAdminPwd = exists('app/lib/adminPasswords.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/adminPasswords.ts'), 'utf8')
    : ''
  if (pwdMod.includes('random: () => number') && !pwdMod.includes('Math.random')) {
    ok('módulo admin generatePassword é puro (aleatório injectado)')
  } else {
    fail('módulo admin/passwords ainda usa Math.random')
  }
  if (
    libAdminPwd.includes("from '../modules/admin/passwords'") &&
    libAdminPwd.includes('Math.random') &&
    !libAdminPwd.includes('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
  ) {
    ok('lib/adminPasswords só envolve o aleatório de generatePassword')
  } else {
    fail('lib/adminPasswords ainda implementa o gerador de senha')
  }
  if (nma.includes("from './lib/adminPasswords'")) {
    ok('NonatoMainApp usa generatePassword via lib')
  } else {
    fail('NonatoMainApp não importa generatePassword do lib')
  }
  const pwdFromForm = fs.readFileSync(path.join(root, 'app/modules/admin/passwordFromForm.ts'), 'utf8')
  if (
    pwdFromForm.includes('nowMs: number') &&
    pwdFromForm.includes('random: () => number') &&
    !pwdFromForm.includes('Date.now()') &&
    !pwdFromForm.includes('Math.random')
  ) {
    ok('módulo admin createPasswordFromForm é puro (relógio/aleatório injectados)')
  } else {
    fail('módulo admin/passwordFromForm ainda usa Date.now/Math.random')
  }
  if (
    libAdminPwd.includes("from '../modules/admin/passwordFromForm'") &&
    libAdminPwd.includes('createPasswordFromForm as createPasswordFromFormPure') &&
    libAdminPwd.includes('Date.now()')
  ) {
    ok('lib/adminPasswords só envolve relógio/aleatório do fromForm')
  } else {
    fail('lib/adminPasswords ainda não envolve createPasswordFromForm')
  }
  if (nma.includes('createPasswordFromForm') && nma.includes("from './lib/adminPasswords'")) {
    ok('NonatoMainApp usa createPasswordFromForm via lib')
  } else {
    fail('NonatoMainApp não importa createPasswordFromForm do lib')
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
  const logosHubLabelUi = fs.readFileSync(path.join(root, 'app/components/admin/AdminLogosHub.tsx'), 'utf8')
  const logosSitLabelUi = fs.readFileSync(path.join(root, 'app/components/admin/AdminPdfLogosBySituation.tsx'), 'utf8')
  const logosRelSrc = fs.readFileSync(path.join(root, 'app/modules/admin/logosRelatorio.ts'), 'utf8')
  if (
    logosRelSrc.includes('export function resolveLogoLabel(') &&
    logosHubLabelUi.includes('resolveLogoLabel') &&
    logosSitLabelUi.includes('resolveLogoLabel') &&
    !logosHubLabelUi.includes('function resolveLogoLabel(') &&
    !logosSitLabelUi.includes('function resolveLogoLabel(')
  ) {
    ok('AdminLogosHub/AdminPdfLogosBySituation usam resolveLogoLabel do módulo')
  } else {
    fail('resolveLogoLabel ainda definido nos componentes de logos')
  }
  if (
    adminTypes.includes("from '../../modules/admin/userTipos'") ||
    adminTypes.includes('from "../../modules/admin/userTipos"')
  ) {
    ok('adminTypes re-exporta User do módulo admin')
  } else {
    fail('adminTypes não re-exporta User do módulo admin')
  }
  if (
    idx.includes('AdminInterfaceLogoDraft') &&
    idx.includes('AdminBibliotecaLogoDraft') &&
    adminTypes.includes("from '../../modules/admin/logoDrafts'") &&
    !adminTypes.includes('export type AdminInterfaceLogoDraft = {') &&
    !adminTypes.includes('export type AdminBibliotecaLogoDraft = {') &&
    !nma.includes('type AdminInterfaceLogoDraft = {') &&
    nma.includes('AdminInterfaceLogoDraft') &&
    nma.includes('AdminBibliotecaLogoDraft')
  ) {
    ok('módulo admin define rascunhos de logo (adminTypes/NMA só usam)')
  } else {
    fail('rascunhos de logo ainda definidos em adminTypes ou NonatoMainApp')
  }
  if (
    idx.includes('NonatoBrandVariant') &&
    idx.includes('brandLogoClassName') &&
    idx.includes('NONATO_BRAND_VARIANT_LABELS') &&
    exists('app/modules/admin/brandLogo.ts')
  ) {
    ok('módulo admin exporta NonatoBrandVariant')
  } else {
    fail('módulo admin sem brandLogo')
  }
  const brandLogoUi = fs.readFileSync(path.join(root, 'app/components/NonatoBrandLogo.tsx'), 'utf8')
  const logosHubUi = fs.readFileSync(path.join(root, 'app/components/admin/AdminLogosHub.tsx'), 'utf8')
  if (
    brandLogoUi.includes('brandLogoClassName') &&
    !brandLogoUi.includes('export type NonatoBrandVariant =') &&
    logosHubUi.includes('NONATO_BRAND_VARIANT_LABELS') &&
    (logosHubUi.includes("from '../../modules/admin'") || logosHubUi.includes('from "../../modules/admin"'))
  ) {
    ok('NonatoBrandLogo/AdminLogosHub usam brandLogo do módulo admin')
  } else {
    fail('NonatoBrandVariant ainda definido no componente de logo')
  }
  if (
    idx.includes('SyncPendingRemote') &&
    idx.includes('syncPendingRevisionDisplay') &&
    idx.includes('isSyncPendingRemote') &&
    exists('app/modules/admin/syncPending.ts')
  ) {
    ok('módulo admin exporta SyncPendingRemote')
  } else {
    fail('módulo admin sem syncPending')
  }
  const adminSyncUi = fs.readFileSync(path.join(root, 'app/components/admin/AdminSyncSection.tsx'), 'utf8')
  if (
    adminTypes.includes("from '../../modules/admin/syncPending'") &&
    !adminTypes.includes('export type SyncPendingRemote = {') &&
    !nma.includes('useState<{\n    revision: number') &&
    nma.includes('SyncPendingRemote') &&
    adminSyncUi.includes('isSyncPendingRemote') &&
    adminSyncUi.includes('syncPendingRevisionDisplay')
  ) {
    ok('adminTypes/NMA/AdminSyncSection usam SyncPendingRemote do módulo')
  } else {
    fail('SyncPendingRemote ainda definido em adminTypes ou NonatoMainApp')
  }
  if (
    idx.includes('CodeBackup') &&
    idx.includes('AutoBackup') &&
    idx.includes('findBackupByTimestamp') &&
    idx.includes('formatCodeBackupFilesLabel') &&
    exists('app/modules/admin/backupTipos.ts')
  ) {
    ok('módulo admin exporta CodeBackup/AutoBackup')
  } else {
    fail('módulo admin sem backupTipos')
  }
  const adminBackupUi = fs.readFileSync(path.join(root, 'app/components/admin/AdminBackupSection.tsx'), 'utf8')
  if (
    adminTypes.includes("from '../../modules/admin/backupTipos'") &&
    !adminTypes.includes('export type CodeBackup = {') &&
    !adminTypes.includes('export type AutoBackup = {') &&
    !nma.includes('useState<Array<{ path: string; timestamp: string; filesCount: number }>>') &&
    nma.includes('CodeBackup') &&
    adminBackupUi.includes('findBackupByTimestamp') &&
    adminBackupUi.includes('formatCodeBackupFilesLabel')
  ) {
    ok('adminTypes/NMA/AdminBackupSection usam backupTipos do módulo')
  } else {
    fail('CodeBackup/AutoBackup ainda definidos em adminTypes ou NonatoMainApp')
  }
  if (
    idx.includes('ZipDownloadHistoryEntry') &&
    idx.includes('formatBackupBytes') &&
    idx.includes('MAX_BACKUP_HISTORY') &&
    idx.includes('normalizeZipDownloadHistory') &&
    idx.includes('buildZipDownloadHistoryEntry') &&
    exists('app/modules/admin/zipDownloadHistory.ts')
  ) {
    ok('módulo admin exporta zipDownloadHistory')
  } else {
    fail('módulo admin sem zipDownloadHistory')
  }
  const zipLib = fs.readFileSync(path.join(root, 'app/lib/adminBackupRegistry.ts'), 'utf8')
  if (
    zipLib.includes("from '../modules/admin/zipDownloadHistory'") &&
    !zipLib.includes('export type ZipDownloadHistoryEntry = {') &&
    !zipLib.includes('export function formatBackupBytes(') &&
    adminBackupUi.includes('formatBackupBytes') &&
    adminBackupUi.includes('MAX_BACKUP_HISTORY') &&
    (adminBackupUi.includes("from '../../modules/admin'") || adminBackupUi.includes('from "../../modules/admin"'))
  ) {
    ok('AdminBackupSection usa zipDownloadHistory do módulo admin')
  } else {
    fail('zipDownloadHistory ainda definido em lib ou AdminBackupSection não usa o módulo')
  }
  const zipMod = fs.readFileSync(path.join(root, 'app/modules/admin/zipDownloadHistory.ts'), 'utf8')
  if (
    zipMod.includes('export function buildZipDownloadHistoryEntry(') &&
    !zipMod.includes('Date.now()')
  ) {
    ok('módulo admin buildZipDownloadHistoryEntry é puro (relógio injectado)')
  } else {
    fail('módulo admin/zipDownloadHistory ainda usa Date.now')
  }
  if (
    zipLib.includes('buildZipDownloadHistoryEntry') &&
    zipLib.includes('Date.now()') &&
    !zipLib.includes('timestamp: entry.timestamp ?? Date.now()')
  ) {
    ok('lib/adminBackupRegistry só envolve o relógio do histórico ZIP')
  } else {
    fail('lib/adminBackupRegistry ainda monta o timestamp à mão')
  }
  if (
    idx.includes('USER_PERMISSION_KEYS') &&
    idx.includes('applyPermissionPreset') &&
    idx.includes('countActivePermissions') &&
    exists('app/modules/admin/userPermissions.ts')
  ) {
    ok('módulo admin exporta userPermissions')
  } else {
    fail('módulo admin sem userPermissions')
  }
  const libPerms = fs.readFileSync(path.join(root, 'app/lib/adminUserPermissions.ts'), 'utf8')
  const userFormPanel = fs.readFileSync(path.join(root, 'app/components/admin/AdminUserFormPanel.tsx'), 'utf8')
  const usersSection = fs.readFileSync(path.join(root, 'app/components/admin/AdminUsersSection.tsx'), 'utf8')
  const sidebarMenuPermsMod = fs.readFileSync(path.join(root, 'app/modules/sidebar/menuPermissions.ts'), 'utf8')
  if (
    libPerms.includes("from '../modules/admin/userPermissions'") &&
    !libPerms.includes('export const USER_PERMISSION_GROUPS') &&
    !libPerms.includes('export function applyPermissionPreset(') &&
    userFormPanel.includes('applyPermissionPreset') &&
    (userFormPanel.includes("from '../../modules/admin'") || userFormPanel.includes('from "../../modules/admin"')) &&
    usersSection.includes('countActivePermissions') &&
    (usersSection.includes("from '../../modules/admin'") || usersSection.includes('from "../../modules/admin"')) &&
    sidebarMenuPermsMod.includes("from '../admin/userPermissions'") &&
    !sidebarMenuPermsMod.includes("from './adminUserPermissions'")
  ) {
    ok('admin UI/sidebar usam userPermissions do módulo admin')
  } else {
    fail('userPermissions ainda definido em lib ou consumidores não usam o módulo')
  }
  const libBrandAssets = fs.readFileSync(path.join(root, 'app/lib/nonatoBrandAssets.ts'), 'utf8')
  if (
    idx.includes('getNonatoBrandLogoDisplaySrc') &&
    idx.includes('NONATO_BRAND_LOGO_PNG_SRC') &&
    idx.includes('isNonatoBrandLogoPngSrc') &&
    exists('app/modules/admin/brandAssets.ts')
  ) {
    ok('módulo admin exporta brandAssets')
  } else {
    fail('módulo admin sem brandAssets')
  }
  if (
    libBrandAssets.includes("from '../modules/admin/brandAssets'") &&
    libBrandAssets.includes('export function applyNonatoBrandLogoImgFallback(') &&
    libBrandAssets.includes('export function validateNonatoLogoMediaSrc(') &&
    !libBrandAssets.includes('export function getNonatoBrandLogoDisplaySrc(') &&
    !libBrandAssets.includes('export const NONATO_BRAND_LOGO_PNG_SRC')
  ) {
    ok('lib/nonatoBrandAssets só envolve fetch/DOM do módulo admin')
  } else {
    fail('lib/nonatoBrandAssets ainda implementa resolução pura do logo')
  }
  if (
    nma.includes('getNonatoBrandLogoDisplaySrc') &&
    nma.includes('applyNonatoBrandLogoImgFallback') &&
    nma.includes("from './lib/nonatoBrandAssets'") &&
    !nma.includes('applyNonatoBrandLogoImgFallback,\n  getNonatoBrandLogoDisplaySrc') &&
    brandLogoUi.includes('NONATO_BRAND_LOGO_PNG_SRC') &&
    brandLogoUi.includes("from '../modules/admin'") &&
    brandLogoUi.includes("from '../lib/nonatoBrandAssets'")
  ) {
    ok('NMA/NonatoBrandLogo usam brandAssets do módulo; DOM via lib')
  } else {
    fail('NMA ou NonatoBrandLogo ainda importam resolução pura do lib')
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
    idx.includes('migrateGruposDesmontadosList') &&
    idx.includes('isPecaDesmontadaFormValid') &&
    idx.includes('createPecaDesmontadaFromForm') &&
    idx.includes('updatePecaDesmontadaFromForm') &&
    idx.includes('isGrupoDesmontadoFormValid') &&
    idx.includes('createGrupoDesmontadoFromForm') &&
    idx.includes('updateGrupoDesmontadoFromForm')
  ) {
    ok('módulo desmontados exporta form/migrate')
  } else {
    fail('módulo desmontados incompleto (index.ts)')
  }
  ;['tipos.ts', 'formState.ts', 'migrate.ts', 'pecaDesmontadaFromForm.ts', 'grupoDesmontadoFromForm.ts'].forEach((f) => {
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
    nma.includes('migrateGruposDesmontadosList') &&
    nma.includes('isPecaDesmontadaFormValid') &&
    nma.includes('createPecaDesmontadaFromForm') &&
    nma.includes('updatePecaDesmontadaFromForm') &&
    nma.includes('isGrupoDesmontadoFormValid') &&
    nma.includes('createGrupoDesmontadoFromForm') &&
    nma.includes('updateGrupoDesmontadoFromForm')
  ) {
    ok('NonatoMainApp usa desmontados do módulo')
  } else {
    fail('NonatoMainApp ainda define tipos/form/fromForm Desmontados localmente')
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

try {
  const adminGeral = fs.readFileSync(path.join(root, 'app/components/admin/AdminConfigGeralSection.tsx'), 'utf8')
  if (
    adminGeral.includes('configuraIdioma') &&
    adminGeral.includes('selectedLanguage') &&
    adminGeral.includes('onLanguageChange') &&
    adminGeral.includes('getLanguages')
  ) {
    ok('Admin Configuração Geral tem seletor de idioma')
  } else {
    fail('Admin Configuração Geral sem seletor de idioma (configuraIdioma)')
  }
  const nmaLang = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (
    nmaLang.includes("localStorage.setItem('nonato-language'") &&
    nmaLang.includes('onLanguageChange: handleLanguageChange')
  ) {
    ok('NonatoMainApp persiste e liga o idioma no Admin')
  } else {
    fail('NonatoMainApp não persiste/liga o idioma no Admin')
  }
} catch (e) {
  fail(`configura idioma: ${e.message}`)
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
  if (
    idx.includes('isGestorFormValid') &&
    idx.includes('createGestorFromForm') &&
    idx.includes('updateGestorFromForm') &&
    exists('app/modules/pessoas/gestorFromForm.ts')
  ) {
    ok('módulo pessoas exporta Gestor form/fromForm')
  } else {
    fail('módulo pessoas sem Gestor form/fromForm')
  }
  if (
    nma.includes('isGestorFormValid') &&
    nma.includes('createGestorFromForm') &&
    nma.includes('updateGestorFromForm') &&
    nma.includes('gestorToForm')
  ) {
    ok('NonatoMainApp usa Gestor fromForm do módulo pessoas')
  } else {
    fail('NonatoMainApp ainda mapeia Gestor no sítio')
  }
  if (
    idx.includes('isTecnicoFormValid') &&
    idx.includes('createTecnicoFromForm') &&
    idx.includes('updateTecnicoFromForm') &&
    exists('app/modules/pessoas/tecnicoFromForm.ts')
  ) {
    ok('módulo pessoas exporta Tecnico form/fromForm')
  } else {
    fail('módulo pessoas sem Tecnico form/fromForm')
  }
  if (
    nma.includes('isTecnicoFormValid') &&
    nma.includes('createTecnicoFromForm') &&
    nma.includes('updateTecnicoFromForm') &&
    nma.includes('tecnicoToForm')
  ) {
    ok('NonatoMainApp usa Tecnico fromForm do módulo pessoas')
  } else {
    fail('NonatoMainApp ainda mapeia Tecnico no sítio')
  }
  if (
    idx.includes('isTipoGestorFormValid') &&
    idx.includes('createTipoGestorFromForm') &&
    idx.includes('updateTipoGestorFromForm') &&
    idx.includes('tipoGestorToForm') &&
    exists('app/modules/pessoas/tipoGestorFromForm.ts')
  ) {
    ok('módulo pessoas exporta TipoGestor form/fromForm')
  } else {
    fail('módulo pessoas sem TipoGestor form/fromForm')
  }
  if (
    nma.includes('isTipoGestorFormValid') &&
    nma.includes('createTipoGestorFromForm') &&
    nma.includes('updateTipoGestorFromForm') &&
    nma.includes('tipoGestorToForm') &&
    nma.includes('remapGestoresAreaTipoGestor')
  ) {
    ok('NonatoMainApp usa TipoGestor fromForm do módulo pessoas')
  } else {
    fail('NonatoMainApp ainda mapeia TipoGestor no sítio')
  }
  const libTypes = fs.readFileSync(path.join(root, 'app/lib/pessoaTypes.ts'), 'utf8')
  if (libTypes.includes("from '../modules/pessoas'") || libTypes.includes('from "../modules/pessoas"')) {
    ok('lib/pessoaTypes re-exporta app/modules/pessoas')
  } else {
    fail('lib/pessoaTypes não re-exporta o módulo pessoas')
  }
  if (
    idx.includes('GestoresTecnicosLabels') &&
    idx.includes('tipoTecnicoLabel') &&
    idx.includes('tipoTecnicoIcon') &&
    exists('app/modules/pessoas/gestoresTecnicosLabels.ts')
  ) {
    ok('módulo pessoas exporta GestoresTecnicosLabels')
  } else {
    fail('módulo pessoas sem GestoresTecnicosLabels')
  }
  const gtpLabels = fs.readFileSync(path.join(root, 'app/components/pessoas/GestoresTecnicosPanel.tsx'), 'utf8')
  if (
    (gtpLabels.includes("from '../../modules/pessoas'") || gtpLabels.includes('from "../../modules/pessoas"')) &&
    gtpLabels.includes('tipoTecnicoLabel') &&
    !gtpLabels.includes('export type GestoresTecnicosLabels = {') &&
    !gtpLabels.includes('function tipoTecnicoLabel(')
  ) {
    ok('GestoresTecnicosPanel usa GestoresTecnicosLabels do módulo pessoas')
  } else {
    fail('GestoresTecnicosPanel ainda define GestoresTecnicosLabels no sítio')
  }
  if (
    idx.includes('GestorItem') &&
    idx.includes('TecnicoItem') &&
    idx.includes('formatGestorItemOption') &&
    idx.includes('formatTecnicoItemOption') &&
    exists('app/modules/pessoas/gestorTecnicoItem.ts')
  ) {
    ok('módulo pessoas exporta GestorItem/TecnicoItem')
  } else {
    fail('módulo pessoas sem GestorItem/TecnicoItem')
  }
  const adminTypesSrc = fs.readFileSync(path.join(root, 'app/components/admin/adminTypes.ts'), 'utf8')
  const userFormPanel = fs.readFileSync(path.join(root, 'app/components/admin/AdminUserFormPanel.tsx'), 'utf8')
  if (
    adminTypesSrc.includes("from '../../modules/pessoas/gestorTecnicoItem'") &&
    !adminTypesSrc.includes('export type GestorItem = {') &&
    !adminTypesSrc.includes('export type TecnicoItem = {') &&
    (userFormPanel.includes("from '../../modules/pessoas'") || userFormPanel.includes('from "../../modules/pessoas"')) &&
    userFormPanel.includes('formatGestorItemOption') &&
    userFormPanel.includes('formatTecnicoItemOption')
  ) {
    ok('AdminUserFormPanel usa GestorItem do módulo pessoas')
  } else {
    fail('GestorItem/TecnicoItem ainda definidos em adminTypes ou sem format no painel')
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
  if (
    idx.includes('isManuaisGrupoNomeValid') &&
    idx.includes('createManuaisGrupoFromForm') &&
    idx.includes('isManuaisModeloNomeValid') &&
    idx.includes('createManuaisModeloFromForm') &&
    idx.includes('createManuaisDocumentoFromForm') &&
    idx.includes('createManuaisImagemFromForm') &&
    idx.includes('createBibliaAnexoFromForm') &&
    idx.includes('addManuaisFamiliaFromForm') &&
    idx.includes('renameManuaisFamiliaFromForm') &&
    exists('app/modules/manuais/fromForm.ts')
  ) {
    ok('módulo manuais exporta grupo/modelo fromForm')
  } else {
    fail('módulo manuais sem grupo/modelo fromForm')
  }
  const manuaisUi = fs.readFileSync(path.join(root, 'app/components/ManuaisInformacoesContent.tsx'), 'utf8')
  if (
    manuaisUi.includes('isManuaisGrupoNomeValid') &&
    manuaisUi.includes('createManuaisGrupoFromForm') &&
    manuaisUi.includes('isManuaisModeloNomeValid') &&
    manuaisUi.includes('createManuaisModeloFromForm') &&
    manuaisUi.includes('createManuaisDocumentoFromForm') &&
    manuaisUi.includes('createManuaisImagemFromForm') &&
    manuaisUi.includes('createBibliaAnexoFromForm')
  ) {
    ok('ManuaisInformacoesContent usa Manuais fromForm do módulo')
  } else {
    fail('ManuaisInformacoesContent ainda mapeia grupo/modelo no sítio')
  }
  const manuaisFromForm = fs.readFileSync(path.join(root, 'app/modules/manuais/fromForm.ts'), 'utf8')
  const libManuaisFromForm = exists('app/lib/manuaisFromForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/manuaisFromForm.ts'), 'utf8')
    : ''
  if (
    manuaisFromForm.includes('nowMs: number') &&
    !manuaisFromForm.includes('Date.now()') &&
    !manuaisFromForm.includes('crypto.randomUUID')
  ) {
    ok('módulo manuais fromForm é puro (relógio/UUID injectados)')
  } else {
    fail('módulo manuais/fromForm ainda usa Date.now ou crypto')
  }
  if (
    libManuaisFromForm.includes('createManuaisGrupoFromForm as createManuaisGrupoFromFormPure') &&
    libManuaisFromForm.includes('createManuaisDocumentoFromForm as createManuaisDocumentoFromFormPure') &&
    manuaisUi.includes("from '../lib/manuaisFromForm'")
  ) {
    ok('ManuaisInformacoesContent usa manuais fromForm via lib')
  } else {
    fail('lib/manuaisFromForm ainda não envolve o fromForm')
  }
  if (
    idx.includes('isManuaisFamiliaNomeValid') &&
    idx.includes('addManuaisFamiliaFromForm') &&
    idx.includes('renameManuaisFamiliaFromForm')
  ) {
    ok('módulo manuais exporta família fromForm')
  } else {
    fail('módulo manuais sem família fromForm')
  }
  if (
    manuaisUi.includes('addManuaisFamiliaFromForm') &&
    manuaisUi.includes('renameManuaisFamiliaFromForm') &&
    !manuaisUi.includes('if (nome && !familias.includes(nome))')
  ) {
    ok('ManuaisInformacoesContent usa família fromForm do módulo')
  } else {
    fail('ManuaisInformacoesContent ainda mapeia família no sítio')
  }
  if (
    idx.includes('normalizeBibliaImport') &&
    idx.includes('serializeBibliaForServer') &&
    idx.includes('BibliaStore') &&
    exists('app/modules/manuais/bibliaTipos.ts')
  ) {
    ok('módulo manuais exporta tipos/normalize da Bíblia')
  } else {
    fail('módulo manuais sem tipos/normalize da Bíblia')
  }
  const bibliaCompat = fs.readFileSync(path.join(root, 'app/components/bibliaNonatoTypes.ts'), 'utf8')
  if (
    bibliaCompat.includes("from '../modules/manuais'") ||
    bibliaCompat.includes('from "../modules/manuais"')
  ) {
    ok('bibliaNonatoTypes re-exporta app/modules/manuais')
  } else {
    fail('bibliaNonatoTypes ainda define tipos da Bíblia no sítio')
  }
  const bibliaTipos = fs.readFileSync(path.join(root, 'app/modules/manuais/bibliaTipos.ts'), 'utf8')
  const libManuaisBiblia = exists('app/lib/manuaisBiblia.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/manuaisBiblia.ts'), 'utf8')
    : ''
  if (
    bibliaTipos.includes('nowMs: number') &&
    bibliaTipos.includes('random: () => number') &&
    !bibliaTipos.includes('Date.now()') &&
    !bibliaTipos.includes('Math.random') &&
    !bibliaTipos.includes('new Date().toISOString()')
  ) {
    ok('módulo manuais bibliaTipos é puro (relógio/aleatório injectados)')
  } else {
    fail('módulo manuais/bibliaTipos ainda usa Date.now, Math.random ou new Date()')
  }
  if (
    libManuaisBiblia.includes('bibliaUid as bibliaUidPure') &&
    libManuaisBiblia.includes('seedBibliaExample as seedBibliaExamplePure') &&
    bibliaCompat.includes("from '../lib/manuaisBiblia'")
  ) {
    ok('bibliaNonatoTypes usa Bíblia via lib')
  } else {
    fail('lib/manuaisBiblia ainda não envolve uid/normalize da Bíblia')
  }
  const tiposManuais = fs.readFileSync(path.join(root, 'app/modules/manuais/tipos.ts'), 'utf8')
  if (
    tiposManuais.includes("from './bibliaTipos'") ||
    tiposManuais.includes('from "./bibliaTipos"')
  ) {
    ok('manuais/tipos importa Bíblia do módulo')
  } else {
    fail('manuais/tipos ainda importa bibliaNonatoTypes do componente')
  }
  const mergeSrc = fs.readFileSync(path.join(root, 'app/lib/conhecimentoTecnicoMerge.ts'), 'utf8')
  if (
    mergeSrc.includes("from '../modules/manuais/conhecimentoMerge'") &&
    mergeSrc.includes('makeConhecimentoMergeId') &&
    !mergeSrc.includes('export function mergeManuaisPayloads(') &&
    !mergeSrc.includes('function mergeModeloUnificado(')
  ) {
    ok('lib/conhecimentoTecnicoMerge só envolve IDs/I/O do módulo manuais')
  } else {
    fail('lib/conhecimentoTecnicoMerge ainda implementa o merge')
  }
  if (
    (manuaisUi.includes("from '../modules/manuais'") || manuaisUi.includes('from "../modules/manuais"')) &&
    manuaisUi.includes('resolveBibliaSecao') &&
    !manuaisUi.includes("from './bibliaNonatoTypes'") &&
    !manuaisUi.includes('from "./bibliaNonatoTypes"')
  ) {
    ok('ManuaisInformacoesContent usa tipos/helpers da Bíblia do módulo')
  } else {
    fail('ManuaisInformacoesContent ainda importa bibliaNonatoTypes no sítio')
  }
  if (
    idx.includes('ManualSection') &&
    idx.includes('findManualSectionPdf') &&
    exists('app/modules/manuais/zipSection.ts')
  ) {
    ok('módulo manuais exporta ManualSection / findManualSectionPdf')
  } else {
    fail('módulo manuais sem zipSection')
  }
  const zipPdf = fs.readFileSync(path.join(root, 'app/components/ManuaisZipPdfPreview.tsx'), 'utf8')
  if (
    (zipPdf.includes("from '../modules/manuais'") || zipPdf.includes('from "../modules/manuais"')) &&
    zipPdf.includes('findManualSectionPdf') &&
    !zipPdf.includes("export type ManualSection = 'eletrica' | 'mecanica'") &&
    !zipPdf.includes('export function findManualSectionPdf(')
  ) {
    ok('ManuaisZipPdfPreview usa ManualSection do módulo manuais')
  } else {
    fail('ManuaisZipPdfPreview ainda define ManualSection/findManualSectionPdf no sítio')
  }
  if (
    idx.includes('resolveZipEntryPath') &&
    idx.includes('cleanLinkTarget') &&
    exists('app/modules/manuais/zipPath.ts')
  ) {
    ok('módulo manuais exporta resolveZipEntryPath')
  } else {
    fail('módulo manuais sem zipPath')
  }
  if (
    zipPdf.includes('resolveZipEntryPath') &&
    zipPdf.includes('cleanLinkTarget') &&
    !zipPdf.includes('export function resolveZipEntryPath(')
  ) {
    ok('ManuaisZipPdfPreview usa resolveZipEntryPath do módulo manuais')
  } else {
    fail('ManuaisZipPdfPreview ainda define resolveZipEntryPath no sítio')
  }
  if (
    idx.includes('extractAnnotationTargets') &&
    idx.includes('targetLooksLikeSection') &&
    exists('app/modules/manuais/zipAnnotation.ts')
  ) {
    ok('módulo manuais exporta extractAnnotationTargets')
  } else {
    fail('módulo manuais sem zipAnnotation')
  }
  if (
    zipPdf.includes('extractAnnotationTargets') &&
    zipPdf.includes('targetLooksLikeSection') &&
    !zipPdf.includes('function extractAnnotationTargets(') &&
    !zipPdf.includes('function targetLooksLikeSection(')
  ) {
    ok('ManuaisZipPdfPreview usa anotações ZIP do módulo manuais')
  } else {
    fail('ManuaisZipPdfPreview ainda define extractAnnotationTargets no sítio')
  }
  if (
    idx.includes('inferIndexSectionHints') &&
    idx.includes('preferNativePdfViewer') &&
    exists('app/modules/manuais/zipViewer.ts')
  ) {
    ok('módulo manuais exporta inferIndexSectionHints')
  } else {
    fail('módulo manuais sem zipViewer')
  }
  if (
    zipPdf.includes('inferIndexSectionHints') &&
    zipPdf.includes('preferNativePdfViewer') &&
    !zipPdf.includes('function inferIndexSectionHints(') &&
    !zipPdf.includes('function preferNativePdfViewer(')
  ) {
    ok('ManuaisZipPdfPreview usa zipViewer do módulo manuais')
  } else {
    fail('ManuaisZipPdfPreview ainda define inferIndexSectionHints no sítio')
  }
  if (
    idx.includes('mergeManuaisPayloads') &&
    idx.includes('buildManuaisFromSources') &&
    idx.includes('CONHECIMENTO_TECNICO_STORAGE_KEY') &&
    exists('app/modules/manuais/conhecimentoMerge.ts')
  ) {
    ok('módulo manuais exporta conhecimentoMerge')
  } else {
    fail('módulo manuais sem conhecimentoMerge')
  }
  if (
    nma.includes('buildManuaisFromSources') &&
    nma.includes("from './modules/manuais'") &&
    nma.includes('CONHECIMENTO_TECNICO_STORAGE_KEY') &&
    nma.includes('syncManuaisConhecimentoStores') &&
    nma.includes("from './lib/conhecimentoTecnicoMerge'") &&
    !nma.includes('function mergeModeloUnificado(')
  ) {
    ok('NMA usa merge de manuais do módulo; IDs/I/O via lib')
  } else {
    fail('NMA ainda importa buildManuaisFromSources do lib')
  }
  if (
    manuaisUi.includes('mergeManuaisPayloads') &&
    (manuaisUi.includes("from '../modules/manuais'") || manuaisUi.includes('from "../modules/manuais"')) &&
    manuaisUi.includes("from '../lib/conhecimentoTecnicoMerge'")
  ) {
    ok('ManuaisInformacoesContent usa mergeManuaisPayloads do módulo')
  } else {
    fail('ManuaisInformacoesContent ainda importa mergeManuaisPayloads do lib')
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
  if (
    idx.includes('isTranslatorLibraryFormValid') &&
    idx.includes('createTranslatorLibraryFromForm') &&
    exists('app/modules/tradutor/fromForm.ts')
  ) {
    ok('módulo tradutor exporta fromForm')
  } else {
    fail('módulo tradutor sem fromForm')
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
    nma.includes('createTranslatorLibraryEntry') &&
    nma.includes('isTranslatorLibraryFormValid') &&
    nma.includes('createTranslatorLibraryFromForm')
  ) {
    ok('NonatoMainApp usa tradutor do módulo')
  } else {
    fail('NonatoMainApp ainda define TranslatorLibraryEntry localmente ou não usa helpers')
  }
  const tradFromForm = fs.readFileSync(path.join(root, 'app/modules/tradutor/fromForm.ts'), 'utf8')
  const libTradFromForm = exists('app/lib/tradutorFromForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/tradutorFromForm.ts'), 'utf8')
    : ''
  if (
    tradFromForm.includes('nowMs: number') &&
    !tradFromForm.includes('Date.now()') &&
    !tradFromForm.includes('Math.random')
  ) {
    ok('módulo tradutor fromForm é puro (relógio/aleatório injectados)')
  } else {
    fail('módulo tradutor/fromForm ainda usa Date.now ou Math.random')
  }
  if (
    libTradFromForm.includes('createTranslatorLibraryFromForm as createTranslatorLibraryFromFormPure') &&
    nma.includes("from './lib/tradutorFromForm'")
  ) {
    ok('NonatoMainApp usa tradutor fromForm via lib')
  } else {
    fail('lib/tradutorFromForm ainda não envolve o tradutor fromForm')
  }
  const tradLib = fs.readFileSync(path.join(root, 'app/modules/tradutor/library.ts'), 'utf8')
  const libTradTypes = fs.readFileSync(path.join(root, 'app/lib/translatorLibraryTypes.ts'), 'utf8')
  if (
    tradLib.includes('nowMs: number') &&
    !tradLib.includes('Date.now()')
  ) {
    ok('módulo tradutor library é puro (relógio injectado)')
  } else {
    fail('módulo tradutor/library ainda usa Date.now')
  }
  if (
    libTradTypes.includes('normalizeTranslatorLibrary as normalizeTranslatorLibraryPure') &&
    nma.includes("from './lib/translatorLibraryTypes'")
  ) {
    ok('NonatoMainApp usa normalizeTranslatorLibrary via lib')
  } else {
    fail('lib/translatorLibraryTypes ainda não envolve o normalize')
  }
  const libTypes = fs.readFileSync(path.join(root, 'app/lib/translatorLibraryTypes.ts'), 'utf8')
  if (libTypes.includes("from '../modules/tradutor'") || libTypes.includes('from "../modules/tradutor"')) {
    ok('lib/translatorLibraryTypes re-exporta app/modules/tradutor')
  } else {
    fail('lib/translatorLibraryTypes não re-exporta o módulo tradutor')
  }
  if (
    idx.includes('WritingAssistLangOption') &&
    idx.includes('formatWritingAssistResultLabel') &&
    idx.includes('resolveWritingAssistNativeLang') &&
    exists('app/modules/tradutor/writingAssist.ts')
  ) {
    ok('módulo tradutor exporta WritingAssistLangOption')
  } else {
    fail('módulo tradutor sem writingAssist')
  }
  const writingAssist = fs.readFileSync(path.join(root, 'app/components/WritingLanguageAssistModal.tsx'), 'utf8')
  if (
    (writingAssist.includes("from '../modules/tradutor'") || writingAssist.includes('from "../modules/tradutor"')) &&
    writingAssist.includes('formatWritingAssistResultLabel') &&
    writingAssist.includes('resolveWritingAssistNativeLang') &&
    !writingAssist.includes('export type WritingAssistLangOption = {')
  ) {
    ok('WritingLanguageAssistModal usa WritingAssist do módulo tradutor')
  } else {
    fail('WritingLanguageAssistModal ainda define WritingAssistLangOption no sítio')
  }
  if (
    idx.includes('WritingAssistLabels') &&
    idx.includes('WRITING_ASSIST_NATIVE_LS_KEY') &&
    idx.includes('writingAssistIsSamePair') &&
    idx.includes('formatWritingAssistLangOption') &&
    exists('app/modules/tradutor/writingAssistLabels.ts')
  ) {
    ok('módulo tradutor exporta WritingAssistLabels')
  } else {
    fail('módulo tradutor sem writingAssistLabels')
  }
  if (
    writingAssist.includes('WritingAssistLabels') &&
    writingAssist.includes('WRITING_ASSIST_NATIVE_LS_KEY') &&
    writingAssist.includes('writingAssistIsSamePair') &&
    writingAssist.includes('formatWritingAssistLangOption') &&
    !writingAssist.includes('type Labels = {') &&
    !writingAssist.includes("const STORAGE_NATIVE = 'nonato-writing-native-lang'")
  ) {
    ok('WritingLanguageAssistModal usa WritingAssistLabels do módulo tradutor')
  } else {
    fail('WritingLanguageAssistModal ainda define Labels/STORAGE_NATIVE no sítio')
  }
  const libMyMemory = fs.readFileSync(path.join(root, 'app/lib/mymemory-translate.ts'), 'utf8')
  if (
    idx.includes('WRITING_ASSIST_FIELD_MAX_CHARS') &&
    idx.includes('planMyMemoryTranslation') &&
    idx.includes('splitTextForTranslation') &&
    exists('app/modules/tradutor/myMemory.ts')
  ) {
    ok('módulo tradutor exporta myMemory')
  } else {
    fail('módulo tradutor sem myMemory')
  }
  if (
    libMyMemory.includes("from '../modules/tradutor/myMemory'") &&
    libMyMemory.includes('translateWithMyMemory') &&
    libMyMemory.includes('fetch(') &&
    !libMyMemory.includes('export const WRITING_ASSIST_FIELD_MAX_CHARS')
  ) {
    ok('lib/mymemory-translate só envolve a rede MyMemory')
  } else {
    fail('lib/mymemory-translate ainda implementa limites/plano')
  }
  if (
    nma.includes('WRITING_ASSIST_FIELD_MAX_CHARS') &&
    nma.includes('translateWithMyMemory') &&
    nma.includes("from './lib/mymemory-translate'") &&
    !nma.includes('import { translateWithMyMemory, WRITING_ASSIST_FIELD_MAX_CHARS }') &&
    writingAssist.includes('WRITING_ASSIST_FIELD_MAX_CHARS') &&
    writingAssist.includes('translateWithMyMemory') &&
    writingAssist.includes("from '../lib/mymemory-translate'") &&
    !writingAssist.includes('import { translateWithMyMemory, WRITING_ASSIST_FIELD_MAX_CHARS }')
  ) {
    ok('NMA/modal usam limite do módulo e fetch via lib')
  } else {
    fail('NMA/modal sem myMemory do módulo/lib')
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
  if (
    idx.includes('isConhecimentoTecnicoFormValid') &&
    idx.includes('createConhecimentoTecnicoFromForm') &&
    exists('app/modules/conhecimento-tecnico/fromForm.ts')
  ) {
    ok('módulo conhecimento-tecnico exporta fromForm')
  } else {
    fail('módulo conhecimento-tecnico sem fromForm')
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
  const ctEntries = fs.readFileSync(path.join(root, 'app/modules/conhecimento-tecnico/entries.ts'), 'utf8')
  const libCtTypes = fs.readFileSync(path.join(root, 'app/lib/conhecimentoTecnicoTypes.ts'), 'utf8')
  if (
    ctEntries.includes('nowMs: number') &&
    !ctEntries.includes('Date.now()')
  ) {
    ok('módulo conhecimento-tecnico entries é puro (relógio injectado)')
  } else {
    fail('módulo conhecimento-tecnico/entries ainda usa Date.now')
  }
  if (
    libCtTypes.includes('normalizeConhecimentoTecnicos as normalizeConhecimentoTecnicosPure') &&
    nma.includes("from './lib/conhecimentoTecnicoTypes'")
  ) {
    ok('NonatoMainApp usa normalizeConhecimentoTecnicos via lib')
  } else {
    fail('lib/conhecimentoTecnicoTypes ainda não envolve o normalize')
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
    content.includes('isConhecimentoTecnicoFormValid') &&
    content.includes('createConhecimentoTecnicoFromForm') &&
    content.includes('computeTecnicoStats') &&
    content.includes('buildTiposEquipamentoOpcoes')
  ) {
    ok('ConhecimentoTecnicosContent usa helpers do módulo')
  } else {
    fail('ConhecimentoTecnicosContent ainda define o tipo localmente ou não usa helpers')
  }
  const ctFromForm = fs.readFileSync(path.join(root, 'app/modules/conhecimento-tecnico/fromForm.ts'), 'utf8')
  const libCtFromForm = exists('app/lib/conhecimentoFromForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/conhecimentoFromForm.ts'), 'utf8')
    : ''
  if (
    ctFromForm.includes('nowMs: number') &&
    !ctFromForm.includes('Date.now()') &&
    !ctFromForm.includes('Math.random')
  ) {
    ok('módulo conhecimento-tecnico fromForm é puro (relógio/aleatório injectados)')
  } else {
    fail('módulo conhecimento-tecnico/fromForm ainda usa Date.now ou Math.random')
  }
  if (
    libCtFromForm.includes('createConhecimentoTecnicoFromForm as createConhecimentoTecnicoFromFormPure') &&
    content.includes("from '../lib/conhecimentoFromForm'")
  ) {
    ok('ConhecimentoTecnicosContent usa fromForm via lib')
  } else {
    fail('lib/conhecimentoFromForm ainda não envolve o conhecimento fromForm')
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
  if (
    idx.includes('ConhecimentoFileItem') &&
    idx.includes('guessMime') &&
    idx.includes('supportsTranslation') &&
    exists('app/modules/conhecimento-tecnico/fileItem.ts')
  ) {
    ok('módulo conhecimento-tecnico exporta ConhecimentoFileItem')
  } else {
    fail('módulo conhecimento-tecnico sem ConhecimentoFileItem')
  }
  const fileViewer = fs.readFileSync(path.join(root, 'app/components/ConhecimentoFileViewer.tsx'), 'utf8')
  if (
    (fileViewer.includes("from '../modules/conhecimento-tecnico'") ||
      fileViewer.includes('from "../modules/conhecimento-tecnico"')) &&
    fileViewer.includes('guessMime') &&
    !fileViewer.includes('export type ConhecimentoFileItem = {')
  ) {
    ok('ConhecimentoFileViewer usa ConhecimentoFileItem do módulo')
  } else {
    fail('ConhecimentoFileViewer ainda define ConhecimentoFileItem no sítio')
  }
  const manuaisFile = fs.readFileSync(path.join(root, 'app/components/ManuaisInformacoesContent.tsx'), 'utf8')
  if (
    (manuaisFile.includes("from '../modules/conhecimento-tecnico'") ||
      manuaisFile.includes('from "../modules/conhecimento-tecnico"')) &&
    manuaisFile.includes('ConhecimentoFileItem')
  ) {
    ok('ManuaisInformacoesContent usa ConhecimentoFileItem do módulo')
  } else {
    fail('ManuaisInformacoesContent ainda importa ConhecimentoFileItem do viewer')
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
  if (
    idx.includes('isDemoRecipientFormValid') &&
    idx.includes('createDemoRecipientFromForm') &&
    exists('app/modules/demo/fromForm.ts')
  ) {
    ok('módulo demo exporta destinatário fromForm')
  } else {
    fail('módulo demo sem destinatário fromForm')
  }
  if (
    gestao.includes('isDemoRecipientFormValid') &&
    gestao.includes('createDemoRecipientFromForm')
  ) {
    ok('GestaoDemosContent usa DemoRecipient fromForm do módulo')
  } else {
    fail('GestaoDemosContent ainda mapeia DemoRecipient no sítio')
  }
  const demoFromForm = fs.readFileSync(path.join(root, 'app/modules/demo/fromForm.ts'), 'utf8')
  const libDemoFromForm = exists('app/lib/demoFromForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/demoFromForm.ts'), 'utf8')
    : ''
  if (
    demoFromForm.includes('nowMs: number') &&
    !demoFromForm.includes('Date.now()') &&
    !demoFromForm.includes('new Date().toISOString()')
  ) {
    ok('módulo demo fromForm é puro (relógio injectado)')
  } else {
    fail('módulo demo/fromForm ainda usa Date.now ou new Date()')
  }
  if (
    libDemoFromForm.includes('createDemoRecipientFromForm as createDemoRecipientFromFormPure') &&
    gestao.includes("from '../lib/demoFromForm'")
  ) {
    ok('GestaoDemosContent usa destinatário fromForm via lib')
  } else {
    fail('lib/demoFromForm ainda não envolve o destinatário demo')
  }
  if (
    idx.includes('emptyDemoRecipientForm') &&
    idx.includes('defaultDemoModulesForActions') &&
    exists('app/modules/demo/formState.ts')
  ) {
    ok('módulo demo exporta formState do destinatário')
  } else {
    fail('módulo demo sem formState do destinatário')
  }
  const policyDemo = fs.readFileSync(path.join(root, 'app/modules/demo/policy.ts'), 'utf8')
  if (
    policyDemo.includes('emptyDemoRecipientForm') &&
    policyDemo.includes('defaultDemoModulesForActions') &&
    gestao.includes('emptyDemoRecipientForm')
  ) {
    ok('demo policy/GestaoDemos usam formState do módulo demo')
  } else {
    fail('createDefaultDemoLinkForm ainda monta o form vazio no sítio')
  }
  if (
    idx.includes('buildDemoUsername') &&
    idx.includes('formatDemoCredentialsText') &&
    idx.includes('generateDemoPassword') &&
    idx.includes('generateDemoAccessCredentials') &&
    exists('app/modules/demo/credentials.ts')
  ) {
    ok('módulo demo exporta credentials')
  } else {
    fail('módulo demo sem credentials')
  }
  const libCreds = fs.readFileSync(path.join(root, 'app/lib/demoCredentials.ts'), 'utf8')
  if (
    libCreds.includes("from '../modules/demo/credentials'") &&
    libCreds.includes('export function generateDemoPassword(') &&
    libCreds.includes('export function generateDemoAccessCredentials(') &&
    libCreds.includes('Math.random') &&
    !libCreds.includes('export function formatDemoCredentialsText(') &&
    !libCreds.includes('function slugifyName(') &&
    !libCreds.includes('ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789') &&
    gestao.includes('buildDemoUsername') &&
    gestao.includes('formatDemoCredentialsText') &&
    gestao.includes('generateDemoAccessCredentials') &&
    gestao.includes("from '../lib/demoCredentials'")
  ) {
    ok('GestaoDemos usa credentials do módulo demo')
  } else {
    fail('demoCredentials ainda definido em lib ou GestaoDemos não usa o módulo')
  }
  if (
    libCreds.includes('generateDemoPassword as generateDemoPasswordPure') &&
    libCreds.includes('generateDemoPasswordPure(Math.random)')
  ) {
    ok('lib/demoCredentials só envolve o aleatório da senha demo')
  } else {
    fail('lib/demoCredentials ainda implementa generateDemoPassword')
  }
  if (
    libCreds.includes('generateDemoAccessCredentials as generateDemoAccessCredentialsPure') &&
    libCreds.includes('generateDemoAccessCredentialsPure(') &&
    !libCreds.includes('demoUsuario: buildDemoUsername(')
  ) {
    ok('lib/demoCredentials só envolve relógio/aleatório das credenciais')
  } else {
    fail('lib/demoCredentials ainda monta generateDemoAccessCredentials')
  }
  if (
    idx.includes('clampDemoDays') &&
    idx.includes('DEMO_VISITOR_USER') &&
    idx.includes('DEMO_DAYS_DEFAULT') &&
    exists('app/modules/demo/limits.ts')
  ) {
    ok('módulo demo exporta limits')
  } else {
    fail('módulo demo sem limits')
  }
  if (
    libDemo.includes("from '../modules/demo/limits'") &&
    !libDemo.includes('export function clampDemoDays(') &&
    !libDemo.includes("id: 'demo-visitor'")
  ) {
    ok('lib/demoManagement só reexporta limits do módulo demo')
  } else {
    fail('lib/demoManagement ainda implementa clampDemoDays / DEMO_VISITOR_USER')
  }
  if (nma.includes('DEMO_VISITOR_USER') && !nma.includes("from './lib/demoManagement'")) {
    ok('NonatoMainApp usa DEMO_VISITOR_USER do módulo demo')
  } else {
    fail('NonatoMainApp ainda importa DEMO_VISITOR_USER do lib')
  }
  if (
    idx.includes('getDemoModuleLabelForGrid') &&
    idx.includes('DEMO_HIDDEN_ACTIONS') &&
    idx.includes('FULL_DEMO_ACTION_KEYS') &&
    exists('app/modules/demo/actions.ts')
  ) {
    ok('módulo demo exporta actions')
  } else {
    fail('módulo demo sem actions')
  }
  if (
    libDemo.includes("from '../modules/demo/actions'") &&
    !libDemo.includes('export function getDemoModuleLabelForGrid(') &&
    !libDemo.includes('export const DEMO_HIDDEN_ACTIONS = new Set([')
  ) {
    ok('lib/demoManagement só reexporta actions do módulo demo')
  } else {
    fail('lib/demoManagement ainda implementa DEMO_HIDDEN_ACTIONS / labels')
  }
  if (
    gestao.includes('getDemoModuleLabelForGrid') &&
    gestao.includes('DEMO_EDITABLE_ACTION_KEYS') &&
    (gestao.includes("from '../modules/demo'") || gestao.includes('from "../modules/demo"'))
  ) {
    ok('GestaoDemos usa actions do módulo demo')
  } else {
    fail('GestaoDemos ainda importa labels/actions do lib')
  }
  if (
    idx.includes('getDemoModuleGroupId') &&
    idx.includes('DEMO_PRESET_CARDS') &&
    idx.includes('getDemoPresetLabel') &&
    exists('app/modules/demo/groups.ts')
  ) {
    ok('módulo demo exporta groups')
  } else {
    fail('módulo demo sem groups')
  }
  if (
    libDemo.includes("from '../modules/demo/groups'") &&
    !libDemo.includes('export function getDemoModuleGroupId(') &&
    !libDemo.includes('export const DEMO_PRESET_CARDS')
  ) {
    ok('lib/demoManagement só reexporta groups do módulo demo')
  } else {
    fail('lib/demoManagement ainda implementa groups/presets')
  }
  if (
    gestao.includes('getDemoModuleGroupId') &&
    gestao.includes('DEMO_PRESET_CARDS') &&
    gestao.includes('getDemoPresetLabel') &&
    (gestao.includes("from '../modules/demo'") || gestao.includes('from "../modules/demo"'))
  ) {
    ok('GestaoDemos usa groups do módulo demo')
  } else {
    fail('GestaoDemos ainda importa groups/presets do lib')
  }
  if (
    idx.includes('finalizeDemoModulesPolicy') &&
    idx.includes('buildDemoModulesFromPreset') &&
    idx.includes('normalizeDemoModulesForSession') &&
    exists('app/modules/demo/policy.ts')
  ) {
    ok('módulo demo exporta policy')
  } else {
    fail('módulo demo sem policy')
  }
  if (
    libDemo.includes("from '../modules/demo/policy'") &&
    !libDemo.includes('export function finalizeDemoModulesPolicy(') &&
    !libDemo.includes('export function buildDemoModulesFromPreset(')
  ) {
    ok('lib/demoManagement só reexporta policy do módulo demo')
  } else {
    fail('lib/demoManagement ainda implementa a política de módulos')
  }
  if (
    gestao.includes('finalizeDemoModulesPolicy') &&
    gestao.includes('buildDemoModulesFromPreset') &&
    gestao.includes('createDefaultDemoLinkForm') &&
    (gestao.includes("from '../modules/demo'") || gestao.includes('from "../modules/demo"'))
  ) {
    ok('GestaoDemos usa policy do módulo demo')
  } else {
    fail('GestaoDemos ainda importa policy do lib')
  }
  if (
    idx.includes('buildDemoShareMessage') &&
    idx.includes('buildDemoMailto') &&
    idx.includes('buildDemoWhatsAppUrl') &&
    exists('app/modules/demo/share.ts')
  ) {
    ok('módulo demo exporta share')
  } else {
    fail('módulo demo sem share')
  }
  if (
    libDemo.includes("from '../modules/demo/share'") &&
    !libDemo.includes('export function buildDemoShareMessage(') &&
    !libDemo.includes('export function buildDemoMailto(')
  ) {
    ok('lib/demoManagement só reexporta share do módulo demo')
  } else {
    fail('lib/demoManagement ainda implementa o texto de envio')
  }
  if (
    gestao.includes('buildDemoShareMessage') &&
    gestao.includes('buildDemoWhatsAppUrl') &&
    gestao.includes('enrichDemoRecipients') &&
    gestao.includes("from '../lib/demoManagement'")
  ) {
    ok('GestaoDemos usa share do módulo; enrich via lib')
  } else {
    fail('GestaoDemos ainda importa share do lib')
  }
  if (
    idx.includes('enrichDemoRecipients') &&
    exists('app/modules/demo/enrich.ts')
  ) {
    ok('módulo demo exporta enrich')
  } else {
    fail('módulo demo sem enrich')
  }
  if (
    libDemo.includes("from '../modules/demo/enrich'") &&
    libDemo.includes('Date.now()') &&
    !libDemo.includes('recipient.firstAccessAt || recipient.dataEnvio')
  ) {
    ok('lib/demoManagement só envolve o relógio do enrich')
  } else {
    fail('lib/demoManagement ainda implementa o enrich')
  }
} catch (e) {
  fail(`módulo demo: ${e.message}`)
}

// 3al) Módulo pagamentos-contador (119.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/pagamentos-contador/index.ts'), 'utf8')
  if (
    idx.includes('AnexoContador') &&
    idx.includes('EntidadeContador') &&
    idx.includes('PagamentoContador') &&
    idx.includes('emptyEntidadeContadorForm') &&
    idx.includes('emptyPagamentoContadorForm') &&
    idx.includes('createEntidadeContadorFromForm') &&
    idx.includes('createPagamentoContadorFromForm') &&
    idx.includes('createAnexoContadorFromForm')
  ) {
    ok('módulo pagamentos-contador exporta tipos/formState/fromForm')
  } else {
    fail('módulo pagamentos-contador incompleto (index.ts)')
  }
  if (
    exists('app/modules/pagamentos-contador/tipos.ts') &&
    exists('app/modules/pagamentos-contador/formState.ts') &&
    exists('app/modules/pagamentos-contador/fromForm.ts')
  ) {
    ok('existe app/modules/pagamentos-contador tipos/formState/fromForm')
  } else {
    fail('ficheiros do módulo pagamentos-contador em falta')
  }
  const pccMod = fs.readFileSync(path.join(root, 'app/components/PagamentosContadorContent.tsx'), 'utf8')
  if (
    (pccMod.includes("from '../modules/pagamentos-contador'") ||
      pccMod.includes('from "../modules/pagamentos-contador"')) &&
    pccMod.includes('emptyPagamentoContadorForm') &&
    pccMod.includes('createEntidadeContadorFromForm') &&
    pccMod.includes('createPagamentoContadorFromForm') &&
    pccMod.includes('createAnexoContadorFromForm') &&
    !pccMod.includes('export type AnexoContador = {')
  ) {
    ok('PagamentosContadorContent usa tipos/fromForm do módulo pagamentos-contador')
  } else {
    fail('PagamentosContadorContent ainda define AnexoContador/entidade/pagamento no sítio')
  }
  const pagFromForm = fs.readFileSync(path.join(root, 'app/modules/pagamentos-contador/fromForm.ts'), 'utf8')
  const libPagFromForm = exists('app/lib/pagamentosContadorFromForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/pagamentosContadorFromForm.ts'), 'utf8')
    : ''
  if (
    pagFromForm.includes('nowMs: number') &&
    !pagFromForm.includes('Date.now()') &&
    !pagFromForm.includes('Math.random') &&
    !pagFromForm.includes('new Date().toISOString()')
  ) {
    ok('módulo pagamentos-contador fromForm é puro (relógio injectado)')
  } else {
    fail('módulo pagamentos-contador/fromForm ainda usa Date.now ou Math.random')
  }
  const pagFormState = fs.readFileSync(path.join(root, 'app/modules/pagamentos-contador/formState.ts'), 'utf8')
  if (
    pagFormState.includes('nowMs: number') &&
    !pagFormState.includes('new Date().toISOString()')
  ) {
    ok('módulo pagamentos-contador formState é puro (relógio injectado)')
  } else {
    fail('módulo pagamentos-contador/formState ainda usa new Date()')
  }
  if (
    libPagFromForm.includes('createEntidadeContadorFromForm as createEntidadeContadorFromFormPure') &&
    libPagFromForm.includes('emptyPagamentoContadorForm as emptyPagamentoContadorFormPure') &&
    pccMod.includes("from '../lib/pagamentosContadorFromForm'")
  ) {
    ok('PagamentosContadorContent usa fromForm via lib')
  } else {
    fail('lib/pagamentosContadorFromForm ainda não envolve o fromForm')
  }
} catch (e) {
  fail(`módulo pagamentos-contador: ${e.message}`)
}

// 3am) Módulo registro-despesas (121.º corte modularização)
try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/registro-despesas/index.ts'), 'utf8')
  if (
    idx.includes('CartaoEmpresaDespesas') &&
    idx.includes('DespesaRegistro') &&
    idx.includes('DespesaDocumento') &&
    idx.includes('emptyDespesaRegistroForm') &&
    idx.includes('createCartaoEmpresaDespesasFromForm') &&
    idx.includes('createDespesaRegistroFromForm') &&
    idx.includes('createDespesaDocumentoFromForm') &&
    idx.includes('listarTiposDespesaDoCadastro') &&
    idx.includes('servicoApareceComoTipoDespesa')
  ) {
    ok('módulo registro-despesas exporta tipos/formState/fromForm')
  } else {
    fail('módulo registro-despesas incompleto (index.ts)')
  }
  if (
    exists('app/modules/registro-despesas/tipos.ts') &&
    exists('app/modules/registro-despesas/formState.ts') &&
    exists('app/modules/registro-despesas/fromForm.ts')
  ) {
    ok('existe app/modules/registro-despesas tipos/formState/fromForm')
  } else {
    fail('ficheiros do módulo registro-despesas em falta')
  }
  const rdcMod = fs.readFileSync(path.join(root, 'app/components/RegistroDespesasContent.tsx'), 'utf8')
  if (
    (rdcMod.includes("from '../modules/registro-despesas'") ||
      rdcMod.includes('from "../modules/registro-despesas"')) &&
    rdcMod.includes('emptyDespesaRegistroForm') &&
    rdcMod.includes('createCartaoEmpresaDespesasFromForm') &&
    rdcMod.includes('createDespesaRegistroFromForm') &&
    rdcMod.includes('createDespesaDocumentoFromForm') &&
    rdcMod.includes('listarTiposDespesaDoCadastro') &&
    !rdcMod.includes("s.categoria === 'despesa'") &&
    !rdcMod.includes('export type CartaoEmpresaDespesas = {')
  ) {
    ok('RegistroDespesasContent usa tipos/fromForm do módulo registro-despesas')
  } else {
    fail('RegistroDespesasContent ainda define cartão/despesa/documento no sítio')
  }
  const regFromForm = fs.readFileSync(path.join(root, 'app/modules/registro-despesas/fromForm.ts'), 'utf8')
  const libRegFromForm = exists('app/lib/registroDespesasFromForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/registroDespesasFromForm.ts'), 'utf8')
    : ''
  if (
    regFromForm.includes('nowMs: number') &&
    !regFromForm.includes('Date.now()') &&
    !regFromForm.includes('new Date().toISOString()')
  ) {
    ok('módulo registro-despesas fromForm é puro (relógio injectado)')
  } else {
    fail('módulo registro-despesas/fromForm ainda usa Date.now ou new Date()')
  }
  const regFormState = fs.readFileSync(path.join(root, 'app/modules/registro-despesas/formState.ts'), 'utf8')
  if (
    regFormState.includes('nowMs: number') &&
    !regFormState.includes('new Date().toISOString()')
  ) {
    ok('módulo registro-despesas formState é puro (relógio injectado)')
  } else {
    fail('módulo registro-despesas/formState ainda usa new Date()')
  }
  if (
    libRegFromForm.includes('createCartaoEmpresaDespesasFromForm as createCartaoEmpresaDespesasFromFormPure') &&
    libRegFromForm.includes('emptyDespesaRegistroForm as emptyDespesaRegistroFormPure') &&
    rdcMod.includes("from '../lib/registroDespesasFromForm'")
  ) {
    ok('RegistroDespesasContent usa fromForm via lib')
  } else {
    fail('lib/registroDespesasFromForm ainda não envolve o fromForm')
  }
} catch (e) {
  fail(`módulo registro-despesas: ${e.message}`)
}

try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/fornecedores/index.ts'), 'utf8')
  if (
    idx.includes('Fornecedor') &&
    idx.includes('FaturaFornecedor') &&
    idx.includes('emptyFornecedorFormState') &&
    idx.includes('fornecedorToFormState') &&
    idx.includes('emptyFaturaFornecedorFormState') &&
    idx.includes('faturaFornecedorToFormState') &&
    idx.includes('inferFaturaFornecedorEntidadeOrigem') &&
    idx.includes('isFornecedorFormValid') &&
    idx.includes('createFornecedorFromForm') &&
    idx.includes('updateFornecedorFromForm') &&
    idx.includes('isFaturaFornecedorFormValid') &&
    idx.includes('createFaturaFornecedorFromForm') &&
    idx.includes('updateFaturaFornecedorFromForm')
  ) {
    ok('módulo fornecedores exporta tipos + formState + entidadeOrigem')
  } else {
    fail('módulo fornecedores incompleto (index.ts)')
  }
  for (const f of [
    'tipos.ts',
    'formState.ts',
    'entidadeOrigem.ts',
    'fornecedorFromForm.ts',
    'faturaFornecedorFromForm.ts',
    'index.ts',
  ]) {
    if (exists(`app/modules/fornecedores/${f}`)) ok(`existe app/modules/fornecedores/${f}`)
    else fail(`falta app/modules/fornecedores/${f}`)
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/fornecedores'") || nma.includes('from "./modules/fornecedores"')) {
    ok('NonatoMainApp importa app/modules/fornecedores')
  } else {
    fail('NonatoMainApp não importa o módulo fornecedores')
  }
  if (
    !nma.includes('type Fornecedor = {') &&
    !nma.includes('type FaturaFornecedor = {') &&
    nma.includes('Fornecedor') &&
    nma.includes('inferFaturaFornecedorEntidadeOrigem') &&
    nma.includes('isFornecedorFormValid') &&
    nma.includes('createFornecedorFromForm') &&
    nma.includes('updateFornecedorFromForm') &&
    nma.includes('isFaturaFornecedorFormValid') &&
    nma.includes('createFaturaFornecedorFromForm') &&
    nma.includes('updateFaturaFornecedorFromForm')
  ) {
    ok('NonatoMainApp usa Fornecedor/FaturaFornecedor/fromForm do módulo fornecedores')
  } else {
    fail('NonatoMainApp ainda define Fornecedor/FaturaFornecedor/fromForm localmente')
  }
  const fornFormState = fs.readFileSync(path.join(root, 'app/modules/fornecedores/formState.ts'), 'utf8')
  const libFornForm = exists('app/lib/fornecedoresForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/fornecedoresForm.ts'), 'utf8')
    : ''
  if (
    fornFormState.includes('nowMs: number') &&
    !fornFormState.includes('new Date().toISOString()')
  ) {
    ok('módulo fornecedores formState é puro (relógio injectado)')
  } else {
    fail('módulo fornecedores/formState ainda usa new Date()')
  }
  if (
    libFornForm.includes('emptyFaturaFornecedorFormState as emptyFaturaFornecedorFormStatePure') &&
    nma.includes("from './lib/fornecedoresForm'")
  ) {
    ok('NonatoMainApp usa emptyFaturaFornecedorFormState via lib')
  } else {
    fail('lib/fornecedoresForm ainda não envolve o form vazio')
  }
  const formComp = fs.readFileSync(path.join(root, 'app/components/FornecedorCadastroForm.tsx'), 'utf8')
  if (
    (formComp.includes("from '../modules/fornecedores'") ||
      formComp.includes('from "../modules/fornecedores"')) &&
    !formComp.includes('export type FornecedorFormState = {') &&
    !formComp.includes('export const emptyFornecedorFormState = (): FornecedorFormState')
  ) {
    ok('FornecedorCadastroForm re-exporta form do módulo fornecedores')
  } else {
    fail('FornecedorCadastroForm não re-exporta / ainda define form localmente')
  }
} catch (e) {
  fail(`módulo fornecedores: ${e.message}`)
}

try {
  const idx = fs.readFileSync(path.join(root, 'app/modules/comunicacao/index.ts'), 'utf8')
  if (
    idx.includes('MensagemComunicacao') &&
    idx.includes('PecaSolicitadaArmazem') &&
    idx.includes('CommunicationIdentity') &&
    idx.includes('resolveCommunicationIdentity') &&
    idx.includes('isMensagemVisivelParaUsuario') &&
    idx.includes('filterMensagensVisiveis') &&
    idx.includes('filterMensagensNaoLidas') &&
    idx.includes('countMensagensNaoLidas')
  ) {
    ok('módulo comunicação exporta tipos + identity + visibilidade')
  } else {
    fail('módulo comunicação incompleto (index.ts)')
  }
  for (const f of ['tipos.ts', 'identity.ts', 'visibilidade.ts', 'index.ts']) {
    if (exists(`app/modules/comunicacao/${f}`)) ok(`existe app/modules/comunicacao/${f}`)
    else fail(`falta app/modules/comunicacao/${f}`)
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes("from './modules/comunicacao'") || nma.includes('from "./modules/comunicacao"')) {
    ok('NonatoMainApp importa app/modules/comunicacao')
  } else {
    fail('NonatoMainApp não importa o módulo comunicação')
  }
  if (
    !nma.includes('type MensagemComunicacao = {') &&
    !nma.includes('type PecaSolicitadaArmazem = {') &&
    nma.includes('MensagemComunicacao') &&
    nma.includes('resolveCommunicationIdentity') &&
    nma.includes('filterMensagensVisiveis') &&
    nma.includes('filterMensagensNaoLidas')
  ) {
    ok('NonatoMainApp usa MensagemComunicacao/PecaSolicitadaArmazem do módulo comunicação')
  } else {
    fail('NonatoMainApp ainda define MensagemComunicacao/PecaSolicitadaArmazem localmente')
  }
  if (
    idx.includes('isMensagemComunicacaoFormValid') &&
    idx.includes('createMensagemComunicacaoFromForm') &&
    exists('app/modules/comunicacao/fromForm.ts')
  ) {
    ok('módulo comunicação exporta MensagemComunicacao fromForm')
  } else {
    fail('módulo comunicação sem MensagemComunicacao fromForm')
  }
  if (
    nma.includes('isMensagemComunicacaoFormValid') &&
    nma.includes('createMensagemComunicacaoFromForm')
  ) {
    ok('NonatoMainApp usa MensagemComunicacao fromForm do módulo')
  } else {
    fail('NonatoMainApp ainda mapeia MensagemComunicacao no sítio')
  }
  if (
    idx.includes('isPecaSolicitadaArmazemFormValid') &&
    idx.includes('createPecaSolicitadaArmazemFromForm') &&
    exists('app/modules/comunicacao/pecaArmazemFromForm.ts')
  ) {
    ok('módulo comunicação exporta PecaSolicitadaArmazem fromForm')
  } else {
    fail('módulo comunicação sem PecaSolicitadaArmazem fromForm')
  }
  if (
    nma.includes('isPecaSolicitadaArmazemFormValid') &&
    nma.includes('createPecaSolicitadaArmazemFromForm')
  ) {
    ok('NonatoMainApp usa PecaSolicitadaArmazem fromForm do módulo')
  } else {
    fail('NonatoMainApp ainda mapeia PecaSolicitadaArmazem no sítio')
  }
  const comFromForm = fs.readFileSync(path.join(root, 'app/modules/comunicacao/fromForm.ts'), 'utf8')
  const pecaArmFromForm = fs.readFileSync(path.join(root, 'app/modules/comunicacao/pecaArmazemFromForm.ts'), 'utf8')
  const libComFromForm = exists('app/lib/comunicacaoFromForm.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/comunicacaoFromForm.ts'), 'utf8')
    : ''
  if (
    comFromForm.includes('nowMs: number') &&
    !comFromForm.includes('Date.now()') &&
    !comFromForm.includes('new Date().toISOString()') &&
    pecaArmFromForm.includes('nowMs: number') &&
    !pecaArmFromForm.includes('Date.now()') &&
    !pecaArmFromForm.includes('new Date().toISOString()')
  ) {
    ok('módulo comunicação fromForm é puro (relógio injectado)')
  } else {
    fail('módulo comunicação fromForm ainda usa Date.now ou new Date()')
  }
  if (
    libComFromForm.includes('createMensagemComunicacaoFromForm as createMensagemComunicacaoFromFormPure') &&
    libComFromForm.includes('createPecaSolicitadaArmazemFromForm as createPecaSolicitadaArmazemFromFormPure') &&
    libComFromForm.includes('Date.now()')
  ) {
    ok('lib/comunicacaoFromForm só envolve o relógio da comunicação')
  } else {
    fail('lib/comunicacaoFromForm ainda não envolve a comunicação fromForm')
  }
  if (nma.includes("from './lib/comunicacaoFromForm'")) {
    ok('NonatoMainApp usa comunicação fromForm via lib')
  } else {
    fail('NonatoMainApp não importa comunicação fromForm do lib')
  }
} catch (e) {
  fail(`módulo comunicação: ${e.message}`)
}

// Hub Cliente → Equipamento + faturas no detalhe
try {
  for (const f of [
    'app/components/ClienteEquipamentoHub.tsx',
    'app/components/ClienteEquipamentoHistoricoPanel.tsx',
    'app/components/ClienteFaturasSection.tsx',
  ]) {
    if (exists(f)) ok(`existe ${f}`)
    else fail(`em falta: ${f}`)
  }
  const hub = fs.readFileSync(path.join(root, 'app/components/ClienteEquipamentoHub.tsx'), 'utf8')
  if (
    hub.includes('hubEqTabRelatorios') &&
    hub.includes('hubEqTabPecas') &&
    hub.includes('hubEqTabOrcamentos') &&
    hub.includes('hubEqTabTimeline') &&
    hub.includes('vista={active.vista}') &&
    hub.includes('mostrarBarraEstado')
  ) {
    ok('ClienteEquipamentoHub com tabs Timeline / RS / peças / orçamentos + estado')
  } else {
    fail('ClienteEquipamentoHub incompleto (tabs/vista/estado)')
  }
  if (
    hub.includes('onNovoRelatorio') &&
    hub.includes('onNovaFatura') &&
    hub.includes('onNovoPedidoOrcamento') &&
    hub.includes('hubEqCriarRelatorio') &&
    hub.includes('hubEqCriarFatura') &&
    hub.includes('hubEqCriarOrcamento') &&
    hub.includes('cliente-equip-hub__criar')
  ) {
    ok('ClienteEquipamentoHub com botões Criar (RS / orçamento / fatura)')
  } else {
    fail('ClienteEquipamentoHub sem barra Criar / callbacks')
  }
  const hist = fs.readFileSync(path.join(root, 'app/components/ClienteEquipamentoHistoricoPanel.tsx'), 'utf8')
  if (hist.includes("vista === 'pecas'") && hist.includes('hubEqPecasVazio')) {
    ok('HistoricoPanel trata vista=pecas + empty state')
  } else {
    fail('HistoricoPanel sem empty state para vista=pecas')
  }
  if (
    hist.includes("vista === 'timeline'") &&
    hist.includes('buildHubEqChips') &&
    hist.includes('hubEqTimelineVazio') &&
    hist.includes('mostrarBarraEstado')
  ) {
    ok('HistoricoPanel com timeline + chips de estado')
  } else {
    fail('HistoricoPanel sem timeline/chips profissionais')
  }
  if (
    hist.includes('onCriarFaturaDeOrcamento') &&
    hist.includes('hubEqCriarFaturaDeOrcamento') &&
    hist.includes('buildItensFaturaDeOrcamentoAprovado') &&
    hist.includes('onAbrirTimelineItem') &&
    hist.includes('item.action')
  ) {
    ok('HistoricoPanel: Criar fatura de orçamento + timeline clicável')
  } else {
    fail('HistoricoPanel sem Criar fatura / timeline clicável')
  }
  if (exists('app/modules/clientes/equipamentoHubPro.ts')) {
    ok('existe app/modules/clientes/equipamentoHubPro.ts')
  } else {
    fail('em falta: app/modules/clientes/equipamentoHubPro.ts')
  }
  const hubPro = fs.readFileSync(path.join(root, 'app/modules/clientes/equipamentoHubPro.ts'), 'utf8')
  if (
    hubPro.includes('buildItensFaturaDeOrcamentoAprovado') &&
    hubPro.includes('HubEqCriarFaturaDeOrcamentoPayload') &&
    hubPro.includes("kind: HubEqTimelineActionKind")
  ) {
    ok('equipamentoHubPro: payload fatura + action timeline')
  } else {
    fail('equipamentoHubPro incompleto (fatura/timeline action)')
  }
  const libHubPro = exists('app/lib/equipamentoHubPro.ts')
    ? fs.readFileSync(path.join(root, 'app/lib/equipamentoHubPro.ts'), 'utf8')
    : ''
  if (hubPro.includes('nowMs: number') && !hubPro.includes('Date.now()')) {
    ok('módulo clientes buildItensFaturaDeOrcamentoAprovado é puro (relógio injectado)')
  } else {
    fail('módulo clientes/equipamentoHubPro ainda usa Date.now')
  }
  if (
    libHubPro.includes("from '../modules/clientes/equipamentoHubPro'") &&
    libHubPro.includes('buildItensFaturaDeOrcamentoAprovado as buildItensFaturaDeOrcamentoAprovadoPure') &&
    libHubPro.includes('Date.now()')
  ) {
    ok('lib/equipamentoHubPro só envolve o relógio da fatura do hub')
  } else {
    fail('lib/equipamentoHubPro ainda não envolve buildItensFaturaDeOrcamentoAprovado')
  }
  if (hist.includes("from '../lib/equipamentoHubPro'")) {
    ok('HistoricoPanel usa buildItensFaturaDeOrcamentoAprovado via lib')
  } else {
    fail('HistoricoPanel não importa buildItensFaturaDeOrcamentoAprovado do lib')
  }
  const det = fs.readFileSync(path.join(root, 'app/components/ClienteDetalheView.tsx'), 'utf8')
  if (det.includes('ClienteFaturasSection') && det.includes('faturasPecas')) {
    ok('ClienteDetalheView liga ClienteFaturasSection')
  } else {
    fail('ClienteDetalheView sem ClienteFaturasSection')
  }
  if (
    det.includes('onAssociarEquipamentoFatura') &&
    det.includes('buildHubEqChips') &&
    det.includes('hubEqChipToneStyle')
  ) {
    ok('ClienteDetalheView: associar fatura + chips equipamento')
  } else {
    fail('ClienteDetalheView sem associar fatura / chips')
  }
  const fatSec = fs.readFileSync(path.join(root, 'app/components/ClienteFaturasSection.tsx'), 'utf8')
  if (
    fatSec.includes('onAssociarEquipamento') &&
    fatSec.includes('clienteFaturaAssociar') &&
    fatSec.includes('clienteFaturaEscolherEquipamento')
  ) {
    ok('ClienteFaturasSection: UI associar equipamento')
  } else {
    fail('ClienteFaturasSection sem UI associar')
  }
  const nma = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma.includes('ClienteEquipamentoHub')) {
    ok('NonatoMainApp usa ClienteEquipamentoHub')
  } else {
    fail('NonatoMainApp sem ClienteEquipamentoHub')
  }
  if (nma.includes('onAssociarEquipamentoFatura=') && nma.includes("saveData('nonato-faturas-pecas'")) {
    ok('NonatoMainApp grava associação fatura→equipamento')
  } else {
    fail('NonatoMainApp sem wire associar fatura')
  }
  if (nma.includes('hubChipsCard') && nma.includes('buildHubEqChips')) {
    ok('NonatoMainApp: chips no cartão do equipamento')
  } else {
    fail('NonatoMainApp sem chips no cartão equipamento')
  }
  if (nma.includes('faturasCliente=')) {
    ok('NonatoMainApp passa faturasCliente ao hub')
  } else {
    fail('NonatoMainApp sem faturasCliente no hub')
  }
  if (
    nma.includes('onNovaFatura={') &&
    nma.includes('onNovoRelatorio={') &&
    nma.includes('onNovoPedidoOrcamento={') &&
    nma.includes('handleNovaFaturaFromHub') &&
    nma.includes('handleNovoRelatorioFromHub') &&
    nma.includes('handleNovoPedidoOrcamentoFromHub')
  ) {
    ok('NonatoMainApp liga callbacks Criar do hub equipamento')
  } else {
    fail('NonatoMainApp sem wire dos callbacks Criar do hub')
  }
  if (
    nma.includes('formatClienteDadosFaturaTexto') &&
    nma.includes('faturaDadosFiscaisTitulo') &&
    exists('app/modules/clientes/dadosFatura.ts')
  ) {
    ok('modal de fatura mostra dados fiscais do cliente para copiar')
  } else {
    fail('modal de fatura sem bloco de dados fiscais do cliente')
  }
  if (
    nma.includes('onCriarFaturaDeOrcamento={') &&
    nma.includes('handleCriarFaturaDeOrcamentoFromHub') &&
    nma.includes('onAbrirTimelineItem={') &&
    nma.includes('handleAbrirTimelineItemFromHub')
  ) {
    ok('NonatoMainApp liga fatura-de-orçamento + timeline clicável do hub')
  } else {
    fail('NonatoMainApp sem wire fatura-de-orçamento / timeline clicável')
  }
  if (nma.includes('hubSeed={pedidoAvulsoHubSeed}')) {
    ok('Pedido avulso recebe hubSeed do equipamento')
  } else {
    fail('Pedido avulso sem hubSeed')
  }
  {
    const fromForm = exists('app/modules/financeiro/faturaPecasFromForm.ts')
      ? fs.readFileSync(path.join(root, 'app/modules/financeiro/faturaPecasFromForm.ts'), 'utf8')
      : ''
    if (
      nma.includes('equipamentoId: faturaForm.equipamentoId') ||
      nma.includes('equipamentoId: faturaForm.equipamentoId || undefined') ||
      fromForm.includes('equipamentoId: form.equipamentoId || undefined')
    ) {
      ok('faturaForm grava equipamentoId')
    } else {
      fail('faturaForm sem equipamentoId no payload')
    }
  }
  if (
    nma.includes("openTab('clientes'") &&
    nma.includes('bibliotecaRelatoriosAtalhoClientes') &&
    nma.includes("action === 'open-biblioteca-relatorios'")
  ) {
    ok('Biblioteca Relatórios redireciona para Clientes')
  } else {
    fail('open-biblioteca-relatorios não redireciona para Clientes')
  }
  if (
    nma.includes("toggleOrOpenDashboardHub('gestao-financeira', 'gestao-financeira')") &&
    nma.includes("action: 'open-quick-gestao-financeira'")
  ) {
    ok('Gestão Financeira abre hub animado (como Gestão Técnica)')
  } else {
    fail('Gestão Financeira sem hub animado no clique do grupo')
  }
  const tipos = fs.readFileSync(path.join(root, 'app/modules/financeiro/tiposOs.ts'), 'utf8')
  if (tipos.includes('equipamentoId?: string') && tipos.includes('equipamentoTexto?: string')) {
    ok('FaturaPecas tipada com equipamentoId/Texto')
  } else {
    fail('FaturaPecas sem equipamentoId/Texto')
  }
} catch (e) {
  fail(`hub cliente-equipamento: ${e.message}`)
}

// 3b) Fase 1 estabilidade: sync leve + chaves protegidas + APIs autenticadas
try {
  const keysSrc = fs.readFileSync(path.join(root, 'app/lib/criticalCadastroKeys.ts'), 'utf8')
  for (const k of [
    'nonato-orcamentos-avulso',
    'nonato-mensagens-comunicacao',
    'nonato-solicitacoes-servico-tecnico',
    'nonato-pecas-solicitadas-armazem',
  ]) {
    if (keysSrc.includes(`'${k}'`)) ok(`cadastro crítico inclui ${k}`)
    else fail(`cadastro crítico sem ${k}`)
  }
  const storageSrc = fs.readFileSync(path.join(root, 'app/utils/dataStorage.ts'), 'utf8')
  if (
    storageSrc.includes('opts?.timeoutMs ?? (payloadNeedsSlowUpload ? 180000 : 45000)') &&
    storageSrc.includes('payloadStr.length > 80000') &&
    storageSrc.includes("response.status === 409") &&
    storageSrc.includes("json?.error === 'cadastro_protected'") &&
    /SYNC_QUEUE_MAX_FAILS = 5/.test(storageSrc)
  ) {
    ok('save servidor: timeout 45s, 409 protegido, fila não descarta à 2.ª falha')
  } else {
    fail('save servidor ainda com timeout 5s / 409=fail / MAX_FAILS=2')
  }
  if (storageSrc.includes('loadAllFromServer({ bootstrap: true })')) {
    ok('pull automático usa bundle bootstrap (sem catálogo ~38 MB)')
  } else {
    fail('pullServerUpdatesIfNewer não usa loadAllFromServer({ bootstrap: true })')
  }
  if (storageSrc.includes("status: SilentServerSyncResult | 'offline' | 'risk'")) {
    ok('pull avalia risco grave antes de aplicar sync')
  } else {
    fail('pull sem estado risk / assessPullServerRisk')
  }
  const riskSrc = fs.readFileSync(path.join(root, 'app/utils/syncRisk.ts'), 'utf8')
  if (riskSrc.includes("'nonato-agendamentos'") && !/['"]nonato-agenda['"]/.test(riskSrc)) {
    ok('syncRisk usa nonato-agendamentos (não nonato-agenda)')
  } else {
    fail('syncRisk ainda usa chave errada nonato-agenda')
  }
  if (riskSrc.includes('if (s === undefined) continue')) {
    ok('syncRisk ignora chaves ausentes no bundle bootstrap')
  } else {
    fail('syncRisk trata chave ausente como lista vazia')
  }
  const shrinkPol = fs.readFileSync(path.join(root, 'app/lib/cadastroShrinkPolicy.ts'), 'utf8')
  if (
    shrinkPol.includes('export function mergeProtectedArrayById') &&
    shrinkPol.includes("'nonato-clientes'")
  ) {
    ok('cadastro: merge por id em shrink (clientes)')
  } else {
    fail('cadastroShrinkPolicy sem mergeProtectedArrayById / clientes')
  }
  const saveRoute = fs.readFileSync(path.join(root, 'app/api/data/save/route.ts'), 'utf8')
  if (saveRoute.includes('resolveCadastroWriteValue')) {
    ok('save API funde cadastro em vez de só recusar')
  } else {
    fail('save/route ainda só usa assessServerCadastroWrite')
  }
  if (
    storageSrc.includes('MERGE_ON_SHRINK_KEYS.has(key)') &&
    storageSrc.includes("result === 'auth'") &&
    storageSrc.includes('nonato-save-auth-required') &&
    storageSrc.includes('silentUi: true')
  ) {
    ok('save cliente: merge shrink + 401 sem banner vermelho genérico')
  } else {
    fail('dataStorage sem MERGE_ON_SHRINK / auth / silentUi no save')
  }
  const pecasFix = fs.readFileSync(path.join(root, 'app/api/data/pecas-fix/route.ts'), 'utf8')
  const restoreServ = fs.readFileSync(path.join(root, 'app/api/data/restore-cadastro-servicos/route.ts'), 'utf8')
  if (pecasFix.includes('rejectUnauthenticatedProductionAccess')) {
    ok('pecas-fix exige sessão em produção')
  } else {
    fail('pecas-fix sem autenticação')
  }
  if (restoreServ.includes('rejectUnauthenticatedProductionAccess')) {
    ok('restore-cadastro-servicos exige sessão em produção')
  } else {
    fail('restore-cadastro-servicos sem autenticação')
  }
  const appAuthSrc = fs.readFileSync(path.join(root, 'app/api/auth/appAuth.ts'), 'utf8')
  if (
    appAuthSrc.includes('const SESSION_DAYS = 30') &&
    appAuthSrc.includes("SIGNED_COOKIE_PREFIX = 'v1.'") &&
    appAuthSrc.includes('signSessionBody')
  ) {
    ok('sessão: cookie assinado 30 dias (sobrevive ao deploy)')
  } else {
    fail('appAuth ainda com sessão só em ficheiro / 7 dias')
  }
  const swReg = fs.readFileSync(path.join(root, 'app/RegisterSW.tsx'), 'utf8')
  if (swReg.includes('applyWaitingWorker') && swReg.includes('SW_DISMISSED_UNTIL_LS')) {
    ok('PWA: actualiza em silêncio ao sair do ecrã; DEPOIS vale 24h')
  } else {
    fail('RegisterSW sem auto-apply / dismiss 24h')
  }
  const nmaPull = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nmaPull.includes('nonato-request-login')) {
    ok('login: banner de sessão abre o ecrã de entrar')
  } else {
    fail('NonatoMainApp sem listener nonato-request-login')
  }
  if (nmaPull.includes('pulled.status === \'risk\'') || nmaPull.includes('pulled.status === "risk"')) {
    ok('runAutoServerPull respeita risco grave (não aplica bundle incompleto)')
  } else {
    fail('runAutoServerPull não trata status risk')
  }
} catch (e) {
  fail(`fase 1 estabilidade: ${e.message}`)
}

// 3c) Fase 2 arranque: fotos a pedido + i18n lazy + catálogo lite na UI
try {
  const syncCoord = fs.readFileSync(path.join(root, 'app/modules/biblioteca/syncCoordinator.ts'), 'utf8')
  if (syncCoord.includes('export function shouldDeferPecasBibliotecaImageHydration(): boolean {\n  return true')) {
    ok('fotos da biblioteca não hidratam no arranque')
  } else if (syncCoord.includes('return true') && syncCoord.includes('shouldDeferPecasBibliotecaImageHydration')) {
    ok('fotos da biblioteca não hidratam no arranque')
  } else {
    fail('shouldDeferPecasBibliotecaImageHydration já não adia sempre as fotos')
  }
  const nma2 = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma2.includes('pecasBgRepairPendingRef') && nma2.includes("activeTabType === 'biblioteca-pecas'")) {
    ok('reparo pesado da biblioteca só ao abrir o ecrã')
  } else {
    fail('reparo da biblioteca ainda corre no arranque')
  }
  if (nma2.includes('buildPecasBibliotecaLite(toSave)') || nma2.includes('buildPecasBibliotecaLite(toSave) as')) {
    ok('estado React da biblioteca usa catálogo lite (sem base64)')
  } else {
    fail('setPecasBiblioteca no boot ainda guarda imagens base64')
  }
  if (nma2.includes('ensureTranslationBundle')) {
    ok('idioma extra carrega em chunk à parte')
  } else {
    fail('NonatoMainApp sem ensureTranslationBundle')
  }
  const tr = fs.readFileSync(path.join(root, 'app/translations.ts'), 'utf8')
  if (tr.includes("import ptBR from './i18n/messages/pt-BR.json'") && tr.includes('ensureTranslationBundle')) {
    ok('translations.ts é loader (só pt-BR no bundle inicial)')
  } else {
    fail('translations.ts ainda embute os 6 idiomas')
  }
  for (const lang of ['pt-BR', 'es', 'fr', 'it', 'de', 'en']) {
    if (exists(`app/i18n/messages/${lang}.json`)) ok(`existe i18n ${lang}.json`)
    else fail(`em falta: app/i18n/messages/${lang}.json`)
  }
} catch (e) {
  fail(`fase 2 arranque: ${e.message}`)
}

try {
  const lote = fs.readFileSync(path.join(root, 'app/modules/ui/listaLote.ts'), 'utf8')
  if (lote.includes('export const LISTA_UI_LOTE')) ok('listaUiLote define lote de ecrã')
  else fail('listaUiLote sem LISTA_UI_LOTE')
  const nma3 = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma3.includes('new Set(CLIENTES_ALFABETO_INDICE)') && nma3.includes('letrasAlfabetoParaListaNomes')) {
    ok('lista de clientes arranca com letras retraídas')
  } else {
    fail('clientes A–Z ainda abrem todas as letras no arranque')
  }
  const picker = fs.readFileSync(path.join(root, 'app/components/ClienteAlfabetoPicker.tsx'), 'utf8')
  if (picker.includes('new Set(CLIENTES_ALFABETO_INDICE)') && picker.includes('LISTA_UI_LOTE')) {
    ok('picker de clientes retraído + lote')
  } else {
    fail('ClienteAlfabetoPicker sem lote / letras fechadas')
  }
  if (
    nma3.includes('equipamentosArmazemListaLimite') &&
    nma3.includes('fechamentoOsListaLimite') &&
    nma3.includes('fechamentoDespesasGrupoLimites')
  ) {
    ok('equipamentos e fechamento usam lote de ecrã')
  } else {
    fail('listas de equipamentos/fechamento ainda sem lote')
  }
  if (
    nma3.includes('pecasBibliotecaModalListaLimite') &&
    nma3.includes('relatoriosServicoModalListaLimite') &&
    nma3.includes('pecasAgendaListaLimite')
  ) {
    ok('peças, relatórios e agenda usam lote de ecrã')
  } else {
    fail('modais de peças/relatórios ainda sem lote')
  }
  if (
    nma3.includes('fornecedoresAlfaLetrasRecolhidas') &&
    nma3.includes('osListaLimite') &&
    nma3.includes('faturasPecasListaLimite')
  ) {
    ok('fornecedores A–Z retraídos + OS/faturas em lote')
  } else {
    fail('fornecedores/OS/faturas ainda sem lote')
  }
  if (
    nma3.includes('relatoriosFinanceirosListaLimite') &&
    nma3.includes('pedidosSeparacaoListaLimite') &&
    nma3.includes('fornecedoresModalListaLimite')
  ) {
    ok('relatórios financeiros, pedidos de separação e modal fornecedores em lote')
  } else {
    fail('listas financeiras/separação/fornecedores modal ainda sem lote')
  }
  if (nma3.includes('comprovantesSecoesLimite') && nma3.includes('comprovantesItensLimites')) {
    ok('comprovantes usam lote de ecrã')
  } else {
    fail('lista de comprovantes ainda sem lote')
  }
  if (nma3.includes('POLL_MS = 45_000') && !/runAutoServerPull[\s\S]{0,500}30_000/.test(nma3.slice(nma3.indexOf('const runAutoServerPull')))) {
    ok('sync automático usa um só intervalo de 45s')
  } else {
    fail('ainda existe intervalo de 30s a puxar o servidor')
  }
  const gtp = fs.readFileSync(path.join(root, 'app/components/pessoas/GestoresTecnicosPanel.tsx'), 'utf8')
  if (gtp.includes('LISTA_UI_LOTE') && gtp.includes('gestoresLimite') && gtp.includes('tecnicosLimite')) {
    ok('gestores e técnicos usam lote de ecrã')
  } else {
    fail('GestoresTecnicosPanel ainda renderiza a lista toda')
  }
  if (
    nma3.includes('faturasFornecedorListaLimite') &&
    nma3.includes('faturasGeralFornecedoresLimite') &&
    nma3.includes('estadoVisualTecnicosLimite')
  ) {
    ok('faturas por fornecedor e estado visual usam lote de ecrã')
  } else {
    fail('faturas/estado visual ainda sem lote')
  }
  const ctc = fs.readFileSync(path.join(root, 'app/components/ConhecimentoTecnicosContent.tsx'), 'utf8')
  if (ctc.includes('LISTA_UI_LOTE') && ctc.includes('tecnicosRailLimite') && ctc.includes('conhecimentosListaLimite')) {
    ok('conhecimento técnico usa lote no rail e nos cartões')
  } else {
    fail('ConhecimentoTecnicosContent ainda renderiza a lista toda')
  }
  if (
    nma3.includes('diarioPedidosListaLimite') &&
    nma3.includes('sstListaLimite') &&
    nma3.includes('agendaModalListaLimite') &&
    nma3.includes('pecasDesmontadasListaLimite')
  ) {
    ok('diário, SST, agenda modal e desmontados usam lote de ecrã')
  } else {
    fail('diário/SST/agenda/desmontados ainda sem lote')
  }
  const cfs = fs.readFileSync(path.join(root, 'app/components/ClienteFaturasSection.tsx'), 'utf8')
  if (cfs.includes('LISTA_UI_LOTE') && cfs.includes('faturasListaLimite')) {
    ok('faturas do cliente usam lote de ecrã')
  } else {
    fail('ClienteFaturasSection ainda renderiza a lista toda')
  }
  const rdc = fs.readFileSync(path.join(root, 'app/components/RegistroDespesasContent.tsx'), 'utf8')
  if (rdc.includes('documentosListaLimite') && rdc.includes('relatoriosListaLimite')) {
    ok('registo de despesas usa lote de ecrã')
  } else {
    fail('RegistroDespesasContent ainda renderiza a lista toda')
  }
  const hist = fs.readFileSync(path.join(root, 'app/components/ClienteEquipamentoHistoricoPanel.tsx'), 'utf8')
  if (
    hist.includes('timelineListaLimite') &&
    hist.includes('gruposListaLimite') &&
    hist.includes('orcPendentesLimite') &&
    hist.includes('orcAprovadosLimite') &&
    hist.includes('orcCanceladosLimite') &&
    hist.includes('pecasListaLimites') &&
    hist.includes('pedidosPecasLimites')
  ) {
    ok('histórico do equipamento usa lote de ecrã')
  } else {
    fail('ClienteEquipamentoHistoricoPanel ainda renderiza a lista toda')
  }
  if (
    nma3.includes('protocoloExecListaLimite') &&
    nma3.includes('protocoloArquivoGruposLimite') &&
    nma3.includes('pecasImportadasListaLimite')
  ) {
    ok('protocolos e fila de importação usam lote de ecrã')
  } else {
    fail('protocolos/importação ainda sem lote')
  }
  const ogb = fs.readFileSync(path.join(root, 'app/components/OrcamentosGeradosBrowse.tsx'), 'utf8')
  if (ogb.includes('pastaAguardandoLimite') && ogb.includes('pastaEntregaLimite') && ogb.includes('visiveisListaLimite')) {
    ok('orçamentos gerados usam lote nas pastas e na busca')
  } else {
    fail('OrcamentosGeradosBrowse ainda renderiza as pastas todas')
  }
  const gdc = fs.readFileSync(path.join(root, 'app/components/GestaoDemosContent.tsx'), 'utf8')
  if (gdc.includes('demoNomesLimite') && gdc.includes('LISTA_UI_LOTE')) {
    ok('lista de demonstrações usa lote de ecrã')
  } else {
    fail('GestaoDemosContent ainda renderiza a lista toda')
  }
  const reh = fs.readFileSync(path.join(root, 'app/components/RelatorioEspecialHub.tsx'), 'utf8')
  if (
    reh.includes('listaRelatoriosLimite') &&
    reh.includes('diasListaLimite') &&
    reh.includes('tecnicosListaLimite')
  ) {
    ok('relatório especial usa lote na lista, dias e técnicos')
  } else {
    fail('RelatorioEspecialHub ainda renderiza a lista toda')
  }
  const fge = fs.readFileSync(path.join(root, 'app/components/FamiliasGruposEquipamentosContent.tsx'), 'utf8')
  if (fge.includes('familiasListaLimite') && fge.includes('gruposListaLimite')) {
    ok('famílias/grupos de equipamentos usam lote de ecrã')
  } else {
    fail('FamiliasGruposEquipamentosContent ainda renderiza a lista toda')
  }
  const mic = fs.readFileSync(path.join(root, 'app/components/ManuaisInformacoesContent.tsx'), 'utf8')
  if (
    mic.includes('familiasListaLimite') &&
    mic.includes('gruposNavLimite') &&
    mic.includes('modelosNavLimite') &&
    mic.includes('LISTA_UI_LOTE')
  ) {
    ok('manuais/informações usam lote na árvore (famílias, grupos e modelos)')
  } else {
    fail('ManuaisInformacoesContent ainda renderiza a árvore toda')
  }
  const fgc = fs.readFileSync(path.join(root, 'app/components/FamiliasGruposChecklistContent.tsx'), 'utf8')
  if (
    fgc.includes('familiasListaLimite') &&
    fgc.includes('gruposListaLimite') &&
    fgc.includes('parentesListaLimite') &&
    fgc.includes('servicosListaLimite')
  ) {
    ok('famílias/grupos de checklist usam lote de ecrã')
  } else {
    fail('FamiliasGruposChecklistContent ainda renderiza a lista toda')
  }
  if (nma3.includes('ProtocoloArquivoNav') && nma3.includes('gruposProtocolosArquivo.slice(0, protocoloArquivoGruposLimite)')) {
    ok('pílulas do arquivo de protocolos usam lote de ecrã')
  } else {
    fail('pílulas do arquivo de protocolos ainda pintam todos os clientes')
  }
  const poa = fs.readFileSync(path.join(root, 'app/components/PedidoOrcamentosAvulsoContent.tsx'), 'utf8')
  if (poa.includes('historicoListaLimite') && poa.includes('pecasBuscaLimite')) {
    ok('pedido avulso usa lote no histórico e na busca de peças')
  } else {
    fail('PedidoOrcamentosAvulsoContent ainda renderiza o histórico todo')
  }
  const pcc = fs.readFileSync(path.join(root, 'app/components/PagamentosContadorContent.tsx'), 'utf8')
  if (pcc.includes('pagamentosListaLimite') && pcc.includes('LISTA_UI_LOTE')) {
    ok('pagamentos ao contabilista usam lote de ecrã')
  } else {
    fail('PagamentosContadorContent ainda renderiza a lista toda')
  }
  const cof = fs.readFileSync(path.join(root, 'app/components/ClienteOrcamentosFichaSection.tsx'), 'utf8')
  const cop = fs.readFileSync(path.join(root, 'app/components/ClienteEquipamentoOrcamentosPanel.tsx'), 'utf8')
  if (cof.includes('itensListaLimite') && cop.includes('itensListaLimite')) {
    ok('orçamentos do cliente/equipamento usam lote de ecrã')
  } else {
    fail('fichas de orçamento do cliente ainda pintam a lista toda')
  }
  const csc = fs.readFileSync(path.join(root, 'app/components/CadastroServicosContent.tsx'), 'utf8')
  if (csc.includes('itensListaLimite') && csc.includes('listarGruposLimite') && csc.includes('matrizLinhasLimite')) {
    ok('cadastro de serviços usa lote na tabela, matriz e lista')
  } else {
    fail('CadastroServicosContent ainda renderiza as tabelas todas')
  }
  if (
    nma3.includes('alertaGestoresLimite') &&
    nma3.includes('alertaTecnicosInternosLimite') &&
    nma3.includes('alertaTecnicosExternosLimite')
  ) {
    ok('alerta de mensagens (gestores/técnicos) usa lote de ecrã')
  } else {
    fail('cartões de alerta ainda pintam gestores/técnicos todos')
  }
  const aus = fs.readFileSync(path.join(root, 'app/components/admin/AdminUsersSection.tsx'), 'utf8')
  const aps = fs.readFileSync(path.join(root, 'app/components/admin/AdminPasswordsSection.tsx'), 'utf8')
  if (aus.includes('usersListaLimite') && aps.includes('passwordsListaLimite')) {
    ok('administração de utilizadores e senhas usa lote de ecrã')
  } else {
    fail('AdminUsers/Passwords ainda renderizam a lista toda')
  }
  const cdv = fs.readFileSync(path.join(root, 'app/components/ClienteDetalheView.tsx'), 'utf8')
  if (cdv.includes('equipamentosListaLimite') && cdv.includes('LISTA_UI_LOTE')) {
    ok('grelha de equipamentos do cliente usa lote de ecrã')
  } else {
    fail('ClienteDetalheView ainda pinta todos os equipamentos')
  }
  const eam = fs.readFileSync(path.join(root, 'app/components/EquipamentosArmazemMenu.tsx'), 'utf8')
  if (eam.includes('familiasListaLimite') && eam.includes('LISTA_UI_LOTE')) {
    ok('menu de famílias do armazém usa lote de ecrã')
  } else {
    fail('EquipamentosArmazemMenu ainda pinta todas as famílias')
  }
  const cbc = fs.readFileSync(path.join(root, 'app/components/ChecklistBasicoContent.tsx'), 'utf8')
  if (cbc.includes('gruposListaLimite') && cbc.includes('itensListaLimites')) {
    ok('checklist básico usa lote nos grupos e situações')
  } else {
    fail('ChecklistBasicoContent ainda pinta todos os grupos/itens')
  }
  const ost = fs.readFileSync(path.join(root, 'app/components/OrcamentoServicoTecnicoContent.tsx'), 'utf8')
  if (ost.includes('propostasListaLimite') && ost.includes('servicosListaLimite')) {
    ok('orçamento de serviço técnico usa lote nas propostas e serviços')
  } else {
    fail('OrcamentoServicoTecnicoContent ainda pinta propostas/serviços todos')
  }
  const gal = fs.readFileSync(path.join(root, 'app/components/BibliotecaPecasGaleriaCategorias.tsx'), 'utf8')
  if (gal.includes('categoriasListaLimite') && gal.includes('limiteBusca')) {
    ok('galeria de peças usa lote nas categorias e na busca')
  } else {
    fail('BibliotecaPecasGaleriaCategorias ainda pinta categorias/busca todas')
  }
  if (nma3.includes('translatorLibraryListaLimite')) {
    ok('biblioteca do tradutor usa lote de ecrã')
  } else {
    fail('tradutor ainda pinta todas as entradas')
  }
  const alh = fs.readFileSync(path.join(root, 'app/components/admin/AdminLogosHub.tsx'), 'utf8')
  const apl = fs.readFileSync(path.join(root, 'app/components/admin/AdminPdfLogosBySituation.tsx'), 'utf8')
  if (alh.includes('logosListaLimite') && apl.includes('logosListaLimite')) {
    ok('biblioteca de logos usa lote de ecrã')
  } else {
    fail('Admin logos ainda pintam todas as imagens')
  }
  const ope = fs.readFileSync(path.join(root, 'app/components/OrcamentoPecasEspeciaisContent.tsx'), 'utf8')
  if (ope.includes('salvosListaLimite') && ope.includes('LISTA_UI_LOTE')) {
    ok('orçamentos de peças especiais gravados usam lote de ecrã')
  } else {
    fail('OrcamentoPecasEspeciaisContent ainda pinta todos os gravados')
  }
  const tsExtra = require('typescript')
  for (const rel of [
    'app/components/PedidoOrcamentosAvulsoContent.tsx',
    'app/components/PagamentosContadorContent.tsx',
    'app/components/ClienteOrcamentosFichaSection.tsx',
    'app/components/ClienteEquipamentoOrcamentosPanel.tsx',
    'app/components/CadastroServicosContent.tsx',
    'app/components/CadastroPecasStockContent.tsx',
    'app/components/FamiliasGruposChecklistContent.tsx',
    'app/components/ManuaisInformacoesContent.tsx',
    'app/components/admin/AdminUsersSection.tsx',
    'app/components/admin/AdminPasswordsSection.tsx',
    'app/components/ClienteDetalheView.tsx',
    'app/components/EquipamentosArmazemMenu.tsx',
    'app/components/ChecklistBasicoContent.tsx',
    'app/components/OrcamentoServicoTecnicoContent.tsx',
    'app/components/BibliotecaPecasGaleriaCategorias.tsx',
    'app/components/admin/AdminLogosHub.tsx',
    'app/components/admin/AdminPdfLogosBySituation.tsx',
    'app/components/RelatorioEspecialHub.tsx',
    'app/components/OrcamentoPecasEspeciaisContent.tsx',
    'app/components/ClienteEquipamentoHistoricoPanel.tsx',
    'app/components/RegistroDespesasContent.tsx',
    'app/components/InstallPrompt.tsx',
  ]) {
    const extraSrc = fs.readFileSync(path.join(root, rel), 'utf8')
    const extraParsed = tsExtra.transpileModule(extraSrc, {
      fileName: rel,
      reportDiagnostics: true,
      compilerOptions: { jsx: tsExtra.JsxEmit.Preserve, target: tsExtra.ScriptTarget.ES2020 },
    })
    const extraErrs = (extraParsed.diagnostics || []).filter((d) => d.category === tsExtra.DiagnosticCategory.Error)
    if (extraErrs.length === 0) ok(`${path.basename(rel)} sem erro de sintaxe`)
    else fail(`${rel} com erro de sintaxe JSX`)
  }
} catch (e) {
  fail(`fase 3 listas: ${e.message}`)
}

// 4) i18n
const i18n = spawnSync('node', ['scripts/check-i18n-keys.mjs'], {
  cwd: root,
  encoding: 'utf8',
  shell: true,
})
if (i18n.status === 0) ok('i18n:check — chaves alinhadas')
else fail(`i18n:check falhou\n${i18n.stdout || ''}${i18n.stderr || ''}`)

// 4b) Fase 4 — executar guardas de gravar/sync (não só ler o código)
const fase4 = spawnSync('node', ['scripts/runtime-fase4.mjs'], {
  cwd: root,
  encoding: 'utf8',
  shell: true,
})
if (fase4.status === 0) ok('runtime-fase4 — guardas de gravar/sync executadas')
else fail(`runtime-fase4 falhou\n${fase4.stdout || ''}${fase4.stderr || ''}`)

console.log('')
if (failed > 0) {
  console.error(`[smoke:critico] FALHOU — ${failed} problema(s). Não publique até corrigir.\n`)
  process.exit(1)
}
console.log('[smoke:critico] OK — pode seguir para teste manual curto (Admin → Checklist de confiança).\n')
process.exit(0)
