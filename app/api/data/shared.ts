/**
 * Configuração partilhada pelas rotas da API de dados.
 * Uma única fonte para DATA_DIR evita duplicação e facilita manutenção.
 */
import path from 'path'

// Railway: usa volume montado; local: pasta data
export const DATA_DIR =
  process.env.RAILWAY_VOLUME_MOUNT_PATH ||
  process.env.DATA_DIR ||
  path.join(process.cwd(), 'data')

export function ensureDataDir(): void {
  const fs = require('fs')
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}
