/**
 * Redefine a senha de acesso ao sistema (utilizador principal).
 * Uso: node scripts/reset-login-password.mjs "NovaSenha123"
 */
import fs from 'fs'
import path from 'path'

const newPassword = process.argv[2]?.trim()
if (!newPassword || newPassword.length < 4) {
  console.error('Uso: node scripts/reset-login-password.mjs "NovaSenha123"')
  console.error('A senha deve ter pelo menos 4 caracteres.')
  process.exit(1)
}

const DATA_DIR =
  process.env.RAILWAY_VOLUME_MOUNT_PATH ||
  process.env.DATA_DIR ||
  path.join(process.cwd(), 'data')

const usersPath = path.join(DATA_DIR, 'nonato-users.json')
const managedPath = path.join(DATA_DIR, 'nonato-managed-passwords.json')
const sessionsPath = path.join(DATA_DIR, '_app-auth-sessions.json')

function readArray(filePath) {
  if (!fs.existsSync(filePath)) return []
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8')
}

const users = readArray(usersPath)
if (!users.length) {
  console.error('Nenhum utilizador em nonato-users.json — use o primeiro acesso com senha nova no ecrã de login.')
  process.exit(1)
}

const admin =
  users.find((u) => u?.isAdmin) ||
  users.find((u) => String(u?.role || '').toLowerCase().includes('admin')) ||
  users[0]

const updatedUsers = users.map((u) =>
  u?.id === admin.id ? { ...u, password: newPassword, isAdmin: true } : u
)
writeJson(usersPath, updatedUsers)

const managed = readArray(managedPath)
const managedUpdated = managed.map((entry) =>
  entry?.tecnicoName === admin.name ? { ...entry, password: newPassword } : entry
)
if (managedUpdated.length) writeJson(managedPath, managedUpdated)

if (fs.existsSync(sessionsPath)) {
  try {
    fs.unlinkSync(sessionsPath)
  } catch {
    writeJson(sessionsPath, { sessions: {} })
  }
}

console.log('Senha atualizada com sucesso.')
console.log(`Utilizador: ${admin.name}`)
console.log(`E-mail: ${admin.email || '(não definido)'}`)
console.log(`Nova senha: ${newPassword}`)
console.log('Entre no sistema e altere a senha no Administrador se desejar.')
