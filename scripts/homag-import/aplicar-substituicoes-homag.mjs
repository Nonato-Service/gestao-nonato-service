#!/usr/bin/env node

/**

 * Liga códigos HOMAG (máq. antiga + máq. nova) — NÃO remove peças do catálogo.

 * Uso: node scripts/homag-import/aplicar-substituicoes-homag.mjs

 */

import fs from 'fs'

import path from 'path'

import { fileURLToPath } from 'url'

import {

  aplicarLigacoesCodigosHomagNoCatalogo,

  detectarLigacoesCodigosHomag,

} from '../../app/lib/pecaHomagSubstituicao.ts'

import { construirIndiceSubstituicoesHomag } from '../../app/lib/pecaCodigoBusca.ts'



const __dirname = path.dirname(fileURLToPath(import.meta.url))

const ROOT = path.join(__dirname, '..', '..')

const DATA = process.env.DATA_DIR || path.join(ROOT, 'data')

const INDICE = path.join(DATA, 'homag-substituicoes-indice.json')

const BIB = path.join(DATA, 'nonato-pecas-biblioteca.json')

const LITE = path.join(DATA, 'nonato-pecas-biblioteca-lite.json')

const MANUAL = path.join(DATA, 'homag-substituicoes-manuais.json')



function toLite(p) {

  const out = { ...p }

  if (typeof out.imagem === 'string' && out.imagem.startsWith('data:') && out.imagem.length > 0) {

    out.temImagemServidor = true

    delete out.imagem

  }

  return out

}



function loadManual() {

  if (!fs.existsSync(MANUAL)) return []

  const j = JSON.parse(fs.readFileSync(MANUAL, 'utf-8'))

  return Array.isArray(j) ? j : []

}



if (!fs.existsSync(BIB)) {

  console.error('Catálogo não encontrado:', BIB)

  process.exit(1)

}



const pecas = JSON.parse(fs.readFileSync(BIB, 'utf-8'))

const manual = loadManual()



console.log('=== Ligação códigos HOMAG (máq. antiga + máq. nova) ===')

console.log('Regra: os dois códigos ficam — nada é removido do catálogo.')

console.log('')



const detectadas = detectarLigacoesCodigosHomag(pecas, manual)

console.log(`Ligações detectadas: ${detectadas.length}`)

for (const s of detectadas) {

  console.log(

    `  ${s.referenciaAntiga || s.codigoAntigo} ↔ ${s.referenciaNova || s.codigoNovo} (${s.fonte})`

  )

}



const { pecas: atualizado, stats } = aplicarLigacoesCodigosHomagNoCatalogo(pecas, manual)

const indice = construirIndiceSubstituicoesHomag(

  detectarLigacoesCodigosHomag(atualizado, manual),

  atualizado

)

fs.writeFileSync(INDICE, JSON.stringify(indice, null, 2))

fs.writeFileSync(BIB, JSON.stringify(atualizado, null, 2))

fs.writeFileSync(LITE, JSON.stringify(atualizado.map(toLite)))



console.log('')

console.log(`Ligações aplicadas: ${stats.aplicadas}`)

console.log(`Imagens partilhadas (mesma foto): ${stats.imagensMantidas}`)

console.log(`Peças removidas: ${stats.removidas} (sempre 0)`)

console.log(`Catálogo final: ${atualizado.length} peça(s)`)

console.log(`Índice busca bidireccional: ${Object.keys(indice).length} chaves → ${INDICE}`)

