'use client'

import { useMemo, useState } from 'react'
import {
  CLIENTES_ALFABETO_INDICE,
  agruparClientesPorLetra,
  filtrarClientesPorBusca,
  type ClienteAlfabetoRow,
} from '../lib/clienteAlfabetoBusca'
import { localeOrdenacaoClientes } from '../lib/ordenarClientes'
import { ClienteListaLinhas } from './ClienteListaLinhas'

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
  const locale = localeOrdenacaoClientes(language)

  const clientesFiltrados = useMemo(
    () => filtrarClientesPorBusca(clientes, busca, locale),
    [clientes, busca, locale]
  )

  const clientesPorLetra = useMemo(() => agruparClientesPorLetra(clientesFiltrados), [clientesFiltrados])

  const letraAtiva =
    letraFiltro && (clientesPorLetra.get(letraFiltro)?.length ?? 0) > 0 ? letraFiltro : null

  const letrasParaLista = letraAtiva ? [letraAtiva] : []
  const countLetraAtiva = letraAtiva ? (clientesPorLetra.get(letraAtiva)?.length ?? 0) : 0

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
          <strong className="cliente-alfabeto-picker__selected-name">{selecionado.nomeEmpresa}</strong>
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
            : `${L.mostrando || 'Mostrando'} ${clientesFiltrados.length} ${L.de || 'de'} ${clientes.length} ${
                L.clientes || 'cliente(s)'
              } — ${L.selecioneLetra || 'selecione uma letra abaixo'}`}
        </div>
      )}

      {clientesFiltrados.length > 0 ? (
        <div className="clientes-alfa-wrap cliente-alfabeto-picker__wrap">
          <nav
            className="clientes-alfa-jump clientes-alfa-jump--modern"
            aria-label={L.indiceAz || 'Índice A–Z'}
          >
            {CLIENTES_ALFABETO_INDICE.map((letra) => {
              const count = clientesPorLetra.get(letra)?.length ?? 0
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
                  onClick={() => setLetraFiltro(letra)}
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
            {!letraAtiva ? (
              <p className="clientes-alfa-prompt">
                {L.prompt || 'Toque numa letra acima para ver apenas os clientes com essa inicial.'}
              </p>
            ) : (
              letrasParaLista.map((letra) => (
                <section key={letra} id={`cliente-picker-letra-${letra}`} className="clientes-alfa-secao">
                  <h3 className="clientes-alfa-letra">
                    {letra === '#' ? L.outros || 'Outros' : letra}
                    <span className="clientes-alfa-letra__count">
                      {(clientesPorLetra.get(letra) ?? []).length}
                    </span>
                  </h3>
                  <ul className="clientes-alfa-nomes">
                    {(clientesPorLetra.get(letra) ?? []).map((c) => {
                      const devedor = isDevedor?.(c) ?? false
                      const active = selectedId === c.id
                      return (
                        <li key={c.id} className="clientes-alfa-item">
                          <button
                            type="button"
                            className={`clientes-alfa-nome-btn${devedor ? ' clientes-alfa-nome-btn--devedor' : ''}${
                              active ? ' is-selected' : ''
                            }`}
                            onClick={() => onSelect(c)}
                          >
                            <ClienteListaLinhas cliente={c} language={language} devedor={devedor} />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
