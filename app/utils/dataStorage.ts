// Funções para salvar e carregar dados do servidor (com suporte offline)

import { mergeManuaisFamiliasGrupos } from './manuaisMerge'
import { isNonatoDemoBuild } from './nonatoDemoMode'
import { applyRevisionFromSaveResponse, fetchSyncStatus, getLastAcceptedRevision, setLastAcceptedRevision } from './syncRevision'
import { safeMergeOfflineSnapshot } from './cadastroSafety'
import {
  saveManuaisFamiliasGruposToIdb,
  loadManuaisFamiliasGruposFromIdb,
  saveKv,
  getKv,
  deleteKv,
} from './manuaisIndexedDb'
import {
  NONATO_CRITICAL_CADASTRO_KEYS,
  NONATO_PROTECTED_ARRAY_KEYS,
  serverKeyHasMeaningfulData,
} from '../lib/criticalCadastroKeys'
import { mergeArraysByIdDeferServerLocal } from '../lib/mergeArraysById'
import {
  mergePecasBibliotecaArrays,
  pecasBibliotecaArraysDiffer,
} from '../lib/mergePecasBiblioteca'
import { mergeNonatoClientesDeferServerLocal } from '../lib/clienteMergeUtils'
import {
  mergeSidebarButtonsDeferLocal,
  repairSidebarButtonsFromCatalog,
} from '../lib/sidebarMergeUtils'
import { mergeRelatoriosServicoDeferServerLocal } from '../lib/bibliotecaRelatoriosRecovery'
import {
  canAutoPullServerChanges,
} from './syncDiff'

const PECAS_BIBLIOTECA_KEY = 'nonato-pecas-biblioteca'
const PECAS_BIBLIOTECA_LITE_KEY = 'nonato-pecas-biblioteca-lite'

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

/** Aguarda sessão (login) antes de chamar APIs de dados — o arranque muitas vezes corre antes do cookie existir. */
export async function waitForDataApiAuth(maxMs = 20_000): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch('/api/auth/status', { credentials: 'include', cache: 'no-store' })
      if (res.ok) {
        const json = (await res.json()) as { authenticated?: boolean }
        if (json.authenticated) return true
      }
      const demoRes = await fetch('/api/demo/status', { credentials: 'include', cache: 'no-store' })
      if (demoRes.ok) {
        const demo = (await demoRes.json()) as { isDemo?: boolean; expired?: boolean }
        if (demo.isDemo && !demo.expired) return true
      }
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 350))
  }
  return false
}

function isPecasBibliotecaLocalParcial(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0 && value.length < 50
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
    '[saveData] localStorage sem espaço após libertar backups automáticos; fila de sync mantida intacta.'
  )
  try {
    localStorage.removeItem('nonato-code-backups')
  } catch {
    /* ignorar */
  }
  if (key === SYNC_QUEUE_KEY) {
    throw new Error('localStorage sem espaço para a fila de sync')
  }
  localStorage.setItem(key, serialized)
}

/** Pedido em curso por chave — várias chamadas seguidas partilham a mesma Promise mas o valor enviado é sempre o último (coalesce). */
const pendingSaveByKey = new Map<string, Promise<boolean>>()
/** Enquanto um POST está em curso para `key`, guarda o último valor pedido para enviar a seguir (last-write-wins). */
const coalesceNextValueByKey = new Map<string, any>()

// Resultado interno do POST ao servidor
type SaveServerResult = 'ok' | 'blocked' | 'fail'

function dispatchSyncBlocked(key: string, reason: string): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(
      new CustomEvent('nonato-sync-blocked', { detail: { key, reason } })
    )
  } catch {
    /* ignorar */
  }
}

function dispatchSaveServerResult(key: string, ok: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(
      new CustomEvent('nonato-save-server-result', { detail: { key, ok } })
    )
  } catch {
    /* ignorar */
  }
}

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
type SyncQueueItem = {
  key: string
  value: unknown
  timestamp: number
  failCount?: number
}

const SYNC_QUEUE_MAX_FAILS = 2
const SYNC_QUEUE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

/** Cache em memória quando localStorage enche — fila continua válida + espelho IndexedDB. */
let syncQueueMemoryCache: SyncQueueItem[] | null = null

function dispatchSyncQueueHydrated(): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent('nonato-sync-queue-hydrated'))
  } catch {
    /* ignorar */
  }
}

function getSyncQueue(): SyncQueueItem[] {
  if (typeof window === 'undefined') return []
  if (syncQueueMemoryCache !== null) return syncQueueMemoryCache
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    const queue = Array.isArray(parsed) ? parsed : []
    syncQueueMemoryCache = queue
    return queue
  } catch {
    return syncQueueMemoryCache ?? []
  }
}

async function mirrorSyncQueueToIdb(queue: SyncQueueItem[]): Promise<boolean> {
  if (typeof window === 'undefined') return false
  try {
    await saveKv(SYNC_QUEUE_IDB_KEY, queue)
    return true
  } catch {
    return false
  }
}

