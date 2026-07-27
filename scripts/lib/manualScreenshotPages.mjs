import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..', '..')

/** Ícone do cabeçalho do grupo na sidebar (estável entre idiomas). */
export const MODULE_GROUP_ICON = {
  'gestao-tecnica': '🔧',
  'parceiros-comercial': '🤝',
  'documentacao-relatorios': '📋',
  'pecas-biblioteca': '📚',
  'gestao-custos': '💶',
  'gestao-industrial': '🏭',
  'checklist-group': '✅',
  'comunicacao-interna': '💬',
  'manuais-informacoes-tecnicas': '📖',
  'biblia-nonato-service': '📘',
  'almoxarifado-armazem': '📦',
  'gestao-financeira': '💰',
  'empresa-institucional': null,
  outros: '⚙️',
}

const SKIP_ACTIONS = new Set(['open-manual-programa'])

/** Lê SIDEBAR_MENU_MODULES de sidebarMenuPermissions.ts (sem compilar TS). */
export function loadManualScreenshotPages() {
  const src = fs.readFileSync(path.join(ROOT, 'app/lib/sidebarMenuPermissions.ts'), 'utf8')
  const pages = [
    {
      id: 'dashboard',
      action: null,
      moduleId: 'intro',
      waitMs: 800,
    },
  ]

  const moduleBlocks = src.split(/\{\s*\n\s*id:\s*'([^']+)'/g)
  // Fallback: regex por item
  let currentModuleId = ''
  const moduleRe = /id:\s*'([^']+)'[\s\S]*?items:\s*\[([\s\S]*?)\]\s*,?\s*\n\s*\}/g
  let modMatch
  while ((modMatch = moduleRe.exec(src)) !== null) {
    currentModuleId = modMatch[1]
    const itemsBlock = modMatch[2]
    const itemRe =
      /\{\s*buttonId:\s*'([^']+)',\s*action:\s*'([^']+)'[\s\S]*?fallbackLabel:\s*'([^']*)'/g
    let itemMatch
    while ((itemMatch = itemRe.exec(itemsBlock)) !== null) {
      const [, buttonId, action, fallbackLabel] = itemMatch
      if (SKIP_ACTIONS.has(action)) continue
      pages.push({
        id: buttonId,
        action,
        fallbackLabel,
        moduleId: currentModuleId,
        waitMs: action === 'open-checklist' ? 1200 : 1400,
      })
    }
  }

  return pages
}

export const MANUAL_LOCALES = ['pt-BR', 'es', 'fr', 'it', 'de', 'en']
