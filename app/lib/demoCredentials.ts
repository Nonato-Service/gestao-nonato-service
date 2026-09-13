import {
  buildDemoUsername as buildDemoUsernamePure,
  generateDemoPassword as generateDemoPasswordPure,
} from '../modules/demo/credentials'

/** Re-export fino — fonte canónica em `app/modules/demo/credentials`. */
export { formatDemoCredentialsText } from '../modules/demo/credentials'

/** Injeta Date.now() só quando o id não tem dígitos. */
export function buildDemoUsername(
  nome: string,
  email: string,
  recipientId: string,
  existingUsernames: string[] = []
): string {
  return buildDemoUsernamePure(nome, email, recipientId, existingUsernames, String(Date.now()).slice(-4))
}

/** Injeta Math.random() na senha canónica. */
export function generateDemoPassword(): string {
  return generateDemoPasswordPure(Math.random)
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