function setSyncQueue(queue: SyncQueueItem[]): void {
  if (typeof window === 'undefined') return
  syncQueueMemoryCache = queue
  let lsOk = false
  try {
    setItemWithQuotaRecovery(SYNC_QUEUE_KEY, JSON.stringify(queue))
    lsOk = true
  } catch (e) {
    console.warn('[Nonato] Fila offline: localStorage cheio — só IndexedDB + memória.', e)
    try {
      localStorage.removeItem(SYNC_QUEUE_KEY)
    } catch {
      /* ignorar */
    }
  }
  void mirrorSyncQueueToIdb(queue).then((idbOk) => {
    if (idbOk && !lsOk) {
      try {
        localStorage.removeItem(SYNC_QUEUE_KEY)
      } catch {
        /* ignorar */
      }
    }
    dispatchSyncQueueHydrated()
  })
}

/** Repõe fila offline se o localStorage foi limpo mas o espelho IndexedDB ainda existe. */
export async function hydrateSyncQueueFromIdb(): Promise<number> {
  if (typeof window === 'undefined') return 0
  try {
    const fromIdb = (await getKv(SYNC_QUEUE_IDB_KEY)) as SyncQueueItem[] | null
    if (!Array.isArray(fromIdb) || fromIdb.length === 0) return 0
    const local = getSyncQueue()
    if (local.length >= fromIdb.length) return 0
    syncQueueMemoryCache = fromIdb
    setSyncQueue(fromIdb)
    return fromIdb.length
  } catch {
    return 0
  }
}

/** Último valor por chave — evita fila com dezenas de gravações repetidas offline. */
function enqueueSyncItem(key: string, value: any): void {
  const queue = getSyncQueue().filter((item) => item.key !== key)
  queue.push({ key, value, timestamp: Date.now(), failCount: 0 })
  setSyncQueue(queue)
}

function dispatchSyncCompleted(detail: { synced: number; failed: number; discarded?: number }): void {
  if (typeof window === 'undefined') return
  try {
    window.dispatchEvent(new CustomEvent('nonato-sync-completed', { detail }))
  } catch {
    /* ignorar */
  }
}

