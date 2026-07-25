'use client'

import { useMemo } from 'react'
import {
  ALFABETO_INDICE,
  agruparPorLetraNome,
  filtrarPorNomeBusca,
  type NomeAlfabetoRow,
} from '../lib/nomeAlfabetoBusca'

export type AlfabetoIndiceBuscaLabels = {
  buscar?: string
  nenhumEncontrado?: string
  selecioneLetra?: string
  mostrando?: string
  de?: string
  itens?: string
  comInicial?: string
  outros?: string
  semItensLetra?: string
  indiceAz?: string
  limpar?: string
  filtrados?: string
  promptLetra?: string
}

type Props = {
  items: NomeAlfabetoRow[]
  busca: string
  onBuscaChange: (value: string) => void
  letraFiltro: string | null
  onLetraFiltroChange: (letra: string | null) => void
  labels?: AlfabetoIndiceBuscaLabels
  itemLabel?: string
  searchPlaceholder?: string
  className?: string
  showLimpar?: boolean
}

export function AlfabetoIndiceBusca({
  items,
  busca,
  onBuscaChange,
  letraFiltro,
  onLetraFiltroChange,
  labels: L = {},
  itemLabel = 'item(ns)',
  searchPlaceholder,
  className = '',
  showLimpar = true,
}: Props) {
  const filtrados = useMemo(() => filtrarPorNomeBusca(items, busca), [items, busca])
  const porLetra = useMemo(() => agruparPorLetraNome(filtrados), [filtrados])

  const letraAtiva =
    letraFiltro && (porLetra.get(letraFiltro)?.length ?? 0) > 0 ? letraFiltro : null
  const countLetraAtiva = letraAtiva ? (porLetra.get(letraAtiva)?.length ?? 0) : 0

  if (!items.length) return null

  return (
    <div className={`cliente-alfabeto-picker alfabeto-indice-busca${className ? ` ${className}` : ''}`}>
      <input
        type="search"
        className="cliente-alfabeto-picker__search"
        placeholder={searchPlaceholder || L.buscar || 'Buscar por nome...'}
        value={busca}
        onChange={(e) => {
          onBuscaChange(e.target.value)
          onLetraFiltroChange(null)
        }}
      />

      {filtrados.length === 0 ? (
        <p className="cliente-alfabeto-picker__empty">
          {L.nenhumEncontrado || 'Nenhum encontrado'}{' '}
          {busca.trim() ? `"${busca.trim()}"` : ''}
        </p>
      ) : (
        <>
          <div className="cliente-alfabeto-picker__meta">
            {letraAtiva
              ? `${countLetraAtiva} ${itemLabel} ${L.comInicial || 'com inicial'} «${
                  letraAtiva === '#' ? L.outros || 'Outros' : letraAtiva
                }»${busca.trim() ? ` (${L.de || 'de'} ${filtrados.length} ${L.filtrados || 'filtrados'})` : ''}`
              : `${L.mostrando || 'Mostrando'} ${filtrados.length} ${L.de || 'de'} ${items.length} ${itemLabel} — ${
                  L.selecioneLetra || 'selecione uma letra abaixo'
                }`}
          </div>

          <div className="clientes-alfa-wrap cliente-alfabeto-picker__wrap">
            <nav
              className="clientes-alfa-jump clientes-alfa-jump--modern"
              aria-label={L.indiceAz || 'Índice A–Z'}
            >
              {ALFABETO_INDICE.map((letra) => {
                const count = porLetra.get(letra)?.length ?? 0
                const temItens = count > 0
                const active = letraAtiva === letra
                return (
                  <button
                    key={letra}
                    type="button"
                    className={`clientes-alfa-jump-btn${active ? ' is-active' : ''}${!temItens ? ' is-empty' : ''}`}
                    disabled={!temItens}
                    aria-pressed={active}
                    title={
                      temItens
                        ? `${count} ${itemLabel}`
                        : L.semItensLetra || 'Sem itens nesta letra'
                    }
                    onClick={() => onLetraFiltroChange(letra)}
                  >
                    <span className="clientes-alfa-jump-btn__letra">{letra}</span>
                    {temItens ? <span className="clientes-alfa-jump-btn__count">{count}</span> : null}
                  </button>
                )
              })}
            </nav>
          </div>

          <p className="alfabeto-indice-busca__prompt">
            {L.promptLetra ||
              'Toque numa letra acima para ver apenas os itens com essa inicial.'}
          </p>

          {showLimpar && (busca.trim() || letraAtiva) ? (
            <button
              type="button"
              className="cliente-alfabeto-picker__clear alfabeto-indice-busca__limpar"
              onClick={() => {
                onBuscaChange('')
                onLetraFiltroChange(null)
              }}
            >
              {L.limpar || 'Limpar busca e letra'}
            </button>
          ) : null}
        </>
      )}
    </div>
  )
}
