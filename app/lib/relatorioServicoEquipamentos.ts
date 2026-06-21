export type RelatorioEquipamentoOrigem = 'cliente' | 'armazem'

export type RelatorioEquipamentoRef = {
  uid: string
  equipamentoOrigem: RelatorioEquipamentoOrigem
  equipamentoId: string
  maquinaModelo: string
  numeroMaquina: string
}

export const MAX_EQUIPAMENTOS_RELATORIO = 5

export type RelatorioServicoEquipamentosHost = {
  equipamentoId?: string
  equipamentoOrigem?: RelatorioEquipamentoOrigem
  maquinaModelo: string
  numeroMaquina: string
  equipamentos?: RelatorioEquipamentoRef[]
}

export function criarEquipamentoRelatorioVazio(
  origem: RelatorioEquipamentoOrigem = 'cliente'
): RelatorioEquipamentoRef {
  return {
    uid: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    equipamentoOrigem: origem,
    equipamentoId: '',
    maquinaModelo: '',
    numeroMaquina: '',
  }
}

export function equipamentosRelatorioPreenchidos(
  equipamentos: RelatorioEquipamentoRef[]
): RelatorioEquipamentoRef[] {
  return equipamentos.filter((eq) => eq.equipamentoId || eq.maquinaModelo || eq.numeroMaquina)
}

export function normalizarEquipamentosRelatorio(
  r: RelatorioServicoEquipamentosHost
): RelatorioEquipamentoRef[] {
  if (Array.isArray(r.equipamentos) && r.equipamentos.length > 0) {
    return r.equipamentos.slice(0, MAX_EQUIPAMENTOS_RELATORIO).map((eq, i) => ({
      uid: eq.uid || `eq-${i}-${eq.equipamentoId || i}`,
      equipamentoOrigem: eq.equipamentoOrigem === 'armazem' ? 'armazem' : 'cliente',
      equipamentoId: String(eq.equipamentoId ?? '').trim(),
      maquinaModelo: String(eq.maquinaModelo ?? '').trim(),
      numeroMaquina: String(eq.numeroMaquina ?? '').trim(),
    }))
  }

  const id = String(r.equipamentoId ?? '').trim()
  const modelo = String(r.maquinaModelo ?? '').trim()
  const sn = String(r.numeroMaquina ?? '').trim()
  if (!id && !modelo && !sn) return []

  return [
    {
      uid: 'legacy-0',
      equipamentoOrigem: r.equipamentoOrigem === 'armazem' ? 'armazem' : 'cliente',
      equipamentoId: id,
      maquinaModelo: modelo,
      numeroMaquina: sn,
    },
  ]
}

export function formatarEquipamentoRelatorioLinha(
  eq: RelatorioEquipamentoRef,
  indice?: number
): string {
  const prefix = indice != null ? `Equip. ${indice}` : ''
  const idPart = eq.equipamentoId ? `ID: ${eq.equipamentoId}` : ''
  const modelo = eq.maquinaModelo
  const sn = eq.numeroMaquina ? `S/N: ${eq.numeroMaquina}` : ''
  const origemTag = eq.equipamentoOrigem === 'armazem' ? '(Armazém)' : ''
  const partes = [idPart, modelo, sn, origemTag].filter(Boolean)
  const corpo = partes.join(' · ')
  if (!corpo) return prefix || '—'
  return prefix ? `${prefix} — ${corpo}` : corpo
}

export function formatarEquipamentosIdsRelatorio(equipamentos: RelatorioEquipamentoRef[]): string {
  return equipamentosRelatorioPreenchidos(equipamentos)
    .map((eq) => eq.equipamentoId)
    .filter(Boolean)
    .join(', ')
}

export function sincronizarCamposLegadoEquipamentos(equipamentos: RelatorioEquipamentoRef[]): {
  equipamentoId?: string
  equipamentoOrigem?: RelatorioEquipamentoOrigem
  maquinaModelo: string
  numeroMaquina: string
  equipamentos: RelatorioEquipamentoRef[]
} {
  const list = equipamentosRelatorioPreenchidos(equipamentos).slice(0, MAX_EQUIPAMENTOS_RELATORIO)
  const principal = list[0]

  if (!principal) {
    return {
      equipamentoId: '',
      equipamentoOrigem: 'cliente',
      maquinaModelo: '',
      numeroMaquina: '',
      equipamentos: [],
    }
  }

  const resumoModelo =
    list.length <= 1
      ? principal.maquinaModelo
      : list.map((eq, i) => formatarEquipamentoRelatorioLinha(eq, i + 1)).join(' · ')

  return {
    equipamentoId: principal.equipamentoId,
    equipamentoOrigem: principal.equipamentoOrigem,
    maquinaModelo: resumoModelo,
    numeroMaquina:
      list.length === 1
        ? principal.numeroMaquina
        : list
            .map((eq) => eq.numeroMaquina)
            .filter(Boolean)
            .join(', '),
    equipamentos: list,
  }
}

