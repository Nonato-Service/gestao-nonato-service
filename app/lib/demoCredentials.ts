/** Geração de utilizador/senha para destinatários de demonstração. */

function slugifyName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 16)
}

export function buildDemoUsername(
  nome: string,
  email: string,
  recipientId: string,
  existingUsernames: string[] = []
): string {
  const tail = recipientId.replace(/\D/g, '').slice(-4) || String(Date.now()).slice(-4)
  const emailLocal = email
    .trim()
    .split('@')[0]
    ?.replace(/[^a-zA-Z0-9._-]/g, '')
    .toLowerCase()

  let base = emailLocal && emailLocal.length >= 2 ? emailLocal.slice(0, 14) : slugifyName(nome) || 'demo'
  let candidate = `${base}${tail}`.replace(/[^a-z0-9._-]/gi, '').slice(0, 24)
  if (candidate.length < 4) candidate = `demo${tail}`

  const taken = new Set(existingUsernames.map((u) => u.trim().toLowerCase()).filter(Boolean))
  let finalName = candidate
  let n = 0
  while (taken.has(finalName.toLowerCase())) {
    n += 1
    finalName = `${candidate.slice(0, 18)}${n}`
  }
  return finalName
}

export function generateDemoPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let pwd = ''
  for (let i = 0; i < 8; i += 1) {
    pwd += chars[Math.floor(Math.random() * chars.length)]
  }
  return pwd
}

export function generateDemoAccessCredentials(
  nome: string,
  email: string,
  recipientId: string,
  existingUsernames: string[] = []
): { demoUsuario: string; demoSenha: string } {
  return {
    demoUsuario: buildDemoUsername(nome, email, recipientId, existingUsernames),
    demoSenha: generateDemoPassword(),
  }
}

export function formatDemoCredentialsText(creds: { demoUsuario?: string; demoSenha?: string }): string {
  if (!creds.demoUsuario || !creds.demoSenha) return ''
  return `Utilizador: ${creds.demoUsuario}\nSenha: ${creds.demoSenha}`
}
