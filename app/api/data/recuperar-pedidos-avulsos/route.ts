import { NextRequest, NextResponse } from 'next/server'
import { ensureDataDir } from '../shared'
import { getDemoContext, ensureDemoDataDir } from '../demo-context'
import { rejectUnauthenticatedProductionAccess } from '../../auth/appAuth'
import { recuperarPedidosAvulsosNoServidor } from '../../../lib/recuperarPedidosAvulsosServer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const host = (request.headers.get('host') || '').split(':')[0].toLowerCase()
    const isLocalDevHost =
      process.env.NODE_ENV === 'development' ||
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '[::1]' ||
      host === '::1'
    if (!isLocalDevHost) {
      const authDenied = rejectUnauthenticatedProductionAccess(request)
      if (authDenied) return authDenied
    }

    const { isDemo, expired, dataDir } = getDemoContext(request)
    if (isDemo && expired) {
      return NextResponse.json({ ok: false, message: 'Demo expirada.' }, { status: 403 })
    }
    ensureDemoDataDir(dataDir)
    ensureDataDir()

    const result = recuperarPedidosAvulsosNoServidor(dataDir)
    if (!result.ok) {
      return NextResponse.json(result, { status: 404 })
    }

    return NextResponse.json({
      ...result,
      pedidos: result.pedidos.map((p) => ({
        codigo: p.codigo,
        clienteNomeReal: p.clienteNomeReal,
        dataGeracao: p.dataGeracao,
        emitirComoCliente: p.emitirComoCliente,
      })),
    })
  } catch (e) {
    console.error('[recuperar-pedidos-avulsos]', e)
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : 'Erro ao recuperar pedidos.' },
      { status: 500 }
    )
  }
}
