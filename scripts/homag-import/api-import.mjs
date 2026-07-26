/**
 * Importação HOMAG via API Aura — contorna limite de 250 págs (5000 itens/query).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { normCodigo } from './resume.mjs'
import { chavesDedupHomagPeca, normCodigoHomag, variantesCodigoHomagParaMatch } from './homag-codigo-ref.mjs'
import { homagExportItemPrecisaFoto } from './imagem-util.mjs'
import {
  captureAuraSession,
  fetchHomagProductsViaApi,
  parseHomagAuraProducts,
  parseCategoryIdFromUrl,
  catalogMaxPage,
  DEFAULT_FIELDS,
} from './api-products.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AUDIT_PATH = path.join(__dirname, '..', '..', 'data', 'homag-audit-result.json')
const AUDIT_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000

function lerAuditoriaHomagRecente() {
  try {
    if (!fs.existsSync(AUDIT_PATH)) return null
    const j = JSON.parse(fs.readFileSync(AUDIT_PATH, 'utf8'))
    const age = Date.now() - Date.parse(String(j.data || ''))
    if (!Number.isFinite(age) || age > AUDIT_MAX_AGE_MS) return null
    return j
  } catch {
    return null
  }
}

/** API HOMAG aceita páginas 0–250 (251×20 = 5020 itens por query). */
const API_MAX_PAGE_INDEX = 250
const API_PAGE_SIZE = 20
const API_MAX_ITEMS_PER_QUERY = (API_MAX_PAGE_INDEX + 1) * API_PAGE_SIZE

function mergeSearchFields(templateFields) {
  const base = Array.isArray(templateFields) && templateFields.length ? templateFields : DEFAULT_FIELDS
  return [...new Set([...base, 'Name', 'StockKeepingUnit', 'From_price__c'])]
}

export function baseInput(session, categoryId, searchTerm = '') {
  return {
    ...session.searchInputTemplate,
    categoryId,
    searchTerm: searchTerm || '',
    refinements: [],
    fields: mergeSearchFields(session.searchInputTemplate?.fields),
    includeQuantityRule: true,
    includePrices: true,
  }
}

export async function auraSearch(context, session, searchInput) {
  const message = {
    actions: [
      {
        id: '1;a',
        descriptor: 'aura://ApexActionController/ACTION$execute',
        callingDescriptor: 'UNKNOWN',
        params: {
          namespace: 'commerce',
          classname: 'SearchController',
          method: 'searchProducts',
          params: {
            webstoreId: session.webstoreId,
            effectiveAccountId: session.effectiveAccountId ?? null,
            searchInput,
          },
          cacheable: false,
          isContinuation: false,
        },
      },
    ],
  }
  const body = new URLSearchParams({
    message: JSON.stringify(message),
    'aura.context': session.auraContext,
    'aura.pageURI': session.pageURI,
    'aura.token': 'undefined',
  })
  const res = await context.request.post(
    'https://shop.homag.com/s/sfsites/aura?aura.ApexAction.execute=1',
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Referer: `https://shop.homag.com${session.pageURI}`,
      },
      data: body.toString(),
    }
  )
  const text = await res.text()
  if (!res.ok()) throw new Error(`[HOMAG API] HTTP ${res.status()}`)
  const parsed = JSON.parse(text)
  const act = parsed.actions?.[0]
  if (act?.state === 'ERROR') {
    const msg = act?.error?.[0]?.message || 'Aura ERROR'
    throw new Error(`[HOMAG API] ${msg}`)
  }
  return parseHomagAuraProducts(text)
}

export async function fetchCategoryTree(context, session, categoryId) {
  const r = await auraSearch(context, session, { ...baseInput(session, categoryId), page: 0 })
  const cats = r.rawCategories || null
  return { total: r.total, categories: cats }
}

export async function getSearchTotal(context, session, categoryId, searchTerm) {
  const r = await auraSearch(context, session, { ...baseInput(session, categoryId, searchTerm), page: 0 })
  return r.total
}

