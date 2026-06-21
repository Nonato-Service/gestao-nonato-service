'use client'

import React, { useId, useMemo, useRef, useState } from 'react'
import {
  IconBuilding2,
  IconHome,
  IconIdCard,
  IconUser,
} from './UiIcons'
import { translations, translationBundleKey } from '../translations'
import {
  buildEnderecoMapsQuery,
} from '../lib/enderecoMapsUtils'
import { ClienteEnderecoMapsActions } from './ClienteEnderecoMapsActions'
import { ordenarServicoGrupos, type ServicoCadastroGrupo } from '../lib/servicosCadastroUtils'

function useClienteFormTr(language: string) {
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

export type ClienteFormState = {
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
  photo: string
  grupoTarifaId: string
  kmIdaPadrao: string
  kmRetornoPadrao: string
  tipoCliente: 'fisica' | 'juridica'
}

type Props = {
  clienteForm: ClienteFormState
  setClienteForm: React.Dispatch<React.SetStateAction<ClienteFormState>>
  editingCliente: { id: string; isDevedor?: boolean; saldoPendente?: number } | null
  language: string
  servicoGrupos: ServicoCadastroGrupo[]
  clienteGrupoTarifaSelecionadoId: string | null
  onSave: () => void | Promise<void>
  onCancel: () => void
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemovePhoto: () => void
  saving?: boolean
  onBack?: () => void
  variant?: 'page' | 'modal'
  /** Layout igual à referência visual — só campos principais, sem extras */
  referenceLayout?: boolean
  className?: string
  headerSlot?: React.ReactNode
  alertSlot?: React.ReactNode
  editingExtras?: React.ReactNode
  footerExtras?: React.ReactNode
  sanitizeKmFieldTyping?: (v: string) => string
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

function IconCamera({ className }: { className?: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 8h4l1.5-2h5L16 8h4a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.5" />
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

export function ClienteCadastroForm({
  clienteForm,
  setClienteForm,
  editingCliente,
  language,
  servicoGrupos,
  clienteGrupoTarifaSelecionadoId,
  onSave,
  onCancel,
  onPhotoChange,
  onRemovePhoto,
  saving = false,
  onBack,
  variant = 'page',
  referenceLayout = false,
  className,
  headerSlot,
  alertSlot,
  editingExtras,
  footerExtras,
  sanitizeKmFieldTyping = (v) => v,
}: Props) {
  const tr = useClienteFormTr(language)
  const photoInputId = useId()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [detalhesAbertos, setDetalhesAbertos] = useState(Boolean(editingCliente) && !referenceLayout)
  const isFisica = clienteForm.tipoCliente !== 'juridica'
  const showExtras = !referenceLayout

  const titulo = editingCliente ? tr('editCliente') : tr('novoCliente')
  const subtitulo = editingCliente ? tr('editClienteSubtitle') : tr('novoClienteSubtitle')

  const mapsEndereco = {
    morada: clienteForm.morada,
    localidade: clienteForm.localidade,
    conselho: clienteForm.conselho,
    codigoPostal: clienteForm.codigoPostal,
    pais: clienteForm.pais,
  }
  const mapsQuery = buildEnderecoMapsQuery(mapsEndereco)

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
              <span>{tr('clientesBreadcrumb')}</span>
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
          {headerSlot}
        </header>
      ) : (
        <div className="cliente-cadastro-v2__modal-header">
          <h4 className="cliente-cadastro-v2__modal-title">{titulo}</h4>
          {headerSlot}
        </div>
      )}

      {alertSlot}

      <section className="cliente-cadastro-v2__card">
        <h3 className="cliente-cadastro-v2__card-title">{tr('fotoPerfil')}</h3>
        <input
          ref={photoInputRef}
          id={photoInputId}
          type="file"
          accept="image/*"
          className="cliente-cadastro-v2__photo-input"
          onChange={onPhotoChange}
        />
        <button
          type="button"
          className="cliente-cadastro-v2__photo-drop"
          onClick={() => photoInputRef.current?.click()}
        >
          {clienteForm.photo ? (
            <img src={clienteForm.photo} alt="" className="cliente-cadastro-v2__photo-preview" />
          ) : (
            <>
              <IconCamera className="cliente-cadastro-v2__photo-icon" />
              <span>{tr('cliqueAdicionarFoto')}</span>
            </>
          )}
        </button>
        {clienteForm.photo ? (
          <button type="button" className="cliente-cadastro-v2__photo-remove" onClick={onRemovePhoto}>
            {tr('removePhoto')}
          </button>
        ) : null}
      </section>

      <section className="cliente-cadastro-v2__card cliente-cadastro-v2__card--info">
        <h3 className="cliente-cadastro-v2__card-title">{tr('informacoesCliente')}</h3>

        <div
          className={
            'cliente-cadastro-v2__fields-grid' +
            (referenceLayout ? ' cliente-cadastro-v2__fields-grid--single' : '')
          }
        >
        <FieldInput id="tipo-cliente" icon={<IconUser size={18} />} label={tr('tipoCliente')} fullWidth>
          <select
            id="tipo-cliente"
            className="cliente-cadastro-v2__input cliente-cadastro-v2__select"
            value={clienteForm.tipoCliente}
            onChange={(e) =>
              setClienteForm({
                ...clienteForm,
                tipoCliente: e.target.value === 'juridica' ? 'juridica' : 'fisica',
              })
            }
          >
            <option value="fisica">{tr('pessoaFisica')}</option>
            <option value="juridica">{tr('pessoaJuridica')}</option>
          </select>
        </FieldInput>

        <FieldInput
          id="nome-cliente"
          icon={<IconUser size={18} />}
          label={isFisica ? tr('nomeCompleto') : tr('nomeEmpresa')}
          required
          fullWidth
        >
          <input
            id="nome-cliente"
            type="text"
            className="cliente-cadastro-v2__input"
            placeholder={isFisica ? tr('nomeCompletoPlaceholder') : tr('nomeEmpresaPlaceholder')}
            value={clienteForm.nomeEmpresa}
            onChange={(e) => setClienteForm({ ...clienteForm, nomeEmpresa: e.target.value })}
          />
        </FieldInput>

        {isFisica ? (
          <FieldInput
            id="empresa-opcional"
            icon={<IconBuilding2 size={18} />}
            label={tr('empresaOpcional')}
            fullWidth
          >
            <input
              id="empresa-opcional"
              type="text"
              className="cliente-cadastro-v2__input"
              placeholder={tr('empresaOpcionalPlaceholder')}
              value={clienteForm.contato}
              onChange={(e) => setClienteForm({ ...clienteForm, contato: e.target.value })}
            />
          </FieldInput>
        ) : null}

        <FieldInput id="telefone-cliente" icon={<IconPhone />} label={tr('telefone') || tr('telefones')} fullWidth>
          <input
            id="telefone-cliente"
            type="tel"
            className="cliente-cadastro-v2__input"
            placeholder={tr('telefonePlaceholder')}
            value={clienteForm.telefones}
            onChange={(e) => setClienteForm({ ...clienteForm, telefones: e.target.value })}
          />
        </FieldInput>

        {!isFisica ? (
          <FieldInput id="contato-cliente" icon={<IconUser size={18} />} label={tr('contato')} fullWidth>
            <input
              id="contato-cliente"
              type="text"
              className="cliente-cadastro-v2__input"
              placeholder={tr('contatoPlaceholder')}
              value={clienteForm.contato}
              onChange={(e) => setClienteForm({ ...clienteForm, contato: e.target.value })}
            />
          </FieldInput>
        ) : null}

        <FieldInput id="endereco-cliente" icon={<IconMapPin />} label={tr('endereco') || tr('morada')} required fullWidth>
          <input
            id="endereco-cliente"
            type="text"
            className="cliente-cadastro-v2__input"
            placeholder={tr('enderecoPlaceholder')}
            value={clienteForm.morada}
            onChange={(e) => setClienteForm({ ...clienteForm, morada: e.target.value })}
          />
        </FieldInput>

        <FieldInput id="codigo-postal-cliente" icon={<IconMapPin />} label={tr('codigoPostal')} fullWidth={referenceLayout}>
          <input
            id="codigo-postal-cliente"
            type="text"
            className="cliente-cadastro-v2__input"
            placeholder={tr('codigoPostalPlaceholder')}
            value={clienteForm.codigoPostal}
            onChange={(e) => setClienteForm({ ...clienteForm, codigoPostal: e.target.value })}
          />
        </FieldInput>

        <FieldInput id="cidade-cliente" icon={<IconMapPin />} label={tr('cidade')} fullWidth={referenceLayout}>
          <input
            id="cidade-cliente"
            type="text"
            className="cliente-cadastro-v2__input"
            placeholder={tr('cidadePlaceholder')}
            value={clienteForm.localidade}
            onChange={(e) => setClienteForm({ ...clienteForm, localidade: e.target.value })}
          />
        </FieldInput>

        {mapsQuery.trim() ? (
          <div className="cliente-cadastro-v2__field cliente-cadastro-v2__field--span-2">
            <ClienteEnderecoMapsActions endereco={mapsEndereco} tr={tr} />
          </div>
        ) : null}

        <FieldInput
          id="nif-cliente"
          icon={<IconIdCard size={18} />}
          label={tr('nif') || tr('identificacaoFiscal')}
          fullWidth={referenceLayout}
        >
          <input
            id="nif-cliente"
            type="text"
            className="cliente-cadastro-v2__input"
            placeholder={tr('nifPlaceholder')}
            value={clienteForm.numeroContribuicaoFiscal}
            onChange={(e) => setClienteForm({ ...clienteForm, numeroContribuicaoFiscal: e.target.value })}
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
            <FieldInput id="email-cliente" icon={<IconUser size={18} />} label={tr('email')} required>
              <input
                id="email-cliente"
                type="email"
                className="cliente-cadastro-v2__input"
                placeholder={tr('emailPlaceholder')}
                value={clienteForm.email}
                onChange={(e) => setClienteForm({ ...clienteForm, email: e.target.value })}
              />
            </FieldInput>

            <FieldInput id="localidade-detalhe-cliente" icon={<IconMapPin />} label={tr('localidade')}>
              <input
                id="localidade-detalhe-cliente"
                type="text"
                className="cliente-cadastro-v2__input"
                value={clienteForm.localidade}
                onChange={(e) => setClienteForm({ ...clienteForm, localidade: e.target.value })}
              />
            </FieldInput>

            <FieldInput id="conselho-cliente" icon={<IconMapPin />} label={tr('conselho')}>
              <input
                id="conselho-cliente"
                type="text"
                className="cliente-cadastro-v2__input"
                value={clienteForm.conselho}
                onChange={(e) => setClienteForm({ ...clienteForm, conselho: e.target.value })}
              />
            </FieldInput>

            <FieldInput id="freguesia-cliente" icon={<IconMapPin />} label={tr('freguesia')}>
              <input
                id="freguesia-cliente"
                type="text"
                className="cliente-cadastro-v2__input"
                value={clienteForm.freguesia}
                onChange={(e) => setClienteForm({ ...clienteForm, freguesia: e.target.value })}
              />
            </FieldInput>

            <FieldInput id="pais-cliente" icon={<IconMapPin />} label={tr('pais')}>
              <input
                id="pais-cliente"
                type="text"
                className="cliente-cadastro-v2__input"
                value={clienteForm.pais}
                onChange={(e) => setClienteForm({ ...clienteForm, pais: e.target.value })}
              />
            </FieldInput>

            <FieldInput
              id="grupo-tarifa-cliente"
              icon={<IconBuilding2 size={18} />}
              label={tr('clienteGrupoTarifa')}
            >
              <select
                id="grupo-tarifa-cliente"
                className="cliente-cadastro-v2__input cliente-cadastro-v2__select"
                value={
                  clienteForm.grupoTarifaId ||
                  clienteGrupoTarifaSelecionadoId ||
                  ordenarServicoGrupos(servicoGrupos)[0]?.id ||
                  ''
                }
                onChange={(e) => setClienteForm({ ...clienteForm, grupoTarifaId: e.target.value })}
              >
                <option value="">{tr('clienteSemGrupoTarifa')}</option>
                {ordenarServicoGrupos(servicoGrupos).map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome}
                  </option>
                ))}
              </select>
            </FieldInput>

            <FieldInput
              id="km-ida-cliente"
              icon={<IconMapPin />}
              label={tr('clienteKmIdaPadrao')}
            >
              <input
                id="km-ida-cliente"
                type="text"
                inputMode="decimal"
                className="cliente-cadastro-v2__input"
                value={clienteForm.kmIdaPadrao}
                onChange={(e) => setClienteForm({ ...clienteForm, kmIdaPadrao: sanitizeKmFieldTyping(e.target.value) })}
              />
            </FieldInput>

            <FieldInput
              id="km-retorno-cliente"
              icon={<IconMapPin />}
              label={tr('clienteKmRetornoPadrao')}
            >
              <input
                id="km-retorno-cliente"
                type="text"
                inputMode="decimal"
                className="cliente-cadastro-v2__input"
                value={clienteForm.kmRetornoPadrao}
                onChange={(e) =>
                  setClienteForm({ ...clienteForm, kmRetornoPadrao: sanitizeKmFieldTyping(e.target.value) })
                }
              />
            </FieldInput>

          </div>
        ) : null}
      </section>
      ) : null}

      {showExtras ? editingExtras : null}

      <div className="cliente-cadastro-v2__actions">
        <button type="button" className="cliente-cadastro-v2__submit" onClick={onSave} disabled={saving}>
          <span className="cliente-cadastro-v2__submit-icon">+</span>
          {saving ? tr('clienteSalvando') : editingCliente ? tr('save') : tr('addCliente')}
        </button>
        {!referenceLayout ? (
          <button type="button" className="cliente-cadastro-v2__cancel" onClick={onCancel} disabled={saving}>
            {tr('cancel')}
          </button>
        ) : null}
      </div>

      {footerExtras}
    </div>
  )
}

export const emptyClienteFormState = (grupoTarifaId = ''): ClienteFormState => ({
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
  photo: '',
  grupoTarifaId,
  kmIdaPadrao: '',
  kmRetornoPadrao: '',
  tipoCliente: 'fisica',
})
