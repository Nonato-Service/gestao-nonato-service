#!/usr/bin/env node
/**
 * Recupera pedidos avulsos de:
 *  - data/nonato-offline-server-snapshot.json
 *  - backups/json/backup-dados-*.json (campo nonato-offline-server-snapshot)
 *
 * Grava:
 *  - data/nonato-pedidos-orcamento-avulso.json
 *  - data/nonato-orcamentos-avulso.json (recria entradas em falta)
 *
 * Uso: node scripts/recuperar-pedidos-avulsos.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const dataDir = path.join(root, 'data')
const backupsDir = path.join(root, 'backups', 'json')

const PEDIDOS_KEY = 'nonato-pedidos-orcamento-avulso'
const ORCAMENTOS_KEY = 'nonato-orcamentos-avulso'
const SNAPSHOT_KEY = 'nonato-offline-server-snapshot'

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (e) {
    console.warn('[recuperar] JSON inválido:', filePath, e.message)
    return null
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

function normalizarPedido(p) {
  if (!p || typeof p !== 'object') return p
  if (p.equipamentosBlocos && p.equipamentosBlocos.length > 0) return p
  return {
    ...p,
    equipamentosBlocos: [
      {
        id: 'bloco-legado-' + (p.codigo || Date.now()),
        equipamento: null,
        equipamentoManual: p.equipamentoTexto || '',
        pecas: Array.isArray(p.pecas) ? [...p.pecas] : [],
      },
    ],
  }
}

function mergePedidos(listas) {
  const map = new Map()
  for (const lista of listas) {
    for (const raw of lista) {
      const p = normalizarPedido(raw)
      if (!p?.codigo) continue
      const prev = map.get(p.codigo)
      const tPrev = prev ? new Date(prev.geradoEm || prev.dataGeracao || 0).getTime() : 0
      const tNew = new Date(p.geradoEm || p.dataGeracao || 0).getTime()
      if (!prev || tNew >= tPrev) map.set(p.codigo, p)
    }
  }
  return [...map.values()].sort(
    (a, b) =>
      new Date(b.dataGeracao || b.geradoEm || 0).getTime() -
      new Date(a.dataGeracao || a.geradoEm || 0).getTime()
  )
}

function extrairPedidosDeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return []
  const ped = snapshot[PEDIDOS_KEY]
  return Array.isArray(ped) ? ped : []
}

function coletarFontesPedidos() {
  const fontes = []

  const snapshotPath = path.join(dataDir, `${SNAPSHOT_KEY}.json`)
  const snapshot = readJson(snapshotPath)
  const snapPed = extrairPedidosDeSnapshot(snapshot)
  if (snapPed.length) fontes.push({ nome: 'snapshot local', pedidos: snapPed })

  const pedidosPath = path.join(dataDir, `${PEDIDOS_KEY}.json`)
  const pedidosAtuais = readJson(pedidosPath)
  if (Array.isArray(pedidosAtuais) && pedidosAtuais.length) {
    fontes.push({ nome: 'ficheiro data actual', pedidos: pedidosAtuais })
  }

  if (fs.existsSync(backupsDir)) {
    const backups = fs
      .readdirSync(backupsDir)
      .filter((f) => f.startsWith('backup-dados-') && f.endsWith('.json'))
      .map((f) => ({ f, m: fs.statSync(path.join(backupsDir, f)).mtimeMs }))
      .sort((a, b) => b.m - a.m)
    for (const { f } of backups) {
      const j = readJson(path.join(backupsDir, f))
      if (!j?.data) continue
      const nested = j.data[SNAPSHOT_KEY]
      const ped = extrairPedidosDeSnapshot(nested)
      if (ped.length) fontes.push({ nome: `backup ${f}`, pedidos: ped })
    }
  }

  return fontes
}

function pecasTotaisPedido(pedido) {
  if (Array.isArray(pedido.pecas) && pedido.pecas.length) return pedido.pecas
  return (pedido.equipamentosBlocos || []).flatMap((b) => b.pecas || [])
}

function orcamentoFromPedido(pedido) {
  const pecas = pecasTotaisPedido(pedido)
  const codigo = pedido.codigo
  return {
    id: 'avulso-' + codigo,
    numeroOrcamento: codigo,
    data: (pedido.dataGeracao || new Date().toISOString()).split('T')[0],
    validade: '',
    descricao: pedido.equipamentoTexto || '',
    observacoes: '',
    tipo: 'pedido-avulso',
    status: pedido.status || 'pendente',
    clienteId: pedido.clienteId,
    clienteNome: pedido.clienteNomeReal,
    emitirComoCliente: pedido.emitirComoCliente || 'cliente',
    equipamentoChave: pedido.equipamentoChave,
    equipamentoNumeroSerie: pedido.equipamentoNumeroSerie,
    equipamentosBlocos: pedido.equipamentosBlocos,
    geradoEm: pedido.geradoEm || pedido.dataGeracao,
    itens: pecas.map((p) => ({
      descricao: p.nome,
      quantidade: p.quantidade || 1,
      precoUnitario: 0,
      total: 0,
      codigo: p.codigo,
      tipoItem: 'sem-valor',
      iva: 0,
      pecaId: p.pecaId,
      imagem: p.imagem,
    })),
    total: 0,
    totalSemIva: 0,
    totalIva: 0,
    dataCriacao: pedido.geradoEm || pedido.dataGeracao || new Date().toISOString(),
  }
}

function mergeOrcamentos(existentes, pedidos) {
  const map = new Map()
  for (const o of existentes) {
    if (o?.id) map.set(o.id, o)
  }
  for (const ped of pedidos) {
    const id = 'avulso-' + ped.codigo
    if (!map.has(id)) {
      map.set(id, orcamentoFromPedido(ped))
    }
  }
  return [...map.values()].sort(
    (a, b) =>
      new Date(b.dataCriacao || b.geradoEm || 0).getTime() -
      new Date(a.dataCriacao || a.geradoEm || 0).getTime()
  )
}

function bumpSyncMeta() {
  const metaPath = path.join(dataDir, '_sync-meta.json')
  let revision = 0
  const cur = readJson(metaPath)
  if (cur && typeof cur.revision === 'number') revision = cur.revision
  const next = { revision: revision + 1, updatedAt: new Date().toISOString() }
  writeJson(metaPath, next)
  return next
}

function main() {
  console.log('[recuperar] A procurar pedidos avulsos…')
  const fontes = coletarFontesPedidos()
  if (!fontes.length) {
    console.log('[recuperar] Nenhuma fonte com pedidos encontrada.')
    process.exit(1)
  }

  for (const f of fontes) {
    console.log(`  • ${f.nome}: ${f.pedidos.length} pedido(s)`)
  }

  const pedidos = mergePedidos(fontes.map((f) => f.pedidos))
  console.log(`[recuperar] Total único: ${pedidos.length} pedido(s)`)
  for (const p of pedidos) {
    const nPecas = pecasTotaisPedido(p).length
    console.log(`  - ${p.codigo} | ${p.clienteNomeReal} | ${nPecas} peça(s)`)
  }

  const pedidosPath = path.join(dataDir, `${PEDIDOS_KEY}.json`)
  const orcamentosPath = path.join(dataDir, `${ORCAMENTOS_KEY}.json`)
  const orcamentosAtuais = readJson(orcamentosPath)
  const orcamentosExistentes = Array.isArray(orcamentosAtuais) ? orcamentosAtuais : []
  const orcamentos = mergeOrcamentos(orcamentosExistentes, pedidos)

  writeJson(pedidosPath, pedidos)
  writeJson(orcamentosPath, orcamentos)
  const meta = bumpSyncMeta()

  console.log(`[recuperar] Gravado: ${pedidosPath}`)
  console.log(`[recuperar] Gravado: ${orcamentosPath} (${orcamentos.length} orçamento(s))`)
  console.log(`[recuperar] Sync meta revision: ${meta.revision}`)
  console.log('[recuperar] Concluído. Reinicie o servidor ou clique Actualizar no histórico.')
}

main()