export function validarEquipamentosRelatorio(equipamentos: RelatorioEquipamentoRef[]): string | null {
  const list = equipamentosRelatorioPreenchidos(equipamentos)
  if (list.length > MAX_EQUIPAMENTOS_RELATORIO) {
    return `Máximo de ${MAX_EQUIPAMENTOS_RELATORIO} equipamentos por relatório.`
  }

  for (let i = 0; i < list.length; i++) {
    const eq = list[i]
    if (eq.equipamentoOrigem === 'armazem' && !eq.equipamentoId) {
      return `Equipamento ${i + 1}: selecione o equipamento do armazém ou remova a linha.`
    }
    if (eq.equipamentoOrigem === 'cliente' && !eq.equipamentoId && !eq.maquinaModelo) {
      return `Equipamento ${i + 1}: selecione um equipamento do cliente.`
    }
  }

  const chaves = list
    .filter((eq) => eq.equipamentoId)
    .map((eq) => `${eq.equipamentoOrigem}:${eq.equipamentoId}`)
  const duplicado = chaves.find((chave, idx) => chaves.indexOf(chave) !== idx)
  if (duplicado) return 'Não repita o mesmo equipamento duas vezes no relatório.'

  return null
}

export function prepararRelatorioServicoEquipamentos<T extends RelatorioServicoEquipamentosHost>(
  form: T
): T {
  const normalizados = normalizarEquipamentosRelatorio(form)
  const synced = sincronizarCamposLegadoEquipamentos(normalizados)
  return { ...form, ...synced }
}

export function relatorioParaImprimirPDFEquipamentos<T extends RelatorioServicoEquipamentosHost>(
  r: T
): T {
  const equipamentos = equipamentosRelatorioPreenchidos(normalizarEquipamentosRelatorio(r))
  if (equipamentos.length === 0) return r

  if (equipamentos.length === 1) {
    const eq = equipamentos[0]
    if (eq.equipamentoOrigem === 'armazem') {
      const linha = formatarEquipamentoRelatorioLinha(eq)
      return {
        ...r,
        equipamentos,
        equipamentoId: eq.equipamentoId,
        equipamentoOrigem: 'armazem',
        maquinaModelo: `${linha} (Armazém — gestão industrial)`.trim(),
        numeroMaquina: '',
      }
    }
    return {
      ...r,
      equipamentos,
      equipamentoId: eq.equipamentoId,
      equipamentoOrigem: 'cliente',
      maquinaModelo: eq.maquinaModelo,
      numeroMaquina: eq.numeroMaquina,
    }
  }

  const linhas = equipamentos.map((eq, i) => formatarEquipamentoRelatorioLinha(eq, i + 1))
  return {
    ...r,
    equipamentos,
    equipamentoId: formatarEquipamentosIdsRelatorio(equipamentos),
    equipamentoOrigem: equipamentos[0]?.equipamentoOrigem,
    maquinaModelo: linhas.join(' · '),
    numeroMaquina: '',
  }
}

export function equipamentosClienteParaBiblioteca(
  equipamentos: RelatorioEquipamentoRef[]
): string[] {
  return [
    ...new Set(
      equipamentosRelatorioPreenchidos(equipamentos)
        .filter((eq) => eq.equipamentoOrigem !== 'armazem' && eq.equipamentoId)
        .map((eq) => eq.equipamentoId)
    ),
  ]
}

type ClienteRelatoriosHost = {
  id: string
  relatorios?: Record<string, Array<{ id: string; data: string; numero: string }>>
}

export function aplicarRelatorioNaBibliotecaCliente<T extends ClienteRelatoriosHost, R extends { id: string; data: string; numero: string } & RelatorioServicoEquipamentosHost>(
  clientes: T[],
  savedRelatorio: R
): T[] {
  if (!savedRelatorio.clienteId) return clientes

  const keys = equipamentosClienteParaBiblioteca(normalizarEquipamentosRelatorio(savedRelatorio))
  const clienteIndex = clientes.findIndex((c) => c.id === savedRelatorio.clienteId)
  if (clienteIndex === -1) return clientes

  const updated = [...clientes]
  const cliente = { ...updated[clienteIndex] }
  const relatorios: Record<string, R[]> = { ...(cliente.relatorios as Record<string, R[]> | undefined) }

  for (const k of Object.keys(relatorios)) {
    const list = relatorios[k]
    if (!Array.isArray(list)) continue
    const filtered = list.filter((item) => item.id !== savedRelatorio.id)
    if (filtered.length !== list.length) {
      if (filtered.length === 0) delete relatorios[k]
      else relatorios[k] = filtered
    }
  }

  for (const key of keys) {
    if (!relatorios[key]) relatorios[key] = []
    const list = [...relatorios[key]]
    const existingIndex = list.findIndex((item) => item.id === savedRelatorio.id)
    if (existingIndex !== -1) list[existingIndex] = savedRelatorio
    else list.push(savedRelatorio)
    list.sort((a, b) => {
      const dataA = new Date(a.data).getTime()
      const dataB = new Date(b.data).getTime()
      if (dataA === dataB) return b.numero.localeCompare(a.numero)
      return dataB - dataA
    })
    relatorios[key] = list
  }

  updated[clienteIndex] = { ...cliente, relatorios } as T
  return updated
}
