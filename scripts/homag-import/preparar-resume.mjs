#!/usr/bin/env node
/** Prepara export.json + import-state.json a partir da biblioteca local para retomar importação. */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const bibPath = path.join(root, 'data', 'nonato-pecas-biblioteca.json')
const outDir = path.join(root, 'scripts', 'homag-import', 'out')

if (!fs.existsSync(bibPath)) {
  console.error('Biblioteca não encontrada:', bibPath)
  process.exit(1)
}

const bib = JSON.parse(fs.readFileSync(bibPath, 'utf8'))
const items = bib
  .filter((p) => p?.codigo && /^[1-9]\d{9}$/.test(String(p.codigo).replace(/\s/g, '')))
  .map((p) => ({
    codigo: String(p.codigo).trim(),
    nome: String(p.nome || p.descricao || p.codigo).trim(),
    descricao: String(p.descricao || p.nome || p.codigo).trim(),
    imagem: typeof p.imagem === 'string' && p.imagem.startsWith('data:') ? p.imagem : '',
    imagem_url: p.imagem_url || '',
    imagem_local: p.imagem_local || '',
  }))

const lastPageNum = Math.ceil(items.length / 20)
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(
  path.join(outDir, 'export.json'),
  JSON.stringify(
    {
      gerado_em: new Date().toISOString(),
      origem_url:
        'https://shop.homag.com/s/category/spare-parts/0ZG0900000059puGAA?language=en_AU',
      modo: 'automatico',
      total: items.length,
      em_progresso: true,
      itens: items,
    },
    null,
    2
  )
)
fs.writeFileSync(
  path.join(outDir, 'import-state.json'),
  JSON.stringify(
    {
      lastPageNum,
      totalItems: items.length,
      updated: new Date().toISOString(),
    },
    null,
    2
  )
)

console.log(`Retoma preparada: ${items.length} peças, continuar da página ${lastPageNum + 1}`)
