import fs from 'fs'
import path from 'path'
import { DATA_DIR } from '../api/data/shared'

export const PEDIDOS_AVULSO_KEY = 'nonato-pedidos-orcamento-avulso'
export const ORCAMENTOS_AVULSO_KEY = 'nonato-orcamentos-avulso'
const SNAPSHOT_KEY = 'nonato-offline-server-snapshot'

export type PedidoAvulsoRecuperado = {
  codigo: string
  dataGeracao: string
  clienteNomeReal: string
  clienteId?: string
  emitirComoCliente?: 'cliente' | 'nonato-service'
  equipamentoTexto?: string
  equipamentoChave?: string
  equipamentoNumeroSerie?: string
  pecas?: Array<{
    id: string
    codigo: string
    nome: string
    imagem?: string
    quantidade: number
    pecaId?: string
  }>
  equipamentosBlocos?: Array<{
    id: string
    equipamento: unknown
    equipamentoManual: string
    pecas: PedidoAvulsoRecuperado['pecas']
  }>
  status?: string
  geradoEm?: string
}

function readJson(filePath: string): unknown {
  if (!fs.existsSync(filePath)) return null
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch {
    return null
  }
}

function writeJson(filePath: string, value: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

function normalizarPedido(p: PedidoAvulsoRecuperado): PedidoAvulsoRecuperado {
  if (p.equipamentosBlocos && p.equipamentosBlocos.length > 0) return p
  return {
    ...p,
    equipamentosBlocos: [
      {
        id: 'bloco-legado-' + p.codigo,
        equipamento: null,
        equipamentoManual: p.equipamentoTexto || '',
        pecas: Array.isArray(p.pecas) ? [...p.pecas] : [],
      },
    ],
  }
}

function extrairPedidosDeSnapshot(snapshot: unknown): PedidoAvulsoRecuperado[] {
  if (!snapshot || typeof snapshot !== 'object') return []
  const ped = (snapshot as Record<string, unknown>)[PEDIDOS_AVULSO_KEY]
  return Array.isArray(ped) ? (ped as PedidoAvulsoRecuperado[]) : []
}

function mergePedidos(listas: PedidoAvulsoRecuperado[][]): PedidoAvulsoRecuperado[] {
  const map = new Map<string, PedidoAvulsoRecuperado>()
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

function pecasTotaisPedido(pedido: PedidoAvulsoRecuperado) {
  if (Array.isArray(pedido.pecas) && pedido.pecas.length) return pedido.pecas
  return (pedido.equipamentosBlocos || []).flatMap((b) => b.pecas || [])
}

function orcamentoFromPedido(pedido: PedidoAvulsoRecuperado) {
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

function coletarFontesPedidos(dataDir: string, backupsDir: string) {
  const fontes: { nome: string; pedidos: PedidoAvulsoRecuperado[] }[] = []

  const snapshot = readJson(path.join(dataDir, `${SNAPSHOT_KEY}.json`))
  const snapPed = extrairPedidosDeSnapshot(snapshot)
  if (snapPed.length) fontes.push({ nome: 'snapshot local', pedidos: snapPed })

  const pedidosAtuais = readJson(path.join(dataDir, `${PEDIDOS_AVULSO_KEY}.json`))
  if (Array.isArray(pedidosAtuais) && pedidosAtuais.length) {
    fontes.push({ nome: 'ficheiro actual', pedidos: pedidosAtuais as PedidoAvulsoRecuperado[] })
  }

  if (fs.existsSync(backupsDir)) {
    const backups = fs
      .readdirSync(backupsDir)
      .filter((f) => f.startsWith('backup-dados-') && f.endsWith('.json'))
      .map((f) => ({ f, m: fs.statSync(path.join(backupsDir, f)).mtimeMs }))
      .sort((a, b) => b.m - a.m)
    for (const { f } of backups) {
      const j = readJson(path.join(backupsDir, f)) as { data?: Record<string, unknown> } | null
      if (!j?.data) continue
      const ped = extrairPedidosDeSnapshot(j.data[SNAPSHOT_KEY])
      if (ped.length) fontes.push({ nome: `backup ${f}`, pedidos: ped })
    }
  }

  return fontes
}

function bumpSyncMeta(dataDir: string) {
  const metaPath = path.join(dataDir, '_sync-meta.json')
  const cur = readJson(metaPath) as { revision?: number } | null
  const revision = typeof cur?.revision === 'number' ? cur.revision : 0
  const next = { revision: revision + 1, updatedAt: new Date().toISOString() }
  writeJson(metaPath, next)
  return next
}

export type RecuperarPedidosResultado = {
  ok: boolean
  pedidos: PedidoAvulsoRecuperado[]
  fontes: string[]
  orcamentosCount: number
  revision?: number
  message?: string
}

export function recuperarPedidosAvulsosNoServidor(
  dataDir: string = DATA_DIR,
  projectRoot?: string
): RecuperarPedidosResultado {
  const root = projectRoot || path.join(dataDir, '..')
  const backupsDir = path.join(root, 'backups', 'json')
  const fontes = coletarFontesPedidos(dataDir, backupsDir)

  if (!fontes.length) {
    return {
      ok: false,
      pedidos: [],
      fontes: [],
      orcamentosCount: 0,
      message: 'Nenhuma fonte com pedidos avulsos encontrada.',
    }
  }

  const pedidos = mergePedidos(fontes.map((f) => f.pedidos))
  const orcamentosPath = path.join(dataDir, `${ORCAMENTOS_AVULSO_KEY}.json`)
  const orcamentosAtuais = readJson(orcamentosPath)
  const orcamentosExistentes = Array.isArray(orcamentosAtuais) ? orcamentosAtuais : []

  const map = new Map<string, (typeof orcamentosExistentes)[0]>()
  for (const o of orcamentosExistentes) {
    if (o && typeof o === 'object' && 'id' in o && o.id) map.set(String(o.id), o)
  }
  for (const ped of pedidos) {
    const id = 'avulso-' + ped.codigo
    if (!map.has(id)) map.set(id, orcamentoFromPedido(ped))
  }
  const orcamentos = [...map.values()].sort(
    (a, b) =>
      new Date(String(b.dataCriacao || b.geradoEm || 0)).getTime() -
      new Date(String(a.dataCriacao || a.geradoEm || 0)).getTime()
  )

  writeJson(path.join(dataDir, `${PEDIDOS_AVULSO_KEY}.json`), pedidos)
  writeJson(orcamentosPath, orcamentos)
  const meta = bumpSyncMeta(dataDir)

  return {
    ok: true,
    pedidos,
    fontes: fontes.map((f) => `${f.nome} (${f.pedidos.length})`),
    orcamentosCount: orcamentos.length,
    revision: meta.revision,
  }
}
