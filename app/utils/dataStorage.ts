// Funções para salvar e carregar dados do servidor (com suporte offline)

import { mergeManuaisFamiliasGrupos } from './manuaisMerge'
import { isNonatoDemoBuild } from './nonatoDemoMode'
import { applyRevisionFromSaveResponse, fetchSyncStatus, setLastAcceptedRevision } from './syncRevision'
import { safeMergeOfflineSnapshot } from './cadastroSafety'
import {
  saveManuaisFamiliasGruposToIdb,
  loadManuaisFamiliasGruposFromIdb,
  saveKv,
  getKv,
} from './manuaisIndexedDb'
import {
  NONATO_CRITICAL_CADASTRO_KEYS,
  serverKeyHasMeaningfulData,
} from '../lib/criticalCadastroKeys'
import {
  mergePecasBibliotecaArrays,
  pecasBibliotecaArraysDiffer,
} from '../lib/mergePecasBiblioteca'
import { mergeNonatoClientesDeferServerLocal } from '../lib/clienteMergeUtils'
import {
  mergeSidebarButtonsDeferLocal,
  repairSidebarButtonsFromCatalog,
} from '../lib/sidebarMergeUtils'
import {
  canAutoPullServerChanges,
} from './syncDiff'

const PECAS_BIBLIOTECA_KEY = 'nonato-pecas-biblioteca'

const API_BASE = '/api/data'
const SYNC_QUEUE_KEY = 'nonato-sync-queue'
/** Cópia completa do servidor em IndexedDB — permite arranque offline após uma visita online. */
const OFFLINE_SNAPSHOT_KEY = 'nonato-offline-server-snapshot'

/** Fetch autenticado (sessão) para APIs /api/data — cookies incluídos. */
function dataApiFetch(input: string, init?: RequestInit): Promise<Response> {
  return fetch(input, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
  })
}

/** Durante a carga inicial da página: não enviar migrações «só servidor» (saveToLocalStorage=false) nem pushes implícitos em loadData — evita revisões e payloads diferentes por aparelho. */
let blockImplicitServerPushDuringBootstrap = false

export function setBlockImplicitServerPushDuringBootstrap(block: boolean): void {
  blockImplicitServerPushDuringBootstrap = block
}

/** Arranque da página concluído — evita loadData prematuro a apagar localStorage com [] do servidor. */
let dataBootstrapComplete = false

export function markDataBootstrapComplete(): void {
  dataBootstrapComplete = true
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('nonato-bootstrap-complete'))
    } catch {
      /* ignorar */
    }
  }
}

export function isDataBootstrapComplete(): boolean {
  return dataBootstrapComplete
}

/** Espera o bootstrap principal (page.tsx) antes de loadData em efeitos paralelos. */
export function waitForDataBootstrapComplete(timeoutMs = 120_000): Promise<void> {
  if (dataBootstrapComplete) return Promise.resolve()
  if (typeof window === 'undefined') return Promise.resolve()
  return new Promise((resolve) => {
    let done = false
    const finish = () => {
      if (done) return
      done = true
      window.removeEventListener('nonato-bootstrap-complete', onEv)
      window.clearTimeout(tid)
      resolve()
    }
    const onEv = () => finish()
    const tid = window.setTimeout(finish, timeoutMs)
    window.addEventListener('nonato-bootstrap-complete', onEv)
  })
}

function shouldDeferImplicitServerPush(): boolean {
  // Durante bootstrap queremos 100% "read-only" no servidor:
  // evitar que ações automáticas (backups/migrações/marcas) mudem a revisão do servidor
  // enquanto o ecrã do utilizador ainda está a carregar.
  return blockImplicitServerPushDuringBootstrap
}
/** Backups automáticos em localStorage — podem ser reduzidos se a quota estourar ao gravar dados críticos */
const AUTO_BACKUP_STORAGE_KEY = 'nonato-auto-backups'

function isQuotaExceededError(e: unknown): boolean {
  if (typeof DOMException !== 'undefined' && e instanceof DOMException && e.name === 'QuotaExceededError') {
    return true
  }
  if (e !== null && typeof e === 'object' && 'name' in e && (e as { name?: string }).name === 'QuotaExceededError') {
    return true
  }
  const msg = e instanceof Error ? e.message : String(e)
  return /quota|exceeded|storage is full|not enough space/i.test(msg)
}

/** Remove o backup automático mais antigo (ou todos) para libertar espaço no localStorage. */
function trimAutoBackupsForQuota(removeAll: boolean): void {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(AUTO_BACKUP_STORAGE_KEY)
    if (!raw) return
    const backups = JSON.parse(raw) as unknown
    if (!Array.isArray(backups) || backups.length === 0) return
    if (removeAll) {
      localStorage.removeItem(AUTO_BACKUP_STORAGE_KEY)
      return
    }
    backups.pop()
    if (backups.length === 0) {
      localStorage.removeItem(AUTO_BACKUP_STORAGE_KEY)
    } else {
      try {
        localStorage.setItem(AUTO_BACKUP_STORAGE_KEY, JSON.stringify(backups))
      } catch {
        localStorage.removeItem(AUTO_BACKUP_STORAGE_KEY)
      }
    }
  } catch {
    try {
      localStorage.removeItem(AUTO_BACKUP_STORAGE_KEY)
    } catch {
      /* ignorar */
    }
  }
}

/**
 * Grava string no localStorage; se falhar por quota, tenta libertar espaço (backups automáticos) e repetir.
 */
function setItemWithQuotaRecovery(key: string, serialized: string): void {
  try {
    localStorage.setItem(key, serialized)
    return
  } catch (error) {
    if (!isQuotaExceededError(error)) throw error
  }
  for (let i = 0; i < 24; i++) {
    trimAutoBackupsForQuota(false)
    try {
      localStorage.setItem(key, serialized)
      return
    } catch (error) {
      if (!isQuotaExceededError(error)) throw error
    }
  }
  trimAutoBackupsForQuota(true)
  try {
    localStorage.setItem(key, serialized)
    return
  } catch (error) {
    if (!isQuotaExceededError(error)) throw error
  }
  console.warn(
    '[saveData] localStorage sem espaço após libertar backups automáticos; a tentar fila de sync e código.'
  )
  try {
    localStorage.removeItem('nonato-code-backups')
  } catch {
    /* ignorar */
  }
  try {
    const q = getSyncQueue()
    if (q.length > 0) {
      setSyncQueue(q.slice(Math.floor(q.length / 2)))
    }
  } catch {
    /* ignorar */
  }
  try {
    localStorage.removeItem(SYNC_QUEUE_KEY)
  } catch {
    /* ignorar */
  }
  localStorage.setItem(key, serialized)
}

/** Pedido em curso por chave — várias chamadas seguidas partilham a mesma Promise mas o valor enviado é sempre o último (coalesce). */
const pendingSaveByKey = new Map<string, Promise<boolean>>()
/** Enquanto um POST está em curso para `key`, guarda o último valor pedido para enviar a seguir (last-write-wins). */
const coalesceNextValueByKey = new Map<string, any>()

// Flag para detectar se o servidor está offline
let serverOffline = false
let lastServerCheck = 0
const SERVER_CHECK_INTERVAL = 30000 // 30 segundos

// Verificar se está online (rápido)
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true
  return navigator.onLine
}

// Fila de sincronização (para quando estiver offline)
function getSyncQueue(): Array<{ key: string; value: any; timestamp: number }> {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function setSyncQueue(queue: Array<{ key: string; value: any; timestamp: number }>): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
  } catch {}
}

/** Último valor por chave — evita fila com dezenas de gravações repetidas offline. */
function enqueueSyncItem(key: string, value: any): void {
  const queue = getSyncQueue().filter((item) => item.key !== key)
  queue.push({ key, value, timestamp: Date.now() })
  setSyncQueue(queue)
}

