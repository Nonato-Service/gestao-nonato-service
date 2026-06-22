const fs = require('fs')
const { translations } = require('../app/translations.ts')
const locales = Object.keys(translations)
const files = fs.readdirSync('app/components/admin').filter((f) => f.endsWith('.tsx')).map((f) => `app/components/admin/${f}`)
const keyRe = /(?:safeT\??\.|\btr\(safeT,\s*['"])([a-zA-Z][a-zA-Z0-9]*)/g
const keys = new Set()
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8')
  let m
  while ((m = keyRe.exec(text))) keys.add(m[1])
}
const adminKeys = [...keys].filter((k) =>
  k.startsWith('admin') ||
  k.startsWith('syncAdmin') ||
  k.startsWith('password') ||
  k.startsWith('backup') ||
  k.startsWith('clientePrior') ||
  k.startsWith('userManagement') ||
  k.startsWith('configuracoes')
).sort()

console.log('Locales:', locales.join(', '))
console.log('Admin keys scanned:', adminKeys.length)
for (const loc of locales) {
  const missing = adminKeys.filter((k) => !translations[loc][k])
  if (missing.length) console.log(`${loc}: MISSING ${missing.length} -> ${missing.join(', ')}`)
  else console.log(`${loc}: OK`)
}

const jumpKeys = [
  'adminPanelIndexEyebrow', 'adminPanelIndexTitle', 'adminPanelIndexLead',
  'adminJumpSyncTitle', 'adminJumpDemosTitle', 'adminJumpGeralTitle', 'adminJumpUsersTitle',
  'adminJumpClienteTitle', 'adminJumpSidebarTitle', 'adminJumpPapelTimbradoTitle',
  'adminJumpPasswordsTitle', 'adminJumpBackupTitle',
  'adminJumpDemosDesc', 'syncAdminJumpHint', 'adminJumpGeralDesc', 'adminJumpUsersDesc',
  'adminJumpClienteDesc', 'adminJumpSidebarDesc', 'adminJumpPapelTimbradoDesc',
  'adminJumpPasswordsDesc', 'adminJumpBackupDesc',
]
console.log('\nJump/nav keys:')
for (const loc of locales) {
  const missing = jumpKeys.filter((k) => !translations[loc][k])
  console.log(`${loc}: ${missing.length ? 'MISSING ' + missing.join(', ') : 'OK'}`)
}
