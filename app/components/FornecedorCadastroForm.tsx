'use client'

import React, { useMemo, useState } from 'react'
import { IconBuilding2, IconHome, IconIdCard } from './UiIcons'
import { translations, translationBundleKey } from '../translations'

function useFornecedorFormTr(language: string) {
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

export type FornecedorFormState = {
  nomeEmpresa: string
  morada: string
  localidade: string
  conselho: string
  pais: string
  codigoPostal: string
  freguesia: string
  numeroContribuicaoFiscal: string
  telefones: string
  email: string
  contato: string
  iban: string
}

type Props = {
  fornecedorForm: FornecedorFormState
  setFornecedorForm: React.Dispatch<React.SetStateAction<FornecedorFormState>>
  editingFornecedor: { id: string } | null
  language: string
  onSave: () => void
  onCancel: () => void
  onBack?: () => void
  variant?: 'page' | 'modal'
  referenceLayout?: boolean
  className?: string
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.65">
      <path d="M6.5 4h3l1.5 4-2 1.2a11 11 0 0 0 5.8 5.8L16 13l4 1.5v3a1.5 1.5 0 0 1-1.4 1.5C9.8 19 5 14.2 5 7.9A1.5 1.5 0 0 1 6.5 4z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconMapPin({ className }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.65">
      <path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  )
}