// Helper para criar AbortSignal com timeout (compatibilidade)
function createTimeoutSignal(timeoutMs: number): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal) {
    return AbortSignal.timeout(timeoutMs)
  }
  // Fallback para navegadores que não suportam AbortSignal.timeout
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeoutMs)
  return controller.signal
}

// Verificar se o servidor está online
async function checkServerOnline(): Promise<boolean> {
  if (isNonatoDemoBuild()) {
    serverOffline = true
    return false
  }
  if (!isOnline()) {
    serverOffline = true
    return false
  }
  const now = Date.now()
  if (now - lastServerCheck < SERVER_CHECK_INTERVAL && serverOffline) {
    return false
  }
  lastServerCheck = now
  try {
    const response = await dataApiFetch(`${API_BASE}/load?key=__health_check__`, {
      method: 'GET',
      signal: createTimeoutSignal(3000),
    })
    serverOffline = false
    return true
  } catch {
    serverOffline = true
    return false
  }
}

// Processar fila de sincronização (quando voltar online)
export async function processSyncQueue(): Promise<{ synced: number; failed: number }> {
  if (isNonatoDemoBuild()) return { synced: 0, failed: 0 }
  if (!isOnline()) return { synced: 0, failed: 0 }
  const queue = getSyncQueue()
  if (queue.length === 0) return { synced: 0, failed: 0 }
  let synced = 0
  let failed = 0
  const remaining: typeof queue = []
  /** Por chave, só enviar o item mais recente (último timestamp). */
  const latestByKey = new Map<string, (typeof queue)[number]>()
  for (const item of queue) {
    const prev = latestByKey.get(item.key)
    if (!prev || item.timestamp >= prev.timestamp) latestByKey.set(item.key, item)
  }
  for (const item of latestByKey.values()) {
    const ok = await _doSaveToServer(item.key, item.value)
    if (ok) synced++
    else {
      failed++
      remaining.push(item)
    }
  }
  setSyncQueue(remaining)
  serverOffline = failed > 0
  if (synced > 0) serverOffline = false
  return { synced, failed }
}

let autoSyncInFlight = false

/** Envia alterações pendentes ao servidor — chamado ao voltar online ou periodicamente. */
export async function autoSyncPendingChanges(): Promise<{ synced: number; failed: number }> {
  if (isNonatoDemoBuild() || !isOnline()) return { synced: 0, failed: 0 }
  if (autoSyncInFlight) return { synced: 0, failed: 0 }
  if (getPendingSyncCount() === 0) return { synced: 0, failed: 0 }
  autoSyncInFlight = true
  try {
    const online = await checkServerOnline()
    if (!online) return { synced: 0, failed: 0 }
    const result = await processSyncQueue()
    if (typeof window !== 'undefined' && result.synced > 0) {
      try {
        window.dispatchEvent(new CustomEvent('nonato-sync-completed', { detail: result }))
      } catch {
        /* ignorar */
      }
    }
    return result
  } finally {
    autoSyncInFlight = false
  }
}

/** Regista listeners para sincronizar automaticamente quando a ligação voltar. */
export function setupAutoSyncOnReconnect(): () => void {
  if (typeof window === 'undefined') return () => {}

  const run = () => {
    if (isOnline()) void autoSyncPendingChanges()
  }

  window.addEventListener('online', run)
  const interval = window.setInterval(() => {
    if (isOnline() && getPendingSyncCount() > 0) void autoSyncPendingChanges()
  }, 15000)

  if (isOnline()) void autoSyncPendingChanges()

  return () => {
    window.removeEventListener('online', run)
    window.clearInterval(interval)
  }
}

/** Envia fila pendente com fetch keepalive ao fechar/recarregar o separador. */
function flushPendingSyncWithKeepalive(): void {
  if (typeof window === 'undefined' || isNonatoDemoBuild() || !isOnline()) return
  const queue = getSyncQueue()
  if (queue.length === 0) return
  const latestByKey = new Map<string, (typeof queue)[number]>()
  for (const item of queue) {
    const prev = latestByKey.get(item.key)
    if (!prev || item.timestamp >= prev.timestamp) latestByKey.set(item.key, item)
  }
  for (const item of latestByKey.values()) {
    try {
      const payloadStr =
        typeof item.value === 'string' ? item.value : JSON.stringify(item.value)
      const body = JSON.stringify({ key: item.key, value: item.value })
      const isLarge =
        payloadStr.length > 100000 &&
        (payloadStr.startsWith('data:image/') ||
          payloadStr.startsWith('data:video/') ||
          payloadStr.startsWith('data:application/pdf'))
      const endpoint = isLarge ? `${API_BASE}/save-text` : `${API_BASE}/save`
      void fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: isLarge ? JSON.stringify({ key: item.key, value: payloadStr }) : body,
        keepalive: true,
      }).catch(() => {})
    } catch {
      /* ignorar */
    }
  }
}

/** Regista flush da fila ao esconder a página (F5, fechar separador, deploy+reload). */
export function setupFlushSyncOnPageHide(): () => void {
  if (typeof window === 'undefined') return () => {}
  const run = () => flushPendingSyncWithKeepalive()
  window.addEventListener('pagehide', run)
  const onVis = () => {
    if (document.visibilityState === 'hidden') run()
  }
  document.addEventListener('visibilitychange', onVis)
  return () => {
    window.removeEventListener('pagehide', run)
    document.removeEventListener('visibilitychange', onVis)
  }
}

// Quantidade de itens pendentes de sincronização
export function getPendingSyncCount(): number {
  return getSyncQueue().length
}

// Salvar diretamente no servidor (sem fila) - uso interno
const MANUAIS_KEY = 'nonato-manuais-familias-grupos'
const CONHECIMENTO_TECNICO_KEY = 'nonato-conhecimento-tecnico-unificado'
const BIBLIA_NONATO_KEY = 'nonato-biblia-nonato-service'
const CLIENTES_KEY = 'nonato-clientes'
const SIDEBAR_BUTTONS_KEY = 'nonato-sidebar-buttons'

const MANUAIS_OBJECT_KEYS_BLOCK_EMPTY_OVERWRITE = new Set([
  MANUAIS_KEY,
  CONHECIMENTO_TECNICO_KEY,
  BIBLIA_NONATO_KEY,
])

/**
 * Chaves em que gravar `[]` no servidor apagaria cadastros críticos (ex.: serviços/valores).
 * Bloqueia overwrite vazio e ignora essas chaves no «Enviar tudo» se estiverem vazias neste aparelho.
 */
export const NONATO_ARRAY_KEYS_BLOCK_EMPTY_SERVER_OVERWRITE = new Set([
  'nonato-servicos',
  'nonato-servicos-grupos',
  'nonato-clientes',
  'nonato-fornecedores',
  'nonato-gestores',
  'nonato-tecnicos',
  'nonato-equipamentos',
  'nonato-relatorios-servico',
  'nonato-pecas-biblioteca',
  'nonato-biblioteca-pecas',
  'nonato-diario-pedidos-dia',
  'nonato-conhecimento-tecnicos',
  'nonato-checklist-basico-instancias',
])

function isEmptyDataArray(value: unknown): boolean {
  return Array.isArray(value) && value.length === 0
}

function isEmptyManuaisLikePayload(value: unknown): boolean {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return true
  const v = value as { familias?: unknown[]; grupos?: unknown[]; modelos?: unknown[] }
  const hasFam = Array.isArray(v.familias) && v.familias.length > 0
  const hasGrp = Array.isArray(v.grupos) && v.grupos.length > 0
  const hasMod = Array.isArray(v.modelos) && v.modelos.length > 0
  return !hasFam && !hasGrp && !hasMod
}

function manuaisLikePayloadHasContent(value: unknown): boolean {
  if (isEmptyManuaisLikePayload(value)) return false
  const v = value as {
    modelos?: Array<{ documentos?: unknown[]; imagens?: unknown[]; anexos?: unknown[] }>
    familias?: unknown[]
  }
  if (Array.isArray(v.familias) && v.familias.length > 0) return true
  for (const m of v.modelos || []) {
    if ((m.documentos?.length ?? 0) > 0) return true
    if ((m.imagens?.length ?? 0) > 0) return true
    if ((m.anexos?.length ?? 0) > 0) return true
  }
  return (v.modelos?.length ?? 0) > 0
}

