/** Código para ecrã e PDF: `cod` preenchido ou prefixo legado `COD-…` no `nome` (ex. HTT-HORA… → HTT). */
export function servicoCodParaExibicao(s: { cod?: string; nome: string }): string {
  const c = (typeof s.cod === 'string' ? s.cod : '').trim()
  if (c) return c
  const m = (s.nome || '').trim().match(/^([A-Za-z0-9]{2,8})[-–]/)
  return m ? m[1].toUpperCase() : ''
}

/** Descrição legível para gravar no fechamento (evita só o código curto do cadastro). */
export function servicoDescricaoLegivelFechamento(s: {
  cod?: string
  nome: string
  descricao?: string
}): string {
  const cod = servicoCodParaExibicao(s)
  const codNorm = (cod || '').trim().toUpperCase()
  const pareceSoCodigo = (texto: string) => {
    const t = (texto || '').trim()
    if (!t) return true
    if (codNorm && t.toUpperCase() === codNorm) return true
    if (t.length <= 8 && /^[A-Z0-9._\-]+$/i.test(t) && !/\s/.test(t)) return true
    return false
  }
  const d = (typeof s.descricao === 'string' ? s.descricao : '').trim()
  const n = (s.nome || '').trim()
  if (d && !pareceSoCodigo(d)) return d
  if (n && !pareceSoCodigo(n)) return n
  if (d) return d
  if (n) return n
  return cod || ''
}

/** Rótulo para `<select>` no fechamento: código + descrição/nome legível. */
export function servicoRotuloParaSelectFechamento(s: {
  cod?: string
  nome: string
  descricao?: string
}): string {
  const cod = servicoCodParaExibicao(s)
  const codNorm = (cod || '').trim().toUpperCase()
  const legivel = servicoDescricaoLegivelFechamento(s)
  const legNorm = String(legivel ?? '').trim().toUpperCase()
  if (cod && legivel && legNorm !== codNorm) return `${cod} — ${legivel}`
  if (legivel) return cod ? `${cod} — ${legivel}` : legivel
  return cod || '—'
}
