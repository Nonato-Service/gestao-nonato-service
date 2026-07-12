import { useEffect, useMemo, useState } from 'react'

import { buscarPecaBibliotecaNoServidor, type PecaBibliotecaRemota } from './buscarPecaBibliotecaRemoto'
import { filtrarPecasBibliotecaPorBusca } from './pecaCodigoBusca'

/** Busca local + fallback no servidor quando o catálogo em memória está incompleto. */
export function useBuscaPecaBibliotecaComServidor<
  T extends { id: string; codigo?: string; nome?: string; descricao?: string; imagem?: string },
>(pecasBiblioteca: T[], query: string, limit = 50) {
  const resultadosLocais = useMemo(
    () => filtrarPecasBibliotecaPorBusca(pecasBiblioteca, query, limit),
    [pecasBiblioteca, query, limit]
  )

  const [resultadosServidor, setResultadosServidor] = useState<PecaBibliotecaRemota[]>([])
  const [servidorLoading, setServidorLoading] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResultadosServidor([])
      setServidorLoading(false)
      return
    }
    if (resultadosLocais.length > 0) {
      setResultadosServidor([])
      setServidorLoading(false)
      return
    }

    let cancelled = false
    setServidorLoading(true)
    const timer = window.setTimeout(() => {
      void buscarPecaBibliotecaNoServidor(q, limit).then((pecas) => {
        if (cancelled) return
        setResultadosServidor(pecas)
        setServidorLoading(false)
      })
    }, 280)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query, resultadosLocais.length, limit])

  const resultados =
    resultadosLocais.length > 0 ? resultadosLocais : (resultadosServidor as unknown as T[])
  const fonteServidor = query.trim().length > 0 && resultadosLocais.length === 0 && resultadosServidor.length > 0

  return { resultados, resultadosLocais, servidorLoading, fonteServidor }
}
