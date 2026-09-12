/** Variantes visuais da marca NONATO (filtros CSS) — sem I/O. */

export type NonatoBrandVariant =
  | 'original'
  | 'sucesso'
  | 'alerta'
  | 'devedor'
  | 'financeiro'
  | 'informacao'

export const NONATO_BRAND_VARIANT_CLASS: Record<NonatoBrandVariant, string> = {
  original: 'ns-brand-logo ns-brand-logo--original',
  sucesso: 'ns-brand-logo ns-brand-logo--sucesso',
  alerta: 'ns-brand-logo ns-brand-logo--alerta',
  devedor: 'ns-brand-logo ns-brand-logo--devedor',
  financeiro: 'ns-brand-logo ns-brand-logo--financeiro',
  informacao: 'ns-brand-logo ns-brand-logo--informacao',
}

export type NonatoBrandVariantLabel = {
  variant: NonatoBrandVariant
  labelKey: string
  fallback: string
}

export const NONATO_BRAND_VARIANT_LABELS: readonly NonatoBrandVariantLabel[] = [
  { variant: 'original', labelKey: 'brandVariantOriginal', fallback: 'Original' },
  { variant: 'sucesso', labelKey: 'brandVariantSucesso', fallback: 'Sucesso' },
  { variant: 'alerta', labelKey: 'brandVariantAlerta', fallback: 'Alerta' },
  { variant: 'devedor', labelKey: 'brandVariantDevedor', fallback: 'Urgência' },
  { variant: 'financeiro', labelKey: 'brandVariantFinanceiro', fallback: 'Financeiro' },
  { variant: 'informacao', labelKey: 'brandVariantInformacao', fallback: 'Informação' },
]

export function brandLogoClassName(
  variant: NonatoBrandVariant = 'original',
  opts?: { isBrandFile?: boolean; className?: string }
): string {
  const base = NONATO_BRAND_VARIANT_CLASS[variant] ?? NONATO_BRAND_VARIANT_CLASS.original
  const brand = opts?.isBrandFile ? ' ns-brand-logo--brand-file' : ''
  const extra = opts?.className ? ` ${opts.className}` : ''
  return `${base}${brand}${extra}`.trim()
}