function IconArrowLeft({ className }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function FieldInput({
  id,
  icon,
  label,
  required,
  fullWidth,
  children,
}: {
  id: string
  icon: React.ReactNode
  label: string
  required?: boolean
  fullWidth?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={'cliente-cadastro-v2__field' + (fullWidth ? ' cliente-cadastro-v2__field--span-2' : '')}>
      <label htmlFor={id} className="cliente-cadastro-v2__label">
        {label}
        {required ? ' *' : ''}
      </label>
      <div className="cliente-cadastro-v2__input-wrap">
        <span className="cliente-cadastro-v2__input-icon" aria-hidden>
          {icon}
        </span>
        {children}
      </div>
    </div>
  )
}

export function FornecedorCadastroForm({
  fornecedorForm,
  setFornecedorForm,
  editingFornecedor,
  language,
  onSave,
  onCancel,
  onBack,
  variant = 'page',
  referenceLayout = false,
  className,
}: Props) {
  const tr = useFornecedorFormTr(language)
  const [detalhesAbertos, setDetalhesAbertos] = useState(Boolean(editingFornecedor) && !referenceLayout)
  const showExtras = !referenceLayout

  const titulo = editingFornecedor ? tr('editFornecedor') : tr('novoFornecedor')
  const subtitulo = editingFornecedor ? tr('editFornecedorSubtitle') : tr('novoFornecedorSubtitle')

  const mapsQuery = [fornecedorForm.morada, fornecedorForm.codigoPostal, fornecedorForm.pais].filter(Boolean).join(', ')

  return (
    <div
      className={`cliente-cadastro-v2 cliente-cadastro-v2--${variant}${referenceLayout ? ' cliente-cadastro-v2--reference' : ''}${className ? ` ${className}` : ''}`}
    >
      {variant === 'page' ? (
        <header className="cliente-cadastro-v2__page-header">
          <div className="cliente-cadastro-v2__page-header-main">
            <nav className="cliente-cadastro-v2__breadcrumb" aria-label="Breadcrumb">
              <span className="cliente-cadastro-v2__breadcrumb-home">
                <IconHome size={14} />
              </span>
              <span className="cliente-cadastro-v2__breadcrumb-sep">/</span>
              <span>{tr('fornecedoresBreadcrumb')}</span>
            </nav>
            <div className="cliente-cadastro-v2__title-row">
              <div>
                <h2 className="cliente-cadastro-v2__title">{titulo}</h2>
                <p className="cliente-cadastro-v2__subtitle">{subtitulo}</p>
              </div>
              {onBack ? (
                <button type="button" className="cliente-cadastro-v2__back-btn" onClick={onBack} title={tr('voltar')}>
                  <IconArrowLeft />
                </button>
              ) : null}
            </div>
          </div>
        </header>
      ) : (
        <div className="cliente-cadastro-v2__modal-header">
          <h4 className="cliente-cadastro-v2__modal-title">{titulo}</h4>
        </div>
      )}

      <section className="cliente-cadastro-v2__card cliente-cadastro-v2__card--info">
        <h3 className="cliente-cadastro-v2__card-title">{tr('informacoesFornecedor')}</h3>

        <div
          className={
            'cliente-cadastro-v2__fields-grid' +
            (referenceLayout ? ' cliente-cadastro-v2__fields-grid--single' : '')
          }
        >
          <FieldInput
            id="nome-fornecedor"
            icon={<IconBuilding2 size={18} />}
            label={tr('nomeEmpresa')}
            required
            fullWidth
          >
            <input
              id="nome-fornecedor"
              type="text"
              className="cliente-cadastro-v2__input"
              placeholder={tr('nomeEmpresaPlaceholder')}
              value={fornecedorForm.nomeEmpresa}
              onChange={(e) => setFornecedorForm({ ...fornecedorForm, nomeEmpresa: e.target.value })}
            />
          </FieldInput>

          <FieldInput id="telefone-fornecedor" icon={<IconPhone />} label={tr('telefones')} fullWidth>
            <input
              id="telefone-fornecedor"
              type="tel"
              className="cliente-cadastro-v2__input"
              placeholder={tr('telefonePlaceholder')}
              value={fornecedorForm.telefones}
              onChange={(e) => setFornecedorForm({ ...fornecedorForm, telefones: e.target.value })}
            />
          </FieldInput>

          <FieldInput id="morada-fornecedor" icon={<IconMapPin />} label={tr('morada')} required fullWidth>
            <input
              id="morada-fornecedor"
              type="text"
              className="cliente-cadastro-v2__input"
              placeholder={tr('enderecoPlaceholder')}
              value={fornecedorForm.morada}
              onChange={(e) => setFornecedorForm({ ...fornecedorForm, morada: e.target.value })}
            />
          </FieldInput>

          <FieldInput id="codigo-postal-fornecedor" icon={<IconMapPin />} label={tr('codigoPostal')} fullWidth={referenceLayout}>
            <input
              id="codigo-postal-fornecedor"
              type="text"
              className="cliente-cadastro-v2__input"
              placeholder={tr('codigoPostalPlaceholder')}
              value={fornecedorForm.codigoPostal}
              onChange={(e) => setFornecedorForm({ ...fornecedorForm, codigoPostal: e.target.value })}
            />
          </FieldInput>

          <FieldInput
            id="nif-fornecedor"
            icon={<IconIdCard size={18} />}
            label={tr('nif') || tr('identificacaoFiscal')}
            fullWidth={referenceLayout}
          >
            <input
              id="nif-fornecedor"
              type="text"
              className="cliente-cadastro-v2__input"
              placeholder={tr('nifPlaceholder')}
              value={fornecedorForm.numeroContribuicaoFiscal}
              onChange={(e) => setFornecedorForm({ ...fornecedorForm, numeroContribuicaoFiscal: e.target.value })}
            />
          </FieldInput>

          <FieldInput id="email-fornecedor-main" icon={<IconBuilding2 size={18} />} label={tr('email')} required fullWidth>
            <input
              id="email-fornecedor-main"
              type="email"
              className="cliente-cadastro-v2__input"
              placeholder={tr('emailPlaceholder')}
              value={fornecedorForm.email}
              onChange={(e) => setFornecedorForm({ ...fornecedorForm, email: e.target.value })}
            />
          </FieldInput>
        </div>
      </section>

      {showExtras ? (
        <section className="cliente-cadastro-v2__card cliente-cadastro-v2__card--details">
          <button
            type="button"
            className="cliente-cadastro-v2__details-toggle"
            onClick={() => setDetalhesAbertos((v) => !v)}
            aria-expanded={detalhesAbertos}
          >
            <span>{tr('detalhesAdicionaisCliente')}</span>
            <span aria-hidden>{detalhesAbertos ? '▾' : '▸'}</span>
          </button>

          {detalhesAbertos ? (
            <div className="cliente-cadastro-v2__details-grid">
              <FieldInput id="contato-fornecedor" icon={<IconBuilding2 size={18} />} label={tr('contato')}>
                <input
                  id="contato-fornecedor"
                  type="text"
                  className="cliente-cadastro-v2__input"
                  placeholder={tr('contatoPlaceholder')}
                  value={fornecedorForm.contato}
                  onChange={(e) => setFornecedorForm({ ...fornecedorForm, contato: e.target.value })}
                />
              </FieldInput>

              <FieldInput id="localidade-fornecedor" icon={<IconMapPin />} label={tr('localidade')}>
                <input
                  id="localidade-fornecedor"
                  type="text"
                  className="cliente-cadastro-v2__input"
                  value={fornecedorForm.localidade}
                  onChange={(e) => setFornecedorForm({ ...fornecedorForm, localidade: e.target.value })}
                />
              </FieldInput>

              <FieldInput id="conselho-fornecedor" icon={<IconMapPin />} label={tr('conselho')}>
                <input
                  id="conselho-fornecedor"
                  type="text"
                  className="cliente-cadastro-v2__input"
                  value={fornecedorForm.conselho}
                  onChange={(e) => setFornecedorForm({ ...fornecedorForm, conselho: e.target.value })}
                />
              </FieldInput>

              <FieldInput id="freguesia-fornecedor" icon={<IconMapPin />} label={tr('freguesia')}>
                <input
                  id="freguesia-fornecedor"
                  type="text"
                  className="cliente-cadastro-v2__input"
                  value={fornecedorForm.freguesia}
                  onChange={(e) => setFornecedorForm({ ...fornecedorForm, freguesia: e.target.value })}
                />
              </FieldInput>

              <FieldInput id="pais-fornecedor" icon={<IconMapPin />} label={tr('pais')}>
                <input
                  id="pais-fornecedor"
                  type="text"
                  className="cliente-cadastro-v2__input"
                  value={fornecedorForm.pais}
                  onChange={(e) => setFornecedorForm({ ...fornecedorForm, pais: e.target.value })}
                />
              </FieldInput>

              <FieldInput id="iban-fornecedor" icon={<IconIdCard size={18} />} label={tr('iban')}>
                <input
                  id="iban-fornecedor"
                  type="text"
                  className="cliente-cadastro-v2__input"
                  placeholder={tr('iban')}
                  value={fornecedorForm.iban}
                  onChange={(e) => setFornecedorForm({ ...fornecedorForm, iban: e.target.value })}
                />
              </FieldInput>

              {mapsQuery.trim() ? (
                <div className="cliente-cadastro-v2__maps-link">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    🗺️ {tr('abrirGoogleMaps')}
                  </a>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="cliente-cadastro-v2__actions">
        <button type="button" className="cliente-cadastro-v2__submit" onClick={onSave}>
          <span className="cliente-cadastro-v2__submit-icon">+</span>
          {editingFornecedor ? tr('save') : tr('addFornecedor')}
        </button>
        {!referenceLayout ? (
          <button type="button" className="cliente-cadastro-v2__cancel" onClick={onCancel}>
            {tr('cancel')}
          </button>
        ) : null}
      </div>
    </div>
  )
}

export const emptyFornecedorFormState = (): FornecedorFormState => ({
  nomeEmpresa: '',
  morada: '',
  localidade: '',
  conselho: '',
  pais: '',
  codigoPostal: '',
  freguesia: '',
  numeroContribuicaoFiscal: '',
  telefones: '',
  email: '',
  contato: '',
  iban: '',
})
