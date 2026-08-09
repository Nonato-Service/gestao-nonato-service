'use client'

import { useMemo, type MouseEvent } from 'react'
import { codigoClienteExibicao } from '../lib/clienteCodigoUtils'
import { translations, translationBundleKey } from '../translations'
import { ClienteDevedorNomeTag } from './ClienteDevedorNomeTag'
import { formatNifClienteExibicao } from './ClienteIdentidadeChips'

export type ClienteListaLinhasData = {
  codigoCliente?: string
  id?: string
  nomeEmpresa?: string
  telefones?: string
  localidade?: string
  morada?: string
  codigoPostal?: string
  numeroContribuicaoFiscal?: string
  email?: string
}

function useListaTr(language: string) {
  return useMemo(() => {
    const primary = (translations[translationBundleKey(language)] || translations['pt-BR']) as Record<
      string,
      string | undefined
    >
    const en = translations.en as Record<string, string | undefined>
    const pt = translations['pt-BR'] as Record<string, string | undefined>
    return (key: string) => primary[key] ?? en[key] ?? pt[key] ?? key
  }, [language])
}

export function buildClienteInfAdicional(cliente: ClienteListaLinhasData): string {
  const localCp = [cliente.localidade, cliente.codigoPostal]
    .map((x) => String(x || '').trim())
    .filter((x) => x && !/^x+$/i.test(x))
    .join(' ')
    .trim()

  return [
    cliente.telefones?.trim(),
    cliente.morada?.trim(),
    localCp,
    formatNifClienteExibicao(cliente.numeroContribuicaoFiscal),
    cliente.email?.trim(),
  ]
    .filter(Boolean)
    .join(' · ')
}

type Props = {
  cliente: ClienteListaLinhasData
  language?: string
  className?: string
  devedor?: boolean
  /** Se false, esconde INF. ADICIONAL (quando há info). */
  expandido?: boolean
  /** Toggle expandir/retrair detalhes (para o clique não abrir o cliente). */
  onToggleExpand?: (e: MouseEvent) => void
}

export function ClienteListaLinhas({
  cliente,
  language = 'pt-BR',
  className,
  devedor = false,
  expandido = true,
  onToggleExpand,
}: Props) {
  const tr = useListaTr(language)
  const cod = codigoClienteExibicao(cliente)
  const nome = (cliente.nomeEmpresa || '').trim() || '—'
  const inf = buildClienteInfAdicional(cliente)
  const lblCod = tr('clienteIdentTagCod')
  const lblNome = tr('clienteIdentTagNome')
  const lblInf = tr('clienteIdentTagInfAdicional')
  const podeExpandir = Boolean(inf && onToggleExpand)
  const mostrarInf = Boolean(inf && (expandido || !onToggleExpand))

  return (
    <div
      className={`cliente-lista-linhas${devedor ? ' cliente-lista-linhas--devedor' : ''}${
        podeExpandir && !expandido ? ' cliente-lista-linhas--retraido' : ''
      }${className ? ` ${className}` : ''}`}
    >
      <div className="cliente-lista-linhas__topo">
        <div className="cliente-lista-linhas__corpo">
          {cod !== '—' ? (
            <div className="cliente-lista-linhas__row cliente-lista-linhas__row--cod">
              <span className="cliente-lista-linhas__label">{lblCod}</span>
              <span className="cliente-lista-linhas__eq" aria-hidden>
                =
              </span>
              <span className="cliente-lista-linhas__value cliente-lista-linhas__value--cod">{cod}</span>
            </div>
          ) : null}
          <div className="cliente-lista-linhas__row cliente-lista-linhas__row--nome">
            <span className="cliente-lista-linhas__label">{lblNome}</span>
            <span className="cliente-lista-linhas__eq" aria-hidden>
              =
            </span>
            <span className="cliente-lista-linhas__value cliente-lista-linhas__value--nome">
              {devedor ? (
                <ClienteDevedorNomeTag label={tr('clienteDevedorBadge')} variant="inline" />
              ) : null}
              <span className="cliente-devedor-nome-text">{nome}</span>
            </span>
          </div>
          {mostrarInf ? (
            <div className="cliente-lista-linhas__row cliente-lista-linhas__row--info">
              <span className="cliente-lista-linhas__label">{lblInf}</span>
              <span className="cliente-lista-linhas__eq" aria-hidden>
                =
              </span>
              <span className="cliente-lista-linhas__value cliente-lista-linhas__value--info">{inf}</span>
            </div>
          ) : null}
        </div>
        {podeExpandir ? (
          <span
            role="button"
            tabIndex={0}
            className="cliente-lista-linhas__expand"
            aria-expanded={expandido}
            title={expandido ? tr('retrairTodos') : tr('expandirTodos')}
            onClick={onToggleExpand}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                e.stopPropagation()
                onToggleExpand?.(e as unknown as MouseEvent)
              }
            }}
          >
            <span className="cliente-lista-linhas__expand-chevron" aria-hidden>
              {expandido ? '▲' : '▼'}
            </span>
          </span>
        ) : null}
      </div>
    </div>
  )
}
