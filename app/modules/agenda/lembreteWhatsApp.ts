/** Lembretes de agenda via WhatsApp — filtro hoje/amanhã, telefone e texto. */

import type { Agendamento } from './tipos'
import { isAgendamentoPessoal } from './normalize'
import { rotuloTituloAgendamento } from './rotulos'

/** Agendamentos de hoje e amanhã (exclui cancelados). */
export function filterAgendamentosLembrete(
  agendamentos: Agendamento[],
  now: Date = new Date()
): Agendamento[] {
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const todayStr = now.toISOString().split('T')[0]
  const tomorrowStr = tomorrow.toISOString().split('T')[0]
  return agendamentos.filter(
    (a) => a.status !== 'cancelado' && (a.data === todayStr || a.data === tomorrowStr)
  )
}

/** Dígitos para wa.me — prefixo 351 em móveis PT de 9 dígitos. */
export function formatTelefoneWhatsApp(telefone: string): string {
  const digits = (telefone || '').replace(/\D/g, '')
  if (digits.length === 9 && digits.startsWith('9')) return '351' + digits
  if (digits.length >= 9) return digits
  return '351' + digits
}

/** Subconjunto de traduções usado na mensagem de lembrete. */
export type LembreteAgendaTr = {
  agendamentoTecnico?: string
  preAgendamento?: string
  lembreteAgendaWhatsAppPrefixo?: string
  lembreteAgendaTemosAgendado?: string
  as?: string
  cliente?: string
  tecnico?: string
  equipamento?: string
  lembreteAgendaQualquerDuvida?: string
  [key: string]: string | undefined
}

export function buildMensagemLembreteAgenda(a: Agendamento, tr?: LembreteAgendaTr): string {
  const dataPt = a.data
    ? new Date(a.data + 'T12:00:00').toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : ''
  const tipoLabel =
    a.tipo === 'agendamento-tecnico'
      ? tr?.agendamentoTecnico || 'Agendamento Técnico'
      : tr?.preAgendamento || 'Pré-Agendamento'
  const titulo = rotuloTituloAgendamento(a, tr)
  const pessoal = isAgendamentoPessoal(a)
  return [
    tr?.lembreteAgendaWhatsAppPrefixo || 'Lembrete Nonato Service:',
    '',
    (tr?.lembreteAgendaTemosAgendado || 'Temos agendado para') +
      ` ${dataPt} ${tr?.as || 'às'} ${a.hora || ''}:`,
    pessoal ? `• ${titulo}` : `• ${tipoLabel}`,
    !pessoal ? `• ${tr?.cliente || 'Cliente'}: ${a.cliente || ''}` : '',
    !pessoal && a.tecnico ? `• ${tr?.tecnico || 'Técnico'}: ${a.tecnico}` : '',
    !pessoal && a.equipamento ? `• ${tr?.equipamento || 'Equipamento'}: ${a.equipamento}` : '',
    '',
    tr?.lembreteAgendaQualquerDuvida || 'Qualquer dúvida, contacte-nos.',
  ]
    .filter(Boolean)
    .join('\n')
}
