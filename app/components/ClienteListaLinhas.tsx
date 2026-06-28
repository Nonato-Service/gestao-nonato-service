'use client'

import { useMemo } from 'react'
import { codigoClienteExibicao } from '../lib/clienteCodigoUtils'
import { translations, translationBundleKey } from '../translations'
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
}

export function ClienteListaLinhas({ cliente, language = 'pt-BR', className, devedor = false }: Props) {
  const tr = useListaTr(language)
  const cod = codigoClienteExibicao(cliente)
  const nome = (cliente.nomeEmpresa || '').trim() || '—'
  const inf = buildClienteInfAdicional(cliente)
  const lblCod = tr('clienteIdentTagCod')
  const lblNome = tr('clienteIdentTagNome')
  const lblInf = tr('clienteIdentTagInfAdicional')

  return (
    <div
      className={`cliente-lista-linhas${devedor ? ' cliente-lista-linhas--devedor' : ''}${className ? ` ${className}` : ''}`}
    >
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
        <span className="cliente-lista-linhas__value cliente-lista-linhas__value--nome">{nome}</span>
      </div>
      {inf ? (
        <div className="cliente-lista-linhas__row cliente-lista-linhas__row--info">
          <span className="cliente-lista-linhas__label">{lblInf}</span>
          <span className="cliente-lista-linhas__eq" aria-hidden>
            =
          </span>
          <span className="cliente-lista-linhas__value cliente-lista-linhas__value--info">{inf}</span>
        </div>
      ) : null}
    </div>
  )
}
