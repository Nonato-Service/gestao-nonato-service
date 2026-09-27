/**
 * Evita gravar e evitar bump de revisão quando o payload é idêntico ao ficheiro existente.
 * Reduz ciclos de «sincronização pendente» entre notebook/tablet por saves automáticos sem alteração real.
 * Escrita atómica (.tmp + rename); limpa órfãos ENOSPC e não deixa .bak a duplicar o disco.
 */
import fs from 'fs'
import path from 'path'
import {
  cleanupDirSpace,
  cleanupDataVolume,
  getDiskFreeBytes,
  isEnospcError,
} from './diskCleanup'
import { DATA_DIR } from './shared'

export function serializeJsonForDisk(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

export function jsonFileContentUnchanged(filePath: string, value: unknown): boolean {
  const next = serializeJsonForDisk(value)
  try {
    if (!fs.existsSync(filePath)) return false
    const prev = fs.readFileSync(filePath, 'utf-8')
    return prev === next
  } catch {
    return false
  }
}

export function textFileContentUnchanged(filePath: string, nextText: string): boolean {
  try {
    if (!fs.existsSync(filePath)) return false
    const prev = fs.readFileSync(filePath, 'utf-8')
    return prev === nextText
  } catch {
    return false
  }
}

function reclaimSpaceBeforeWrite(dir: string): void {
  try {
    cleanupDirSpace(dir)
  } catch {
    /* ignorar */
  }
  try {
    if (path.resolve(dir) !== path.resolve(DATA_DIR)) {
      cleanupDataVolume(DATA_DIR)
    }
  } catch {
    /* ignorar */
  }
}

/** Grava texto de forma atómica (.tmp + rename) — evita JSON truncado em crash/OOM. */
export function writeTextFileAtomic(filePath: string, content: string): void {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (filePath.endsWith('.json')) {
    JSON.parse(content)
  }

  reclaimSpaceBeforeWrite(dir)

  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`
  const bak = `${filePath}.bak`
  const bytes = Buffer.byteLength(content, 'utf-8')
  const free = getDiskFreeBytes(dir)
  const skipBak = free != null && free < bytes * 2.5

  const writeTmp = () => {
    fs.writeFileSync(tmp, content, 'utf-8')
  }

  try {
    writeTmp()
  } catch (e) {
    if (!isEnospcError(e)) throw e
    reclaimSpaceBeforeWrite(dir)
    try {
      if (fs.existsSync(bak)) fs.unlinkSync(bak)
    } catch {
      /* ignorar */
    }
    writeTmp()
  }

  if (fs.existsSync(filePath) && !skipBak) {
    try {
      fs.copyFileSync(filePath, bak)
    } catch (e) {
      // Sem espaço para backup: seguir sem .bak (rename atómico ainda protege o conteúdo novo).
      if (!isEnospcError(e)) {
        /* ignorar outros erros de bak */
      }
    }
  }

  try {
    fs.renameSync(tmp, filePath)
  } catch (e) {
    try {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp)
    } catch {
      /* ignorar */
    }
    throw e
  }

  // Após sucesso, o .bak só ocupa espaço — remover.
  try {
    if (fs.existsSync(bak)) fs.unlinkSync(bak)
  } catch {
    /* ignorar */
  }
}

export function writeJsonFileAtomic(filePath: string, value: unknown): void {
  writeTextFileAtomic(filePath, serializeJsonForDisk(value))
}
