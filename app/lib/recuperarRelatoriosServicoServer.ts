import fs from 'fs'
import path from 'path'
import { DATA_DIR } from '../api/data/shared'
import { coletarRelatoriosCliente } from './clienteDetalheUtils'
import {
  mergeRelatoriosServicoDeferServerLocal,
  nomesClienteCorrespondem,
  type RelatorioServicoMin,
} from './bibliotecaRelatoriosRecovery'

const RELATORIOS_KEY = 'nonato-relatorios-servico'
const CLIENTES_KEY = 'nonato-clientes'
const EXCLUIDOS_KEY = 'nonato-relatorios-excluidos-clientes'
const SNAPSHOT_KEY = 'nonato-offline-server-snapshot'

export type RelatorioServicoFonte = {
  fonte: string
  relatorio: RelatorioServicoMin
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

function bumpSyncMeta(dataDir: string) {
  const metaPath = path.join(dataDir, '_sync-meta.json')
  const cur = readJson(metaPath) as { revision?: number } | null
  const revision = typeof cur?.revision === 'number' ? cur.revision : 0
  const next = { revision: revision + 1, updatedAt: new Date().toISOString() }
  writeJson(metaPath, next)
  return next
}

function relatorioMatchesCliente(rel: RelatorioServicoMin, clienteQuery?: string): boolean {
  if (!clienteQuery?.trim()) return true
  const q = clienteQuery.trim()
  const cliente = String(rel.cliente ?? '').trim()
  if (nomesClienteCorrespondem(q, cliente)) return true
  const hay = [
    cliente,
    String(rel.numero ?? ''),
    String(rel.data ?? ''),
    String(rel.tecnico ?? ''),
    String(rel.tipoServico ?? ''),
    String(rel.maquinaModelo ?? ''),
  ]
    .join(' ')
    .toLowerCase()
  return hay.includes(q.toLowerCase())
}

function extrairRelatoriosArray(raw: unknown): RelatorioServicoMin[] {
  return Array.isArray(raw) ? (raw as RelatorioServicoMin[]) : []
}

function extrairRelatoriosDeClientes(raw: unknown): RelatorioServicoFonte[] {
  if (!Array.isArray(raw)) return []
  const out: RelatorioServicoFonte[] = []
  for (const c of raw) {
    if (!c || typeof c !== 'object') continue
    const nome = String((c as { nomeEmpresa?: string }).nomeEmpresa ?? '').trim()
    const rels = coletarRelatoriosCliente(
      (c as { relatorios?: Record<string, RelatorioServicoMin[]> }).relatorios
    )
    for (const rel of rels) {
      out.push({
        fonte: `cliente ${nome || (c as { id?: string }).id || '?'}`,
        relatorio: {
          ...rel,
          cliente: String(rel.cliente || nome || '').trim() || rel.cliente,
          clienteId: rel.clienteId || (c as { id?: string }).id,
        },
      })
    }
  }
  return out
}

function extrairRelatoriosExcluidos(raw: unknown): RelatorioServicoFonte[] {
  if (!raw || typeof raw !== 'object') return []
  const pastas = (raw as { pastas?: Record<string, { itens?: unknown[] }> }).pastas
  if (!pastas || typeof pastas !== 'object') return []
  const out: RelatorioServicoFonte[] = []
  for (const [pastaId, pasta] of Object.entries(pastas)) {
    const itens = pasta?.itens
    if (!Array.isArray(itens)) continue
    for (const item of itens) {
      if (!item || typeof item !== 'object') continue
      const tipo = (item as { tipo?: string }).tipo
      if (tipo !== 'servico') continue
      const rel = (item as { relatorio?: RelatorioServicoMin }).relatorio
      if (!rel?.id) continue
      out.push({ fonte: `excluídos (${pastaId})`, relatorio: rel })
    }
  }
  return out
}

function extrairRelatoriosDeSnapshot(snapshot: unknown): RelatorioServicoMin[] {
  if (!snapshot || typeof snapshot !== 'object') return []
  const rel = (snapshot as Record<string, unknown>)[RELATORIOS_KEY]
  return extrairRelatoriosArray(rel)
}

function coletarFontesRelatorios(dataDir: string, projectRoot: string): RelatorioServicoFonte[] {
  const fontes: RelatorioServicoFonte[] = []

  const pushArray = (nome: string, arr: RelatorioServicoMin[]) => {
    for (const rel of arr) {
      if (!rel?.id) continue
      fontes.push({ fonte: nome, relatorio: rel })
    }
  }

  pushArray(
    'ficheiro actual',
    extrairRelatoriosArray(readJson(path.join(dataDir, `${RELATORIOS_KEY}.json`)))
  )
  pushArray(
    'snapshot offline',
    extrairRelatoriosDeSnapshot(readJson(path.join(dataDir, `${SNAPSHOT_KEY}.json`)))
  )
  fontes.push(...extrairRelatoriosDeClientes(readJson(path.join(dataDir, `${CLIENTES_KEY}.json`))))
  fontes.push(...extrairRelatoriosExcluidos(readJson(path.join(dataDir, `${EXCLUIDOS_KEY}.json`))))

  const backupDirs = [
    path.join(dataDir, 'backups', 'json'),
    path.join(projectRoot, 'backups', 'json'),
  ]
  const seenBackupFiles = new Set<string>()
  for (const backupsDir of backupDirs) {
    if (!fs.existsSync(backupsDir)) continue
    const backups = fs
      .readdirSync(backupsDir)
      .filter((f) => f.startsWith('backup-dados-') && f.endsWith('.json'))
      .map((f) => ({ f, m: fs.statSync(path.join(backupsDir, f)).mtimeMs }))
      .sort((a, b) => b.m - a.m)
    for (const { f } of backups.slice(0, 30)) {
      if (seenBackupFiles.has(f)) continue
      seenBackupFiles.add(f)
      const j = readJson(path.join(backupsDir, f)) as { data?: Record<string, unknown> } | null
      if (!j?.data) continue
      pushArray(`backup ${f}`, extrairRelatoriosArray(j.data[RELATORIOS_KEY]))
      fontes.push(...extrairRelatoriosDeClientes(j.data[CLIENTES_KEY]))
      fontes.push(...extrairRelatoriosExcluidos(j.data[EXCLUIDOS_KEY]))
    }
  }

  if (fs.existsSync(dataDir)) {
    const preRestoreDirs = fs
      .readdirSync(dataDir)
      .filter((d) => d.startsWith('_pre-restore-'))
      .map((d) => ({ d, m: fs.statSync(path.join(dataDir, d)).mtimeMs }))
      .sort((a, b) => b.m - a.m)
    for (const { d } of preRestoreDirs.slice(0, 10)) {
      const dir = path.join(dataDir, d)
      pushArray(
        `pré-restore ${d}`,
        extrairRelatoriosArray(readJson(path.join(dir, `${RELATORIOS_KEY}.json`)))
      )
      fontes.push(...extrairRelatoriosDeClientes(readJson(path.join(dir, `${CLIENTES_KEY}.json`))))
      fontes.push(...extrairRelatoriosExcluidos(readJson(path.join(dir, `${EXCLUIDOS_KEY}.json`))))
    }
  }

  return fontes
}

export type RecuperarRelatoriosServicoResultado = {
  ok: boolean
  encontrados: Array<{
    id: string
    cliente: string
    numero: string
    data: string
    tecnico: string
    fontes: string[]
    relatorio: RelatorioServicoMin
  }>
  fontesConsultadas: string[]
  totalFontes: number
  aplicados: number
  revision?: number
  message?: string
}

export function procurarRelatoriosServicoNoServidor(
  dataDir: string = DATA_DIR,
  projectRoot?: string,
  clienteQuery?: string
): RecuperarRelatoriosServicoResultado {
  const root = projectRoot || path.join(dataDir, '..')
  const fontesRaw = coletarFontesRelatorios(dataDir, root)
  const fontesUnicas = [...new Set(fontesRaw.map((f) => f.fonte))]

  if (fontesRaw.length === 0) {
    return {
      ok: false,
      encontrados: [],
      fontesConsultadas: [],
      totalFontes: 0,
      aplicados: 0,
      message: 'Nenhuma fonte de relatórios encontrada no servidor.',
    }
  }

  const byId = new Map<
    string,
    { relatorio: RelatorioServicoMin; fontes: Set<string> }
  >()
  for (const { fonte, relatorio } of fontesRaw) {
    if (!relatorio?.id) continue
    if (!relatorioMatchesCliente(relatorio, clienteQuery)) continue
    const id = String(relatorio.id)
    const prev = byId.get(id)
    if (!prev) {
      byId.set(id, { relatorio, fontes: new Set([fonte]) })
      continue
    }
    prev.fontes.add(fonte)
    const merged = mergeRelatoriosServicoDeferServerLocal([relatorio], [prev.relatorio])
    if (merged[0]) prev.relatorio = merged[0]
  }

  const encontrados = [...byId.values()]
    .map(({ relatorio, fontes }) => ({
      id: String(relatorio.id),
      cliente: String(relatorio.cliente ?? '').trim(),
      numero: String(relatorio.numero ?? '').trim(),
      data: String(relatorio.data ?? '').trim(),
      tecnico: String(relatorio.tecnico ?? '').trim(),
      fontes: [...fontes],
      relatorio,
    }))
    .sort((a, b) => {
      if (a.data !== b.data) return b.data.localeCompare(a.data)
      return b.id.localeCompare(a.id)
    })

  return {
    ok: encontrados.length > 0,
    encontrados,
    fontesConsultadas: fontesUnicas,
    totalFontes: fontesUnicas.length,
    aplicados: 0,
    message:
      encontrados.length === 0
        ? clienteQuery
          ? `Nenhum relatório encontrado para «${clienteQuery}» no servidor.`
          : 'Nenhum relatório encontrado no servidor.'
        : undefined,
  }
}

export function aplicarRecuperacaoRelatoriosServicoNoServidor(
  dataDir: string = DATA_DIR,
  projectRoot?: string,
  clienteQuery?: string
): RecuperarRelatoriosServicoResultado {
  const busca = procurarRelatoriosServicoNoServidor(dataDir, projectRoot, clienteQuery)
  if (!busca.ok || busca.encontrados.length === 0) return busca

  const relPath = path.join(dataDir, `${RELATORIOS_KEY}.json`)
  const actuais = extrairRelatoriosArray(readJson(relPath))
  const novos = busca.encontrados.map((e) => e.relatorio)
  const merged = mergeRelatoriosServicoDeferServerLocal(actuais, novos)
  writeJson(relPath, merged)
  const meta = bumpSyncMeta(dataDir)

  return {
    ...busca,
    aplicados: busca.encontrados.length,
    revision: meta.revision,
    message: `Repostos ${busca.encontrados.length} relatório(s) no servidor.`,
  }
}