function shouldDiscardSyncQueueItem(item: SyncQueueItem, now: number): boolean {
  const failCount = item.failCount ?? 0
  if (failCount >= SYNC_QUEUE_MAX_FAILS) return true
  if (now - item.timestamp > SYNC_QUEUE_MAX_AGE_MS) return true
  return false
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
export async function processSyncQueue(): Promise<{ synced: number; failed: number; discarded: number }> {
  if (isNonatoDemoBuild()) return { synced: 0, failed: 0, discarded: 0 }
  if (!isOnline()) return { synced: 0, failed: 0, discarded: 0 }
  const queue = getSyncQueue()
  if (queue.length === 0) return { synced: 0, failed: 0, discarded: 0 }
  let synced = 0
  let failed = 0
  let discarded = 0
  const remaining: SyncQueueItem[] = []
  const now = Date.now()
  /** Por chave, só enviar o item mais recente (último timestamp). */
  const latestByKey = new Map<string, SyncQueueItem>()
  for (const item of queue) {
    const prev = latestByKey.get(item.key)
    if (!prev || item.timestamp >= prev.timestamp) latestByKey.set(item.key, item)
  }
  for (const item of latestByKey.values()) {
    if (shouldDiscardSyncQueueItem(item, now)) {
      discarded++
      console.warn(`[Nonato] Fila offline: descartado «${item.key}» (falhas=${item.failCount ?? 0}, idade=${Math.round((now - item.timestamp) / 3600000)}h)`)
      continue
    }
    const payloadStr = typeof item.value === 'string' ? item.value : JSON.stringify(item.value)
    const slowUpload =
      payloadStr.length > 80000 ||
      (typeof item.value === 'string' &&
        item.value.length > 100000 &&
        (item.value.startsWith('data:image/') ||
          item.value.startsWith('data:video/') ||
          item.value.startsWith('data:application/pdf')))
    let result = await _doSaveToServer(item.key, item.value, { timeoutMs: slowUpload ? 120000 : 45000 })
    if (result === 'fail' && slowUpload) {
      result = await _doSaveToServer(item.key, item.value, { timeoutMs: 180000 })
    }
    if (result === 'ok') synced++
    else if (result === 'fail') {
      failed++
      remaining.push({ ...item, failCount: (item.failCount ?? 0) + 1 })
    }
    /* blocked: não reenviar — servidor tem versão mais completa */
  }
  setSyncQueue(remaining)
  if (synced > 0 || remaining.length === 0) serverOffline = false
  return { synced, failed, discarded }
}

/** Limpa fila offline presa (ex.: item obsoleto que não consegue gravar). */
export function clearPendingSyncQueue(): void {
  setSyncQueue([])
  serverOffline = false
  lastServerCheck = 0
  dispatchSyncCompleted({ synced: 0, failed: 0, discarded: 0 })
}

let autoSyncInFlight = false

/** Envia alterações pendentes — tenta gravar mesmo após falha anterior (sem bloqueio de 30s). */
export async function forceSyncPendingChanges(): Promise<{
  synced: number
  failed: number
  discarded: number
}> {
  if (isNonatoDemoBuild() || !isOnline()) return { synced: 0, failed: 0, discarded: 0 }
  serverOffline = false
  lastServerCheck = 0
  return autoSyncPendingChanges()
}

/** Envia alterações pendentes ao servidor — chamado ao voltar online ou periodicamente. */
export async function autoSyncPendingChanges(): Promise<{
  synced: number
  failed: number
  discarded: number
}> {
  if (isNonatoDemoBuild() || !isOnline()) return { synced: 0, failed: 0, discarded: 0 }
  if (autoSyncInFlight) return { synced: 0, failed: 0, discarded: 0 }
  if (getPendingSyncCount() === 0) return { synced: 0, failed: 0, discarded: 0 }
  autoSyncInFlight = true
  try {
    const result = await processSyncQueue()
    if (typeof window !== 'undefined') {
      if (result.synced > 0 || result.discarded > 0 || getPendingSyncCount() === 0) {
        dispatchSyncCompleted(result)
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

  void hydrateSyncQueueFromIdb().then((n) => {
    dispatchSyncQueueHydrated()
    if (n > 0) void autoSyncPendingChanges()
  })

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
        credentials: 'include',
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
const RELATORIOS_SERVICO_KEY = 'nonato-relatorios-servico'
/** Gravações que devem confirmar no Railway antes de dar por concluído (não inclui biblioteca — payload grande). */
const KEYS_AUTO_AWAIT_SERVER = new Set([
  RELATORIOS_SERVICO_KEY,
  CLIENTES_KEY,
  'nonato-fechamentos-relatorios',
  'nonato-fechamentos-guardados-biblioteca',
  'nonato-protocolos-servico',
  'nonato-comprovantes-despesas',
  'nonato-agendamentos',
  'nonato-ordens-servico',
])
const SYNC_QUEUE_IDB_KEY = 'nonato-sync-queue-mirror'
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
function countPecasComImagemBase64(value: unknown): number {
  if (!Array.isArray(value)) return 0
  return value.filter(
    (p) =>
      p &&
      typeof p === 'object' &&
      typeof (p as { imagem?: string }).imagem === 'string' &&
      (p as { imagem: string }).imagem.startsWith('data:')
  ).length
}

async function shouldBlockPecasImageStripOverwrite(key: string, value: unknown): Promise<boolean> {
  if (key !== PECAS_BIBLIOTECA_KEY || !Array.isArray(value)) return false
  try {
    const existing = await forceLoadCadastroFromServer(key)
    if (!Array.isArray(existing) || existing.length === 0) return false
    const oldImg = countPecasComImagemBase64(existing)
    const newImg = countPecasComImagemBase64(value)
    if (oldImg >= 10 && newImg < oldImg - 3) {
      console.warn(
        `[Nonato] Gravação bloqueada: «${key}» perderia fotos (${newImg} vs ${oldImg} no servidor).`
      )
      return true
    }
  } catch {
    /* ignorar */
  }
  return false
}

async function shouldBlockShrinkServerOverwrite(key: string, value: unknown): Promise<boolean> {
  if (!NONATO_PROTECTED_ARRAY_KEYS.has(key)) return false
  if (!Array.isArray(value)) return false
  try {
    const existing = await forceLoadCadastroFromServer(key)
    if (!Array.isArray(existing) || existing.length === 0) return false
    if (value.length >= existing.length) return false
    console.warn(
      `[Nonato] Gravação ignorada: «${key}» tem ${value.length} item(ns) — o servidor tem ${existing.length}; não substituir cadastro maior.`
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
  if (!NONATO_PROTECTED_ARRAY_KEYS.has(key) && !NONATO_ARRAY_KEYS_BLOCK_EMPTY_SERVER_OVERWRITE.has(key)) return false
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
  for (const key of NONATO_PROTECTED_ARRAY_KEYS) {
    if (isEmptyDataArray(out[key])) delete out[key]
  }
  for (const key of NONATO_ARRAY_KEYS_BLOCK_EMPTY_SERVER_OVERWRITE) {
    if (isEmptyDataArray(out[key])) delete out[key]
  }
  for (const key of MANUAIS_OBJECT_KEYS_BLOCK_EMPTY_OVERWRITE) {
    if (isEmptyManuaisLikePayload(out[key])) delete out[key]
  }
  return out
}

async function _doSaveToServer(
  key: string,
  value: any,
  opts?: { timeoutMs?: number }
): Promise<SaveServerResult> {
  if (isNonatoDemoBuild()) return 'ok'
  if (await shouldBlockEmptyServerOverwrite(key, value)) {
    console.warn(
      `[Nonato] Gravação ignorada: «${key}» vazio não pode substituir o cadastro já guardado no servidor.`
    )
    dispatchSyncBlocked(key, 'empty')
    return 'blocked'
  }
  if (await shouldBlockShrinkServerOverwrite(key, value)) {
    dispatchSyncBlocked(key, 'shrink')
    return 'blocked'
  }
  if (await shouldBlockPecasImageStripOverwrite(key, value)) {
    dispatchSyncBlocked(key, 'pecas')
    return 'blocked'
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
      signal: createTimeoutSignal(
        opts?.timeoutMs ?? (payloadNeedsSlowUpload ? 120000 : 5000)
      ),
    })
    if (response.ok) {
      serverOffline = false
      try {
        const json = await response.json()
        applyRevisionFromSaveResponse(json)
      } catch {
        /* resposta sem JSON */
      }
      return 'ok'
    }
    return 'fail'
  } catch {
    return 'fail'
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
          const result = await _doSaveToServer(key, current)
          if (result === 'ok') {
            lastOk = true
          } else if (result === 'blocked') {
            lastOk = false
            dispatchSaveServerResult(key, false)
          } else {
            lastOk = false
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

async function fetchPecasLiteFileFromServer(): Promise<unknown[] | null> {
  const url = `${API_BASE}/load?key=${encodeURIComponent(PECAS_BIBLIOTECA_LITE_KEY)}`
  const attempts: Array<() => Promise<Response>> = [
    () => dataApiFetch(url, { method: 'GET', signal: createTimeoutSignal(45_000) }),
    () => fetch(url, { method: 'GET', credentials: 'same-origin', cache: 'no-store', signal: createTimeoutSignal(45_000) }),
  ]
  for (const attempt of attempts) {
    try {
      const res = await attempt()
      if (!res.ok) continue
      const json = (await res.json()) as { data?: unknown; error?: string }
      if (json?.error === 'auth_required') continue
      if (Array.isArray(json?.data) && json.data.length > 0) {
        console.info(`[Nonato] Catálogo lite (ficheiro): ${json.data.length} peça(s).`)
        return json.data
      }
    } catch (e) {
      console.warn('[Nonato] Falha ao carregar ficheiro lite de peças:', e)
    }
  }
  return null
}

async function fetchPecasBibliotecaRepairPaginated(
  onProgress?: (loaded: number, total: number) => void
): Promise<unknown[] | null> {
  /** Modo lite: catálogo completo ~160 KB (sem fotos base64). Algumas peças têm fotos de 3+ MB. */
  serverOffline = false

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

  if (authRequired && typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
    throw new Error('auth_required')
  }

  const maxAttempts = 4
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 800 * attempt))
      all.length = 0
      offset = 0
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
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.warn('[Nonato] Reparo peças: 401 em dev — a tentar ficheiro lite')
        const lite = await fetchPecasLiteFileFromServer()
        if (Array.isArray(lite) && lite.length > 0) return lite
      }
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

    if (all.length > 0) break
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

  const authed = await waitForDataApiAuth(25_000)
  if (!authed) {
    throw new Error('auth_required')
  }

  let totalImages = 0
  let metaMessage = ''
  try {
    const metaRes = await dataApiFetch(`${API_BASE}/repair-pecas-biblioteca?meta=1`, {
      method: 'GET',
      signal: createTimeoutSignal(30_000),
    })
    if (metaRes.status === 401) {
      throw new Error('auth_required')
    }
    if (metaRes.ok) {
      const meta = (await metaRes.json()) as { totalImages?: number; message?: string; error?: string }
      if (meta?.error === 'auth_required') throw new Error('auth_required')
      if (typeof meta.totalImages === 'number') totalImages = meta.totalImages
      if (typeof meta.message === 'string') metaMessage = meta.message
    }
  } catch (e) {
    if (e instanceof Error && e.message === 'auth_required') throw e
    /* continuar — tentativa abaixo */
  }

  if (totalImages <= 0) {
    throw new Error(
      metaMessage ||
        'O servidor não tem fotos em base64 para transferir. Execute PREENCHER-FOTOS-HOMAG.bat no PC para encher a nuvem.'
    )
  }

  const byId = new Map<string, Record<string, unknown>>()
  for (const p of pecas) {
    if (p && typeof p === 'object' && 'id' in p) {
      byId.set(String((p as { id: unknown }).id), p as Record<string, unknown>)
    }
  }

  let offset = 0
  let loaded = 0
  let applied = 0
  const batchLimit = 1
  while (offset < totalImages) {
    let res: Response | null = null
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        res = await dataApiFetch(
          `${API_BASE}/repair-pecas-biblioteca?images=1&offset=${offset}&limit=${batchLimit}`,
          {
            method: 'GET',
            signal: createTimeoutSignal(240_000),
          }
        )
        if (res.ok || res.status === 401) break
      } catch {
        res = null
      }
      if (attempt < 2) await new Promise((r) => setTimeout(r, 800 * (attempt + 1)))
    }
    if (!res) break
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
        applied++
      }
      loaded++
      onProgress?.({ phase: 'images', loaded, total: totalImages })
    }
    offset += json.imagens.length
    if (loaded % 120 === 0 || !json.hasMore) {
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

  if (applied <= 0) {
    throw new Error(
      'Nenhuma foto chegou do servidor. Verifique ligação, login, ou se o Railway tem fotos guardadas (meta totalImages).'
    )
  }

  const finalSnapshot = Array.from(byId.values())
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('nonato-pecas-imagens-hidratadas', { detail: { pecas: finalSnapshot } })
      )
    }
  } catch {
    /* ignorar */
  }

  return finalSnapshot
}

