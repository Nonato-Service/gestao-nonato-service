import { NextRequest, NextResponse } from 'next/server'
import { ensureDataDir } from '../shared'
import { getDemoContext, ensureDemoDataDir } from '../demo-context'
import { rejectUnauthenticatedProductionAccess } from '../../auth/appAuth'
import {
  aplicarRecuperacaoRelatoriosServicoNoServidor,
  procurarRelatoriosServicoNoServidor,
} from '../../../lib/recuperarRelatoriosServicoServer'

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

    let body: { cliente?: string; aplicar?: boolean } = {}
    try {
      body = (await request.json()) as typeof body
    } catch {
      /* body opcional */
    }
    const cliente = String(body.cliente ?? '').trim() || undefined
    const aplicar = body.aplicar === true

    const result = aplicar
      ? aplicarRecuperacaoRelatoriosServicoNoServidor(dataDir, undefined, cliente)
      : procurarRelatoriosServicoNoServidor(dataDir, undefined, cliente)

    return NextResponse.json({
      ...result,
      encontrados: result.encontrados.map((e) => ({
        id: e.id,
        cliente: e.cliente,
        numero: e.numero,
        data: e.data,
        tecnico: e.tecnico,
        fontes: e.fontes,
        relatorio: e.relatorio,
      })),
    })
  } catch (e) {
    console.error('[recuperar-relatorios-servico]', e)
    return NextResponse.json(
      { ok: false, message: e instanceof Error ? e.message : 'Erro ao procurar relatórios.' },
      { status: 500 }
    )
  }
}