/** Divide prefixos até cada bucket ter ≤5000 itens (máx. 250 págs API). */
export async function buildSearchBuckets(context, session, categoryId, rootTerm = '') {
  const buckets = []
  const queue = [{ categoryId, searchTerm: rootTerm }]
  const seen = new Set()

  while (queue.length) {
    const { categoryId: cid, searchTerm } = queue.shift()
    const key = `${cid}|${searchTerm}`
    if (seen.has(key)) continue
    seen.add(key)

    let total = 0
    try {
      total = await getSearchTotal(context, session, cid, searchTerm)
    } catch (e) {
      console.warn(`[HOMAG API] Bucket "${searchTerm || '(todos)'}": ${e.message}`)
      continue
    }
    if (total <= 0) continue

    if (total <= API_MAX_ITEMS_PER_QUERY) {
      buckets.push({ categoryId: cid, searchTerm, total })
      console.log(`[HOMAG API] Bucket "${searchTerm || '(todos)'}" — ${total} itens, ${Math.ceil(total / 20)} págs`)
    } else {
      for (let d = 0; d <= 9; d++) {
        queue.push({ categoryId: cid, searchTerm: searchTerm + String(d) })
      }
    }
  }
  return buckets
}

export async function fetchBucketPage(context, session, bucket, pageIndex) {
  const input = { ...baseInput(session, bucket.categoryId, bucket.searchTerm), page: pageIndex }
  const r = await auraSearch(context, session, input)
  return r.products
}

