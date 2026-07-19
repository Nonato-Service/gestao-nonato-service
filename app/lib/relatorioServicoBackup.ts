import { mergeRelatoriosServicoDeferServerLocal, type RelatorioServicoMin } from './bibliotecaRelatoriosRecovery'

const BACKUP_KEY = 'nonato-relatorios-servico-backup-v1'
const MAX_SNAPSHOTS = 40

type RelatorioBackupSnapshot = {
  at: string
  count: number
  relatorios: RelatorioServicoMin[]
}

/** Cópia de segurança local a cada gravação — não depende do servidor. */
export function snapshotRelatoriosServicoBackup(relatorios: RelatorioServicoMin[]): void {
  if (typeof window === 'undefined' || !Array.isArray(relatorios) || relatorios.length === 0) return
  try {
    const raw = localStorage.getItem(BACKUP_KEY)
    const list: RelatorioBackupSnapshot[] = raw ? (JSON.parse(raw) as RelatorioBackupSnapshot[]) : []
    const snap: RelatorioBackupSnapshot = {
      at: new Date().toISOString(),
      count: relatorios.length,
      relatorios,
    }
    const next = [snap, ...(Array.isArray(list) ? list : [])].slice(0, MAX_SNAPSHOTS)
    localStorage.setItem(BACKUP_KEY, JSON.stringify(next))
  } catch {
    try {
      localStorage.removeItem(BACKUP_KEY)
      localStorage.setItem(
        BACKUP_KEY,
        JSON.stringify([
          {
            at: new Date().toISOString(),
            count: relatorios.length,
            relatorios,
          },
        ])
      )
    } catch {
      /* ignorar quota */
    }
  }
}

/** Repõe relatórios a partir dos snapshots locais (últimos 40 saves). */
export function restaurarRelatoriosDeBackupsLocais(
  actuais: RelatorioServicoMin[]
): { relatorios: RelatorioServicoMin[]; recuperados: number } {
  if (typeof window === 'undefined') return { relatorios: actuais, recuperados: 0 }
  try {
    const raw = localStorage.getItem(BACKUP_KEY)
    if (!raw) return { relatorios: actuais, recuperados: 0 }
    const list = JSON.parse(raw) as RelatorioBackupSnapshot[]
    if (!Array.isArray(list) || list.length === 0) return { relatorios: actuais, recuperados: 0 }

    const idsAntes = new Set(actuais.filter((r) => r?.id).map((r) => String(r.id)))
    let merged = actuais
    for (const snap of list) {
      if (!snap?.relatorios || !Array.isArray(snap.relatorios)) continue
      merged = mergeRelatoriosServicoDeferServerLocal(snap.relatorios, merged)
    }
    let recuperados = 0
    for (const r of merged) {
      if (r?.id && !idsAntes.has(String(r.id))) recuperados++
    }
    return { relatorios: merged, recuperados }
  } catch {
    return { relatorios: actuais, recuperados: 0 }
  }
}
