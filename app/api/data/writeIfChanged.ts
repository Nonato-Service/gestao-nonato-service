/**
 * Evita gravar e evitar bump de revisão quando o payload é idêntico ao ficheiro existente.
 * Reduz ciclos de «sincronização pendente» entre notebook/tablet por saves automáticos sem alteração real.
 */
import fs from 'fs'
import path from 'path'

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

/** Grava texto de forma atómica (.tmp + rename) — evita JSON truncado em crash/OOM. */
export function writeTextFileAtomic(filePath: string, content: string): void {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (filePath.endsWith('.json')) {
    JSON.parse(content)
  }
  const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}`
  const bak = `${filePath}.bak`
  fs.writeFileSync(tmp, content, 'utf-8')
  if (fs.existsSync(filePath)) {
    try {
      fs.copyFileSync(filePath, bak)
    } catch {
      /* ignorar */
    }
  }
  fs.renameSync(tmp, filePath)
}

export function writeJsonFileAtomic(filePath: string, value: unknown): void {
  writeTextFileAtomic(filePath, serializeJsonForDisk(value))
}
