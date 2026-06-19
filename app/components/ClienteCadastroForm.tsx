'use client'

import React, { useId, useRef, useState } from 'react'
import {
  IconBuilding2,
  IconHome,
  IconIdCard,
  IconUser,
} from './UiIcons'
import { ordenarServicoGrupos, type ServicoCadastroGrupo } from '../lib/servicosCadastroUtils'

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
  safeT: Record<string, string | undefined>
  servicoGrupos: ServicoCadastroGrupo[]
  clienteGrupoTarifaSelecionadoId: string | null
  onSave: () => void
  onCancel: () => void
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemovePhoto: () => void
  onBack?: () => void
  variant?: 'page' | 'modal'
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

function FieldInput({
  id,
  icon,
  label,
  required,
  children,
}: {
  id: string
  icon: React.ReactNode
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="cliente-cadastro-v2__field">
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
  safeT,
  servicoGrupos,
  clienteGrupoTarifaSelecionadoId,
  onSave,
  onCancel,
  onPhotoChange,
  onRemovePhoto,
  onBack,
  variant = 'page',
  className,
  headerSlot,
  alertSlot,
  editingExtras,
  footerExtras,
  sanitizeKmFieldTyping = (v) => v,
}: Props) {
  const tx = safeT as Record<string, string>
  const photoInputId = useId()
  const photoInputRef = useRef<HTMLInputElement>(null)
  const [detalhesAbertos, setDetalhesAbertos] = useState(Boolean(editingCliente))
  const isFisica = clienteForm.tipoCliente !== 'juridica'

  const titulo = editingCliente
    ? tx.editCliente || 'Editar Cliente'
    : tx.novoCliente || 'Novo Cliente'
  const subtitulo = editingCliente
    ? tx.editClienteSubtitle || 'Atualize os dados do cliente'
    : tx.novoClienteSubtitle || 'Adicione um novo cliente ao sistema'

  const mapsQuery = [clienteForm.morada, clienteForm.codigoPostal, clienteForm.pais].filter(Boolean).join(', ')

  return (
    <div className={`cliente-cadastro-v2 cliente-cadastro-v2--${variant}${className ? ` ${className}` : ''}`}>
      {variant === 'page' ? (
        <header className="cliente-cadastro-v2__page-header">
          <div className="cliente-cadastro-v2__page-header-main">
            <nav className="cliente-cadastro-v2__breadcrumb" aria-label="Breadcrumb">
              <span className="cliente-cadastro-v2__breadcrumb-home">
                <IconHome size={14} />
              </span>
              <span className="cliente-cadastro-v2__breadcrumb-sep">/</span>
              <span>{tx.clientesBreadcrumb || 'add-client'}</span>
            </nav>
            <div className="cliente-cadastro-v2__title-row">
              <div>
                <h2 className="cliente-cadastro-v2__title">{titulo}</h2>
                <p className="cliente-cadastro-v2__subtitle">{subtitulo}</p>
              </div>
              {onBack ? (
                <button type="button" className="cliente-cadastro-v2__back-btn" onClick={onBack} title={tx.voltar || 'Voltar'}>
                  ↶
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
        <h3 className="cliente-cadastro-v2__card-title">{tx.fotoPerfil || 'Foto de Perfil'}</h3>
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
              <span>{tx.cliqueAdicionarFoto || 'Clique para adicionar foto'}</span>
            </>
          )}
        </button>
        {clienteForm.photo ? (
          <button type="button" className="cliente-cadastro-v2__photo-remove" onClick={onRemovePhoto}>
            {tx.removePhoto || 'Remover Foto'}
          </button>
        ) : null}
      </section>

      <section className="cliente-cadastro-v2__card">
        <h3 className="cliente-cadastro-v2__card-title">{tx.informacoesCliente || 'Informações do Cliente'}</h3>

        <FieldInput id="tipo-cliente" icon={<IconUser size={18} />} label={tx.tipoCliente || 'Tipo de Cliente'}>
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
            <option value="fisica">{tx.pessoaFisica || 'Pessoa Física'}</option>
            <option value="juridica">{tx.pessoaJuridica || 'Pessoa Jurídica'}</option>
          </select>
        </FieldInput>

        <FieldInput
          id="nome-cliente"
          icon={<IconUser size={18} />}
          label={isFisica ? tx.nomeCompleto || 'Nome Completo' : tx.nomeEmpresa || 'Razão Social / Nome'}
          required
        >
          <input
            id="nome-cliente"
            type="text"
            className="cliente-cadastro-v2__input"
            placeholder={isFisica ? tx.nomeCompletoPlaceholder || 'Ex: João Silva' : tx.nomeEmpresaPlaceholder || 'Ex: Empresa Lda.'}
            value={clienteForm.nomeEmpresa}
            onChange={(e) => setClienteForm({ ...clienteForm, nomeEmpresa: e.target.value })}
          />
        </FieldInput>

        {isFisica ? (
          <FieldInput
            id="empresa-opcional"
            icon={<IconBuilding2 size={18} />}
            label={tx.empresaOpcional || 'Empresa (Opcional)'}
          >
            <input
              id="empresa-opcional"
              type="text"
              className="cliente-cadastro-v2__input"
              placeholder={tx.empresaOpcionalPlaceholder || 'Ex: Nome da Empresa'}
              value={clienteForm.contato}
              onChange={(e) => setClienteForm({ ...clienteForm, contato: e.target.value })}
            />
          </FieldInput>
        ) : null}

        <FieldInput id="telefone-cliente" icon={<IconPhone />} label={tx.telefone || tx.telefones || 'Telefone'}>
          <input
            id="telefone-cliente"
            type="tel"
            className="cliente-cadastro-v2__input"
            placeholder={tx.telefonePlaceholder || 'Ex: (11) 98765-4321'}
            value={clienteForm.telefones}
            onChange={(e) => setClienteForm({ ...clienteForm, telefones: e.target.value })}
          />
        </FieldInput>

        <FieldInput id="endereco-cliente" icon={<IconMapPin />} label={tx.endereco || tx.morada || 'Endereço'} required>
          <input
            id="endereco-cliente"
            type="text"
            className="cliente-cadastro-v2__input"
            placeholder={tx.enderecoPlaceholder || 'Ex: Rua Exemplo, 123'}
            value={clienteForm.morada}
            onChange={(e) => setClienteForm({ ...clienteForm, morada: e.target.value })}
          />
        </FieldInput>

        <FieldInput id="codigo-postal-cliente" icon={<IconMapPin />} label={tx.codigoPostal || 'Código Postal'}>
          <input
            id="codigo-postal-cliente"
            type="text"
            className="cliente-cadastro-v2__input"
            placeholder={tx.codigoPostalPlaceholder || 'Ex: 1234-567'}
            value={clienteForm.codigoPostal}
            onChange={(e) => setClienteForm({ ...clienteForm, codigoPostal: e.target.value })}
          />
        </FieldInput>

        <FieldInput id="nif-cliente" icon={<IconIdCard size={18} />} label={tx.nif || tx.identificacaoFiscal || 'NIF'}>
          <input
            id="nif-cliente"
            type="text"
            className="cliente-cadastro-v2__input"
            placeholder={tx.nifPlaceholder || 'Ex: 123456789'}
            value={clienteForm.numeroContribuicaoFiscal}
            onChange={(e) => setClienteForm({ ...clienteForm, numeroContribuicaoFiscal: e.target.value })}
          />
        </FieldInput>
      </section>

      <section className="cliente-cadastro-v2__card cliente-cadastro-v2__card--details">
        <button
          type="button"
          className="cliente-cadastro-v2__details-toggle"
          onClick={() => setDetalhesAbertos((v) => !v)}
          aria-expanded={detalhesAbertos}
        >
          <span>{tx.detalhesAdicionaisCliente || 'Detalhes adicionais'}</span>
          <span aria-hidden>{detalhesAbertos ? '▾' : '▸'}</span>
        </button>

        {detalhesAbertos ? (
          <div className="cliente-cadastro-v2__details-grid">
            <FieldInput id="email-cliente" icon={<IconUser size={18} />} label={tx.email || 'E-mail'} required>
              <input
                id="email-cliente"
                type="email"
                className="cliente-cadastro-v2__input"
                placeholder={tx.emailPlaceholder || 'Ex: cliente@email.com'}
                value={clienteForm.email}
                onChange={(e) => setClienteForm({ ...clienteForm, email: e.target.value })}
              />
            </FieldInput>

            {!isFisica ? (
              <FieldInput id="contato-cliente" icon={<IconUser size={18} />} label={tx.contato || 'Contacto responsável'}>
                <input
                  id="contato-cliente"
                  type="text"
                  className="cliente-cadastro-v2__input"
                  placeholder={tx.contatoPlaceholder || 'Ex: Maria Santos'}
                  value={clienteForm.contato}
                  onChange={(e) => setClienteForm({ ...clienteForm, contato: e.target.value })}
                />
              </FieldInput>
            ) : null}

            <FieldInput id="localidade-cliente" icon={<IconMapPin />} label={tx.localidade || 'Localidade'}>
              <input
                id="localidade-cliente"
                type="text"
                className="cliente-cadastro-v2__input"
                value={clienteForm.localidade}
                onChange={(e) => setClienteForm({ ...clienteForm, localidade: e.target.value })}
              />
            </FieldInput>

            <FieldInput id="conselho-cliente" icon={<IconMapPin />} label={tx.conselho || 'Conselho'}>
              <input
                id="conselho-cliente"
                type="text"
                className="cliente-cadastro-v2__input"
                value={clienteForm.conselho}
                onChange={(e) => setClienteForm({ ...clienteForm, conselho: e.target.value })}
              />
            </FieldInput>

            <FieldInput id="freguesia-cliente" icon={<IconMapPin />} label={tx.freguesia || 'Freguesia'}>
              <input
                id="freguesia-cliente"
                type="text"
                className="cliente-cadastro-v2__input"
                value={clienteForm.freguesia}
                onChange={(e) => setClienteForm({ ...clienteForm, freguesia: e.target.value })}
              />
            </FieldInput>

            <FieldInput id="pais-cliente" icon={<IconMapPin />} label={tx.pais || 'País'}>
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
              label={tx.clienteGrupoTarifa || 'Grupo / tabela de valores'}
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
                <option value="">{tx.clienteSemGrupoTarifa || '— Sem grupo (tarifa padrão) —'}</option>
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
              label={tx.clienteKmIdaPadrao || 'KM de ida (padrão)'}
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
              label={tx.clienteKmRetornoPadrao || 'KM de retorno (padrão)'}
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

            {mapsQuery.trim() ? (
              <div className="cliente-cadastro-v2__maps-link">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🗺️ {tx.abrirGoogleMaps || 'Abrir no Google Maps'}
                </a>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {editingExtras}

      <div className="cliente-cadastro-v2__actions">
        <button type="button" className="cliente-cadastro-v2__submit" onClick={onSave}>
          <span className="cliente-cadastro-v2__submit-icon">+</span>
          {editingCliente ? tx.save || 'Salvar' : tx.addCliente || 'Adicionar Cliente'}
        </button>
        <button type="button" className="cliente-cadastro-v2__cancel" onClick={onCancel}>
          {tx.cancel || 'Cancelar'}
        </button>
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
