'use client'

import { useMemo, useState } from 'react'
import {
  CLIENTES_ALFABETO_INDICE,
  agruparClientesPorLetra,
  filtrarClientesPorBusca,
  contarClientesPorLetraAlfabeto,
  filtrarClientesPorLetraAlfabeto,
  type ClienteAlfabetoRow,
} from '../lib/clienteAlfabetoBusca'
import { localeOrdenacaoClientes, ordenarClientesPorNome } from '../lib/ordenarClientes'
import { ClienteListaLinhas } from './ClienteListaLinhas'
import { ClienteDevedorNomeTag } from './ClienteDevedorNomeTag'

export type ClienteAlfabetoPickerLabels = {
  buscar?: string
  nenhumEncontrado?: string
  selecioneLetra?: string
  prompt?: string
  mostrando?: string
  de?: string
  clientes?: string
  comInicial?: string
  outros?: string
  semClientesLetra?: string
  indiceAz?: string
  limpar?: string
  cliente?: string
  filtrados?: string
  devedor?: string
  toqueFiltrar?: string
  expandirTodos?: string
  retrairTodos?: string
}

export type ClienteAlfabetoPickerAction = {
  id: string
  label: string
  active?: boolean
  onClick: () => void
}

type Props = {
  clientes: ClienteAlfabetoRow[]
  selectedId?: string
  onSelect: (cliente: ClienteAlfabetoRow) => void
  onClear?: () => void
  language?: string
  labels?: ClienteAlfabetoPickerLabels
  className?: string
  listMaxHeight?: number | string
  isDevedor?: (cliente: ClienteAlfabetoRow) => boolean
  headerActions?: ClienteAlfabetoPickerAction[]
  showSelectedChip?: boolean
}

