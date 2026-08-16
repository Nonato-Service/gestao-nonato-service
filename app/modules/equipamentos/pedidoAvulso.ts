import { resolverNumeroEquipamentoPdf, resolverSerieEquipamentoPdf } from '../../lib/orcamentoPdfPro'
import { resolverIdEquipamentoCliente } from './relatorio'

export type EquipamentoPedidoPdfOrigem = {
  id?: string
  tipoEquipamento?: string
  modelo?: string
  marca?: string
  numeroSerie?: string
  familia?: string
  grupo?: string
}

export type BlocoEquipamentoPedidoPdf = {
  equipamento?: EquipamentoPedidoPdfOrigem | null
  equipamentoManual?: string
  equipamentoIdx?: number
}

/** Recupera equipamento do cadastro do cliente quando o bloco guardado perdeu a referência. */
export function enriquecerBlocoEquipamentoPedido(
  bloco: BlocoEquipamentoPedidoPdf,
  clienteEquipamentos?: EquipamentoPedidoPdfOrigem[] | null,
  equipamentoChave?: string
): BlocoEquipamentoPedidoPdf {
  const eqAtual = bloco.equipamento
  const temDadosEstruturados =
    !!eqAtual &&
    !!(
      String(eqAtual.marca ?? '').trim() ||
      String(eqAtual.modelo ?? '').trim() ||
      String(eqAtual.numeroSerie ?? '').trim() ||
      resolverNumeroEquipamentoPdf(eqAtual)
    )
  if (temDadosEstruturados) return bloco

  const lista = clienteEquipamentos || []
  let eq: EquipamentoPedidoPdfOrigem | null = eqAtual || null

  if (lista.length) {
    if (!eq && bloco.equipamentoIdx != null && bloco.equipamentoIdx >= 0 && lista[bloco.equipamentoIdx]) {
      eq = lista[bloco.equipamentoIdx]
    }
    if (!eq && equipamentoChave) {
      const chave = equipamentoChave.trim()
      eq =
        lista.find((e, idx) => resolverIdEquipamentoCliente(e as Parameters<typeof resolverIdEquipamentoCliente>[0], idx) === chave) ||
        lista.find((e) => String(e.id ?? '').trim() === chave) ||
        lista.find((e) => String(e.numeroSerie ?? '').trim() === chave) ||
        null
    }
    const manual = String(bloco.equipamentoManual ?? '').trim().toLowerCase()
    if (!eq && manual) {
      eq =
        lista.find((e) => {
          const blob = [e.tipoEquipamento, e.marca, e.modelo, e.numeroSerie]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return blob === manual || blob.includes(manual) || manual.includes(blob)
        }) || null
    }
  }

  if (eq) return { ...bloco, equipamento: eq }
  return bloco
}

export function montarCamposEquipamentoPedidoPdf(
  eq: EquipamentoPedidoPdfOrigem | null | undefined,
  manual: string,
  labels: Record<string, string | undefined>
): Array<{ label: string; value: string }> {
  if (!eq) {
    const m = manual.trim()
    if (!m) return []
    return [{ label: labels.descricao || 'Descrição', value: m }]
  }

  const linhas: Array<{ label: string; value: string }> = []
  let marca = String(eq.marca ?? '').trim()
  let modelo = String(eq.modelo ?? '').trim()
  const tipo = String(eq.tipoEquipamento ?? '').trim()

  if (!marca && !modelo && tipo) {
    const partido = tipo.match(/^(.+?)\s*[-–]\s*(.+)$/)
    if (partido) {
      modelo = partido[1].trim()
      marca = partido[2].trim()
    }
  }

  if (marca) linhas.push({ label: labels.marca || 'Marca', value: marca })
  if (modelo) linhas.push({ label: labels.modelo || 'Modelo', value: modelo })
  if (!marca && !modelo && tipo) {
    linhas.push({ label: labels.tipoEquipamento || 'Tipo', value: tipo })
  }

  const numeroEq = resolverNumeroEquipamentoPdf(eq)
  if (numeroEq) {
    linhas.push({ label: labels.numeroEquipamento || 'Número do Equipamento', value: numeroEq })
  }
  const serieEq = resolverSerieEquipamentoPdf(eq)
  if (serieEq) {
    linhas.push({ label: labels.numeroSerie || 'Nº Série', value: serieEq })
  }
  if (eq.familia) linhas.push({ label: labels.familia || 'Família', value: String(eq.familia) })
  if (eq.grupo) linhas.push({ label: labels.grupo || 'Grupo', value: String(eq.grupo) })

  return linhas
}
