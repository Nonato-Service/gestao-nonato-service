#!/usr/bin/env node
/**
 * Adiciona referência com hífen a todas as peças HOMAG (busca com e sem hífen).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { enriquecerPecaHomagComReferencias } from './homag-codigo-ref.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data')
const BIB = path.join(DATA, 'nonato-pecas-biblioteca.json')
const LITE = path.join(DATA, 'nonato-pecas-biblioteca-lite.json')

function toLite(p) {
  const out = { ...p }
  if (typeof out.imagem === 'string' && out.imagem.startsWith('data:') && out.imagem.length > 0) {
    out.temImagemServidor = true
    delete out.imagem
  }
  return out
}

if (!fs.existsSync(BIB)) {
  console.error('Catálogo não encontrado:', BIB)
  process.exit(1)
}

const pecas = JSON.parse(fs.readFileSync(BIB, 'utf-8'))
let alteradas = 0
const atualizado = pecas.map((p) => {
  const next = enriquecerPecaHomagComReferencias(p)
  if (JSON.stringify(next) !== JSON.stringify(p)) alteradas++
  return next
})

fs.writeFileSync(BIB, JSON.stringify(atualizado, null, 2))
fs.writeFileSync(LITE, JSON.stringify(atualizado.map(toLite)))

console.log(`Referências HOMAG (com/sem hífen): ${alteradas} peça(s) actualizadas de ${atualizado.length}.`)