/** Evita que uma lista menor (ex.: 2 peças após restore parcial) apague centenas no servidor. */
async function shouldBlockShrinkServerOverwrite(key: string, value: unknown): Promise<boolean> {
  if (key !== PECAS_BIBLIOTECA_KEY) return false
  if (!Array.isArray(value)) return false
  try {
    const existing = await forceLoadCadastroFromServer(key)
    if (!Array.isArray(existing) || existing.length === 0) return false
    if (value.length >= existing.length) return false
    console.warn(
      `[Nonato] Gravação ignorada: «${key}» tem ${value.length} item(ns) — o servidor tem ${existing.length}; não substituir catálogo maior.`
    )
    return true
  } catch {
    return false
  }
}

/** Evita que uma lista vazia (sync/atualização) apague dados já guardados no servidor. */
async function shouldBlockEmptyServerOverwrite(key: string, value: unknown): Promise<boolean> {
  if (MANUAIS_OBJECT_KEYS_BLOCK_EMPTY_OVERWRITE.has(key)) {
    if (!isEmptyManuaisLikePayload(value)) return false
    try {
      const existing = await loadFromServer(key)
      return manuaisLikePayloadHasContent(existing)
    } catch {
      return false
    }
  }
  if (!NONATO_ARRAY_KEYS_BLOCK_EMPTY_SERVER_OVERWRITE.has(key)) return false
  if (!isEmptyDataArray(value)) return false
  try {
    const existing = await forceLoadCadastroFromServer(key)
    return Array.isArray(existing) && existing.length > 0
  } catch {
    return false
  }
}

/** Remove listas vazias protegidas do payload de «Enviar tudo» para não apagar o servidor. */
export function omitEmptyProtectedKeysForServerPush(data: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...data }
  for (const key of NONATO_ARRAY_KEYS_BLOCK_EMPTY_SERVER_OVERWRITE) {
    if (isEmptyDataArray(out[key])) delete out[key]
  }
  for (const key of MANUAIS_OBJECT_KEYS_BLOCK_EMPTY_OVERWRITE) {
    if (isEmptyManuaisLikePayload(out[key])) delete out[key]
  }
  return out
}

async function _doSaveToServer(key: string, value: any): Promise<boolean> {
  if (isNonatoDemoBuild()) return true
  if (await shouldBlockEmptyServerOverwrite(key, value)) {
    console.warn(
      `[Nonato] Gravação ignorada: «${key}» vazio não pode substituir o cadastro já guardado no servidor.`
    )
    return true
  }
  if (await shouldBlockShrinkServerOverwrite(key, value)) {
    return true
  }
  try {
    const payloadStr = typeof value === 'string' ? value : JSON.stringify(value)
    const isLargeString =
      typeof value === 'string' &&
      value.length > 100000 &&
      (value.startsWith('data:image/') || value.startsWith('data:video/') || value.startsWith('data:application/pdf'))
    /** Logos da UI: sempre `.txt` + save-text — evita coexistir `nonato-logo.json` pequeno com `.txt` novo (o /load dava prioridade ao JSON). */
    const isLogoBodyKey = key === 'nonato-logo' || key === 'nonato-logo-dashboard'
    const useSaveTextForLogo =
      isLogoBodyKey &&
      typeof value === 'string' &&
      (value === '' || value.startsWith('data:image/') || value.startsWith('data:video/'))
    /** Manuais com PDFs em base64: JSON grande — usar save-text para não estourar limites do /save */
    const isLargeManuaisJson = key === MANUAIS_KEY && payloadStr.length > 80000
    /** Biblioteca de logos PDF: várias imagens base64 — mesmo tratamento que manuais grandes */
    const isLargeLogosRelatoriosJson = key === 'nonato-logos-relatorios' && payloadStr.length > 80000
    /** Biblioteca de peças com imagens base64 — payload grande */
    const isLargePecasBibliotecaJson = key === PECAS_BIBLIOTECA_KEY && payloadStr.length > 80000
    const useTextEndpoint =
      isLargeString ||
      isLargeManuaisJson ||
      isLargeLogosRelatoriosJson ||
      isLargePecasBibliotecaJson ||
      useSaveTextForLogo
    const endpoint = useTextEndpoint ? `${API_BASE}/save-text` : `${API_BASE}/save`
    const body =
      (isLargeManuaisJson && typeof value === 'object') || isLargeLogosRelatoriosJson
        ? JSON.stringify({ key, value: payloadStr })
        : JSON.stringify({ key, value })
    const payloadNeedsSlowUpload =
      isLargeManuaisJson ||
      isLargeLogosRelatoriosJson ||
      isLargePecasBibliotecaJson ||
      isLargeString ||
      (useSaveTextForLogo && typeof value === 'string' && value.length > 40000)
    const response = await dataApiFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: createTimeoutSignal(payloadNeedsSlowUpload ? 120000 : 5000),
    })
    if (response.ok) {
      serverOffline = false
      try {
        const json = await response.json()
        applyRevisionFromSaveResponse(json)
      } catch {
        /* resposta sem JSON */
      }
      return true
    }
    return false
  } catch {
    return false
  }
}

// Salvar um item específico
export async function saveToServer(key: string, value: any): Promise<boolean> {
  if (isNonatoDemoBuild()) {
    return true
  }
  const requestKey = `save:${key}`
  if (pendingSaveByKey.has(requestKey)) {
    coalesceNextValueByKey.set(key, value)
    return pendingSaveByKey.get(requestKey)!
  }

  if (serverOffline) {
    const ok = await checkServerOnline()
    if (!ok) return false
  }

  const requestPromise = (async (): Promise<boolean> => {
    let current: any = value
    let lastOk = false
    try {
      while (true) {
        if (!isOnline()) {
          serverOffline = true
          enqueueSyncItem(key, current)
          return false
        }
        try {
          lastOk = await _doSaveToServer(key, current)
          if (!lastOk) {
            serverOffline = true
            enqueueSyncItem(key, current)
          }
        } catch (error: any) {
          lastOk = false
          const isNetworkError = error instanceof TypeError || error?.name === 'AbortError' ||
            (error?.message && (error.message.includes('NetworkError') || error.message.includes('Failed to fetch') || error.message.includes('CONNECTION_REFUSED')))
          if (isNetworkError) {
            serverOffline = true
            enqueueSyncItem(key, current)
          }
        }
        const next = coalesceNextValueByKey.get(key)
        coalesceNextValueByKey.delete(key)
        if (next === undefined) break
        current = next
      }
      return lastOk
    } finally {
      pendingSaveByKey.delete(requestKey)
    }
  })()
  pendingSaveByKey.set(requestKey, requestPromise)
  return requestPromise
}

async function fetchServerKeyPayload(key: string, timeoutMs: number): Promise<any | null> {
  const response = await dataApiFetch(`${API_BASE}/load-text?key=${encodeURIComponent(key)}`, {
    signal: createTimeoutSignal(timeoutMs),
  })
  if (!response.ok) return null
  const result = await response.json()
  if (result?.error === 'auth_required') return null
  return result?.data ?? null
}

async function forceLoadCadastroFromServer(key: string): Promise<any | null> {
  if (!isOnline()) return null
  const slowKey = key === PECAS_BIBLIOTECA_KEY || key === MANUAIS_KEY
  const timeoutMs = slowKey ? 120_000 : 15_000
  try {
    let data = await fetchServerKeyPayload(key, timeoutMs)
    if (data == null && slowKey) {
      const response = await dataApiFetch(`${API_BASE}/load?key=${encodeURIComponent(key)}`, {
        signal: createTimeoutSignal(timeoutMs),
      })
      if (response.ok) {
        const result = await response.json()
        if (result?.error !== 'auth_required') {
          data = result?.data ?? null
        }
      }
    }
    if (data != null) serverOffline = false
    return data
  } catch {
    return null
  }
}

