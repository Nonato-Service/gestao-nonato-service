/** Alvos de anotações PDF e pista de secção Elétrica / Mecânica. */

import type { ManualSection } from './zipSection'
import { cleanLinkTarget } from './zipPath'

export function extractAnnotationTargets(ann: Record<string, unknown>): string[] {
  const out: string[] = []
  const push = (v: unknown) => {
    if (typeof v === 'string' && v.trim()) out.push(v.trim())
  }
  push(ann.unsafeUrl)
  push(ann.url)
  const titleObj = ann.titleObj as { str?: string } | undefined
  push(titleObj?.str)
  const contentsObj = ann.contentsObj as { str?: string } | undefined
  push(contentsObj?.str)
  push(ann.attachment)
  return out
}

export function targetLooksLikeSection(target: string, section: ManualSection): boolean {
  const blob = cleanLinkTarget(target).toLowerCase()
  if (section === 'eletrica') {
    return /elektr|eletric|electric|elektro|(^|[\\/])el[\.\-_/\\]/.test(blob)
  }
  return /mechan|mecan|mechanik|(^|[\\/])mk[\.\-_/\\]/.test(blob)
}
