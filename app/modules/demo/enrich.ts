/** Estado derivado do destinatário (link, validade, status) — relógio injectado. */

import type { DemoRecipientRecord, DemoRecipientStatus, DemoRecipientWithState } from './tipos'
import { resolveDemoDaysForRecipient } from './limits'

export function enrichDemoRecipients(
  recipients: DemoRecipientRecord[],
  demoLinkBaseUrl: string,
  nowMs: number
): DemoRecipientWithState[] {
  return recipients
    .map((recipient) => {
      const link = `${demoLinkBaseUrl}?rid=${encodeURIComponent(recipient.id)}`
      const demoDays = resolveDemoDaysForRecipient(recipient)
      const dataBaseAtivacao = recipient.firstAccessAt || recipient.dataEnvio
      const dataBaseMs = new Date(dataBaseAtivacao).getTime()
      const dataExpiracao =
        recipient.dataExpiracao ||
        (dataBaseMs ? new Date(dataBaseMs + demoDays * 24 * 60 * 60 * 1000).toISOString() : undefined)
      const expiracaoMs = dataExpiracao ? new Date(dataExpiracao).getTime() : NaN
      const diffMs = isNaN(expiracaoMs) ? NaN : expiracaoMs - nowMs
      const daysLeft = isNaN(diffMs) ? null : Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
      const status: DemoRecipientStatus = !recipient.firstAccessAt
        ? 'pendente'
        : diffMs <= 0
          ? 'expirado'
          : daysLeft !== null && daysLeft <= 3
            ? 'a-expirar'
            : 'ativo'
      return { ...recipient, link, dataExpiracao, daysLeft, status }
    })
    .sort((a, b) => new Date(b.dataEnvio).getTime() - new Date(a.dataEnvio).getTime())
}