export async function fetchPecasBibliotecaLiteFromServer(
  onProgress?: (loaded: number, total: number) => void
): Promise<unknown[] | null> {
  const fromFile = await fetchPecasLiteFileFromServer()
  if (Array.isArray(fromFile) && fromFile.length > 0) {
    onProgress?.(fromFile.length, fromFile.length)
    return fromFile
  }
  return fetchPecasBibliotecaRepairPaginated(onProgress)
}

export type PecasBibliotecaServerMeta = {
  total: number
  totalImages: number
  totalBase64?: number
  totalUrl?: number
  totalPlaceholder?: number
  totalSemImagem?: number
  totalFaltamFoto?: number
  comFotoReal?: number
  message?: string
}

/** Contagem no servidor (Railway) — para comparar com o catálogo local. */
export async function fetchPecasBibliotecaServerMeta(): Promise<PecasBibliotecaServerMeta | null> {
  try {
    const metaRes = await dataApiFetch(`${API_BASE}/repair-pecas-biblioteca?meta=1&lite=1`, {
      method: 'GET',
      signal: createTimeoutSignal(20_000),
    })
    if (!metaRes.ok) return null
    const meta = (await metaRes.json()) as {
      total?: number
      totalImages?: number
      totalBase64?: number
      totalUrl?: number
      totalPlaceholder?: number
      totalSemImagem?: number
      totalFaltamFoto?: number
      comFotoReal?: number
      message?: string
      error?: string
    }
    if (meta?.error === 'auth_required') return null
    if (typeof meta.total !== 'number') return null
    return {
      total: meta.total,
      totalImages: typeof meta.totalImages === 'number' ? meta.totalImages : 0,
      totalBase64: typeof meta.totalBase64 === 'number' ? meta.totalBase64 : undefined,
      totalUrl: typeof meta.totalUrl === 'number' ? meta.totalUrl : undefined,
      totalPlaceholder: typeof meta.totalPlaceholder === 'number' ? meta.totalPlaceholder : undefined,
      totalSemImagem: typeof meta.totalSemImagem === 'number' ? meta.totalSemImagem : undefined,
      totalFaltamFoto: typeof meta.totalFaltamFoto === 'number' ? meta.totalFaltamFoto : undefined,
      comFotoReal: typeof meta.comFotoReal === 'number' ? meta.comFotoReal : undefined,
      message: typeof meta.message === 'string' ? meta.message : undefined,
    }
  } catch {
    return null
  }
}

