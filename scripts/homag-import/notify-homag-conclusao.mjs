#!/usr/bin/env node
/**
 * Aviso Windows (toast) quando a importação HOMAG termina no PC.
 * Uso: node notify-homag-conclusao.mjs [exitCode]
 * exitCode: 0=concluído, 2=parcial/retoma, outro=erro
 */
import fs from 'fs'
import path from 'path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..', '..')
const exitCode = Number(process.argv[2] ?? 0)

function readJsonCount(file) {
  try {
    if (!fs.existsSync(file)) return 0
    const j = JSON.parse(fs.readFileSync(file, 'utf8'))
    if (Array.isArray(j)) return j.length
    if (Array.isArray(j?.itens)) return j.itens.length
    return 0
  } catch {
    return 0
  }
}

const totalBiblioteca = readJsonCount(path.join(root, 'data', 'nonato-pecas-biblioteca.json'))
const totalExport = readJsonCount(path.join(root, 'scripts', 'homag-import', 'out', 'export.json'))

let title
let message
if (exitCode === 0) {
  title = 'HOMAG — Importação concluída'
  message = `Catálogo actualizado: ${totalBiblioteca || totalExport} peças no PC.`
  if (totalBiblioteca > 0) {
    message += ' Abra o site e clique «Actualizar biblioteca» se aparecer aviso amarelo.'
  }
} else if (exitCode === 2) {
  title = 'HOMAG — Parou a meio (retoma guardada)'
  message = `${totalBiblioteca || totalExport} peças guardadas. Execute IMPORTAR-TUDO-HOMAG.bat outra vez para continuar.`
} else {
  title = 'HOMAG — Importação com problemas'
  message = 'Verifique a janela preta. Pode executar o BAT outra vez para retomar.'
}

console.log(`\n[AVISO] ${title}\n${message}\n`)

if (process.platform === 'win32') {
  const ps1 = path.join(__dirname, 'notify-homag.ps1')
  if (fs.existsSync(ps1)) {
    spawnSync(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1, title, message],
      { stdio: 'inherit', windowsHide: true }
    )
  }
}