async function fetchPecasBibliotecaRepairPaginated(
  onProgress?: (loaded: number, total: number) => void
): Promise<unknown[] | null> {
  /** Modo lite: catálogo completo ~160 KB (sem fotos base64). Algumas peças têm fotos de 3+ MB. */
  const limit = 500
  let offset = 0
  let total = 0
  const all: unknown[] = []
  let authRequired = false

  try {
    const metaRes = await dataApiFetch(`${API_BASE}/repair-pecas-biblioteca?meta=1&lite=1`, {
      method: 'GET',
      signal: createTimeoutSignal(30_000),
    })
    if (metaRes.status === 401) authRequired = true
    if (metaRes.ok) {
      const meta = (await metaRes.json()) as { total?: number; error?: string }
      if (meta?.error === 'auth_required') authRequired = true
      if (typeof meta.total === 'number') total = meta.total
    }
  } catch {
    /* continuar sem total */
  }

  if (authRequired) {
    throw new Error('auth_required')
  }

  while (true) {
    let res: Response
    try {
      res = await dataApiFetch(
        `${API_BASE}/repair-pecas-biblioteca?lite=1&offset=${offset}&limit=${limit}`,
        {
          method: 'GET',
          signal: createTimeoutSignal(60_000),
        }
      )
    } catch (e) {
      console.warn('[Nonato] Reparo peças: rede falhou', offset, e)
      break
    }
    if (res.status === 401) {
      throw new Error('auth_required')
    }
    if (!res.ok) {
      console.warn('[Nonato] Reparo peças: página falhou', offset, res.status)
      break
    }
    let json: {
      success?: boolean
      pecas?: unknown[]
      hasMore?: boolean
      total?: number
      error?: string
    }
    try {
      json = (await res.json()) as typeof json
    } catch (e) {
      console.warn('[Nonato] Reparo peças: JSON inválido na página', offset, e)
      break
    }
    if (json?.error === 'auth_required') {
      throw new Error('auth_required')
    }
    if (!json?.success || !Array.isArray(json.pecas)) break
    if (typeof json.total === 'number') total = json.total
    all.push(...json.pecas)
    onProgress?.(all.length, total || all.length)
    if (!json.hasMore || json.pecas.length === 0) break
    offset += json.pecas.length
    if (total > 0 && all.length >= total) break
  }

  return all.length > 0 ? all : null
}

export type PecasBibliotecaRepairProgress = {
  phase: 'catalog' | 'images'
  loaded: number
  total: number
}

/** Carrega fotos uma a uma (algumas têm 3+ MB em base64). */
export async function hydratePecasBibliotecaImagensFromServer(
  pecas: unknown[],
  onProgress?: (p: PecasBibliotecaRepairProgress) => void
): Promise<unknown[]> {
  if (!Array.isArray(pecas) || pecas.length === 0) return pecas

  let totalImages = 0
  try {
    const metaRes = await dataApiFetch(`${API_BASE}/repair-pecas-biblioteca?meta=1`, {
      method: 'GET',
      signal: createTimeoutSignal(20_000),
    })
    if (metaRes.ok) {
      const meta = (await metaRes.json()) as { totalImages?: number }
      if (typeof meta.totalImages === 'number') totalImages = meta.totalImages
    }
  } catch {
    /* ignorar */
  }

  if (totalImages <= 0) return pecas

  const byId = new Map<string, Record<string, unknown>>()
  for (const p of pecas) {
    if (p && typeof p === 'object' && 'id' in p) {
      byId.set(String((p as { id: unknown }).id), p as Record<string, unknown>)
    }
  }

  let offset = 0
  let loaded = 0
  while (offset < totalImages) {
    const res = await dataApiFetch(
      `${API_BASE}/repair-pecas-biblioteca?images=1&offset=${offset}&limit=1`,
      {
        method: 'GET',
        signal: createTimeoutSignal(120_000),
      }
    )
    if (res.status === 401) throw new Error('auth_required')
    if (!res.ok) break
    const json = (await res.json()) as {
      success?: boolean
      imagens?: Array<{ id?: string; imagem?: string }>
      hasMore?: boolean
      total?: number
    }
    if (!json?.success || !Array.isArray(json.imagens) || json.imagens.length === 0) break
    if (typeof json.total === 'number') totalImages = json.total
    for (const row of json.imagens) {
      const id = String(row.id ?? '')
      const img = typeof row.imagem === 'string' ? row.imagem : ''
      const peca = byId.get(id)
      if (peca && img) {
        peca.imagem = img
        delete peca.temImagemServidor
      }
      loaded++
      onProgress?.({ phase: 'images', loaded, total: totalImages })
    }
    offset += json.imagens.length
    if (loaded % 15 === 0 || !json.hasMore) {
      const snapshot = Array.from(byId.values())
      try {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('nonato-pecas-imagens-hidratadas', { detail: { pecas: snapshot } })
          )
        }
      } catch {
        /* ignorar */
      }
    }
    if (!json.hasMore) break
  }

  return Array.from(byId.values())
}

/**
 * Reposição forçada (botão «Repor biblioteca»): ignora heurística de catálogo parcial.
 */
export async function forceReporPecasBibliotecaFromServer(
  current: unknown,
  onProgress?: (p: PecasBibliotecaRepairProgress) => void
): Promise<unknown[] | null> {
  const local = Array.isArray(current) ? current : []
  let best: unknown[] = [...local]

  try {
    const fromKv = await getKv(PECAS_BIBLIOTECA_KEY)
    if (Array.isArray(fromKv) && fromKv.length > best.length) {
      best = fromKv as unknown[]
    }
  } catch {
    /* ignorar */
  }

  const fromServer = await fetchPecasBibliotecaRepairPaginated((loaded, total) => {
    onProgress?.({ phase: 'catalog', loaded, total })
  })

  if (!Array.isArray(fromServer) || fromServer.length === 0) {
    return null
  }

  best = mergePecasBibliotecaArrays(fromServer, best) as unknown[]
  await savePecasBibliotecaLocally(best)
  console.info(`[Nonato] Catálogo reposto (lite): ${local.length} → ${best.length} peças.`)

  void (async () => {
    try {
      const withImages = await hydratePecasBibliotecaImagensFromServer(best, onProgress)
      if (withImages.length > 0) {
        await savePecasBibliotecaLocally(withImages)
        console.info(`[Nonato] Fotos da biblioteca hidratadas: ${withImages.filter((p) => p && typeof p === 'object' && (p as { imagem?: string }).imagem).length} peça(s) com imagem.`)
      }
    } catch (e) {
      console.warn('[Nonato] Hidratação de fotos interrompida:', e)
    }
  })()

  return best
}

/** Grava biblioteca de peças: IndexedDB primeiro (suporta ~10 MB+); localStorage se couber. */
export async function savePecasBibliotecaLocally(value: unknown[]): Promise<'ls' | 'idb'> {
  try {
    await saveKv(PECAS_BIBLIOTECA_KEY, value)
  } catch (e) {
    console.error('[Nonato] Falha ao gravar peças em IndexedDB:', e)
  }
  const serialized = JSON.stringify(value)
  try {
    setItemWithQuotaRecovery(PECAS_BIBLIOTECA_KEY, serialized)
    try {
      localStorage.removeItem(`${PECAS_BIBLIOTECA_KEY}--idb`)
    } catch {
      /* ignorar */
    }
    return 'ls'
  } catch {
    try {
      localStorage.setItem(`${PECAS_BIBLIOTECA_KEY}--idb`, '1')
      localStorage.removeItem(PECAS_BIBLIOTECA_KEY)
    } catch {
      /* ignorar */
    }
    return 'idb'
  }
}

