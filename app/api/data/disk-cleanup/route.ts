/**
 * Admin / diagnóstico: limpar tmp+bak+txt redundantes e listar maiores ficheiros do volume.
 * POST = cleanup + relatório; GET = só relatório (sem apagar).
 */
import { NextRequest, NextResponse } from 'next/server'
import { assertApiAuthorized } from '../../apiSecurity'
import { rejectUnauthenticatedProductionAccess } from '../../auth/appAuth'
import { ensureDataDir, DATA_DIR } from '../shared'
import {
  cleanupDataVolume,
  getDiskFreeBytes,
  listLargestDataFiles,
} from '../diskCleanup'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function report(cleaned?: { deleted: string[]; freedApproxBytes: number }) {
  const free = getDiskFreeBytes(DATA_DIR)
  return {
    ok: true,
    dataDir: DATA_DIR,
    diskFreeBytes: free,
    diskFreeMb: free != null ? Math.round((free / (1024 * 1024)) * 10) / 10 : null,
    largestFiles: listLargestDataFiles(DATA_DIR, 20),
    cleaned: cleaned
      ? {
          deletedCount: cleaned.deleted.length,
          deleted: cleaned.deleted.slice(0, 100),
          freedApproxBytes: cleaned.freedApproxBytes,
          freedApproxMb: Math.round((cleaned.freedApproxBytes / (1024 * 1024)) * 10) / 10,
        }
      : undefined,
    hint:
      free != null && free < 5 * 1024 * 1024
        ? 'Pouco espaço livre — aumente o volume no Railway ou apague ficheiros grandes listados acima.'
        : undefined,
  }
}

export async function GET(request: NextRequest) {
  const denied = assertApiAuthorized(request)
  if (denied) return denied
  const authDenied = rejectUnauthenticatedProductionAccess(request)
  if (authDenied) return authDenied
  ensureDataDir()
  return NextResponse.json(report())
}

export async function POST(request: NextRequest) {
  const denied = assertApiAuthorized(request)
  if (denied) return denied
  const authDenied = rejectUnauthenticatedProductionAccess(request)
  if (authDenied) return authDenied
  ensureDataDir()
  const cleaned = cleanupDataVolume(DATA_DIR)
  return NextResponse.json(report(cleaned))
}