export async function fetchAllBucketProducts(context, session, bucket, onPage) {
  const maxIdx = Math.min(API_MAX_PAGE_INDEX, Math.ceil(bucket.total / API_PAGE_SIZE) - 1)
  const all = []
  for (let idx = 0; idx <= maxIdx; idx++) {
    const products = await fetchBucketPage(context, session, bucket, idx)
    if (onPage) await onPage(idx + 1, maxIdx + 1, products)
    if (!products.length) break
    all.push(...products)
    await sleep(120)
  }
  return all
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function codigoHomagJaVisto(codigosVistos, codigo) {
  const keys = [...variantesCodigoHomagParaMatch(codigo), normCodigoHomag(codigo)].filter(Boolean)
  return keys.some((k) => codigosVistos.has(k))
}

function marcarCodigoHomagVisto(codigosVistos, item) {
  for (const k of chavesDedupHomagPeca(item)) codigosVistos.add(k)
  const c = normCodigo(item?.codigo)
  if (c) codigosVistos.add(c)
}

function indicePorCodigoHomag(items, codigo) {
  const alvo = new Set([...variantesCodigoHomagParaMatch(codigo), normCodigoHomag(codigo)].filter(Boolean))
  return items.findIndex((it) => {
    for (const k of chavesDedupHomagPeca(it)) {
      if (alvo.has(k)) return true
    }
    return alvo.has(normCodigo(it.codigo))
  })
}

function listSubcategories(rawCategories) {
  const out = []
  for (const ch of rawCategories?.children || []) {
    const c = ch?.category
    const count = Number(ch?.productCount) || 0
    if (c?.id && count > 0) out.push({ id: c.id, name: c.name || c.id, count })
  }
  return out
}

function bucketKey(b) {
  return `${b.categoryId}|${b.searchTerm}`
}

async function backfillHomagFieldsOnExisting(context, page, products, items, buildItemFromDiscovered, embedOff, maxEmbed) {
  let photos = 0
  for (const meta of products) {
    const codKey = normCodigo(meta.codigo)
    if (!codKey) continue
    const idx = indicePorCodigoHomag(items, meta.codigo)
    const cur = idx >= 0 ? items[idx] : null
    if (!cur) continue

    let next = cur
    if ((!cur.preco || !String(cur.preco).trim()) && meta.preco) {
      next = { ...next, preco: meta.preco }
    }

    if (meta.imagemUrl) {
      const hasFile =
        cur.imagem_local && fs.existsSync(cur.imagem_local) && fs.statSync(cur.imagem_local).size > 500
      if (!hasFile || homagExportItemPrecisaFoto(cur)) {
        const it = await buildItemFromDiscovered(context, page, meta, idx, embedOff, maxEmbed)
        if (it.imagem || it.imagem_url) {
          next = {
            ...next,
            nome: next.nome || it.nome,
            descricao: next.descricao || it.descricao,
            preco: next.preco || it.preco || '',
            imagem: it.imagem || next.imagem,
            imagem_url: it.imagem_url || next.imagem_url,
            imagem_local: it.imagem_local || next.imagem_local,
          }
          photos++
        }
      }
    }

    if (next !== cur) items[idx] = next
  }
  return photos
}

function dedupeBuckets(allBuckets) {
  const dedup = []
  const seen = new Set()
  for (const b of allBuckets) {
    const k = bucketKey(b)
    if (seen.has(k)) continue
    seen.add(k)
    dedup.push(b)
  }
  return dedup
}

function backfillPrecosOnExisting(products, items) {
  let count = 0
  for (const meta of products) {
    const codKey = normCodigo(meta.codigo)
    if (!codKey || !meta.preco) continue
    const idx = indicePorCodigoHomag(items, meta.codigo)
    if (idx < 0) continue
    const cur = items[idx]
    const substituir = process.env.HOMAG_MERGE_REPLACE_PRICES === '1'
    const falta = !cur.preco || !String(cur.preco).trim()
    if ((falta || substituir) && cur.preco !== meta.preco) {
      items[idx] = { ...cur, preco: meta.preco }
      count++
    }
  }
  return count
}

/**
 * Importação completa via API — buckets por prefixo + subcategorias.
 */
export async function runHomagApiImport(opts) {
  const {
    context,
    page,
    startUrl,
    items,
    codigosVistos,
    stateFile,
    outFile,
    startUrl: url,
    interactive,
    buildItemFromDiscovered,
    saveResumeFn,
    apiState = {},
  } = opts

  let globalSeq = items.length
  const pricesOnly = process.env.HOMAG_PRICES_ONLY === '1'
  const session = await initHomagApiSession(page, startUrl)
  const rootId = session.categoryId
  if (session.effectiveAccountId) {
    console.log(`[HOMAG API] Conta efectiva (preços): ${session.effectiveAccountId}`)
  } else if (pricesOnly || process.env.HOMAG_API_BACKFILL_PRICES === '1') {
    console.warn('[HOMAG API] AVISO: sessão sem conta B2B — preços podem ficar vazios. Use HOMAG_USER/HOMAG_PASS.')
  }

  const first = await auraSearch(context, session, { ...baseInput(session, rootId), page: 0 })
  const subs = listSubcategories(first.rawCategories)
  console.log(`[HOMAG API] Catálogo: ${first.total} itens, ${subs.length} subcategorias`)

  const forceAllBuckets = process.env.HOMAG_FORCE_ALL_BUCKETS === '1'
  const maxBuckets = Number(process.env.HOMAG_API_MAX_BUCKETS) || 0
  const audit = lerAuditoriaHomagRecente()
  const fastIfComplete = process.env.HOMAG_FAST_IF_COMPLETE !== '0'

  if (
    fastIfComplete &&
    !forceAllBuckets &&
    maxBuckets <= 0 &&
    audit &&
    Number(audit.faltamApi) === 0
  ) {
    console.log('')
    console.log('============================================================')
    console.log('  MODO RAPIDO — auditoria recente: 0 pecas em falta na API')
    console.log(`  Biblioteca local: ${audit.bibliotecaLocal ?? items.length} | API unicos: ${audit.apiUnicos ?? '?'}`)
    console.log('  Salta varredura de 62 buckets (2-6 horas, quase tudo +0 novas).')
    console.log('  Vai gravar merge + referencias (hifen/R) + Railway.')
    console.log('  Varredura completa: COMPLEMENTAR-HOMAG-FALTANTES.bat')
    console.log('  Nova auditoria: VERIFICAR-CATALOGO-HOMAG.bat')
    console.log('============================================================')
    console.log('')
    return {
      items,
      totalNew: 0,
      bucketsDone: forceAllBuckets ? [] : [...(apiState.doneBuckets || [])],
      completedFully: true,
      bucketsTotal: Number(audit.buckets) || 62,
      skippedComplete: true,
    }
  }

  const allBuckets = []
  const rootBuckets = await buildSearchBuckets(context, session, rootId, '')
  allBuckets.push(...rootBuckets)

  for (const sub of subs) {
    console.log(`[HOMAG API] Subcategoria "${sub.name}" (${sub.count} itens)…`)
    const subBuckets = await buildSearchBuckets(context, session, sub.id, '')
    allBuckets.push(...subBuckets)
  }

  const allBucketsUnique = dedupeBuckets(allBuckets)
  const seenBucket = forceAllBuckets ? new Set() : new Set(apiState.doneBuckets || [])
  const uniqueBuckets = []
  for (const b of allBucketsUnique) {
    const k = bucketKey(b)
    if (seenBucket.has(k)) continue
    uniqueBuckets.push(b)
  }

  console.log(
    `[HOMAG API] Catálogo HOMAG: ${first.total} itens · ${allBucketsUnique.length} buckets únicos · ${uniqueBuckets.length} a processar (${seenBucket.size} já feitos${forceAllBuckets ? ', FORÇAR TODOS' : ''})`
  )
  if (uniqueBuckets.length < allBucketsUnique.length && !forceAllBuckets) {
    console.log(
      `[HOMAG API] AVISO: faltam ${allBucketsUnique.length - uniqueBuckets.length} bucket(s) — execute COMPLEMENTAR-HOMAG-FALTANTES.bat para ~31k peças`
    )
  }

  const maxBucketsLimit = Number(process.env.HOMAG_API_MAX_BUCKETS) || 0
  if (maxBucketsLimit > 0 && uniqueBuckets.length > maxBucketsLimit) {
    uniqueBuckets.length = maxBucketsLimit
    console.log(`[HOMAG API] Limite teste: ${maxBucketsLimit} buckets`)
  }

  let totalNew = 0
  let bucketsDone = forceAllBuckets ? [] : [...(apiState.doneBuckets || [])]

  if (!pricesOnly) {
  for (let bi = 0; bi < uniqueBuckets.length; bi++) {
    const bucket = uniqueBuckets[bi]
    const bk = bucketKey(bucket)
    const label = bucket.searchTerm ? `"${bucket.searchTerm}"` : '(todos)'
    console.log(`\n[HOMAG API] Bucket ${bi + 1}/${uniqueBuckets.length} ${label} — ${bucket.total} itens`)

    let bucketNew = 0
    let bucketPhotos = 0
    await fetchAllBucketProducts(context, session, bucket, async (pg, pgTotal, products) => {
      let added = 0
      let photos = 0
      for (const meta of products) {
        const codKey = normCodigo(meta.codigo)
        if (!codKey) continue

        if (codigoHomagJaVisto(codigosVistos, meta.codigo)) {
          const n = await backfillHomagFieldsOnExisting(
            context,
            page,
            [meta],
            items,
            buildItemFromDiscovered,
            opts.embedOff,
            opts.maxEmbed
          )
          photos += n
          bucketPhotos += n
          continue
        }

        const it = await buildItemFromDiscovered(context, page, meta, globalSeq, opts.embedOff, opts.maxEmbed)
        if (meta.referenciasAlternativas?.length) it.referenciasAlternativas = meta.referenciasAlternativas
        if (meta.codigosAlternativos?.length) it.codigosAlternativos = meta.codigosAlternativos
        if (meta.codigoOriginal && meta.codigoOriginal !== it.codigo) {
          it.codigosAlternativos = [...new Set([...(it.codigosAlternativos || []), meta.codigoOriginal])]
        }
        marcarCodigoHomagVisto(codigosVistos, it)
        items.push(it)
        globalSeq++
        added++
        bucketNew++
        totalNew++
        if (it.imagem || it.imagem_url) {
          photos++
          bucketPhotos++
        }
      }
      if (pg % 10 === 0 || pg === pgTotal) {
        console.log(
          `[HOMAG API]   pág.${pg}/${pgTotal} — +${added} novas, +${photos} fotos (bucket +${bucketNew}/+${bucketPhotos}, total ${items.length})`
        )
      }
    })

    bucketsDone.push(bk)
    try {
      saveResumeFn({
        items,
        startUrl: url,
        pageNum: 0,
        range: `API bucket ${bi + 1}/${uniqueBuckets.length} ${label}`,
        interactive,
        apiMode: true,
        apiDoneBuckets: bucketsDone,
      })
    } catch (e) {
      console.warn(`[HOMAG API] Aviso ao guardar retoma: ${e?.message || e}`)
    }
    console.log(`[HOMAG API] Bucket ${label} concluído (+${bucketNew} novas, +${bucketPhotos} fotos)`)
    await sleep(300)
  }
  }

  const dedupBuckets = dedupeBuckets(allBuckets)

  if (process.env.HOMAG_API_BACKFILL_IMAGES === '1') {
    console.log(`\n[HOMAG API] Backfill de imagens — ${dedupBuckets.length} buckets (peças sem foto)…`)
    let backfillTotal = 0
    for (let bi = 0; bi < dedupBuckets.length; bi++) {
      const bucket = dedupBuckets[bi]
      const label = bucket.searchTerm ? `"${bucket.searchTerm}"` : '(todos)'
      let bucketPhotos = 0
      await fetchAllBucketProducts(context, session, bucket, async (pg, pgTotal, products) => {
        bucketPhotos += await backfillHomagFieldsOnExisting(
          context,
          page,
          products,
          items,
          buildItemFromDiscovered,
          opts.embedOff,
          opts.maxEmbed
        )
        if (pg % 25 === 0 || pg === pgTotal) {
          console.log(`[HOMAG API]   backfill ${label} pág.${pg}/${pgTotal} — +${bucketPhotos} fotos`)
        }
      })
      backfillTotal += bucketPhotos
      if (bucketPhotos > 0) {
        try {
          saveResumeFn({
            items,
            startUrl: url,
            pageNum: 0,
            range: `API backfill imagens ${bi + 1}/${dedupBuckets.length} ${label}`,
            interactive,
            apiMode: true,
            apiDoneBuckets: bucketsDone,
          })
        } catch (e) {
          console.warn(`[HOMAG API] Aviso ao guardar backfill: ${e?.message || e}`)
        }
      }
    }
    console.log(`[HOMAG API] Backfill imagens concluído — +${backfillTotal} fotos`)
  }

  if (process.env.HOMAG_API_BACKFILL_PRICES === '1') {
    console.log(`\n[HOMAG API] Backfill de preços — ${dedupBuckets.length} buckets…`)
    let backfillPrecosTotal = 0
    for (let bi = 0; bi < dedupBuckets.length; bi++) {
      const bucket = dedupBuckets[bi]
      const label = bucket.searchTerm ? `"${bucket.searchTerm}"` : '(todos)'
      let bucketPrecos = 0
      await fetchAllBucketProducts(context, session, bucket, async (pg, pgTotal, products) => {
        bucketPrecos += backfillPrecosOnExisting(products, items)
        if (pg % 25 === 0 || pg === pgTotal) {
          console.log(`[HOMAG API]   preços ${label} pág.${pg}/${pgTotal} — +${bucketPrecos} preços`)
        }
      })
      backfillPrecosTotal += bucketPrecos
      try {
        saveResumeFn({
          items,
          startUrl: url,
          pageNum: 0,
          range: `API backfill preços ${bi + 1}/${dedupBuckets.length} ${label}`,
          interactive,
          apiMode: true,
          apiDoneBuckets: bucketsDone,
        })
      } catch (e) {
        console.warn(`[HOMAG API] Aviso ao guardar preços: ${e?.message || e}`)
      }
    }
    console.log(`[HOMAG API] Backfill preços concluído — +${backfillPrecosTotal} actualizados`)
  }

  return {
    items,
    totalNew,
    bucketsDone,
    completedFully: bucketsDone.length >= allBucketsUnique.length,
    bucketsTotal: allBucketsUnique.length,
  }
}

export async function initHomagApiSession(page, startUrl) {
  console.log('[HOMAG API] A capturar sessão Aura (searchProducts)…')
  const session = await captureAuraSession(page, startUrl)
  console.log(`[HOMAG API] Sessão OK — webstore ${session.webstoreId}, categoria ${session.categoryId}`)
  return session
}

export {
  API_MAX_PAGE_INDEX,
  API_MAX_ITEMS_PER_QUERY,
  API_PAGE_SIZE,
  catalogMaxPage,
  parseCategoryIdFromUrl,
}