// Carregar um item específico
export async function loadFromServer(key: string): Promise<any | null> {
  if (!isOnline()) {
    serverOffline = true
    return null
  }
  if (serverOffline) {
    const ok = await checkServerOnline()
    if (!ok) return null
  }

  const slowKey = key === PECAS_BIBLIOTECA_KEY || key === MANUAIS_KEY
  const timeoutMs = slowKey ? 90_000 : 5000

  try {
    let data = await fetchServerKeyPayload(key, timeoutMs)
    if (data == null && slowKey) {
      const response = await dataApiFetch(`${API_BASE}/load?key=${encodeURIComponent(key)}`, {
        signal: createTimeoutSignal(timeoutMs),
      })
      if (response.ok) {
        const result = await response.json()
        data = result?.data ?? null
      }
    }
    if (data == null) {
      serverOffline = true
      return null
    }
    serverOffline = false
    return data
  } catch (error: any) {
    if (
      error instanceof TypeError &&
      (error.message.includes('NetworkError') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('CONNECTION_REFUSED') ||
        error.name === 'AbortError')
    ) {
      serverOffline = true
    }
    return null
  }
}

/**
 * Repõe biblioteca de peças quando o browser ficou com cópia mínima (ex.: restore/sync parcial)
 * mas o servidor ainda tem o catálogo completo.
 */
export async function repairPecasBibliotecaIfStale(
  current: unknown,
  categoriasCount: number,
  onProgress?: (loaded: number, total: number) => void
): Promise<unknown[] | null> {
  const local = Array.isArray(current) ? current : []
  if (categoriasCount < 5) return null
  /** Muitas categorias com catálogo minúsculo = cópia parcial (ex.: restore a 9/07). */
  const suspectPartial = local.length < Math.max(15, Math.min(categoriasCount, 80))
  if (!suspectPartial) return null

  let best: unknown[] = [...local]

  try {
    const snap = await getKv(OFFLINE_SNAPSHOT_KEY)
    if (snap && typeof snap === 'object' && !Array.isArray(snap)) {
      const fromSnap = (snap as Record<string, unknown>)[PECAS_BIBLIOTECA_KEY]
      if (Array.isArray(fromSnap) && fromSnap.length > best.length) {
        best = fromSnap as unknown[]
      }
    }
  } catch {
    /* ignorar */
  }

  try {
    const fromKv = await getKv(PECAS_BIBLIOTECA_KEY)
    if (Array.isArray(fromKv) && fromKv.length > best.length) {
      best = fromKv as unknown[]
    }
  } catch {
    /* ignorar */
  }

  const fromServer = await fetchPecasBibliotecaRepairPaginated((loaded, total) => {
    onProgress?.(loaded, total)
  })
  if (Array.isArray(fromServer) && fromServer.length > 0) {
    best = mergePecasBibliotecaArrays(fromServer, best) as unknown[]
  } else {
    const fromLoad = await forceLoadCadastroFromServer(PECAS_BIBLIOTECA_KEY)
    if (Array.isArray(fromLoad) && fromLoad.length > 0) {
      best = mergePecasBibliotecaArrays(fromLoad, best) as unknown[]
    }
  }

  if (best.length <= local.length) return null

  await savePecasBibliotecaLocally(best)
  if (!shouldDeferImplicitServerPush() && Array.isArray(fromServer) && pecasBibliotecaArraysDiffer(best, fromServer)) {
    scheduleServerMigrationPush(PECAS_BIBLIOTECA_KEY, best)
  }
  console.info(
    `[Nonato] Biblioteca de peças reposta: ${local.length} → ${best.length}${Array.isArray(fromServer) ? ` (servidor: ${fromServer.length})` : ''}.`
  )
  return best
}

/** Resultado de carregar o bundle completo: `ok` distingue rede/HTTP bem-sucedidos de falha (timeout, offline). */
export type LoadAllFromServerResult = {
  data: Record<string, any>
  ok: boolean
  source?: 'server' | 'local' | 'snapshot'
}

/** Junta localStorage + IndexedDB + snapshot offline para arranque sem rede. */
export async function loadAllFromLocalCache(): Promise<Record<string, any>> {
  const fromLs = await collectAllLocalNonatoDataForSync()
  try {
    const snap = await getKv(OFFLINE_SNAPSHOT_KEY)
    if (snap && typeof snap === 'object' && !Array.isArray(snap)) {
      return { ...(snap as Record<string, any>), ...fromLs }
    }
  } catch {
    /* ignorar */
  }
  return fromLs
}

/** Guarda bundle do servidor para uso offline (IndexedDB — não compete com quota do localStorage). */
export async function saveOfflineServerSnapshot(data: Record<string, any>): Promise<void> {
  await safeMergeOfflineSnapshot(data)
}

/**
 * Carga inicial inteligente: offline → imediato com dados locais;
 * online → tenta servidor uma vez; se falhar, usa cache local/snapshot.
 */
export async function loadAllForBootstrap(
  prefetched?: Record<string, any> | null
): Promise<LoadAllFromServerResult> {
  if (prefetched && Object.keys(prefetched).length > 0) {
    void saveOfflineServerSnapshot(prefetched)
    return { data: prefetched, ok: true, source: 'server' }
  }

  if (!isOnline()) {
    serverOffline = true
    const local = await loadAllFromLocalCache()
    return {
      data: local,
      ok: false,
      source: Object.keys(local).length > 0 ? 'local' : 'snapshot',
    }
  }

  const server = await loadAllFromServer()
  if (server.ok && Object.keys(server.data).length > 0) {
    void saveOfflineServerSnapshot(server.data)
    return { ...server, source: 'server' }
  }

  serverOffline = true
  const local = await loadAllFromLocalCache()
  if (Object.keys(local).length > 0) {
    return { data: local, ok: false, source: 'local' }
  }
  return { ...server, source: 'server' }
}

const LOAD_ALL_TIMEOUT_MS = 60_000

async function loadAllFromServerOnce(): Promise<LoadAllFromServerResult> {
  if (isNonatoDemoBuild()) {
    return { data: {}, ok: false }
  }
  if (!isOnline()) {
    serverOffline = true
    return { data: {}, ok: false }
  }

  try {
    // Não abortar aqui só porque `serverOffline` — evita ficar preso a `{}` durante ~30s após um timeout.
    const response = await dataApiFetch(`${API_BASE}/load`, {
      signal: createTimeoutSignal(LOAD_ALL_TIMEOUT_MS),
    })

    if (!response.ok) {
      serverOffline = true
      return { data: {}, ok: false }
    }

    const result = await response.json()
    serverOffline = false
    return { data: result?.data && typeof result.data === 'object' ? result.data : {}, ok: true }
  } catch (error: any) {
    if (
      error instanceof TypeError &&
      (error.message.includes('NetworkError') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('CONNECTION_REFUSED') ||
        error.name === 'AbortError')
    ) {
      serverOffline = true
    }
    return { data: {}, ok: false }
  }
}

/** Carrega todos os ficheiros do servidor com retry (payload grande pode exceder 5s). */
export async function loadAllFromServer(): Promise<LoadAllFromServerResult> {
  const delays = [0, 700, 1800]
  let last: LoadAllFromServerResult = { data: {}, ok: false }
  for (let i = 0; i < delays.length; i++) {
    if (delays[i]! > 0) {
      await new Promise((r) => setTimeout(r, delays[i]))
    }
    last = await loadAllFromServerOnce()
    if (last.ok) return last
  }
  return last
}

const SKIP_KEYS_PUSH_SYNC = new Set([
  'nonato-sync-last-accepted-revision',
  'nonato-sync-queue',
  'nonato-auto-backups',
  'nonato-code-backups'
])

/**
 * Junta tudo o que está neste browser (localStorage nonato-* + manuais no IndexedDB) para enviar ao servidor numa única operação.
 */
