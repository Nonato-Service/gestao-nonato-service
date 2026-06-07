export type ComprovanteDespesaRef = {
  id: string
  tipo: 'cliente' | 'pessoal'
  cliente: string
  data: string
  valorTotal: number
  imagemBase64?: string
  imagemHash?: string
}

/** Hash leve da imagem base64 para detetar o mesmo ficheiro fotografado duas vezes. */
export function hashImagemComprovante(imagemBase64: string): string {
  const payload = imagemBase64.includes(',') ? imagemBase64.split(',')[1]! : imagemBase64
  let h = 5381
  for (let i = 0; i < payload.length; i++) {
    h = ((h << 5) + h) ^ payload.charCodeAt(i)
  }
  return `img-${(h >>> 0).toString(36)}-${payload.length}`
}

export type DuplicadoComprovanteResultado =
  | null
  | {
      grau: 'imagem' | 'dados'
      existente: ComprovanteDespesaRef
    }

function chaveGrupo(c: Pick<ComprovanteDespesaRef, 'tipo' | 'cliente'>, labelNonato: string): string {
  return c.tipo === 'pessoal' ? labelNonato : String(c.cliente || '').trim().toLowerCase()
}

/** Procura recibo já registado (mesma foto ou mesma data+valor+cliente). */
export function encontrarComprovanteDuplicado(
  candidato: {
    imagemBase64?: string
    imagemHash?: string
    data: string
    valorTotal: number
    tipo: 'cliente' | 'pessoal'
    cliente: string
  },
  existentes: ComprovanteDespesaRef[],
  opts?: { excluirId?: string; labelNonato?: string }
): DuplicadoComprovanteResultado {
  const excluirId = opts?.excluirId
  const labelNonato = opts?.labelNonato || 'NONATO SERVICE'
  const lista = existentes.filter((c) => c.id !== excluirId)

  const hashNovo =
    candidato.imagemHash ||
    (candidato.imagemBase64 ? hashImagemComprovante(candidato.imagemBase64) : '')

  if (hashNovo) {
    for (const c of lista) {
      const hashExistente =
        c.imagemHash || (c.imagemBase64 ? hashImagemComprovante(c.imagemBase64) : '')
      if (hashExistente && hashExistente === hashNovo) {
        return { grau: 'imagem', existente: c }
      }
    }
  }

  const dataNorm = String(candidato.data || '').trim().slice(0, 10)
  const valor = Math.round((Number(candidato.valorTotal) || 0) * 100) / 100
  const grupo = chaveGrupo(candidato, labelNonato)
  if (!dataNorm || valor <= 0) return null

  for (const c of lista) {
    const dataEx = String(c.data || '').trim().slice(0, 10)
    const valorEx = Math.round((Number(c.valorTotal) || 0) * 100) / 100
    if (dataEx !== dataNorm || valorEx !== valor) continue
    if (chaveGrupo(c, labelNonato) !== grupo) continue
    return { grau: 'dados', existente: c }
  }

  return null
}

export function mensagemDuplicadoComprovante(
  dup: NonNullable<DuplicadoComprovanteResultado>,
  t: Record<string, string | undefined>,
  labelGrupo: (c: ComprovanteDespesaRef) => string
): string {
  const ex = dup.existente
  const cliente = labelGrupo(ex)
  const valor = (Number(ex.valorTotal) || 0).toFixed(2)
  const data = String(ex.data || '').slice(0, 10)
  if (dup.grau === 'imagem') {
    return (
      t.comprovantesDuplicadoImagem ||
      `Esta foto já foi registada (${cliente}, ${data}, ${valor} €). Deseja registar mesmo assim?`
    )
      .replace('{cliente}', cliente)
      .replace('{data}', data)
      .replace('{valor}', valor)
  }
  return (
    t.comprovantesDuplicadoDados ||
    `Já existe um comprovante igual (${cliente}, ${data}, ${valor} €). Deseja registar mesmo assim?`
  )
    .replace('{cliente}', cliente)
    .replace('{data}', data)
    .replace('{valor}', valor)
}
