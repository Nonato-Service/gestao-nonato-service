'use client'

import React, { useMemo, useState } from 'react'
import type { ClientePrioritario, ClientePrioritarioForm, SafeT } from './adminTypes'
import {
  clientePrioritarioFormCompleteness,
  formatClientePrioritarioAddress,
} from '../../modules/clientes'

type ClientePrioritarioEntity = ClientePrioritario

export type AdminClientePrioritarioSectionProps = {
  safeT: SafeT
  clientePrioritario: ClientePrioritario | null
  showClientePrioritarioForm: boolean
  editingClientePrioritario: ClientePrioritarioEntity | null
  clientePrioritarioForm: ClientePrioritarioForm
  setClientePrioritarioForm: React.Dispatch<React.SetStateAction<ClientePrioritarioForm>>
  handleAddClientePrioritario: () => void
  handleEditClientePrioritario: () => void
  handleDeleteClientePrioritario: () => void
  handleSaveClientePrioritario: () => void
  handleClientePrioritarioPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleRemoveClientePrioritarioPhoto: () => void
  setShowClientePrioritarioForm: React.Dispatch<React.SetStateAction<boolean>>
  setEditingClientePrioritario: React.Dispatch<React.SetStateAction<ClientePrioritarioEntity | null>>
  emptyClientePrioritarioForm: () => ClientePrioritarioForm
}