/** Arranque / botão repor: prioriza ficheiro lite (~157 KB), ignora cópia parcial no browser. */
export async function bootstrapLoadPecasBiblioteca(categoriasCount: number): Promise<unknown[] | null> {
  const threshold = Math.max(15, Math.min(categoriasCount, 80))
  const isComplete = (n: number) => n >= 50 || (categoriasCount >= 10 && n >= threshold)

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 700 * attempt))
    try {
      const fromServer = await fetchPecasBibliotecaLiteFromServer()
      if (Array.isArray(fromServer) && isComplete(fromServer.length)) {
        await savePecasBibliotecaLocally(fromServer)
        console.info(`[Nonato] Biblioteca carregada: ${fromServer.length} peça(s).`)
        return fromServer
      }
    } catch (e) {
      console.warn('[Nonato] bootstrapLoadPecasBiblioteca tentativa', attempt + 1, e)
    }
  }

  const fromLoad = await loadData(PECAS_BIBLIOTECA_KEY)
  const loadCount = Array.isArray(fromLoad) ? fromLoad.length : 0
  if (isComplete(loadCount)) return fromLoad

  try {
    await clearPecasBibliotecaLocal()
    const lastTry = await fetchPecasBibliotecaLiteFromServer()
    if (Array.isArray(lastTry) && isComplete(lastTry.length)) {
      await savePecasBibliotecaLocally(lastTry)
      return lastTry
    }
    const repaired = await fetchPecasBibliotecaRepairPaginated()
    if (Array.isArray(repaired) && isComplete(repaired.length)) {
      await savePecasBibliotecaLocally(repaired)
      return repaired
    }
  } catch {
    /* ignorar */
  }
  if (isComplete(loadCount)) return fromLoad
  return null
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

  /** Limpar cópia parcial (2 peças) que bloqueia o browser. */
  if (typeof window !== 'undefined' && local.length < 50) {
    try {
      localStorage.removeItem(PECAS_BIBLIOTECA_KEY)
      localStorage.removeItem(`${PECAS_BIBLIOTECA_KEY}--idb`)
      await saveKv(PECAS_BIBLIOTECA_KEY, [])
    } catch {
      /* ignorar */
    }
    best = []
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
    onProgress?.({ phase: 'catalog', loaded, total })
  })

  if (!Array.isArray(fromServer) || fromServer.length === 0) {
    return null
  }

  best = mergePecasBibliotecaArrays(fromServer, best) as unknown[]
  await savePecasBibliotecaLocally(best)
  try {
    sessionStorage.setItem('nonato-pecas-biblioteca-count', String(best.length))
  } catch {
    /* ignorar */
  }
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

