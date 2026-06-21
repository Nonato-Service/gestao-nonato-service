/**
 * Aplica paleta escura (#121212 / #1e1e1e / #00c853) em ficheiros de UI.
 * Não altera node_modules, .next, backups, data.
 */
import fs from 'fs'
import path from 'path'

const ROOT = path.resolve(import.meta.dirname, '..')
const SKIP_DIRS = new Set(['node_modules', '.next', 'backups', 'data', 'NONATO-SERVICE-BACKUP 2026'])
const EXT = new Set(['.tsx', '.ts', '.css', '.jsx', '.js', '.html'])
const SKIP_PATH_PARTS = [path.sep + 'api' + path.sep + 'pdf' + path.sep]

const REPLACEMENTS = [
  ['#00ff00', '#00c853'],
  ['#00FF00', '#00c853'],
  ['#00ff88', '#2ecc71'],
  ['#00FF88', '#2ecc71'],
  ['#00e66b', '#00c853'],
  ['#00E66B', '#00c853'],
  ['#39ff8c', '#2ecc71'],
  ['#12c96a', '#00c853'],
  ['#1db954', '#00c853'],
  ['#1ed760', '#2ecc71'],
  ['#1a1d1a', '#121212'],
  ['#121712', '#121212'],
  ['#141a14', '#1e1e1e'],
  ['#1b231b', '#212121'],
  ['#252a25', '#1e1e1e'],
  ['#1f2420', '#1e1e1e'],
  ['#2a2a2a', '#1e1e1e'],
  ['#2A2A2A', '#1e1e1e'],
  ['#1a1a1a', '#121212'],
  ['#1A1A1A', '#121212'],
  ['#222222', '#1e1e1e'],
  ['rgba(0, 255, 0', 'rgba(0, 200, 83'],
  ['rgba(0,255,0', 'rgba(0,200,83'],
  ['rgba(0, 230, 107', 'rgba(0, 200, 83'],
  ['rgba(29, 185, 84', 'rgba(0, 200, 83'],
  ["backgroundColor: '#000'", "backgroundColor: '#121212'"],
  ['backgroundColor: "#000"', 'backgroundColor: "#121212"'],
  ["backgroundColor: '#000000'", "backgroundColor: '#121212'"],
  ['backgroundColor: "#000000"', 'backgroundColor: "#121212"'],
  ["background: '#000'", "background: '#121212'"],
  ['background: "#000"', 'background: "#121212"'],
  ["background: '#000000'", "background: '#121212'"],
  ['background: "#000000"', 'background: "#121212"'],
  ["color: '#999'", "color: '#b0b0b0'"],
  ['color: "#999"', 'color: "#b0b0b0"'],
  ["color: '#666'", "color: '#909090'"],
  ['color: "#666"', 'color: "#909090"'],
]

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue
    const full = path.join(dir, name)
    const st = fs.statSync(full)
    if (st.isDirectory()) walk(full, files)
    else if (EXT.has(path.extname(name))) files.push(full)
  }
  return files
}

let changed = 0
for (const file of walk(path.join(ROOT, 'app')).concat(walk(path.join(ROOT, 'public')))) {
  if (SKIP_PATH_PARTS.some((p) => file.includes(p))) continue
  if (file.includes(`${path.sep}sw.js`)) continue
  let text = fs.readFileSync(file, 'utf8')
  let next = text
  for (const [from, to] of REPLACEMENTS) {
    next = next.split(from).join(to)
  }
  if (next !== text) {
    fs.writeFileSync(file, next)
    changed++
    console.log('updated', path.relative(ROOT, file))
  }
}
console.log('done, files changed:', changed)
