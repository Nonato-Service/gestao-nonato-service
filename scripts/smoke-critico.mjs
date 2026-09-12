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

// 2b) Formato monetário único (14.087,50 €)
try {
  const money = fs.readFileSync(path.join(root, 'app/lib/formatMoney.ts'), 'utf8')
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
  if (nma.includes("from './lib/formatMoney'") && nma.includes('formatMoneyEUR(fechTotIva')) {
    ok('NonatoMainApp usa formatMoneyEUR nos totais de fechamento')
  } else {
    fail('NonatoMainApp sem formatMoneyEUR no fechamento')
  }
  if (servicoValor.includes('formatMoneyNumber') && servicoValor.includes('parseMoneyInput')) {
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
  if (
    idx.includes('buildItensFechamentoParaExibirFromSalvos') &&
    idx.includes('filtrarOpcoesServicoLinhaFechamento') &&
    idx.includes('resolverQuantidadeLinhaFechamentoExibir')
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
  if (
    nma.includes('lerOrcamentoAvulsoRascunhoSession() || rascunho') &&
    nma.includes('gravarTipoOrcamentoSessionSync')
  ) {
    ok('Orçamentos: tipo sobrevive a remount via sessionStorage')
  } else {
    fail('Orçamentos: falta persistência sync do tipo (regressão do seletor TIPO DE ORÇAMENTO)')
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
    idx.includes('imprimirRelatorioEspecialPdf') &&
    idx.includes('defaultRelatorioEspecialPdfSecoes') &&
    idx.includes('normalizeRelatorioEspecialPdfSecoes') &&
    idx.includes('temAlgumaSecaoPdfEspecial') &&
    idx.includes('diaContaComoDiariaEspecial') &&
    idx.includes('dedupeRelatoriosEspeciais') &&
    idx.includes('upsertRelatorioEspecialNaLista')
  ) {
    ok('módulo relatorios-especiais exporta cálculos/fechamento/PDF')
  } else {
    fail('módulo relatorios-especiais incompleto (index.ts)')
  }
  const hub = fs.readFileSync(path.join(root, 'app/components/RelatorioEspecialHub.tsx'), 'utf8')
  const pdfMod = fs.readFileSync(path.join(root, 'app/modules/relatorios-especiais/pdf.ts'), 'utf8')
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
    hub.includes('labelEquipamentoCurto(eqLabel, ei, labelOptsCadastro)')
  ) {
    ok('RelatorioEspecialHub: select Hora trabalhada enriquece série do cadastro')
  } else {
    fail('RelatorioEspecialHub select Hora trabalhada sem enrich de série do cadastro')
  }
  {
    const relEq = fs.readFileSync(path.join(root, 'app/modules/equipamentos/relatorio.ts'), 'utf8')
    if (
      relEq.includes('preferirEquipamentoClienteComSerie') &&
      relEq.includes('encontrarEquipamentoClientePorRefRelatorio') &&
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
  {
    const mergeUtils = fs.readFileSync(path.join(root, 'app/lib/clienteMergeUtils.ts'), 'utf8')
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
    !nma.includes('type User = {') &&
    nma.includes('createUserFromForm') &&
    nma.includes('updateUserFromForm')
  ) {
    ok('NonatoMainApp usa User + fromForm do módulo admin')
  } else {
    fail('NonatoMainApp ainda define User localmente ou não usa create/updateUserFromForm')
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
  if (
    adminTypes.includes("from '../../modules/admin/userTipos'") ||
    adminTypes.includes('from "../../modules/admin/userTipos"')
  ) {
    ok('adminTypes re-exporta User do módulo admin')
  } else {
    fail('adminTypes não re-exporta User do módulo admin')
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
    (mergeSrc.includes("from '../modules/manuais'") || mergeSrc.includes('from "../modules/manuais"')) &&
    mergeSrc.includes('normalizeBibliaImport')
  ) {
    ok('conhecimentoTecnicoMerge usa Bíblia do módulo manuais')
  } else {
    fail('conhecimentoTecnicoMerge ainda importa bibliaNonatoTypes do componente')
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
  if (
    idx.includes('emptyDemoRecipientForm') &&
    idx.includes('defaultDemoModulesForActions') &&
    exists('app/modules/demo/formState.ts')
  ) {
    ok('módulo demo exporta formState do destinatário')
  } else {
    fail('módulo demo sem formState do destinatário')
  }
  if (
    libDemo.includes('emptyDemoRecipientForm') &&
    libDemo.includes('defaultDemoModulesForActions') &&
    gestao.includes('emptyDemoRecipientForm')
  ) {
    ok('demoManagement/GestaoDemos usam formState do módulo demo')
  } else {
    fail('createDefaultDemoLinkForm ainda monta o form vazio no sítio')
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
    idx.includes('createDespesaDocumentoFromForm')
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
    !rdcMod.includes('export type CartaoEmpresaDespesas = {')
  ) {
    ok('RegistroDespesasContent usa tipos/fromForm do módulo registro-despesas')
  } else {
    fail('RegistroDespesasContent ainda define cartão/despesa/documento no sítio')
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
  const lote = fs.readFileSync(path.join(root, 'app/lib/listaUiLote.ts'), 'utf8')
  if (lote.includes('export const LISTA_UI_LOTE')) ok('listaUiLote define lote de ecrã')
  else fail('listaUiLote sem LISTA_UI_LOTE')
  const nma3 = fs.readFileSync(path.join(root, 'app/NonatoMainApp.tsx'), 'utf8')
  if (nma3.includes('new Set(CLIENTES_ALFABETO_INDICE)')) {
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
  if (nma3.includes('proto-arquivo-nav') && nma3.includes('gruposProtocolosArquivo.slice(0, protocoloArquivoGruposLimite)')) {
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