/** Lê biblioteca já gravada neste browser (IndexedDB ou localStorage) — prioridade após recuperação. */
export async function loadPecasBibliotecaFromBrowserStorage(): Promise<unknown[] | null> {
  const snap = await readLocalValueForLoad(PECAS_BIBLIOTECA_KEY, true)
  if (Array.isArray(snap.parsed) && snap.parsed.length >= 50 && !isPecasBibliotecaLocalParcial(snap.parsed)) {
    return snap.parsed as unknown[]
  }
  return null
}

/** Remove cópia parcial da biblioteca (localStorage + IndexedDB + fila sync). */
export async function clearPecasBibliotecaLocal(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(PECAS_BIBLIOTECA_KEY)
    localStorage.removeItem(`${PECAS_BIBLIOTECA_KEY}--idb`)
    const raw = localStorage.getItem(SYNC_QUEUE_KEY)
    if (raw) {
      const q = JSON.parse(raw) as Array<{ key: string }>
      if (Array.isArray(q)) {
        const filtered = q.filter((item) => item.key !== PECAS_BIBLIOTECA_KEY)
        if (filtered.length === 0) localStorage.removeItem(SYNC_QUEUE_KEY)
        else localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered))
      }
    }
  } catch {
    /* ignorar */
  }
  try {
    await deleteKv(PECAS_BIBLIOTECA_KEY)
  } catch {
    /* ignorar */
  }
}

/**
 * Reposição de emergência — catálogo lite + recuperação de fotos já guardadas no servidor (não do site).
 */
