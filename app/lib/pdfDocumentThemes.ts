import { normalizePdfModelo } from './pdfModelTypes'

/** Variantes visuais para PDFs de orçamento / pedido (shell orc-pdf-pro). */
export function orcamentoPdfThemeCss(model: string): string {
  const m = normalizePdfModelo(model)
  const themes: Record<string, string> = {
    classico: `
      :root { --orc-brand: #1e3a5f; --orc-brand-dark: #0f172a; --orc-brand-light: #f1f5f9; --orc-accent: #1e3a5f; }
      .ns-pdf-header { border-bottom-color: #1e3a5f; }
      .ns-pdf-header__title { color: #1e3a5f; }
    `,
    profissional: `
      :root { --orc-brand: #0d7a3d; --orc-brand-dark: #14532d; --orc-brand-light: #ecfdf5; --orc-accent: #1e3a5f; }
      .ns-pdf-header { border-bottom: 3px solid #0d7a3d; }
      .orc-pdf-pro__summary-row--total { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); }
    `,
    moderno: `
      :root { --orc-brand: #2563eb; --orc-brand-dark: #1e40af; --orc-brand-light: #eff6ff; --orc-accent: #7c3aed; }
      .ns-pdf-header { border-bottom: none; background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); border-radius: 10px; padding: 14px 16px; margin-bottom: 16px; }
      .ns-pdf-header__title, .ns-pdf-header__subtitle, .ns-pdf-header__badge { color: #fff !important; }
      .ns-pdf-header__report-num { background: rgba(255,255,255,0.15); color: #fff; border-color: rgba(255,255,255,0.35); }
    `,
    detalhado: `
      :root { --orc-brand: #0f766e; --orc-brand-dark: #115e59; --orc-brand-light: #f0fdfa; --orc-accent: #134e4a; }
      .orc-pdf-pro__table th { background: #115e59; }
    `,
    compacto: `
      :root { --orc-brand: #475569; --orc-brand-dark: #334155; --orc-brand-light: #f8fafc; --orc-accent: #64748b; }
      body.orc-pdf-pro { font-size: 9.5px; }
      .orc-pdf-pro__page { padding: 10px 12px 14px; }
    `,
    minimalista: `
      :root { --orc-brand: #171717; --orc-brand-dark: #000; --orc-brand-light: #fafafa; --orc-accent: #525252; }
      .ns-pdf-header { border-bottom: 1px solid #e5e5e5; box-shadow: none; }
      .orc-pdf-pro__table th { background: #fafafa; color: #171717; border-color: #e5e5e5; }
    `,
    executivo: `
      :root { --orc-brand: #78350f; --orc-brand-dark: #451a03; --orc-brand-light: #fffbeb; --orc-accent: #92400e; }
      .ns-pdf-header { border-bottom: 3px solid #92400e; }
      .orc-pdf-pro__summary-row--total { border-color: #92400e; }
    `,
    formal: `
      :root { --orc-brand: #1e293b; --orc-brand-dark: #0f172a; --orc-brand-light: #f8fafc; --orc-accent: #334155; }
      .ns-pdf-header__title { font-family: Georgia, "Times New Roman", serif; letter-spacing: 0.06em; }
    `,
    resumido: `
      :root { --orc-brand: #64748b; --orc-brand-dark: #475569; --orc-brand-light: #f1f5f9; --orc-accent: #94a3b8; }
      body.orc-pdf-pro { font-size: 10px; }
    `,
    colorido: `
      :root { --orc-brand: #db2777; --orc-brand-dark: #9d174d; --orc-brand-light: #fdf2f8; --orc-accent: #7c3aed; }
      .ns-pdf-header { border-bottom: 3px solid #db2777; }
      .orc-pdf-pro__table th { background: linear-gradient(90deg, #7c3aed, #db2777); }
    `,
  }
  return themes[m] || themes.profissional
}

