/**
 * Testa o fluxo demo: status → activate → status → load (isolamento).
 * Uso: node scripts/test-demo-flow.mjs [baseUrl]
 * Ex.: node scripts/test-demo-flow.mjs https://gest-o-nonato-gestao.up.railway.app
 */

const base = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '')

function parseCookies(setCookieHeaders) {
  const jar = {}
  for (const h of setCookieHeaders) {
    const part = h.split(';')[0]
    const eq = part.indexOf('=')
    if (eq > 0) jar[part.slice(0, eq)] = part.slice(eq + 1)
  }
  return jar
}

function cookieHeader(jar) {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
}

async function fetchJson(path, jar, opts = {}) {
  const headers = { ...(opts.headers || {}) }
  if (jar && Object.keys(jar).length) headers.cookie = cookieHeader(jar)
  const res = await fetch(`${base}${path}`, { redirect: 'manual', ...opts, headers })
  const rawSet = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : []
  const merged = { ...jar, ...parseCookies(rawSet) }
  let body = null
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    try {
      body = await res.json()
    } catch {
      body = null
    }
  } else {
    body = await res.text()
  }
  return { status: res.status, body, jar: merged, location: res.headers.get('location') }
}

function ok(label, cond, detail = '') {
  const mark = cond ? '✅' : '❌'
  console.log(`${mark} ${label}${detail ? ` — ${detail}` : ''}`)
  return cond
}

async function main() {
  console.log(`\nTeste demo em: ${base}\n`)
  let jar = {}

  const s0 = await fetchJson('/api/demo/status', jar)
  jar = s0.jar
  ok('/demo page', (await fetch(`${base}/demo`)).ok)
  ok('status inicial isDemo=false', s0.body?.isDemo === false, JSON.stringify(s0.body))

  const act = await fetchJson('/api/demo/activate?rid=test-demo-script', jar)
  jar = act.jar
  ok('activate redireciona', act.status === 302, `status=${act.status}`)
  ok('cookie nonato_demo', jar.nonato_demo === '1')
  ok('cookie nonato_demo_start', Boolean(jar.nonato_demo_start))

  const s1 = await fetchJson('/api/demo/status', jar)
  jar = s1.jar
  ok('status após activate isDemo=true', s1.body?.isDemo === true, JSON.stringify(s1.body))
  ok('daysLeft definido', typeof s1.body?.daysLeft === 'number', String(s1.body?.daysLeft))

  const load = await fetchJson('/api/data/load', jar)
  jar = load.jar
  ok('load com cookie demo', load.status === 200, `status=${load.status}`)
  const keys = load.body?.data ? Object.keys(load.body.data) : []
  ok('load devolve objeto data', load.body?.success !== false && typeof load.body?.data === 'object', `${keys.length} chaves`)

  const save = await fetchJson('/api/data/save', jar, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'nonato-demo-test-marker', value: { ts: Date.now(), rid: 'test-demo-script' } }),
  })
  jar = save.jar
  ok('save em modo demo', save.status === 200, JSON.stringify(save.body))

  const load2 = await fetchJson('/api/data/load', jar)
  jar = load2.jar
  const marker = load2.body?.data?.['nonato-demo-test-marker']
  ok('marker gravado na demo', marker?.rid === 'test-demo-script', JSON.stringify(marker))

  const s2 = await fetchJson('/api/demo/status', {})
  ok('sem cookie isDemo=false', s2.body?.isDemo === false)

  const loadMain = await fetchJson('/api/data/load', {})
  const mainMarker = loadMain.body?.data?.['nonato-demo-test-marker']
  ok('marker NÃO aparece na base principal', mainMarker == null, mainMarker ? 'VAZAMENTO!' : 'isolado')

  const exit = await fetchJson('/api/demo/exit', jar)
  jar = exit.jar
  ok('exit redireciona', exit.status === 302)

  const s3 = await fetchJson('/api/demo/status', jar)
  ok('após exit isDemo=false', s3.body?.isDemo === false)

  console.log('\nConcluído.\n')
}

main().catch((e) => {
  console.error('Erro no teste:', e)
  process.exit(1)
})
