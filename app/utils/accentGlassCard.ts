/**
 * Cartões estilo página inicial (splash): fundo escuro com tonalidade do accent,
 * borda semi-transparente na cor de destaque, blur leve.
 * Reutilizável com qualquer RGB (verde, âmbar, etc.) mantendo o mesmo contraste.
 */

import type { CSSProperties } from 'react'

export type AccentRgb = { r: number; g: number; b: number }

/** Verde neon — alinhado aos cartões «Recursos que Fazem a Diferença» */
export const ACCENT_GREEN: AccentRgb = { r: 0, g: 255, b: 0 }

/** Âmbar — secção despesas / fechamentos (mantém a cor, mesmo padrão glass) */
export const ACCENT_AMBER: AccentRgb = { r: 255, g: 170, b: 0 }

/** Fundo escuro tintado pelo accent (mesma lógica do rgba(30,35,30) para verde puro) */
export function tintBg(accent: AccentRgb, alpha = 0.88): string {
  const { r, g, b } = accent
  const br = Math.round(18 + (r / 255) * 42)
  const bg = Math.round(20 + (g / 255) * 42)
  const bb = Math.round(18 + (b / 255) * 42)
  return `rgba(${br}, ${bg}, ${bb}, ${alpha})`
}

export type GlassCardOpts = {
  padding?: string
  radius?: string
  borderAlpha?: number
  borderWidth?: string
  bgAlpha?: number
}

export function glassCardStyle(accent: AccentRgb, opts?: GlassCardOpts): CSSProperties {
  const { r, g, b } = accent
  const borderA = opts?.borderAlpha ?? 0.26
  const bgA = opts?.bgAlpha ?? 0.88
  const bw = opts?.borderWidth ?? '1px'
  return {
    padding: opts?.padding ?? '18px',
    borderRadius: opts?.radius ?? '12px',
    backgroundColor: tintBg(accent, bgA),
    border: `${bw} solid rgba(${r}, ${g}, ${b}, ${borderA})`,
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: 'none',
  }
}

/** Equipamento — um nível dentro do cartão cliente */
export function glassNestedStyle(accent: AccentRgb): CSSProperties {
  return glassCardStyle(accent, {
    padding: '12px',
    radius: '10px',
    borderAlpha: 0.22,
    bgAlpha: 0.82,
  })
}

/** Linha de relatório — mais compacto */
export function glassInnerRowStyle(accent: AccentRgb): CSSProperties {
  return glassCardStyle(accent, {
    padding: '10px',
    radius: '8px',
    borderAlpha: 0.2,
    bgAlpha: 0.78,
  })
}

export function glassCardHover(el: HTMLElement, accent: AccentRgb, hover: boolean, borderLo = 0.26, borderHi = 0.5) {
  const { r, g, b } = accent
  el.style.borderColor = hover ? `rgba(${r}, ${g}, ${b}, ${borderHi})` : `rgba(${r}, ${g}, ${b}, ${borderLo})`
  el.style.boxShadow = hover ? `0 8px 28px rgba(${r}, ${g}, ${b}, 0.14)` : 'none'
}

export function glassInnerRowHover(el: HTMLElement, accent: AccentRgb, hover: boolean) {
  const { r, g, b } = accent
  el.style.borderColor = hover ? `rgba(${r}, ${g}, ${b}, 0.45)` : `rgba(${r}, ${g}, ${b}, 0.2)`
  el.style.backgroundColor = hover ? tintBg(accent, 0.92) : tintBg(accent, 0.78)
}
