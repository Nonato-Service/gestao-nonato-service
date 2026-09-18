import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

/** Manual imprimível — o mesmo HTML que /MANUAL-USO-NONATO-SERVICE.html (capturas reais). */
export async function GET() {
  try {
    const file = path.join(process.cwd(), 'public', 'MANUAL-USO-NONATO-SERVICE.html')
    const html = await fs.readFile(file, 'utf8')
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return new NextResponse('Manual em falta. Abra /MANUAL-USO-NONATO-SERVICE.html', { status: 404 })
  }
}
