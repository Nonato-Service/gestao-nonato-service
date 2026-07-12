export type PecaBibliotecaRemota = {
  id: string
  codigo: string
  nome: string
  descricao?: string
  imagem?: string
  temImagemServidor?: boolean
}

const API_BASE =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || ''

export async function buscarPecaBibliotecaNoServidor(
  query: string,
  limit = 50
): Promise<PecaBibliotecaRemota[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const url = `${API_BASE}/api/data/buscar-peca-biblioteca?q=${encodeURIComponent(q)}&limit=${limit}`
  try {
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    })
    if (!res.ok) return []
    const json = (await res.json()) as {
      success?: boolean
      pecas?: PecaBibliotecaRemota[]
      error?: string
    }
    if (json?.error === 'auth_required') return []
    if (!json?.success || !Array.isArray(json.pecas)) return []
    return json.pecas.filter((p) => p && p.id && p.codigo)
  } catch {
    return []
  }
}
