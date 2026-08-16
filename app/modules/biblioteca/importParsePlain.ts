/** Parse de catálogo JSON/CSV/texto/HOMAG (sem DOMParser). */

import {
  looksLikeHomagClipboard,
  matchHomagCodeLine,
  parseHomagPlainTextCatalog,
} from '../../lib/parseHomagClipboard'

export function csvSplit(line: string, sep: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        quoted = !quoted
      }
    } else if (ch === sep && !quoted) {
      out.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  out.push(cur)
  return out.map((v) => v.trim())
}

export function pushIfValidCatalogItem(itens: any[], obj: any): void {
  if (!obj || typeof obj !== 'object') return
  const maybeCodigo = String(
    obj?.codigo ??
      obj?.code ??
      obj?.partNumber ??
      obj?.part_no ??
      obj?.articleNumber ??
      obj?.numero ??
      obj?.id ??
      obj?.ref ??
      ''
  ).trim()
  const maybeNome = String(
    obj?.nome ?? obj?.name ?? obj?.descricao ?? obj?.description ?? obj?.designation ?? obj?.title ?? ''
  ).trim()
  if (maybeCodigo || maybeNome) itens.push(obj)
}

/** Extrai itens brutos de JSON, CSV ou texto plano (incl. HOMAG). */
export function parseRawCatalogItensPlain(raw: string): any[] {
  const trimRaw = raw.trim()
  let itens: any[] = []

  if (trimRaw.startsWith('[') || trimRaw.startsWith('{')) {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) itens = parsed
    else if (
      parsed &&
      typeof parsed === 'object' &&
      (Array.isArray((parsed as any).pecas) ||
        Array.isArray((parsed as any).parts) ||
        Array.isArray((parsed as any).items) ||
        Array.isArray((parsed as any).data) ||
        Array.isArray((parsed as any).itens))
    )
      itens =
        (parsed as any).pecas ??
        (parsed as any).parts ??
        (parsed as any).items ??
        (parsed as any).data ??
        (parsed as any).itens
    else itens = [parsed]
  } else {
    const lines = raw
      .split(/\r?\n/)
      .map((l: string) => l.trim())
      .filter(Boolean)
    if (lines.length < 1) return []

    const looksLikeDelimitedTable =
      (lines[0].includes(';') || lines[0].includes(',')) &&
      /codigo|código|nome|descri|pre[cç]o|price|sku|code/i.test(lines[0])

    if (looksLikeDelimitedTable) {
      const sep = lines[0].includes(';') ? ';' : ','
      const headers = csvSplit(lines[0], sep).map((h: string) => h.trim().replace(/^["']|["']$/g, ''))
      for (let i = 1; i < lines.length; i++) {
        const vals = csvSplit(lines[i], sep).map((v: string) => v.trim().replace(/^["']|["']$/g, ''))
        const obj: Record<string, string> = {}
        headers.forEach((h, j) => {
          obj[h] = vals[j] ?? ''
        })
        itens.push(obj)
      }
    } else {
      if (looksLikeHomagClipboard(raw)) {
        itens = parseHomagPlainTextCatalog(raw)
      }
      if (itens.length === 0) {
        // HOMAG / catálogos: descrição seguida de código (2006807481, 2-006-80-7481, 2006808181R, R2006215960)
        const homagItemsParsed: Array<{ codigo: string; nome: string; descricao: string }> = []
        let homagBuf: string[] = []
        for (const line of lines) {
          const t = line.trim()
          if (!t) continue
          const codigoHomag = matchHomagCodeLine(t)
          if (codigoHomag) {
            if (homagBuf.length) {
              homagItemsParsed.push({
                codigo: codigoHomag,
                nome: homagBuf[0],
                descricao: homagBuf.slice(1).join(' ').trim() || homagBuf[0],
              })
              homagBuf = []
            }
          } else {
            homagBuf.push(t)
          }
        }
        if (homagBuf.length && homagItemsParsed.length) {
          const last = homagItemsParsed[homagItemsParsed.length - 1]
          last.descricao = [last.descricao, ...homagBuf].join(' ').trim()
        }
        const homagCodeLineCount = lines.filter((l) => matchHomagCodeLine(l.trim()) != null).length
        const useHomagLinear =
          homagItemsParsed.length > 0 && homagItemsParsed.length === homagCodeLineCount

        if (useHomagLinear) {
          itens = homagItemsParsed
        } else {
          const codeRegex = /\b[A-Z0-9][A-Z0-9\-_.\/]{3,}\b/i
          const numericCodeRegex = /^\d{7,}$/
          const priceRegex = /(\d{1,3}(?:[.\s]\d{3})*(?:[.,]\d{2})\s?(?:€|eur|usd|us\$|r\$)?)$/i
          const imageUrlLine =
            /^\s*https?:\/\/[^\s<>"']+\.(jpg|jpeg|png|webp|gif|svg)(?:\?[^\s<>"']*)?\s*$/i
          let current: {
            codigo?: string
            nome?: string
            descricao?: string
            preco?: string
            imagem?: string
          } | null = null
          let pendingImagem = ''

          const flushCurrent = () => {
            if (!current) return
            if (current.codigo || current.nome || current.descricao) {
              const row = { ...current }
              if (pendingImagem && !row.imagem) row.imagem = pendingImagem
              itens.push(row)
              pendingImagem = ''
            }
            current = null
          }

          const blocks = raw
            .split(/\r?\n\s*\r?\n/g)
            .map((block: string) =>
              block
                .split(/\r?\n/)
                .map((line: string) => line.trim())
                .filter(Boolean)
            )
            .filter((block: string[]) => block.length > 0)

          const looksLikeTrailingCodeCatalog =
            blocks.length >= 2 &&
            blocks.filter((block: string[]) => numericCodeRegex.test(block[block.length - 1] || ''))
              .length >= Math.max(2, Math.ceil(blocks.length * 0.6))

          if (looksLikeTrailingCodeCatalog) {
            blocks.forEach((block: string[]) => {
              const lastLine = block[block.length - 1] || ''
              if (!numericCodeRegex.test(lastLine)) return

              let contentLines = block.slice(0, -1)
              const imgIdx = contentLines.findIndex((ln: string) => imageUrlLine.test(ln))
              let imagemBloco = ''
              if (imgIdx >= 0) {
                imagemBloco = contentLines[imgIdx].trim()
                contentLines = contentLines.filter((_, index) => index !== imgIdx)
              }
              const precoIndex = contentLines.findIndex((line: string) => priceRegex.test(line))
              const preco = precoIndex >= 0 ? contentLines[precoIndex].match(priceRegex)?.[1] || '' : ''
              const textLines =
                precoIndex >= 0 ? contentLines.filter((_, index) => index !== precoIndex) : contentLines

              const nome = textLines[0] || lastLine
              const descricao = textLines.slice(1).join(' ').trim()

              itens.push({
                codigo: lastLine,
                nome,
                descricao: descricao || nome,
                preco,
                ...(imagemBloco ? { imagem: imagemBloco } : {}),
              })
            })
          } else
            for (const line of lines) {
              if (imageUrlLine.test(line)) {
                const url = line.trim()
                if (current && (current.codigo || current.nome || current.descricao)) {
                  current.imagem = url
                } else {
                  pendingImagem = url
                }
                continue
              }
              const priceMatch = line.match(priceRegex)
              const normalizedLine = line.replace(/\s+/g, ' ').trim()
              const isLikelyCodeLine =
                !!normalizedLine.match(codeRegex) &&
                normalizedLine.length <= 60 &&
                !/\s{2,}/.test(normalizedLine) &&
                normalizedLine.split(' ').length <= 3

              if (isLikelyCodeLine) {
                if (current && !current.codigo && (current.nome || current.descricao)) {
                  current.codigo = normalizedLine
                  if (pendingImagem && !current.imagem) {
                    current.imagem = pendingImagem
                    pendingImagem = ''
                  }
                } else {
                  flushCurrent()
                  current = { codigo: normalizedLine }
                  if (pendingImagem) {
                    current.imagem = pendingImagem
                    pendingImagem = ''
                  }
                }
                continue
              }

              if (!current) {
                current = {}
              }

              if (priceMatch && !current.preco) {
                current.preco = priceMatch[1]
                const withoutPrice = normalizedLine.replace(priceRegex, '').trim()
                if (withoutPrice) {
                  if (!current.nome) current.nome = withoutPrice
                  else current.descricao = current.descricao ? `${current.descricao} ${withoutPrice}` : withoutPrice
                }
                continue
              }

              if (!current.nome) current.nome = normalizedLine
              else current.descricao = current.descricao ? `${current.descricao} ${normalizedLine}` : normalizedLine
            }

          flushCurrent()
        }
      }
    }
  }

  return itens
}
