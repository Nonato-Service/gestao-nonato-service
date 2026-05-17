#!/usr/bin/env node
/**
 * Restaura o Cadastro de Serviços a partir de data/nonato-servicos.json no disco
 * e envia para o servidor (se estiver a correr).
 *
 * Uso: node scripts/restaurar-cadastro-servicos.mjs
 *      npm run restaurar:cadastro
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const dataDir = path.join(root, 'data')
const servicosPath = path.join(dataDir, 'nonato-servicos.json')
const gruposPath = path.join(dataDir, 'nonato-servicos-grupos.json')
const DEFAULT_GRUPO_ID = 'servico-grupo-geral'
const port = process.env.PORT || 3000
const baseUrl = process.env.NONATO_RESTORE_URL || `http://127.0.0.1:${port}`

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch (e) {
    console.error(`Erro a ler ${filePath}:`, e.message)
    return fallback
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf-8')
}

function bumpSyncMeta() {
  const metaPath = path.join(dataDir, '_sync-meta.json')
  let revision = 0
  if (fs.existsSync(metaPath)) {
    try {
      const m = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
      revision = typeof m.revision === 'number' ? m.revision : 0
    } catch {
      /* ignorar */
    }
  }
  const next = { revision: revision + 1, updatedAt: new Date().toISOString() }
  fs.writeFileSync(metaPath, JSON.stringify(next, null, 2) + '\n', 'utf-8')
  return next
}

async function postSave(key, value) {
  const res = await fetch(`${baseUrl}/api/data/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value }),
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} ${t.slice(0, 200)}`)
  }
  return res.json()
}

async function main() {
  let servicos = readJson(servicosPath, null)
  if (!Array.isArray(servicos) || servicos.length === 0) {
    console.error('')
    console.error('❌ data/nonato-servicos.json está vazio ou não existe.')
    console.error('   Se tiver cópia noutro sítio, coloque o ficheiro em data/ e volte a correr este script.')
    console.error('')
    process.exit(1)
  }

  let grupos = readJson(gruposPath, null)
  if (!Array.isArray(grupos) || grupos.length === 0) {
    grupos = [{ id: DEFAULT_GRUPO_ID, nome: 'Geral', ordem: 0 }]
    console.log('ℹ️  Criado grupo padrão «Geral» (nonato-servicos-grupos.json).')
  }

  const grupoId = grupos[0]?.id || DEFAULT_GRUPO_ID
  servicos = servicos.map((s, i) => ({
    ...s,
    grupoId: typeof s.grupoId === 'string' && s.grupoId ? s.grupoId : grupoId,
    valor: typeof s.valor === 'number' ? s.valor : parseFloat(String(s.valor ?? '0').replace(',', '.')) || 0,
  }))

  writeJson(servicosPath, servicos)
  writeJson(gruposPath, grupos)
  const meta = bumpSyncMeta()

  console.log('')
  console.log('✅ Gravado no disco:')
  console.log(`   • ${servicos.length} serviço(s) em data/nonato-servicos.json`)
  console.log(`   • ${grupos.length} grupo(s) em data/nonato-servicos-grupos.json`)
  console.log(`   • Revisão sync: ${meta.revision}`)
  console.log('')
  for (const s of servicos) {
    const cod = (s.cod || '').trim() || '—'
    console.log(`   - ${cod}: ${s.nome} → ${s.valor} € (${s.tipoCobranca})`)
  }

  let apiOk = false
  try {
    await postSave('nonato-servicos-grupos', grupos)
    await postSave('nonato-servicos', servicos)
    apiOk = true
    console.log('')
    console.log(`✅ Enviado para o servidor em ${baseUrl}`)
  } catch (e) {
    console.log('')
    console.log(`⚠️  Servidor não respondeu (${e.message}).`)
    console.log('   Os ficheiros em data/ já estão corrigidos.')
    console.log('   Inicie o programa (npm run dev) e volte a correr: npm run restaurar:cadastro')
  }

  console.log('')
  console.log('📱 No browser:')
  console.log('   1. Abra o programa e faça F5 (atualizar página).')
  if (apiOk) {
    console.log('   2. Menu Admin → use «Atualizar deste aparelho com o servidor» SE ainda não aparecer o cadastro.')
  } else {
    console.log('   2. Com o servidor a correr, execute outra vez: npm run restaurar:cadastro')
  }
  console.log('   3. Abra «Cadastro de Serviços / Valores» — deve listar HTT, HTV, KRC, etc.')
  console.log('')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
