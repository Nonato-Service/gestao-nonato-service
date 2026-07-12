/**
 * Normaliza preços vindos da API HOMAG (From_price__c) para a biblioteca (ex.: "12,50").
 */

function parsePrecoNumero(raw) {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : NaN
  const t = String(raw ?? '')
    .trim()
    .replace(/[€$£\s]/g, '')
  if (!t) return NaN
  if (t.includes(',') && t.includes('.')) {
    if (t.lastIndexOf(',') > t.lastIndexOf('.')) {
      return parseFloat(t.replace(/\./g, '').replace(',', '.'))
    }
    return parseFloat(t.replace(/,/g, ''))
  }
  if (t.includes(',')) return parseFloat(t.replace(',', '.'))
  return parseFloat(t)
}

export function formatHomagPreco(raw) {
  if (raw == null || raw === '') return ''
  let v = raw
  if (typeof raw === 'object' && raw !== null && 'value' in raw) {
    v = raw.value
  }
  const n = parsePrecoNumero(v)
  if (!Number.isFinite(n) || n < 0) return ''
  return n.toFixed(2).replace('.', ',')
}

export function extractHomagPrecoFromProduct(p) {
  if (!p || typeof p !== 'object') return ''
  const fields = p.fields
  if (fields && typeof fields === 'object') {
    for (const key of ['From_price__c', 'from_price__c', 'UnitPrice', 'ListPrice']) {
      const fp = fields[key]
      if (fp != null && fp !== '') return fp
    }
  }
  const prices = p.prices
  if (prices && typeof prices === 'object') {
    for (const key of ['unitPrice', 'listPrice', 'negotiatedPrice', 'price', 'amount']) {
      const v = prices[key]
      if (v != null && v !== '') return v
    }
  }
  if (p.pricing && typeof p.pricing === 'object') {
    for (const key of ['unitPrice', 'listPrice', 'price']) {
      const v = p.pricing[key]
      if (v != null && v !== '') return v
    }
  }
  if (p.From_price__c != null && p.From_price__c !== '') return p.From_price__c
  if (p.preco != null && String(p.preco).trim()) return p.preco
  if (p.price != null && String(p.price).trim()) return p.price
  return ''
}

export function extractHomagPrecoFromExportItem(item) {
  if (!item || typeof item !== 'object') return ''
  const direct = item.preco ?? item.price ?? item.From_price__c
  if (direct != null && String(direct).trim()) return direct
  const fields = item.fields
  if (fields && typeof fields === 'object') {
    const fp = fields.From_price__c ?? fields.from_price__c
    if (fp != null && fp !== '') return fp
  }
  return ''
}
