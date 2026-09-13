/**
 * I/O de relógio/aleatório/UUID — ids canónicos em `app/modules/protocolo/blocos`.
 */
import {
  ensureProtocoloBlocosIds as ensureProtocoloBlocosIdsPure,
  newProtocoloBlocoId as newProtocoloBlocoIdPure,
  type ProtocoloIdDeps,
} from '../modules/protocolo/blocos'
import { protocoloServicoToForm as protocoloServicoToFormPure } from '../modules/protocolo/formState'
import type { ProtocoloBloco, ProtocoloServico } from '../modules/protocolo/tipos'
import type { ProtocoloServicoFormState } from '../modules/protocolo/formState'

function protocoloIdDeps(): ProtocoloIdDeps {
  return {
    nowMs: Date.now(),
    random: Math.random,
    randomUUID:
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? () => crypto.randomUUID()
        : undefined,
  }
}

/** Injeta Date.now(), Math.random() e crypto.randomUUID() quando existir. */
export function newProtocoloBlocoId(): string {
  return newProtocoloBlocoIdPure(protocoloIdDeps())
}

export function ensureProtocoloBlocosIds(blocos: ProtocoloBloco[] | null | undefined): ProtocoloBloco[] {
  return ensureProtocoloBlocosIdsPure(blocos, protocoloIdDeps())
}

export function protocoloServicoToForm(
  p: Partial<ProtocoloServico> & {
    clienteId?: string
    equipamentoNumeroSerie?: string
    textoInicial?: string
    blocos?: ProtocoloBloco[]
    pecasTrocadasCodigos?: string[]
    relatorioServicoId?: string
  },
  pdfPadrao: number
): ProtocoloServicoFormState {
  return protocoloServicoToFormPure(p, pdfPadrao, protocoloIdDeps())
}