export async function collectAllLocalNonatoDataForSync(): Promise<Record<string, any>> {
  const out: Record<string, any> = {}
  if (typeof window === 'undefined') return out

  const keys = new Set<string>()
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith('nonato-') && !SKIP_KEYS_PUSH_SYNC.has(k)) keys.add(k)
  }

  let manuaisMerged: any = null
  if (keys.has(MANUAIS_KEY)) {
    keys.delete(MANUAIS_KEY)
    try {
      const idb = await loadManuaisFamiliasGruposFromIdb()
      const raw = localStorage.getItem(MANUAIS_KEY)
      if (raw) {
        const local = JSON.parse(raw) as { familias?: string[]; grupos?: unknown[]; modelos?: unknown[] }
        manuaisMerged = idb && typeof idb === 'object' ? mergeManuaisFamiliasGrupos(idb as any, local) : local
      } else if (idb && typeof idb === 'object') {
        manuaisMerged = idb
      }
    } catch {
      const raw = localStorage.getItem(MANUAIS_KEY)
      if (raw) {
        try {
          manuaisMerged = JSON.parse(raw)
        } catch {
          /* ignorar */
        }
      }
    }
    if (manuaisMerged !== null && typeof manuaisMerged === 'object') {
      out[MANUAIS_KEY] = manuaisMerged
    }
  }

  /** Peças podem estar só em IndexedDB quando localStorage encheu (--idb). */
  keys.delete(PECAS_BIBLIOTECA_KEY)
  try {
    const pecasSnap = await readLocalValueForLoad(PECAS_BIBLIOTECA_KEY, true)
    if (Array.isArray(pecasSnap.parsed) && pecasSnap.parsed.length > 0) {
      out[PECAS_BIBLIOTECA_KEY] = pecasSnap.parsed
    }
  } catch {
    /* ignorar */
  }

  for (const key of Array.from(keys)) {
    const raw = localStorage.getItem(key)
    if (raw === null || raw === '') continue
    try {
      out[key] = JSON.parse(raw)
    } catch {
      out[key] = raw
    }
  }
  return out
}

const SKIP_PULL_KEYS = new Set([
  'nonato-sync-last-accepted-revision',
  'nonato-sync-queue',
  'nonato-auto-backups',
  'nonato-code-backups',
  'nonato-language',
  'nonato-protocolo-servico-draft',
  /** Preferências só deste aparelho — não sobrescrever na sync automática. */
  'nonato-bottom-tabs-order',
])

function serverPullValueIsEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value as object).length === 0
  return false
}

/**
 * Alinha localStorage com o servidor quando a diferença é só aditiva / edição remota (sem risco de apagar).
 * Não envia nada ao servidor — quebra o ciclo «atualizar num aparelho → aviso infinito nos outros».
 */
export async function applyNonBlockingServerPull(server: Record<string, unknown>): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const local = collectLocalNonatoSnapshotForPull()
  if (!canAutoPullServerChanges(server, local)) return false

  let changed = false
  const keys = new Set([...Object.keys(server), ...Object.keys(local)])

  for (const key of keys) {
    if (!key.startsWith('nonato-') || SKIP_PULL_KEYS.has(key) || key.endsWith('.json')) continue
    const s = server[key]
    const l = local[key]
    const hasS = !serverPullValueIsEmpty(s)
    const hasL = !serverPullValueIsEmpty(l)

    if (!hasS && hasL) continue
    if (!hasS && !hasL) continue
    if (hasS && !hasL) {
      await writeLocalFromServerPull(key, s)
      changed = true
      continue
    }
    try {
      const ns = JSON.stringify(s)
      const nl = JSON.stringify(l)
      if (ns !== nl) {
        await writeLocalFromServerPull(key, s)
        changed = true
      }
    } catch {
      await writeLocalFromServerPull(key, s)
      changed = true
    }
  }

  return changed
}

function collectLocalNonatoSnapshotForPull(): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (typeof window === 'undefined') return out
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k || !k.startsWith('nonato-') || SKIP_PULL_KEYS.has(k)) continue
    const raw = localStorage.getItem(k)
    if (raw === null || raw === '') continue
    try {
      out[k] = JSON.parse(raw) as unknown
    } catch {
      out[k] = raw
    }
  }
  return out
}

async function writeLocalFromServerPull(key: string, value: unknown): Promise<void> {
  if (typeof window === 'undefined') return
  if (key === PECAS_BIBLIOTECA_KEY && Array.isArray(value)) {
    let localParsed: unknown = null
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        localParsed = JSON.parse(raw)
      } catch {
        /* ignorar */
      }
    }
    const merged = mergePecasBibliotecaArrays(value, localParsed)
    writeLocalStorageValue(key, merged)
    if (pecasBibliotecaArraysDiffer(merged, value)) {
      scheduleServerMigrationPush(key, merged)
    }
    return
  }
  if (key === MANUAIS_KEY) {
    await saveManuaisFamiliasGruposToIdb(value)
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      try {
        localStorage.setItem(`${key}--idb`, '1')
      } catch {
        /* ignorar */
      }
    }
    return
  }
  if (key === CLIENTES_KEY) {
    let localParsed: unknown = null
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        localParsed = JSON.parse(raw)
      } catch {
        /* ignorar */
      }
    }
    const merged = mergeNonatoClientesDeferServerLocal(value, localParsed)
    try {
      await saveKv(key, merged)
    } catch {
      /* ignorar */
    }
    writeLocalStorageValue(key, merged)
    try {
      if (JSON.stringify(merged) !== JSON.stringify(value)) {
        scheduleServerMigrationPush(key, merged)
      }
    } catch {
      /* ignorar */
    }
    return
  }
  if (key === SIDEBAR_BUTTONS_KEY) {
    let localParsed: unknown = null
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        localParsed = JSON.parse(raw)
      } catch {
        /* ignorar */
      }
    }
    const merged = repairSidebarButtonsFromCatalog(
      mergeSidebarButtonsDeferLocal(value, localParsed)
    )
    try {
      await saveKv(key, merged)
    } catch {
      /* ignorar */
    }
    writeLocalStorageValue(key, merged)
    try {
      if (JSON.stringify(merged) !== JSON.stringify(value)) {
        scheduleServerMigrationPush(key, merged)
      }
    } catch {
      /* ignorar */
    }
    return
  }
  writeLocalStorageValue(key, value)
}

/**
 * Sincronização silenciosa: servidor manda nos dados partilhados (sem modal).
 * Devolve lista de chaves alteradas no localStorage.
 */
export async function applySilentServerSync(server: Record<string, unknown>): Promise<string[]> {
  if (typeof window === 'undefined') return []
  const changedKeys: string[] = []
  for (const key of Object.keys(server)) {
    if (!key.startsWith('nonato-') || SKIP_PULL_KEYS.has(key) || key.endsWith('.json')) continue
    const s = server[key]
    if (serverPullValueIsEmpty(s)) continue
    const raw = localStorage.getItem(key)
    let same = false
    if (raw !== null && raw !== '') {
      try {
        same = JSON.stringify(JSON.parse(raw)) === JSON.stringify(s)
      } catch {
        same = raw === String(s)
      }
    }
    if (same) continue
    await writeLocalFromServerPull(key, s)
    changedKeys.push(key)
    try {
      window.dispatchEvent(new CustomEvent('nonato-data-local-changed', { detail: { key } }))
    } catch {
      /* ignorar */
    }
  }
  return changedKeys
}

export type SilentServerSyncResult = 'noop' | 'ok' | 'fail'

/** Puxa servidor → local, alinha revisão; não recarrega a página (evita reinício inesperado). */
export async function runSilentServerSync(expectedRevision?: number): Promise<SilentServerSyncResult> {
  if (typeof window === 'undefined') return 'fail'
  if (isNonatoDemoBuild()) return 'noop'
  try {
    const { data: serverData, ok } = await loadAllFromServer()
    if (!ok || Object.keys(serverData).length === 0) return 'fail'
    const changedKeys = await applySilentServerSync(serverData as Record<string, unknown>)
    const st = await fetchSyncStatus()
    const rev = Math.max(expectedRevision ?? 0, st?.revision ?? 0)
    if (Number.isFinite(rev) && rev > 0) {
      setLastAcceptedRevision(rev)
    }
    if (changedKeys.length === 0) return 'noop'
    return 'ok'
  } catch {
    return 'fail'
  }
}