export async function reporPecasBibliotecaEmergencia(
  onProgress?: (msg: string) => void
): Promise<unknown[] | null> {
  serverOffline = false
  onProgress?.('A carregar catálogo do servidor…')

  let localBefore: unknown[] | null = null
  try {
    localBefore = await loadPecasBibliotecaFromBrowserStorage()
  } catch {
    /* ignorar */
  }

  const cacheBust = Date.now()
  const urls = [
    `${API_BASE}/load?key=${encodeURIComponent(PECAS_BIBLIOTECA_LITE_KEY)}&_=${cacheBust}`,
    `${API_BASE}/repair-pecas-biblioteca?lite=1&offset=0&limit=500&_=${cacheBust}`,
  ]

  let catalog: unknown[] | null = null
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      })
      if (!res.ok) continue
      const json = (await res.json()) as {
        data?: unknown
        pecas?: unknown
        error?: string
        success?: boolean
      }
      if (json?.error === 'auth_required') continue
      const data = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.pecas)
          ? json.pecas
          : null
      if (!data || data.length < 50) continue
      catalog = data
      break
    } catch (e) {
      console.warn('[Nonato] reporPecasBibliotecaEmergencia tentativa falhou:', url, e)
    }
  }

  if (!catalog) return null

  await clearPecasBibliotecaLocal()
  onProgress?.(`${catalog.length} peças — a recuperar fotos do servidor…`)
  await savePecasBibliotecaLocally(catalog)

  let finalCatalog: unknown[] = catalog
  try {
    finalCatalog = await hydratePecasBibliotecaImagensFromServer(catalog, (p) => {
      if (p.phase === 'images') {
        onProgress?.(`Fotos: ${p.loaded} / ${p.total}…`)
      }
    })
    await savePecasBibliotecaLocally(finalCatalog)
    const comFoto = countPecasComImagemBase64(finalCatalog)
    console.info(`[Nonato] Reposição emergência: ${finalCatalog.length} peça(s), ${comFoto} com foto.`)
    onProgress?.(`Concluído: ${finalCatalog.length} peças, ${comFoto} fotos.`)
  } catch (e) {
    console.warn('[Nonato] Hidratação de fotos falhou parcialmente:', e)
    onProgress?.(`${catalog.length} peças (fotos incompletas — tente Repor outra vez).`)
  }

  if (localBefore && Array.isArray(localBefore) && localBefore.length > 0) {
    finalCatalog = mergePecasBibliotecaArrays(finalCatalog, localBefore)
    await savePecasBibliotecaLocally(finalCatalog)
    console.info(
      `[Nonato] Reposição emergência fundida com local: ${finalCatalog.length} peça(s) (classificações locais preservadas).`
    )
  }

  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('nonato-pecas-imagens-hidratadas', { detail: { pecas: finalCatalog } })
      )
    }
  } catch {
    /* ignorar */
  }

  return finalCatalog
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
      const merged = { ...(snap as Record<string, any>), ...fromLs }
      const snapPecas = (snap as Record<string, unknown>)[PECAS_BIBLIOTECA_KEY]
      const localPecas = fromLs[PECAS_BIBLIOTECA_KEY]
      const snapCount = Array.isArray(snapPecas) ? snapPecas.length : 0
      const localCount = Array.isArray(localPecas) ? localPecas.length : 0
      if (snapCount >= 50 && snapCount > localCount) {
        merged[PECAS_BIBLIOTECA_KEY] = snapPecas
      } else if (localCount > 0 && isPecasBibliotecaLocalParcial(localPecas) && snapCount >= 50) {
        merged[PECAS_BIBLIOTECA_KEY] = snapPecas
      } else if (localCount > 0 && isPecasBibliotecaLocalParcial(localPecas)) {
        delete merged[PECAS_BIBLIOTECA_KEY]
      }
      const snapClientes = (snap as Record<string, unknown>)[CLIENTES_KEY]
      const localClientes = fromLs[CLIENTES_KEY]
      const snapClientesCount = Array.isArray(snapClientes) ? snapClientes.length : 0
      const localClientesCount = Array.isArray(localClientes) ? localClientes.length : 0
      if (snapClientesCount > localClientesCount) {
        merged[CLIENTES_KEY] = snapClientes
      }
      return merged
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
    if (
      Array.isArray(pecasSnap.parsed) &&
      pecasSnap.parsed.length > 0 &&
      !isPecasBibliotecaLocalParcial(pecasSnap.parsed)
    ) {
      out[PECAS_BIBLIOTECA_KEY] = pecasSnap.parsed
    }
  } catch {
    /* ignorar */
  }

  /** Clientes podem estar só em IndexedDB quando localStorage encheu. */
  keys.delete(CLIENTES_KEY)
  try {
    const clientesSnap = await readLocalValueForLoad(CLIENTES_KEY, true)
    if (Array.isArray(clientesSnap.parsed) && clientesSnap.parsed.length > 0) {
      out[CLIENTES_KEY] = clientesSnap.parsed
    }
  } catch {
    /* ignorar */
  }

  /** Relatórios podem estar só em IndexedDB quando localStorage encheu. */
  keys.delete(RELATORIOS_SERVICO_KEY)
  try {
    const relSnap = await readLocalValueForLoad(RELATORIOS_SERVICO_KEY, true)
    if (Array.isArray(relSnap.parsed) && relSnap.parsed.length > 0) {
      out[RELATORIOS_SERVICO_KEY] = relSnap.parsed
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
    const snap = await readLocalValueForLoad(key, true)
    const localCount = Array.isArray(snap.parsed) ? snap.parsed.length : 0
    if (localCount > value.length && localCount >= 15) {
      console.warn(
        `[Nonato] Sync ignorada: «${key}» no servidor (${value.length}) é menor que local (${localCount}).`
      )
      return
    }
    let localParsed: unknown = snap.parsed
    const merged = mergePecasBibliotecaArrays(value, localParsed)
    await savePecasBibliotecaLocally(merged as unknown[])
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
    const localSnapshot = await readLocalValueForLoad(key, true)
    const localParsed = localSnapshot.parsed
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
  if (key === RELATORIOS_SERVICO_KEY && Array.isArray(value)) {
    const snap = await readLocalValueForLoad(key, true)
    const localParsed = snap.parsed
    const localCount = Array.isArray(localParsed) ? localParsed.length : 0
    if (localCount > value.length && localCount >= 1) {
      console.warn(
        `[Nonato] Sync relatórios: servidor (${value.length}) < local (${localCount}) — a fundir por id.`
      )
    }
    const merged = mergeRelatoriosServicoDeferServerLocal(value, localParsed)
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
  if (NONATO_PROTECTED_ARRAY_KEYS.has(key) && Array.isArray(value)) {
    const snap = await readLocalValueForLoad(key, true)
    const localParsed = snap.parsed
    const localCount = Array.isArray(localParsed) ? localParsed.length : 0
    if (localCount > value.length && localCount >= 1) {
      console.warn(
        `[Nonato] Sync «${key}»: servidor (${value.length}) < local (${localCount}) — a fundir por id.`
      )
    }
    const merged = mergeArraysByIdDeferServerLocal(value, localParsed)
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
    if (
      key === PECAS_BIBLIOTECA_KEY &&
      Array.isArray(s) &&
      s.length < 50
    ) {
      const snap = await readLocalValueForLoad(key, true)
      if (Array.isArray(snap.parsed) && snap.parsed.length > s.length) continue
      /* Nunca aplicar cópia parcial (2 peças) vinda do bundle sync */
      continue
    }
    if (key === RELATORIOS_SERVICO_KEY && Array.isArray(s)) {
      const snap = await readLocalValueForLoad(key, true)
      const localLen = Array.isArray(snap.parsed) ? snap.parsed.length : 0
      if (localLen > s.length && localLen >= 1) {
        console.warn(
          `[Nonato] Sync: servidor tem ${s.length} relatório(s), local ${localLen} — a fundir (não substituir).`
        )
      }
    }
    if (NONATO_PROTECTED_ARRAY_KEYS.has(key) && Array.isArray(s)) {
      const snap = await readLocalValueForLoad(key, true)
      const localLen = Array.isArray(snap.parsed) ? snap.parsed.length : 0
      if (localLen > s.length && localLen >= 1) {
        console.warn(
          `[Nonato] Sync «${key}»: servidor ${s.length} < local ${localLen} — a fundir (não substituir).`
        )
      }
    }
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

export type PullServerUpdatesResult = {
  status: SilentServerSyncResult | 'offline'
  changedKeys: string[]
}

/** Puxa servidor → local quando a revisão remota é mais recente (multi-dispositivo). */
export async function pullServerUpdatesIfNewer(): Promise<PullServerUpdatesResult> {
  if (typeof window === 'undefined') return { status: 'fail', changedKeys: [] }
  if (isNonatoDemoBuild()) return { status: 'noop', changedKeys: [] }
  if (!isOnline()) return { status: 'offline', changedKeys: [] }
  try {
    const st = await fetchSyncStatus()
    if (!st) return { status: 'offline', changedKeys: [] }
    const lastAcc = getLastAcceptedRevision()
    if (st.revision <= lastAcc) return { status: 'noop', changedKeys: [] }
    const { data: serverData, ok } = await loadAllFromServer()
    if (!ok || Object.keys(serverData).length === 0) return { status: 'fail', changedKeys: [] }
    const changedKeys = await applySilentServerSync(serverData as Record<string, unknown>)
    const stAfter = await fetchSyncStatus()
    const rev = Math.max(st.revision, stAfter?.revision ?? 0)
    if (Number.isFinite(rev) && rev > 0) setLastAcceptedRevision(rev)
    if (changedKeys.length > 0) {
      try {
        window.dispatchEvent(
          new CustomEvent('nonato-server-pull-complete', { detail: { changedKeys } })
        )
      } catch {
        /* ignorar */
      }
    }
    return { status: changedKeys.length > 0 ? 'ok' : 'noop', changedKeys }
  } catch {
    return { status: 'fail', changedKeys: [] }
  }
}

/** Puxa servidor → local, alinha revisão; não recarrega a página (evita reinício inesperado). */
export async function runSilentServerSync(expectedRevision?: number): Promise<SilentServerSyncResult> {
  const pulled = await pullServerUpdatesIfNewer()
  if (pulled.status === 'offline') return 'fail'
  if (pulled.status === 'fail') return 'fail'
  if (pulled.status === 'ok') return 'ok'
  if (expectedRevision != null && expectedRevision > getLastAcceptedRevision()) {
    setLastAcceptedRevision(expectedRevision)
  }
  return 'noop'
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
      if (await shouldBlockShrinkServerOverwrite(key, value)) {
        continue
      }
      if (await shouldBlockPecasImageStripOverwrite(key, value)) {
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
  const effectiveAwaitServer =
    awaitServer ||
    (!shouldDeferImplicitServerPush() && KEYS_AUTO_AWAIT_SERVER.has(key))
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
      if (effectiveAwaitServer) manuaisServerOk = (await p) === true
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
      if (effectiveAwaitServer) return (await p) === true
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
    if (key === RELATORIOS_SERVICO_KEY && Array.isArray(value)) {
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
    if (effectiveAwaitServer) {
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
  if (effectiveAwaitServer && typeof window !== 'undefined') {
    dispatchSaveServerResult(key, serverOk)
  }
  return serverOk
}

async function readLocalValueForLoad(
  key: string,
  parseJson: boolean
): Promise<{ parsed: unknown; raw: string | null }> {
  if (typeof window === 'undefined') return { parsed: null, raw: null }

  const readArrayBestOfLsIdb = async (): Promise<{ parsed: unknown; raw: string | null }> => {
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
    return { parsed: null, raw: null }
  }

  if ((key === PECAS_BIBLIOTECA_KEY || key === RELATORIOS_SERVICO_KEY || key === CLIENTES_KEY) && parseJson) {
    return readArrayBestOfLsIdb()
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
    key === RELATORIOS_SERVICO_KEY &&
    Array.isArray(serverValue) &&
    Array.isArray(localParsed) &&
    localParsed.length > serverValue.length
  ) {
    return true
  }
  if (
    key === CLIENTES_KEY &&
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

        if (
          key === CLIENTES_KEY &&
          parseJson &&
          Array.isArray(serverData) &&
          localSnapshot.parsed !== null &&
          localSnapshot.parsed !== undefined &&
          Array.isArray(localSnapshot.parsed)
        ) {
          const merged = mergeNonatoClientesDeferServerLocal(serverData, localSnapshot.parsed)
          writeLocalStorageValue(key, merged)
          try {
            await saveKv(key, merged)
          } catch {
            /* ignorar */
          }
          if (JSON.stringify(merged) !== JSON.stringify(serverData)) {
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
      if (Array.isArray(pecasSnap.parsed) && !isPecasBibliotecaLocalParcial(pecasSnap.parsed)) {
        return pecasSnap.parsed
      }
    }
    try {
      const localData = localStorage.getItem(key)
      if (localData !== null && localData !== '') {
        if (parseJson) {
          try {
            const parsed = JSON.parse(localData)
            if (key === PECAS_BIBLIOTECA_KEY && isPecasBibliotecaLocalParcial(parsed)) {
              /* ignorar cópia parcial — preferir IndexedDB abaixo ou reparo do servidor */
            } else {
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
              if (!serverOffline && !blockImplicitServerPushDuringBootstrap) {
                saveToServer(key, parsed).catch(() => {
                  /* Ignorar erros de salvamento no servidor */
                })
              }
              return parsed
            }
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
      if (key === PECAS_BIBLIOTECA_KEY && Array.isArray(fromKv) && isPecasBibliotecaLocalParcial(fromKv)) {
        return null
      }
      return fromKv
    }
  } catch {
    /* ignorar */
  }

  return null
}

