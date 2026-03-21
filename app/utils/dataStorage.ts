// Funções para salvar e carregar dados do servidor (com suporte offline)

import { mergeManuaisFamiliasGrupos } from './manuaisMerge'
import { saveManuaisFamiliasGruposToIdb, loadManuaisFamiliasGruposFromIdb } from './manuaisIndexedDb'

const API_BASE = '/api/data'
const SYNC_QUEUE_KEY = 'nonato-sync-queue'

// Cache para evitar requisições duplicadas simultâneas
const pendingRequests = new Map<string, Promise<boolean>>()

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
    const response = await fetch(`${API_BASE}/load?key=__health_check__`, {
      method: 'GET',
      signal: createTimeoutSignal(3000)
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
  if (!isOnline()) return { synced: 0, failed: 0 }
  const queue = getSyncQueue()
  if (queue.length === 0) return { synced: 0, failed: 0 }
  let synced = 0
  let failed = 0
  const remaining: typeof queue = []
  for (const item of queue) {
    const ok = await _doSaveToServer(item.key, item.value)
    if (ok) synced++
    else {
      failed++
      remaining.push(item)
    }
  }
  setSyncQueue(remaining)
  serverOffline = false
  return { synced, failed }
}

// Quantidade de itens pendentes de sincronização
export function getPendingSyncCount(): number {
  return getSyncQueue().length
}

// Salvar diretamente no servidor (sem fila) - uso interno
const MANUAIS_KEY = 'nonato-manuais-familias-grupos'

async function _doSaveToServer(key: string, value: any): Promise<boolean> {
  try {
    const payloadStr = typeof value === 'string' ? value : JSON.stringify(value)
    const isLargeString =
      typeof value === 'string' &&
      value.length > 100000 &&
      (value.startsWith('data:image/') || value.startsWith('data:video/') || value.startsWith('data:application/pdf'))
    /** Manuais com PDFs em base64: JSON grande — usar save-text para não estourar limites do /save */
    const isLargeManuaisJson = key === MANUAIS_KEY && payloadStr.length > 80000
    const useTextEndpoint = isLargeString || isLargeManuaisJson
    const endpoint = useTextEndpoint ? `${API_BASE}/save-text` : `${API_BASE}/save`
    const body =
      isLargeManuaisJson && typeof value === 'object'
        ? JSON.stringify({ key, value: payloadStr })
        : JSON.stringify({ key, value })
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: createTimeoutSignal(isLargeManuaisJson ? 120000 : 5000)
    })
    if (response.ok) {
      serverOffline = false
      return true
    }
    return false
  } catch {
    return false
  }
}

// Salvar um item específico
export async function saveToServer(key: string, value: any): Promise<boolean> {
  const requestKey = `save:${key}`
  if (pendingRequests.has(requestKey)) return pendingRequests.get(requestKey)!

  if (serverOffline) {
    const ok = await checkServerOnline()
    if (!ok) return false
  }

  const requestPromise = (async () => {
    if (!isOnline()) {
      serverOffline = true
      const queue = getSyncQueue()
      queue.push({ key, value, timestamp: Date.now() })
      setSyncQueue(queue)
      setTimeout(() => pendingRequests.delete(requestKey), 500)
      return false
    }
    try {
      const ok = await _doSaveToServer(key, value)
      if (ok) return true
      serverOffline = true
      const queue = getSyncQueue()
      queue.push({ key, value, timestamp: Date.now() })
      setSyncQueue(queue)
      return false
    } catch (error: any) {
      const isNetworkError = error instanceof TypeError || error?.name === 'AbortError' ||
        (error?.message && (error.message.includes('NetworkError') || error.message.includes('Failed to fetch') || error.message.includes('CONNECTION_REFUSED')))
      if (isNetworkError) {
        serverOffline = true
        const queue = getSyncQueue()
        queue.push({ key, value, timestamp: Date.now() })
        setSyncQueue(queue)
      }
      return false
    } finally {
      setTimeout(() => pendingRequests.delete(requestKey), 1000)
    }
  })()
  pendingRequests.set(requestKey, requestPromise)
  return requestPromise
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

  try {
    // Tentar carregar como texto primeiro (para vídeos/imagens grandes)
    const response = await fetch(`${API_BASE}/load-text?key=${encodeURIComponent(key)}`, {
      signal: createTimeoutSignal(5000) // Timeout de 5 segundos (compatível com todos os navegadores)
    })
    
    if (!response.ok) {
      serverOffline = true
      return null
    }

    const result = await response.json()
    serverOffline = false
    return result.data
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
      return null
    }
    return null
  }
}

// Carregar todos os dados
export async function loadAllFromServer(): Promise<Record<string, any>> {
  if (!isOnline()) {
    serverOffline = true
    return {}
  }
  if (serverOffline) {
    const ok = await checkServerOnline()
    if (!ok) return {}
  }

  try {
    const response = await fetch(`${API_BASE}/load`, {
      signal: createTimeoutSignal(5000) // Timeout de 5 segundos
    })
    
    if (!response.ok) {
      serverOffline = true
      return {}
    }

    const result = await response.json()
    serverOffline = false
    return result.data || {}
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
      return {}
    }
    return {}
  }
}

// Salvar todos os dados de uma vez
export async function saveAllToServer(data: Record<string, any>): Promise<boolean> {
  if (!isOnline()) {
    serverOffline = true
    for (const [key, value] of Object.entries(data)) {
      const queue = getSyncQueue()
      queue.push({ key, value, timestamp: Date.now() })
      setSyncQueue(queue)
    }
    return false
  }
  if (serverOffline) {
    const ok = await checkServerOnline()
    if (!ok) return false
  }

  try {
    const response = await fetch(`${API_BASE}/save-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: createTimeoutSignal(10000) // Timeout de 10 segundos para operações grandes
    })

    if (!response.ok) {
      serverOffline = true
      return false
    }

    serverOffline = false
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
export async function saveData(key: string, value: any, saveToLocalStorage = true): Promise<void> {
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
    void saveToServer(key, value).catch(() => {})
    return
  }

  // Salvar no localStorage (para acesso rápido) - falha aqui deve ser reportada ao caller
  if (saveToLocalStorage && typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
    } catch (error) {
      console.error(`Erro ao salvar no localStorage (${key}):`, error)
      throw error
    }
  }

  // Salvar no servidor (para persistência)
  await saveToServer(key, value)
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
            saveToServer(key, merged).catch(() => {})
            return merged
          } catch {
            /* fallback abaixo */
          }
        } else if (idbLocal && typeof idbLocal === 'object') {
          const merged = mergeManuaisFamiliasGrupos(serverData, idbLocal)
          saveManuaisFamiliasGruposToIdb(merged).catch(() => {})
          saveToServer(key, merged).catch(() => {})
          return merged
        }
      }
      if (serverData !== null) {
        // Se encontrou no servidor, também atualizar o localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(key, typeof serverData === 'string' ? serverData : JSON.stringify(serverData))
          } catch (error) {
            console.error(`Erro ao atualizar localStorage (${key}):`, error)
          }
        }
        return serverData
      }
    }
  }

  // Se não encontrou no servidor ou servidor está offline, tentar localStorage
  if (typeof window !== 'undefined') {
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
                if (!serverOffline) {
                  saveToServer(key, merged).catch(() => {})
                }
                return merged
              } catch {
                /* fallback ao parsed só com localStorage */
              }
            }
            // Se encontrou no localStorage e servidor está online, também salvar no servidor (migração)
            // Mas não bloquear se o servidor estiver offline
            if (!serverOffline) {
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
          if (!serverOffline) {
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

  return null
}

