/**
 * Fase 4 — testes reais (não só leitura de código):
 * 1) assessServerCadastroWrite bloqueia wipe/encolhimento de cadastro
 * 2) assessPullServerRisk não trata chave ausente (bootstrap) como lista vazia
 * 3) GET /api/health se o servidor local estiver a correr (só leitura)
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import { createRequire } from 'module'
import { pathToFileURL } from 'url'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

let failed = 0
function ok(msg) {
  console.log(`  ✓ ${msg}`)
}
function fail(msg) {
  failed += 1
  console.error(`  ✗ ${msg}`)
}

function expect(cond, msg) {
  if (cond) ok(msg)
  else fail(msg)
}

function transpileGuardModules() {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nonato-fase4-'))
  const files = [
    'app/lib/criticalCadastroKeys.ts',
    'app/lib/cadastroShrinkPolicy.ts',
    'app/lib/serverCadastroGuard.ts',
    'app/utils/syncRisk.ts',
  ]
  const compilerOptions = {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
    esModuleInterop: true,
    skipLibCheck: true,
    isolatedModules: true,
  }
  for (const rel of files) {
    const src = fs.readFileSync(path.join(root, rel), 'utf8')
    let { outputText } = ts.transpileModule(src, { compilerOptions, fileName: rel })
    outputText = outputText.replace(/from\s+['"]([^'"]+)['"]/g, (full, spec) => {
      if (!spec.startsWith('.')) return full
      if (/\.(js|mjs|cjs|json)$/.test(spec)) return full
      return `from '${spec}.js'`
    })
    const dest = path.join(outDir, rel.replace(/^app\//, '').replace(/\.ts$/, '.js'))
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, outputText, 'utf8')
  }
  fs.writeFileSync(
    path.join(outDir, 'utils', 'syncDiff.js'),
    'export const SYNC_KEY_LABELS = {};\n',
    'utf8'
  )
  return outDir
}

async function testCadastroWriteGuard(outDir) {
  console.log('\n[runtime-fase4] Guarda de gravação no disco')
  const mod = await import(pathToFileURL(path.join(outDir, 'lib', 'serverCadastroGuard.js')).href)
  const { assessServerCadastroWrite } = mod
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nonato-fase4-data-'))
  const clientes = path.join(dir, 'nonato-clientes.json')
  const orcamentos = path.join(dir, 'nonato-orcamentos-avulso.json')
  const fechamentos = path.join(dir, 'nonato-fechamentos-relatorios.json')
  const tomb = path.join(dir, 'nonato-relatorios-especiais-deleted-ids.json')

  fs.writeFileSync(clientes, JSON.stringify([{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }]), 'utf8')
  const empty = assessServerCadastroWrite('nonato-clientes', [], clientes)
  expect(empty.allowed === false && empty.reason === 'empty_overwrite', 'clientes: [] sobre lista existente é bloqueado')

  const shrink = assessServerCadastroWrite('nonato-clientes', [{ id: 'c1' }], clientes)
  expect(shrink.allowed === false && shrink.reason === 'shrink_overwrite', 'clientes: lista menor sem política de shrink é bloqueada')

  const grow = assessServerCadastroWrite(
    'nonato-clientes',
    [{ id: 'c1' }, { id: 'c2' }, { id: 'c3' }, { id: 'c4' }],
    clientes
  )
  expect(grow.allowed === true, 'clientes: crescer a lista é permitido')

  const missingFile = path.join(dir, 'nao-existe-ainda.json')
  const firstWrite = assessServerCadastroWrite('nonato-clientes', [{ id: 'novo' }], missingFile)
  expect(firstWrite.allowed === true, 'clientes: primeira gravação (ficheiro novo) é permitida')

  fs.writeFileSync(
    orcamentos,
    JSON.stringify([{ id: 'o1' }, { id: 'o2' }, { id: 'o3' }]),
    'utf8'
  )
  const orcSubset = assessServerCadastroWrite(
    'nonato-orcamentos-avulso',
    [{ id: 'o1' }, { id: 'o3' }],
    orcamentos
  )
  expect(orcSubset.allowed === true, 'orçamentos avulso: excluir itens com IDs conhecidos é permitido')

  const orcWipe = assessServerCadastroWrite('nonato-orcamentos-avulso', [], orcamentos)
  expect(orcWipe.allowed === false && orcWipe.reason === 'empty_overwrite', 'orçamentos avulso: wipe [] continua bloqueado')

  const orcStrange = assessServerCadastroWrite(
    'nonato-orcamentos-avulso',
    [{ id: 'outro' }],
    orcamentos
  )
  expect(orcStrange.allowed === false, 'orçamentos avulso: substituir por IDs novos (não subset) é bloqueado')

  fs.writeFileSync(fechamentos, JSON.stringify({ a: 1, b: 2 }), 'utf8')
  const objEmpty = assessServerCadastroWrite('nonato-fechamentos-relatorios', {}, fechamentos)
  expect(
    objEmpty.allowed === false && objEmpty.reason === 'object_empty_overwrite',
    'fechamentos: {} sobre mapa existente é bloqueado'
  )
  const objShrink = assessServerCadastroWrite('nonato-fechamentos-relatorios', { a: 1 }, fechamentos)
  expect(
    objShrink.allowed === false && objShrink.reason === 'object_shrink_overwrite',
    'fechamentos: mapa com menos chaves é bloqueado'
  )

  fs.writeFileSync(tomb, JSON.stringify(['id-a', 'id-b', 'id-c']), 'utf8')
  const tombShrink = assessServerCadastroWrite('nonato-relatorios-especiais-deleted-ids', ['id-a'], tomb)
  expect(tombShrink.allowed === false && tombShrink.reason === 'tombstone_shrink', 'tombstones: lista menor é bloqueada')
  const tombGrow = assessServerCadastroWrite(
    'nonato-relatorios-especiais-deleted-ids',
    ['id-a', 'id-b', 'id-c', 'id-d'],
    tomb
  )
  expect(tombGrow.allowed === true, 'tombstones: união (crescer) é permitida')

  try {
    fs.rmSync(dir, { recursive: true, force: true })
  } catch {
    /* temp */
  }
}