function tr(safeT: SafeT, key: string, fallback: string): string {
  return (safeT as Record<string, string | undefined>)[key] || fallback
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '★'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function AdminClientePrioritarioSection({
  safeT,
  clientePrioritario,
  showClientePrioritarioForm,
  editingClientePrioritario,
  clientePrioritarioForm,
  setClientePrioritarioForm,
  handleAddClientePrioritario,
  handleEditClientePrioritario,
  handleDeleteClientePrioritario,
  handleSaveClientePrioritario,
  handleClientePrioritarioPhotoChange,
  handleRemoveClientePrioritarioPhoto,
  setShowClientePrioritarioForm,
  setEditingClientePrioritario,
  emptyClientePrioritarioForm,
}: AdminClientePrioritarioSectionProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copyFlash, setCopyFlash] = useState<'email' | 'phone' | null>(null)

  const activeData = showClientePrioritarioForm ? clientePrioritarioForm : clientePrioritario
  const pct = useMemo(() => clientePrioritarioFormCompleteness(activeData), [activeData])
  const hasClient = Boolean(clientePrioritario)
  const hasPhoto = Boolean((activeData?.photo || '').trim())

  const cancelForm = () => {
    setShowClientePrioritarioForm(false)
    setEditingClientePrioritario(null)
    setClientePrioritarioForm(emptyClientePrioritarioForm())
  }

  const copyValue = async (value: string, kind: 'email' | 'phone') => {
    if (!value.trim()) return
    try {
      await navigator.clipboard.writeText(value.trim())
      setCopyFlash(kind)
      window.setTimeout(() => setCopyFlash((cur) => (cur === kind ? null : cur)), 2000)
    } catch {
      /* ignore */
    }
  }

  const renderField = (
    key: keyof ClientePrioritarioForm,
    label: string,
    opts?: { required?: boolean; type?: string; placeholder?: string }
  ) => (
    <label key={key} className="admin-priority-client-hub__field">
      <span>
        {label}
        {opts?.required ? <em className="admin-priority-client-hub__required">*</em> : null}
      </span>
      <input
        type={opts?.type || 'text'}
        placeholder={opts?.placeholder || label}
        value={clientePrioritarioForm[key] as string}
        onChange={(e) => setClientePrioritarioForm({ ...clientePrioritarioForm, [key]: e.target.value })}
      />
    </label>
  )

  return (
    <section className="admin-priority-client-hub">
      <header className="admin-priority-client-hub__hero">
        <div className="admin-priority-client-hub__hero-glow" aria-hidden="true" />
        <div className="admin-priority-client-hub__hero-content">
          <div className="admin-priority-client-hub__hero-icon" aria-hidden="true">
            ★
          </div>
          <div>
            <h3 className="admin-priority-client-hub__hero-title">
              {tr(safeT, 'adminClientePriorHubTitle', 'Cliente em Destaque')}
            </h3>
            <p className="admin-priority-client-hub__hero-desc">
              {tr(
                safeT,
                'adminClientePriorHubDesc',
                'A empresa prioritária alimenta formulários, fluxos internos e documentos — mantenha os dados sempre completos e visíveis.'
              )}
            </p>
          </div>
        </div>
        <ol className="admin-priority-client-hub__steps">
          <li>{tr(safeT, 'adminClientePriorStep1', '1. Identidade da empresa')}</li>
          <li>{tr(safeT, 'adminClientePriorStep2', '2. Morada completa')}</li>
          <li>{tr(safeT, 'adminClientePriorStep3', '3. Contactos e foto')}</li>
        </ol>
      </header>

      <div className="admin-priority-client-hub__stats">
        <div className="admin-priority-client-hub__stat">
          <span>{tr(safeT, 'adminClientePriorKpiStatus', 'Estado')}</span>
          <strong className={hasClient ? 'admin-priority-client-hub__stat--active' : ''}>
            {hasClient
              ? tr(safeT, 'adminClientePriorKpiStatusActive', 'Cadastrado')
              : tr(safeT, 'adminClientePriorKpiStatusEmpty', 'Vazio')}
          </strong>
        </div>
        <div className="admin-priority-client-hub__stat">
          <span>{tr(safeT, 'adminClientePriorKpiComplete', 'Perfil completo')}</span>
          <strong>{pct}%</strong>
        </div>
        <div className="admin-priority-client-hub__stat admin-priority-client-hub__stat--note">
          <span>{tr(safeT, 'adminClientePriorKpiPhoto', 'Foto')}</span>
          <strong>
            {hasPhoto
              ? tr(safeT, 'adminClientePriorKpiPhotoYes', 'Sim')
              : tr(safeT, 'adminClientePriorKpiPhotoNo', 'Não')}
          </strong>
        </div>
      </div>

      <p className="admin-priority-client-hub__note">
        {tr(
          safeT,
          'adminClientePriorSingleNote',
          'Apenas um cliente prioritário pode existir no sistema. Edite ou remova antes de registar outro.'
        )}
      </p>

      <div className="admin-priority-client-hub__toolbar">
        {!showClientePrioritarioForm && hasClient ? (
          <>
            <button type="button" className="admin-priority-client-hub-btn admin-priority-client-hub-btn--primary" onClick={handleEditClientePrioritario}>
              {safeT?.editClientePrioritario || 'Editar Cliente Prioritário'}
            </button>
            {confirmDelete ? (
              <>
                <button type="button" className="admin-priority-client-hub-btn admin-priority-client-hub-btn--danger" onClick={() => { handleDeleteClientePrioritario(); setConfirmDelete(false) }}>
                  {tr(safeT, 'adminClientePriorConfirmDelete', 'Sim, eliminar')}
                </button>
                <button type="button" className="admin-priority-client-hub-btn admin-priority-client-hub-btn--ghost" onClick={() => setConfirmDelete(false)}>
                  {safeT?.cancel || 'Cancelar'}
                </button>
              </>
            ) : (
              <button type="button" className="admin-priority-client-hub-btn admin-priority-client-hub-btn--danger-outline" onClick={() => setConfirmDelete(true)}>
                {safeT?.deleteClientePrioritario || 'Excluir Cliente Prioritário'}
              </button>
            )}
          </>
        ) : !showClientePrioritarioForm ? (
          <button type="button" className="admin-priority-client-hub-btn admin-priority-client-hub-btn--primary" onClick={handleAddClientePrioritario}>
            + {tr(safeT, 'adminClientePriorRegister', 'Registar cliente prioritário')}
          </button>
        ) : null}
      </div>

      {showClientePrioritarioForm ? (
        <div className="admin-priority-client-hub__editor">
          <header className="admin-priority-client-hub__editor-head">
            <div>
              <h4>{editingClientePrioritario ? safeT?.editClientePrioritario : safeT?.addClientePrioritario}</h4>
              <p>{tr(safeT, 'adminClientePriorRequiredNote', 'Campos com * são obrigatórios: empresa, morada e e-mail.')}</p>
            </div>
            <button type="button" className="admin-priority-client-hub-btn admin-priority-client-hub-btn--ghost admin-priority-client-hub-btn--sm" onClick={cancelForm}>
              {safeT?.cancel || 'Cancelar'}
            </button>
          </header>

          <div className="admin-priority-client-hub__progress" aria-label={tr(safeT, 'adminClientePriorCompleteness', 'Completude do perfil')}>
            <div className="admin-priority-client-hub__progress-bar">
              <span style={{ width: `${pct}%` }} />
            </div>
            <small>
              {pct}% {tr(safeT, 'adminClientePriorCompleteness', 'completude do perfil')}
            </small>
          </div>

          <div className="admin-priority-client-hub__sections">
            <article className="admin-priority-client-hub-section admin-priority-client-hub-section--identity">
              <header>
                <span aria-hidden="true">🏢</span>
                <div>
                  <strong>{tr(safeT, 'adminClientePriorSectionIdentity', 'Identidade')}</strong>
                  <small>{tr(safeT, 'adminClientePriorSectionIdentityDesc', 'Nome da empresa e imagem de destaque')}</small>
                </div>
              </header>
              <div className="admin-priority-client-hub__grid">
                {renderField('nomeEmpresa', safeT?.nomeEmpresa || 'Nome da Empresa', { required: true })}
                <div className="admin-priority-client-hub__photo">
                  <span>{tr(safeT, 'adminClientePriorPhotoLabel', 'Foto / logotipo')}</span>
                  <div className={`admin-priority-client-hub__dropzone${clientePrioritarioForm.photo ? ' admin-priority-client-hub__dropzone--filled' : ''}`}>
                    {clientePrioritarioForm.photo ? (
                      <img src={clientePrioritarioForm.photo} alt="" />
                    ) : (
                      <div className="admin-priority-client-hub__dropzone-empty">
                        <span aria-hidden="true">⬆</span>
                        <p>{tr(safeT, 'adminClientePriorPhotoHint', 'PNG ou JPG — aparece nos fluxos em destaque')}</p>
                      </div>
                    )}
                  </div>
                  <div className="admin-priority-client-hub__photo-actions">
                    <label className="admin-priority-client-hub-btn admin-priority-client-hub-btn--secondary admin-priority-client-hub-btn--sm">
                      {tr(safeT, 'adminClientePriorPhotoUpload', 'Carregar imagem')}
                      <input type="file" accept="image/*" hidden onChange={handleClientePrioritarioPhotoChange} />
                    </label>
                    {clientePrioritarioForm.photo ? (
                      <button type="button" className="admin-priority-client-hub-btn admin-priority-client-hub-btn--ghost admin-priority-client-hub-btn--sm" onClick={handleRemoveClientePrioritarioPhoto}>
                        {tr(safeT, 'adminClientePriorPhotoRemove', 'Remover foto')}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>

            <article className="admin-priority-client-hub-section admin-priority-client-hub-section--address">
              <header>
                <span aria-hidden="true">📍</span>
                <div>
                  <strong>{tr(safeT, 'adminClientePriorSectionAddress', 'Morada')}</strong>
                  <small>{tr(safeT, 'adminClientePriorSectionAddressDesc', 'Endereço completo para documentos e mapas')}</small>
                </div>
              </header>
              <div className="admin-priority-client-hub__grid">
                {renderField('morada', safeT?.morada || 'Morada', { required: true })}
                {renderField('localidade', safeT?.localidade || 'Localidade')}
                {renderField('freguesia', safeT?.freguesia || 'Freguesia')}
                {renderField('conselho', safeT?.conselho || 'Conselho')}
                {renderField('codigoPostal', safeT?.codigoPostal || 'Código Postal')}
                {renderField('pais', safeT?.pais || 'País')}
              </div>
            </article>

            <article className="admin-priority-client-hub-section admin-priority-client-hub-section--contact">
              <header>
                <span aria-hidden="true">📞</span>
                <div>
                  <strong>{tr(safeT, 'adminClientePriorSectionContact', 'Fiscal e contactos')}</strong>
                  <small>{tr(safeT, 'adminClientePriorSectionContactDesc', 'NIF, telefones, e-mail e pessoa de contacto')}</small>
                </div>
              </header>
              <div className="admin-priority-client-hub__grid">
                {renderField('numeroContribuicaoFiscal', safeT?.identificacaoFiscal || 'Identificação Fiscal')}
                {renderField('telefones', safeT?.telefones || 'Telefones')}
                {renderField('email', safeT?.email || 'E-mail', { required: true, type: 'email' })}
                {renderField('contato', safeT?.contato || 'Contato')}
              </div>
            </article>
          </div>

          <div className="admin-priority-client-hub__editor-actions">
            <button type="button" className="admin-priority-client-hub-btn admin-priority-client-hub-btn--ghost" onClick={cancelForm}>
              {safeT?.cancel || 'Cancelar'}
            </button>
            <button type="button" className="admin-priority-client-hub-btn admin-priority-client-hub-btn--primary" onClick={handleSaveClientePrioritario}>
              {safeT?.save || 'Salvar'}
            </button>
          </div>
        </div>
      ) : hasClient && clientePrioritario ? (
        <article className="admin-priority-client-hub-showcase">
          <div className="admin-priority-client-hub-showcase__glow" aria-hidden="true" />
          <div className="admin-priority-client-hub-showcase__main">
            <div className="admin-priority-client-hub-showcase__avatar" aria-hidden="true">
              {clientePrioritario.photo ? (
                <img src={clientePrioritario.photo} alt="" />
              ) : (
                initials(clientePrioritario.nomeEmpresa)
              )}
            </div>
            <div className="admin-priority-client-hub-showcase__info">
              <span className="admin-priority-client-hub-showcase__badge">
                {tr(safeT, 'adminClientePriorViewCard', 'Cliente prioritário ativo')}
              </span>
              <h4>{clientePrioritario.nomeEmpresa}</h4>
              <p>{formatClientePrioritarioAddress(clientePrioritario)}</p>
              <div className="admin-priority-client-hub-showcase__chips">
                {clientePrioritario.numeroContribuicaoFiscal ? (
                  <span className="admin-priority-client-hub-chip">
                    NIF: {clientePrioritario.numeroContribuicaoFiscal}
                  </span>
                ) : null}
                {clientePrioritario.contato ? (
                  <span className="admin-priority-client-hub-chip">{clientePrioritario.contato}</span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="admin-priority-client-hub-showcase__contacts">
            {clientePrioritario.email ? (
              <div className="admin-priority-client-hub-contact-row">
                <span>{safeT?.email || 'E-mail'}</span>
                <strong>{clientePrioritario.email}</strong>
                <button
                  type="button"
                  className={`admin-priority-client-hub-btn admin-priority-client-hub-btn--xs admin-priority-client-hub-btn--ghost${copyFlash === 'email' ? ' admin-priority-client-hub-btn--success' : ''}`}
                  onClick={() => void copyValue(clientePrioritario.email, 'email')}
                >
                  {copyFlash === 'email'
                    ? tr(safeT, 'adminClientePriorCopied', 'Copiado!')
                    : tr(safeT, 'adminClientePriorCopyEmail', 'Copiar e-mail')}
                </button>
              </div>
            ) : null}
            {clientePrioritario.telefones ? (
              <div className="admin-priority-client-hub-contact-row">
                <span>{safeT?.telefones || 'Telefones'}</span>
                <strong>{clientePrioritario.telefones}</strong>
                <button
                  type="button"
                  className={`admin-priority-client-hub-btn admin-priority-client-hub-btn--xs admin-priority-client-hub-btn--ghost${copyFlash === 'phone' ? ' admin-priority-client-hub-btn--success' : ''}`}
                  onClick={() => void copyValue(clientePrioritario.telefones, 'phone')}
                >
                  {copyFlash === 'phone'
                    ? tr(safeT, 'adminClientePriorCopied', 'Copiado!')
                    : tr(safeT, 'adminClientePriorCopyPhone', 'Copiar telefone')}
                </button>
              </div>
            ) : null}
          </div>

          <div className="admin-priority-client-hub-showcase__details">
            {(
              [
                [safeT?.morada || 'Morada', clientePrioritario.morada],
                [safeT?.localidade || 'Localidade', clientePrioritario.localidade],
                [safeT?.freguesia || 'Freguesia', clientePrioritario.freguesia],
                [safeT?.conselho || 'Conselho', clientePrioritario.conselho],
                [safeT?.codigoPostal || 'Código Postal', clientePrioritario.codigoPostal],
                [safeT?.pais || 'País', clientePrioritario.pais],
              ] as const
            )
              .filter(([, value]) => String(value || '').trim())
              .map(([label, value]) => (
                <div key={label} className="admin-priority-client-hub-detail">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
          </div>

          <div className="admin-priority-client-hub__progress admin-priority-client-hub__progress--inline">
            <div className="admin-priority-client-hub__progress-bar">
              <span style={{ width: `${pct}%` }} />
            </div>
            <small>{pct}% {tr(safeT, 'adminClientePriorCompleteness', 'completude do perfil')}</small>
          </div>
        </article>
      ) : (
        <div className="admin-priority-client-hub__empty">
          <span aria-hidden="true">★</span>
          <p>{safeT?.noClientePrioritario || 'Nenhum cliente prioritário cadastrado'}</p>
          <button type="button" className="admin-priority-client-hub-btn admin-priority-client-hub-btn--primary" onClick={handleAddClientePrioritario}>
            {safeT?.addClientePrioritario || 'Adicionar Cliente Prioritário'}
          </button>
        </div>
      )}
    </section>
  )
}