/** Extra CSS para relatórios de serviço por modelo. */
export function relatorioPdfThemeCss(model: string): string {
  const m = normalizePdfModelo(model)
  const themes: Record<string, string> = {
    profissional: `
      body.rs-pdf.rs-pdf--profissional .info-section {
        background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
        border-left: 4px solid #0d7a3d;
        border-radius: 0 8px 8px 0;
        padding: 16px 18px;
        box-shadow: 0 1px 3px rgba(15,23,42,0.06);
      }
      body.rs-pdf.rs-pdf--profissional .summary-card {
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(30,58,95,0.08);
        border-top-width: 3px;
        border-top-color: #0d7a3d;
      }
      body.rs-pdf.rs-pdf--profissional th { background: linear-gradient(180deg, #1e293b 0%, #334155 100%); }
    `,
    moderno: `
      body.rs-pdf.rs-pdf--moderno .ns-pdf-header {
        background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
        border-radius: 10px;
        padding: 4px 0 12px;
        margin-bottom: 18px;
      }
      body.rs-pdf.rs-pdf--moderno .ns-pdf-header__title,
      body.rs-pdf.rs-pdf--moderno .ns-pdf-header__subtitle { color: #fff !important; }
    `,
    classico: `
      body.rs-pdf.rs-pdf--classico .info-section h3 { border-bottom-color: #1e3a5f; color: #1e3a5f; }
    `,
  }
  return themes[m] || themes.profissional
}

/** Temas visuais para documentos genéricos (cadastro, contador, confirmações). */
export function documentPdfThemeCss(
  model: string,
  docTheme: 'service' | 'expense' | 'billing' | 'cadastro' = 'service'
): string {
  const m = normalizePdfModelo(model)
  const brandByTheme: Record<string, { main: string; dark: string; light: string }> = {
    service: { main: '#1e3a5f', dark: '#0f172a', light: '#f1f5f9' },
    expense: { main: '#0d7a3d', dark: '#14532d', light: '#ecfdf5' },
    billing: { main: '#1565c0', dark: '#0d47a1', light: '#e3f2fd' },
    cadastro: { main: '#0d7a3d', dark: '#14532d', light: '#ecfdf5' },
  }
  const brand = brandByTheme[docTheme] || brandByTheme.service

  const base = `
    :root {
      --ns-pdf-brand: ${brand.main};
      --ns-pdf-brand-dark: ${brand.dark};
      --ns-pdf-brand-light: ${brand.light};
    }
    .ns-pdf-header__bar {
      background: linear-gradient(90deg, ${brand.main} 0%, ${brand.dark} 50%, ${brand.main} 100%);
    }
    .ns-pdf-header__badge-v { color: ${brand.main}; }
    .ns-pdf-section-title { color: ${brand.main}; }
  `

  const themes: Record<string, string> = {
    profissional: base,
    classico: `
      ${base}
      .ns-pdf-header__title { color: ${brand.main}; }
    `,
    moderno: `
      ${base}
      .ns-pdf-header__row {
        background: linear-gradient(135deg, ${brand.dark} 0%, ${brand.main} 100%);
        border-radius: 8px;
        padding: 12px 14px;
        margin-bottom: 8px;
      }
      .ns-pdf-header__title, .ns-pdf-header__subtitle, .ns-pdf-header__badge-k, .ns-pdf-header__badge-v {
        color: #fff !important;
      }
      .ns-pdf-header__badge { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.25); }
      .ns-pdf-header__bar { display: none; }
    `,
    detalhado: `
      ${base}
      .ns-pdf-header__title { font-size: 20px; }
      .ns-pdf-card { padding: 20px 22px; }
    `,
    compacto: `
      ${base}
      body.ns-pdf-doc { font-size: 9pt; padding: 12px 14px 18px; }
      .ns-pdf-card { padding: 12px 14px; }
    `,
    minimalista: `
      ${base}
      .ns-pdf-card { background: #fff; border-color: #e5e5e5; box-shadow: none; }
      .ns-pdf-table th { background: #fafafa; color: #171717; border-color: #e5e5e5; }
    `,
    executivo: `
      ${base}
      .ns-pdf-header__title { font-family: Georgia, "Times New Roman", serif; letter-spacing: 0.04em; }
    `,
    formal: `
      ${base}
      .ns-pdf-header__title { font-family: Georgia, "Times New Roman", serif; text-transform: uppercase; letter-spacing: 0.08em; font-size: 15px; }
    `,
    colorido: `
      ${base}
      .ns-pdf-table th { background: linear-gradient(90deg, #7c3aed, #db2777); }
    `,
    negro: `
      ${base}
      body.ns-pdf-doc { background: #111; color: #eee; }
      .ns-pdf-card { background: #1a1a1a; border-color: #333; }
      .ns-pdf-card__value { color: #eee; }
      .ns-pdf-meta { border-color: #333; background: #1a1a1a; }
    `,
  }
  return themes[m] || themes.profissional
}
