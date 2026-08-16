/** Escape HTML para atributos e conteúdo. */

export function escAttr(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function preEsc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Valor vazio → traço tipográfico para documentos de contabilidade. */
export function valDash(x: string | undefined): string {
  return x && String(x).trim() ? String(x).trim() : '—'
}