/** Envia toda a cópia local para o servidor (substitui ficheiros no servidor pelos deste aparelho). Uma revisão. */
export async function pushAllLocalStorageToServer(): Promise<{ ok: boolean; error?: string }> {
  if (isNonatoDemoBuild()) {
    return { ok: true }
  }
  try {
    const data = omitEmptyProtectedKeysForServerPush(await collectAllLocalNonatoDataForSync())
    if (Object.keys(data).length === 0) {
      return { ok: false, error: 'empty' }
    }
    const ok = await saveAllToServer(data, { timeoutMs: 180000 })
    if (!ok) return { ok: false, error: 'network_or_server' }
    const st = await fetchSyncStatus()
    if (st) applyRevisionFromSaveResponse({ revision: st.revision })
    return { ok: true }
  } catch (e) {
    console.error('[pushAllLocalStorageToServer]', e)
    return { ok: false, error: 'exception' }
  }
}

// Salvar todos os dados de uma vez
export async function saveAllToServer(
  data: Record<string, any>,
  opts?: { timeoutMs?: number }
): Promise<boolean> {
  const timeoutMs = opts?.timeoutMs ?? 10000
  if (isNonatoDemoBuild()) {
    return true
  }
  if (!isOnline()) {
    serverOffline = true
    for (const [key, value] of Object.entries(data)) {
      enqueueSyncItem(key, value)
    }
    return false
  }
  if (serverOffline) {
    const ok = await checkServerOnline()
    if (!ok) return false
  }

  try {
    const safeData: Record<string, any> = {}
    for (const [key, value] of Object.entries(data)) {
      if (await shouldBlockEmptyServerOverwrite(key, value)) {
        console.warn(
          `[Nonato] save-all: «${key}» vazio ignorado — mantém-se o cadastro no servidor.`
        )
        continue
      }
      safeData[key] = value
    }
    if (Object.keys(safeData).length === 0) {
      return false
    }
    const response = await fetch(`${API_BASE}/save-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(safeData),
      signal: createTimeoutSignal(timeoutMs)
    })

    if (!response.ok) {
      serverOffline = true
      return false
    }

    serverOffline = false
    try {
      const json = await response.json()
      applyRevisionFromSaveResponse(json)
    } catch {
      /* ignorar */
    }
    return true
  } catch (error: any) {
    // Detectar erros de conexão
    if (
      error instanceof TypeError && 
      (error.message.includes('NetworkError') || 
       error.message.includes('Failed to fetch') ||
       error.message.includes('CONNECTION_REFUSED') ||
       error.name === 'AbortError')
    ) {
      serverOffline = true
      return false
    }
    return false
  }
}

// Função híbrida: salva no localStorage E no servidor
/** @returns `true` se não houve envio ao servidor ou o envio (com `awaitServer`) foi bem-sucedido; `false` se `awaitServer` e o servidor falhou. */
export async function saveData(
  key: string,
  value: any,
  saveToLocalStorage = true,
  awaitServer = false
): Promise<boolean> {
  /** Manuais: IndexedDB primeiro (PDFs grandes); localStorage é opcional; não falhar se quota estourar */
  if (key === MANUAIS_KEY && typeof window !== 'undefined') {
    /** IndexedDB é a fonte de verdade local; o servidor pode ser lento ou falhar (413, rede) — não bloquear a UI */
    await saveManuaisFamiliasGruposToIdb(value)
    if (saveToLocalStorage) {
      try {
        localStorage.setItem(key, JSON.stringify(value))
      } catch (e) {
        console.warn(`localStorage cheio para ${key}; dados em IndexedDB`, e)
        try {
          localStorage.setItem(`${key}--idb`, '1')
        } catch {
          /* ignorar */
        }
      }
    }
    let manuaisServerOk = true
    if (!shouldDeferImplicitServerPush()) {
      const p = saveToServer(key, value).catch(() => false)
      if (awaitServer) manuaisServerOk = (await p) === true
    }
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('nonato-data-local-changed', { detail: { key } }))
      } catch {
        /* ignorar */
      }
    }
    return manuaisServerOk
  }

  /** Biblioteca de peças (~10 MB com imagens): IndexedDB primeiro; localStorage se couber. */
  if (key === PECAS_BIBLIOTECA_KEY && typeof window !== 'undefined' && Array.isArray(value)) {
    await savePecasBibliotecaLocally(value)
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('nonato-data-local-changed', { detail: { key } }))
      } catch {
        /* ignorar */
      }
    }
    if (!shouldDeferImplicitServerPush()) {
      const p = saveToServer(key, value).catch(() => false)
      if (awaitServer) return (await p) === true
    }
    return true
  }

  // Salvar no localStorage (para acesso rápido) — quota: libertar backups automáticos e voltar a tentar; último recurso: IndexedDB
  if (saveToLocalStorage && typeof window !== 'undefined') {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value)
    try {
      setItemWithQuotaRecovery(key, serialized)
    } catch (error) {
      console.error(`Erro ao salvar no localStorage (${key}):`, error)
      if (key === MANUAIS_KEY) {
        throw error
      }
      try {
        await saveKv(key, value)
        console.warn(`[saveData] ${key} guardado em IndexedDB (localStorage sem espaço).`)
      } catch (idbErr) {
        console.error(`Erro ao salvar no IndexedDB (${key}):`, idbErr)
        throw idbErr
      }
    }
    if (key === CLIENTES_KEY) {
      try {
        await saveKv(key, value)
      } catch (idbErr) {
        console.warn(`[saveData] espelho IndexedDB falhou para ${key}`, idbErr)
      }
    }
  } else if (key === CLIENTES_KEY && typeof window !== 'undefined') {
    try {
      await saveKv(key, value)
    } catch (idbErr) {
      console.warn(`[saveData] espelho IndexedDB falhou para ${key}`, idbErr)
    }
  }

  // Servidor — por defeito em segundo plano; `awaitServer` para alinhar revisão de sync (logos, etc.)
  let serverOk = true
  if (!shouldDeferImplicitServerPush()) {
    const p = saveToServer(key, value).catch(() => false)
    if (awaitServer) {
      serverOk = (await p) === true
    } else {
      void p
    }
  }

  if (typeof window !== 'undefined' && saveToLocalStorage) {
    try {
      window.dispatchEvent(new CustomEvent('nonato-data-local-changed', { detail: { key } }))
    } catch {
      /* ignorar */
    }
  }
  return serverOk
}

async function readLocalValueForLoad(
  key: string,
  parseJson: boolean
): Promise<{ parsed: unknown; raw: string | null }> {
  if (typeof window === 'undefined') return { parsed: null, raw: null }

  if (key === PECAS_BIBLIOTECA_KEY && parseJson) {
    let fromLs: unknown[] | null = null
    const raw = localStorage.getItem(key)
    if (raw !== null && raw !== '') {
      try {
        const parsed = JSON.parse(raw) as unknown
        if (Array.isArray(parsed)) fromLs = parsed
      } catch {
        /* ignorar */
      }
    }
    let fromIdb: unknown[] | null = null
    try {
      const idb = await getKv(key)
      if (Array.isArray(idb)) fromIdb = idb
    } catch {
      /* ignorar */
    }
    const best =
      fromLs && fromIdb
        ? fromIdb.length >= fromLs.length
          ? fromIdb
          : fromLs
        : fromIdb || fromLs
    if (best) return { parsed: best, raw }
  }

  const raw = localStorage.getItem(key)
  if (raw !== null && raw !== '') {
    if (!parseJson) return { parsed: raw, raw }
    try {
      return { parsed: JSON.parse(raw), raw }
    } catch {
      return { parsed: null, raw }
    }
  }
  try {
    const fromKv = await getKv(key)
    if (fromKv !== null && fromKv !== undefined) {
      return { parsed: fromKv, raw: null }
    }
  } catch {
    /* ignorar */
  }
  return { parsed: null, raw: null }
}

function shouldPreferLocalOverServerOnLoad(key: string, serverValue: unknown, localParsed: unknown): boolean {
  if (!serverKeyHasMeaningfulData(serverValue) && serverKeyHasMeaningfulData(localParsed)) {
    return true
  }
  if (
    (NONATO_CRITICAL_CADASTRO_KEYS as readonly string[]).includes(key) &&
    !serverKeyHasMeaningfulData(serverValue) &&
    serverKeyHasMeaningfulData(localParsed)
  ) {
    return true
  }
  if (Array.isArray(serverValue) && serverValue.length === 0 && Array.isArray(localParsed) && localParsed.length > 0) {
    return true
  }
  if (
    key === PECAS_BIBLIOTECA_KEY &&
    Array.isArray(serverValue) &&
    Array.isArray(localParsed) &&
    localParsed.length > serverValue.length
  ) {
    return true
  }
  if (
    typeof serverValue === 'object' &&
    serverValue !== null &&
    !Array.isArray(serverValue) &&
    Object.keys(serverValue).length === 0 &&
    typeof localParsed === 'object' &&
    localParsed !== null &&
    !Array.isArray(localParsed) &&
    Object.keys(localParsed as object).length > 0
  ) {
    return true
  }
  return false
}

function writeLocalStorageValue(key: string, value: unknown): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
  } catch (error) {
    console.error(`Erro ao atualizar localStorage (${key}):`, error)
  }
}

function scheduleServerMigrationPush(key: string, value: unknown): void {
  if (blockImplicitServerPushDuringBootstrap || serverOffline) return
  saveToServer(key, value).catch(() => {})
}

// Função híbrida: carrega do servidor primeiro, depois do localStorage como fallback
export async function loadData(key: string, parseJson = true): Promise<any | null> {
  // Tentar carregar do servidor primeiro (apenas se não estiver offline)
  if (!serverOffline) {
    let serverData = await loadFromServer(key)
    if (serverData !== null) {
      // Manuais guardados como JSON em .txt (payload grande)
      if (key === MANUAIS_KEY && typeof serverData === 'string' && parseJson) {
        try {
          serverData = JSON.parse(serverData)
        } catch {
          serverData = null
        }
      }
      // Biblioteca de logos em .txt (JSON serializado) — devolver array como no .json
      if (key === 'nonato-logos-relatorios' && typeof serverData === 'string' && parseJson) {
        try {
          const parsed = JSON.parse(serverData) as unknown
          if (Array.isArray(parsed)) serverData = parsed
        } catch {
          /* manter string; consumidor valida */
        }
      }
      // Manuais: nunca substituir o local só pelo servidor — fundir para não perder PDFs
      if (key === MANUAIS_KEY && parseJson && typeof serverData === 'object' && serverData !== null && !Array.isArray(serverData)) {
        const localRaw = typeof window !== 'undefined' ? localStorage.getItem(key) : null
        let idbLocal: any = null
        try {
          idbLocal = await loadManuaisFamiliasGruposFromIdb()
        } catch {
          /* ignorar */
        }
        if (localRaw !== null && localRaw !== '') {
          try {
            const local = JSON.parse(localRaw)
            const merged = mergeManuaisFamiliasGrupos(
              mergeManuaisFamiliasGrupos(serverData, idbLocal || {}),
              local
            )
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem(key, JSON.stringify(merged))
              } catch (error) {
                console.error(`Erro ao atualizar localStorage (${key}):`, error)
              }
            }
            saveManuaisFamiliasGruposToIdb(merged).catch(() => {})
            return merged
          } catch {
            /* fallback abaixo */
          }
        } else if (idbLocal && typeof idbLocal === 'object') {
          const merged = mergeManuaisFamiliasGrupos(serverData, idbLocal)
          saveManuaisFamiliasGruposToIdb(merged).catch(() => {})
          return merged
        }
      }
      if (serverData !== null) {
        const localSnapshot = await readLocalValueForLoad(key, parseJson)

        if (
          key === PECAS_BIBLIOTECA_KEY &&
          parseJson &&
          Array.isArray(serverData) &&
          localSnapshot.parsed !== null &&
          localSnapshot.parsed !== undefined &&
          Array.isArray(localSnapshot.parsed)
        ) {
          const merged = mergePecasBibliotecaArrays(serverData, localSnapshot.parsed)
          void savePecasBibliotecaLocally(merged as unknown[])
          if (pecasBibliotecaArraysDiffer(merged, serverData)) {
            scheduleServerMigrationPush(key, merged)
          }
          return merged
        }

        // Barra lateral: preservar organização local — não empurrar ao servidor em cada loadData (evita ciclo multi-dispositivo).
        if (
          key === 'nonato-sidebar-buttons' &&
          Array.isArray(localSnapshot.parsed) &&
          localSnapshot.parsed.length > 0
        ) {
          return localSnapshot.parsed
        }

        // Servidor vazio/stale após deploy: não apagar o que já está neste aparelho
        if (shouldPreferLocalOverServerOnLoad(key, serverData, localSnapshot.parsed)) {
          if (localSnapshot.parsed !== null && localSnapshot.parsed !== undefined) {
            scheduleServerMigrationPush(key, localSnapshot.parsed)
            return localSnapshot.parsed
          }
        }

        writeLocalStorageValue(key, serverData)
        return serverData
      }
    }
  }

  // Se não encontrou no servidor ou servidor está offline, tentar localStorage / IndexedDB
  if (typeof window !== 'undefined') {
    if (key === PECAS_BIBLIOTECA_KEY && parseJson) {
      const pecasSnap = await readLocalValueForLoad(key, true)
      if (Array.isArray(pecasSnap.parsed)) {
        return pecasSnap.parsed
      }
    }
    try {
      const localData = localStorage.getItem(key)
      if (localData !== null && localData !== '') {
        if (parseJson) {
          // Tentar fazer parse do JSON
          try {
            const parsed = JSON.parse(localData)
            if (key === MANUAIS_KEY && typeof parsed === 'object' && parsed !== null) {
              try {
                const idb = await loadManuaisFamiliasGruposFromIdb()
                const merged = mergeManuaisFamiliasGrupos(parsed, idb || {})
                saveManuaisFamiliasGruposToIdb(merged).catch(() => {})
                return merged
              } catch {
                /* fallback ao parsed só com localStorage */
              }
            }
            // Se encontrou no localStorage e servidor está online, também salvar no servidor (migração)
            // Mas não bloquear se o servidor estiver offline
            if (!serverOffline && !blockImplicitServerPushDuringBootstrap) {
              saveToServer(key, parsed).catch(() => {
                // Ignorar erros de salvamento no servidor
              })
            }
            return parsed
          } catch (parseError) {
            console.error(`Erro ao fazer parse do JSON (${key}):`, parseError)
            return null
          }
        } else {
          // Se encontrou no localStorage e servidor está online, também salvar no servidor (migração)
          if (!serverOffline && !blockImplicitServerPushDuringBootstrap) {
            saveToServer(key, localData).catch(() => {
              // Ignorar erros de salvamento no servidor
            })
          }
          return localData
        }
      }
    } catch (error) {
      console.error(`Erro ao carregar do localStorage (${key}):`, error)
    }
  }

  if (key === MANUAIS_KEY && typeof window !== 'undefined') {
    try {
      const idb = await loadManuaisFamiliasGruposFromIdb()
      if (idb !== null && typeof idb === 'object') {
        return idb
      }
    } catch {
      /* ignorar */
    }
  }

  // Dados gravados só em IndexedDB quando o localStorage encheu (saveData → saveKv)
  try {
    const fromKv = await getKv(key)
    if (fromKv !== null && fromKv !== undefined) {
      return fromKv
    }
  } catch {
    /* ignorar */
  }

  return null
}