async function testPullRisk(outDir) {
  console.log('\n[runtime-fase4] Risco do sync automático')
  const { assessPullServerRisk } = await import(pathToFileURL(path.join(outDir, 'utils', 'syncRisk.js')).href)

  const local = {
    'nonato-clientes': [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }, { id: '5' }],
    'nonato-pecas-biblioteca': Array.from({ length: 20 }, (_, i) => ({ id: `p${i}` })),
  }

  const bootstrap = assessPullServerRisk(
    { 'nonato-clientes': local['nonato-clientes'] },
    local
  )
  expect(
    bootstrap.severity === 'none',
    'bootstrap sem peças (chave undefined) não é tratado como servidor vazio'
  )

  const emptyServer = assessPullServerRisk({ 'nonato-clientes': [] }, local)
  expect(emptyServer.severity === 'severe', 'servidor com 0 clientes vs aparelho com 5 = risco grave')

  const same = assessPullServerRisk(
    { 'nonato-clientes': local['nonato-clientes'], 'nonato-pecas-biblioteca': local['nonato-pecas-biblioteca'] },
    local
  )
  expect(same.severity === 'none', 'servidor igual ao aparelho = sem risco')

  const half = assessPullServerRisk(
    { 'nonato-clientes': [{ id: '1' }, { id: '2' }] },
    local
  )
  expect(half.severity === 'severe', 'servidor com metade dos clientes e IDs só locais = risco grave')
}

async function testLocalHealthIfUp() {
  console.log('\n[runtime-fase4] HTTP local (só leitura, opcional)')
  const urls = ['http://127.0.0.1:3000/api/health', 'http://localhost:3000/api/health']
  let reached = false
  for (const url of urls) {
    try {
      const ac = new AbortController()
      const t = setTimeout(() => ac.abort(), 2500)
      const res = await fetch(url, { signal: ac.signal, headers: { Accept: 'application/json' } })
      clearTimeout(t)
      if (!res.ok) {
        fail(`health ${url} respondeu ${res.status}`)
        reached = true
        break
      }
      const body = await res.json()
      expect(body?.ok === true && body?.alive === true, `GET ${url} devolve ok/alive`)
      if (typeof body?.appVersion === 'number') {
        ok(`servidor local reporta PWA v${body.appVersion}`)
      }
      reached = true
      break
    } catch {
      /* tentar próximo */
    }
  }
  if (!reached) {
    ok('servidor local :3000 não está a correr — HTTP saltado (guardas já executadas)')
  }
}

async function main() {
  console.log('\n[runtime-fase4] Testes reais de gravar / sync / health\n')
  const outDir = transpileGuardModules()
  try {
    await testCadastroWriteGuard(outDir)
    await testPullRisk(outDir)
    await testLocalHealthIfUp()
  } finally {
    try {
      fs.rmSync(outDir, { recursive: true, force: true })
    } catch {
      /* temp */
    }
  }
  console.log('')
  if (failed > 0) {
    console.error(`[runtime-fase4] FALHOU — ${failed} problema(s).\n`)
    process.exit(1)
  }
  console.log('[runtime-fase4] OK — guardas de dados executadas.\n')
  process.exit(0)
}

main().catch((err) => {
  console.error(`[runtime-fase4] erro: ${err?.stack || err}`)
  process.exit(1)
})