export function ClienteAlfabetoPicker({
  clientes,
  selectedId = '',
  onSelect,
  onClear,
  language = 'pt-BR',
  labels: L = {},
  className = '',
  listMaxHeight = 340,
  isDevedor,
  headerActions,
  showSelectedChip = true,
}: Props) {
  const [busca, setBusca] = useState('')
  const [letraFiltro, setLetraFiltro] = useState<string | null>(null)
  const [letrasRecolhidas, setLetrasRecolhidas] = useState<Set<string>>(() => new Set())
  const [cardsExpandidos, setCardsExpandidos] = useState<Set<string>>(() => new Set())
  const locale = localeOrdenacaoClientes(language)

  const clientesFiltrados = useMemo(
    () => filtrarClientesPorBusca(clientes, busca, locale),
    [clientes, busca, locale]
  )

  const clientesPorLetra = useMemo(() => agruparClientesPorLetra(clientesFiltrados), [clientesFiltrados])
  const buscaAtiva = busca.trim().length > 0

  const letraAtiva =
    letraFiltro && contarClientesPorLetraAlfabeto(clientesFiltrados, letraFiltro) > 0
      ? letraFiltro
      : null

  const letrasParaLista = letraAtiva
    ? [letraAtiva]
    : CLIENTES_ALFABETO_INDICE.filter((letra) => (clientesPorLetra.get(letra)?.length ?? 0) > 0)

  const clientesListaPorLetra = (letra: string) =>
    letraAtiva && letra === letraAtiva
      ? ordenarClientesPorNome(filtrarClientesPorLetraAlfabeto(clientesFiltrados, letra), locale)
      : (clientesPorLetra.get(letra) ?? [])

  const countLetraAtiva = letraAtiva ? clientesListaPorLetra(letraAtiva).length : clientesFiltrados.length

  const selecionado = selectedId ? clientes.find((c) => c.id === selectedId) : undefined

  const limparSelecao = () => {
    setBusca('')
    setLetraFiltro(null)
    onClear?.()
  }

  if (!clientes.length) {
    return (
      <p className="cliente-alfabeto-picker__empty">
        {L.nenhumEncontrado || 'Nenhum cliente cadastrado.'}
      </p>
    )
  }

  return (
    <div className={`cliente-alfabeto-picker${className ? ` ${className}` : ''}`}>
      {headerActions && headerActions.length > 0 ? (
        <div className="cliente-alfabeto-picker__actions" role="group">
          {headerActions.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`cliente-alfabeto-picker__action${a.active ? ' is-active' : ''}`}
              onClick={a.onClick}
            >
              {a.label}
            </button>
          ))}
        </div>
      ) : null}

      {showSelectedChip && selecionado ? (
        <div className="cliente-alfabeto-picker__selected">
          <span className="cliente-alfabeto-picker__selected-label">{L.cliente || 'Cliente'}:</span>
          <strong className="cliente-alfabeto-picker__selected-name">
            {isDevedor?.(selecionado) ? (
              <ClienteDevedorNomeTag
                label={L.devedor || 'Devedor'}
                variant="inline"
              />
            ) : null}
            {selecionado.nomeEmpresa}
          </strong>
          {onClear ? (
            <button type="button" className="cliente-alfabeto-picker__clear" onClick={limparSelecao}>
              {L.limpar || 'Limpar'}
            </button>
          ) : null}
        </div>
      ) : null}

      <input
        type="text"
        className="cliente-alfabeto-picker__search"
        placeholder={
          L.buscar ||
          'Buscar cliente por nome, morada, código postal, país, telefone, e-mail ou contato...'
        }
        value={busca}
        onChange={(e) => {
          setBusca(e.target.value)
          setLetraFiltro(null)
        }}
      />

      {clientesFiltrados.length === 0 ? (
        <p className="cliente-alfabeto-picker__empty">
          {L.nenhumEncontrado || 'Nenhum encontrado'} {busca.trim() ? `"${busca.trim()}"` : ''}
        </p>
      ) : (
        <div className="cliente-alfabeto-picker__meta">
          {letraAtiva
            ? `${countLetraAtiva} ${L.clientes || 'cliente(s)'} ${L.comInicial || 'com inicial'} «${
                letraAtiva === '#' ? L.outros || 'Outros' : letraAtiva
              }»${busca.trim() ? ` (${L.de || 'de'} ${clientesFiltrados.length} ${L.filtrados || 'filtrados'})` : ''}`
            : buscaAtiva
              ? `${clientesFiltrados.length} ${L.clientes || 'cliente(s)'} — «${busca.trim()}»`
              : `${L.mostrando || 'Mostrando'} ${clientesFiltrados.length} ${L.de || 'de'} ${clientes.length} ${
                  L.clientes || 'cliente(s)'
                } — ${L.toqueFiltrar || 'toque numa letra para filtrar'}`}
        </div>
      )}

      {clientesFiltrados.length > 0 ? (
        <div className="clientes-alfa-wrap cliente-alfabeto-picker__wrap">
          <nav
            className="clientes-alfa-jump clientes-alfa-jump--modern"
            aria-label={L.indiceAz || 'Índice A–Z'}
          >
            {CLIENTES_ALFABETO_INDICE.map((letra) => {
              const count = contarClientesPorLetraAlfabeto(clientesFiltrados, letra)
              const temClientes = count > 0
              const active = letraAtiva === letra
              return (
                <button
                  key={letra}
                  type="button"
                  className={`clientes-alfa-jump-btn${active ? ' is-active' : ''}${!temClientes ? ' is-empty' : ''}`}
                  disabled={!temClientes}
                  aria-pressed={active}
                  title={
                    temClientes
                      ? `${count} ${L.clientes || 'cliente(s)'}`
                      : L.semClientesLetra || 'Sem clientes nesta letra'
                  }
                  onClick={() => setLetraFiltro((prev) => (prev === letra ? null : letra))}
                >
                  <span className="clientes-alfa-jump-btn__letter">{letra === '#' ? '#' : letra}</span>
                  {temClientes ? (
                    <span className="clientes-alfa-jump-btn__count" aria-hidden>
                      {count}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </nav>

          <div className="cliente-alfabeto-picker__list" style={{ maxHeight: listMaxHeight }}>
            {letrasParaLista.length > 0 ? (
              <>
                <div className="clientes-alfa-toolbar">
                  <button
                    type="button"
                    className="btn-secondary clientes-alfa-toolbar__btn"
                    onClick={() => {
                      setLetrasRecolhidas(new Set())
                      setCardsExpandidos(
                        new Set(
                          letrasParaLista.flatMap((letra) =>
                            clientesListaPorLetra(letra).map((c) => c.id).filter(Boolean)
                          ) as string[]
                        )
                      )
                    }}
                  >
                    {L.expandirTodos || 'Expandir todos'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary clientes-alfa-toolbar__btn"
                    onClick={() => {
                      setLetrasRecolhidas(new Set(letrasParaLista))
                      setCardsExpandidos(new Set())
                    }}
                  >
                    {L.retrairTodos || 'Retrair todos'}
                  </button>
                </div>
                {letrasParaLista.map((letra) => {
                  const letraAberta = !letrasRecolhidas.has(letra)
                  const listaLetra = clientesListaPorLetra(letra)
                  return (
                <section
                  key={letra}
                  id={`cliente-picker-letra-${letra}`}
                  className={`clientes-alfa-secao${letraAberta ? ' clientes-alfa-secao--aberta' : ' clientes-alfa-secao--retraida'}`}
                >
                  <button
                    type="button"
                    className="clientes-alfa-letra clientes-alfa-letra--toggle"
                    aria-expanded={letraAberta}
                    onClick={() => {
                      setLetrasRecolhidas((prev) => {
                        const next = new Set(prev)
                        if (next.has(letra)) next.delete(letra)
                        else next.add(letra)
                        return next
                      })
                    }}
                  >
                    <span className="clientes-alfa-letra__badge">
                      {letra === '#' ? L.outros || 'Outros' : letra}
                    </span>
                    <span className="clientes-alfa-letra__count">{listaLetra.length}</span>
                    <span className="clientes-alfa-letra__chevron" aria-hidden>
                      {letraAberta ? '▲' : '▼'}
                    </span>
                  </button>
                  {letraAberta ? (
                  <ul className="clientes-alfa-nomes">
                    {listaLetra.map((c) => {
                      const devedor = isDevedor?.(c) ?? false
                      const active = selectedId === c.id
                      const cardAberto = cardsExpandidos.has(c.id)
                      return (
                        <li key={c.id} className="clientes-alfa-item">
                          <button
                            type="button"
                            className={`clientes-alfa-nome-btn${devedor ? ' clientes-alfa-nome-btn--devedor' : ''}${
                              active ? ' is-selected' : ''
                            }`}
                            onClick={() => onSelect(c)}
                          >
                            <ClienteListaLinhas
                              cliente={c}
                              language={language}
                              devedor={devedor}
                              expandido={cardAberto}
                              onToggleExpand={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setCardsExpandidos((prev) => {
                                  const next = new Set(prev)
                                  if (next.has(c.id)) next.delete(c.id)
                                  else next.add(c.id)
                                  return next
                                })
                              }}
                            />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                  ) : null}
                </section>
                  )
                })}
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
