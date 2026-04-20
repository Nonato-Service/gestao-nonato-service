'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { translations } from '../translations'
import { loadData } from '../utils/dataStorage'
import './papel-timbrado.css'

const STORAGE_KEY = 'nonato-papel-timbrado-v1'
const FICHA_KEY = 'nonato-ficha-cadastral'

export type PapelTimbradoConfig = {
  nomeEmpresa: string
  cidade: string
  freguesia: string
  rua: string
  cep: string
  telefone: string
  logoUrl: string
}

type PapelTimbradoStored = Partial<PapelTimbradoConfig> & {
  linhaMorada?: string
  linhaLocal?: string
}

type FichaCadastralLite = {
  nomeEmpresa?: string
  telefone?: string
  morada?: string
  logo?: string
}

const DEFAULTS: PapelTimbradoConfig = {
  nomeEmpresa: 'NONATO SERVICE',
  cidade: 'Viana do Castelo',
  freguesia: 'Vila de Punhe',
  rua: 'Rua das Mimosas, 303',
  cep: '4905-642',
  telefone: '+351-91111-5479',
  logoUrl: '/brand/nonato-logo-original.png',
}

const FALLBACK_LOGO = '/brand/nonato-letterhead-logo.svg'

function getLang(): keyof typeof translations {
  if (typeof window === 'undefined') return 'pt-BR'
  const v = localStorage.getItem('nonato-language')
  if (v && v in translations) return v as keyof typeof translations
  return 'pt-BR'
}

function moradaStringParaPartial(morada: string): Partial<Pick<PapelTimbradoConfig, 'rua' | 'cep' | 'cidade' | 'freguesia'>> {
  const { linhaMorada, linhaLocal } = moradaParaDuasLinhas(morada)
  const out: Partial<Pick<PapelTimbradoConfig, 'rua' | 'cep' | 'cidade' | 'freguesia'>> = {}
  if (linhaMorada) out.rua = linhaMorada
  if (linhaLocal) {
    const cepM = linhaLocal.match(/(\d{4}-\d{3})/)
    if (cepM) out.cep = cepM[1]
    const tail = linhaLocal
      .replace(cepM?.[0] || '', '')
      .trim()
      .replace(/^[-—,\s]+/, '')
    const chunks = tail
      .split(/[—–]/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (chunks.length >= 2) {
      out.cidade = chunks[0]
      out.freguesia = chunks[chunks.length - 1]
    } else if (chunks.length === 1) {
      out.cidade = chunks[0]
    }
  }
  return out
}

function temCamposMoradaEstruturados(j: PapelTimbradoStored): boolean {
  return (
    (typeof j.rua === 'string' && j.rua.trim() !== '') ||
    (typeof j.cidade === 'string' && j.cidade.trim() !== '') ||
    (typeof j.freguesia === 'string' && j.freguesia.trim() !== '') ||
    (typeof j.cep === 'string' && j.cep.trim() !== '')
  )
}

function loadConfig(): PapelTimbradoConfig {
  if (typeof window === 'undefined') return { ...DEFAULTS }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const j = JSON.parse(raw) as PapelTimbradoStored
    const migrated = temCamposMoradaEstruturados(j)
      ? {}
      : moradaStringParaPartial(`${j.linhaMorada || ''}\n${j.linhaLocal || ''}`)
    return {
      nomeEmpresa: typeof j.nomeEmpresa === 'string' ? j.nomeEmpresa : DEFAULTS.nomeEmpresa,
      cidade: typeof j.cidade === 'string' && j.cidade.trim() ? j.cidade.trim() : migrated.cidade ?? DEFAULTS.cidade,
      freguesia:
        typeof j.freguesia === 'string' && j.freguesia.trim()
          ? j.freguesia.trim()
          : migrated.freguesia ?? DEFAULTS.freguesia,
      rua: typeof j.rua === 'string' && j.rua.trim() ? j.rua.trim() : migrated.rua ?? DEFAULTS.rua,
      cep: typeof j.cep === 'string' && j.cep.trim() ? j.cep.trim() : migrated.cep ?? DEFAULTS.cep,
      telefone: typeof j.telefone === 'string' ? j.telefone : DEFAULTS.telefone,
      logoUrl: typeof j.logoUrl === 'string' && j.logoUrl.trim() ? j.logoUrl.trim() : DEFAULTS.logoUrl,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

function moradaParaDuasLinhas(morada: string | undefined): { linhaMorada: string; linhaLocal: string } {
  const raw = (morada || '').trim()
  if (!raw) return { linhaMorada: '', linhaLocal: '' }
  const nl = raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (nl.length >= 2) return { linhaMorada: nl[0], linhaLocal: nl.slice(1).join(' — ') }
  return { linhaMorada: raw, linhaLocal: '' }
}

/** Campos preenchidos a partir da ficha «Cadastro / Ficha cadastral da Nonato Service» (nonato-ficha-cadastral). */
function partialDesdeFichaCadastral(fc: FichaCadastralLite | null | undefined): Partial<PapelTimbradoConfig> | null {
  if (!fc || typeof fc !== 'object') return null
  const out: Partial<PapelTimbradoConfig> = {}
  const nome = (fc.nomeEmpresa || '').trim()
  const tel = (fc.telefone || '').trim()
  const logo = (fc.logo || '').trim()
  const moradaBits = moradaStringParaPartial(fc.morada || '')
  if (nome) out.nomeEmpresa = nome
  if (tel) out.telefone = tel
  if (moradaBits.rua) out.rua = moradaBits.rua
  if (moradaBits.cep) out.cep = moradaBits.cep
  if (moradaBits.cidade) out.cidade = moradaBits.cidade
  if (moradaBits.freguesia) out.freguesia = moradaBits.freguesia
  if (logo) out.logoUrl = logo
  if (!nome && !tel && !logo && !moradaBits.rua && !moradaBits.cidade && !moradaBits.freguesia && !moradaBits.cep)
    return null
  return out
}

function mergeCfg(base: PapelTimbradoConfig, partial: Partial<PapelTimbradoConfig>): PapelTimbradoConfig {
  const next = { ...base }
  ;(Object.keys(partial) as (keyof PapelTimbradoConfig)[]).forEach((k) => {
    const v = partial[k]
    if (v !== undefined && v !== null && String(v).trim() !== '') (next as Record<string, string>)[k] = String(v).trim()
  })
  return next
}

export default function PapelTimbradoPage() {
  const [lang, setLang] = useState<keyof typeof translations>('pt-BR')
  const [cfg, setCfg] = useState<PapelTimbradoConfig>(DEFAULTS)
  const [logoBroken, setLogoBroken] = useState(false)

  useEffect(() => {
    setLang(getLang())
    const inicial = loadConfig()
    setCfg(inicial)
    setLogoBroken(false)

    const semPapelSalvo = typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEY)
    let cancel = false

    ;(async () => {
      try {
        const fc = (await loadData(FICHA_KEY, true)) as FichaCadastralLite | null
        if (cancel) return
        const partial = partialDesdeFichaCadastral(fc)
        if (!partial) return
        if (semPapelSalvo) {
          setCfg(mergeCfg({ ...DEFAULTS }, partial))
          setLogoBroken(false)
        }
      } catch {
        /* ignorar */
      }
    })()

    return () => {
      cancel = true
    }
  }, [])

  const t = useMemo(() => translations[lang] || translations['pt-BR'], [lang])
  const tx = t as Record<string, string>

  const salvar = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg))
    } catch {
      /* ignore */
    }
  }, [cfg])

  const restaurar = useCallback(() => {
    setCfg({ ...DEFAULTS })
    setLogoBroken(false)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  const imprimir = useCallback(() => {
    window.print()
  }, [])

  const sincronizarComCadastro = useCallback(async () => {
    const cur = (translations[getLang()] || translations['pt-BR']) as Record<string, string>
    try {
      const fc = (await loadData(FICHA_KEY, true)) as FichaCadastralLite | null
      const partial = partialDesdeFichaCadastral(fc)
      if (!partial) {
        window.alert(cur.papelTimbradoSemFichaCadastro || 'Sem dados na ficha cadastral.')
        return
      }
      setCfg((c) => mergeCfg(c, partial))
      setLogoBroken(false)
    } catch {
      window.alert(cur.papelTimbradoSemFichaCadastro || 'Sem dados na ficha cadastral.')
    }
  }, [])

  const logoSrc = logoBroken ? FALLBACK_LOGO : cfg.logoUrl || FALLBACK_LOGO
  const logoCampoMultilinha = cfg.logoUrl.length > 120

  return (
    <div className="papel-timbrado-root">
      <div className="papel-timbrado-toolbar">
        <Link href="/">← {tx.papelTimbradoVoltarSistema || 'Voltar ao sistema'}</Link>
        <button type="button" className="secondary" onClick={sincronizarComCadastro}>
          {tx.papelTimbradoSincronizarCadastro || 'Puxar dados do cadastro'}
        </button>
        <button type="button" className="secondary" onClick={salvar}>
          {tx.papelTimbradoSalvarConfig || 'Guardar'}
        </button>
        <button type="button" className="secondary" onClick={restaurar}>
          {tx.papelTimbradoRestaurarNonato || 'Restaurar'}
        </button>
        <button type="button" className="primary" onClick={imprimir}>
          {tx.papelTimbradoImprimir || 'Imprimir / PDF'}
        </button>
      </div>

      <div className="papel-timbrado-layout">
        <div className="papel-timbrado-form">
          <h1>{tx.papelTimbradoTitle || 'Papel timbrado'}</h1>
          <p className="lead">{tx.papelTimbradoSubtitle || ''}</p>
          <p className="papel-timbrado-hint" style={{ marginBottom: 14 }}>
            {tx.papelTimbradoSincronizarCadastroHint || ''}
          </p>

          <div className="papel-timbrado-field">
            <label htmlFor="pt-nome">{tx.papelTimbradoNomeEmpresa || 'Nome'}</label>
            <input
              id="pt-nome"
              value={cfg.nomeEmpresa}
              onChange={(e) => setCfg((c) => ({ ...c, nomeEmpresa: e.target.value }))}
            />
          </div>
          <div className="papel-timbrado-field">
            <label htmlFor="pt-cid">{tx.papelTimbradoCampoCidade || 'Cidade'}</label>
            <input
              id="pt-cid"
              value={cfg.cidade}
              onChange={(e) => setCfg((c) => ({ ...c, cidade: e.target.value }))}
            />
          </div>
          <div className="papel-timbrado-field">
            <label htmlFor="pt-freg">{tx.papelTimbradoCampoFreguesia || 'Freguesia'}</label>
            <input
              id="pt-freg"
              value={cfg.freguesia}
              onChange={(e) => setCfg((c) => ({ ...c, freguesia: e.target.value }))}
            />
          </div>
          <div className="papel-timbrado-field">
            <label htmlFor="pt-rua">{tx.papelTimbradoCampoRua || 'Rua'}</label>
            <input
              id="pt-rua"
              value={cfg.rua}
              onChange={(e) => setCfg((c) => ({ ...c, rua: e.target.value }))}
            />
          </div>
          <div className="papel-timbrado-field">
            <label htmlFor="pt-cep">{tx.papelTimbradoCampoCep || 'CEP'}</label>
            <input
              id="pt-cep"
              value={cfg.cep}
              onChange={(e) => setCfg((c) => ({ ...c, cep: e.target.value }))}
            />
          </div>
          <div className="papel-timbrado-field">
            <label htmlFor="pt-tel">{tx.papelTimbradoTelefone || 'Telefone'}</label>
            <input
              id="pt-tel"
              value={cfg.telefone}
              onChange={(e) => setCfg((c) => ({ ...c, telefone: e.target.value }))}
            />
          </div>
          <div className="papel-timbrado-field">
            <label htmlFor="pt-logo">{tx.papelTimbradoLogoUrl || 'Logo URL'}</label>
            {logoCampoMultilinha ? (
              <textarea
                id="pt-logo"
                rows={4}
                value={cfg.logoUrl}
                onChange={(e) => {
                  setLogoBroken(false)
                  setCfg((c) => ({ ...c, logoUrl: e.target.value }))
                }}
                placeholder="/brand/nonato-logo-original.png"
                className="papel-timbrado-textarea-logo"
              />
            ) : (
              <input
                id="pt-logo"
                value={cfg.logoUrl}
                onChange={(e) => {
                  setLogoBroken(false)
                  setCfg((c) => ({ ...c, logoUrl: e.target.value }))
                }}
                placeholder="/brand/nonato-logo-original.png"
              />
            )}
          </div>
          <p className="papel-timbrado-hint">{tx.papelTimbradoLogoHint || ''}</p>
          <p className="papel-timbrado-hint">{tx.papelTimbradoDicaImpressao || ''}</p>
        </div>

        <div className="papel-timbrado-sheet-wrap">
          <div className="papel-timbrado-sheet" id="papel-timbrado-print-area">
            <div className="papel-timbrado-sheet-inner">
              <header className="papel-timbrado-header">
                <img className="papel-timbrado-logo" src={logoSrc} alt="" onError={() => setLogoBroken(true)} />
                <div className="papel-timbrado-header-text">
                  <h2>{cfg.nomeEmpresa}</h2>
                </div>
              </header>
              <section className="papel-timbrado-body-zone">
                <span>{tx.papelTimbradoAreaCorpo || 'Área da correspondência'}</span>
              </section>
              <footer className="papel-timbrado-footer" aria-label="Contactos">
                <div className="papel-timbrado-footer-row">
                  <span className="papel-timbrado-footer-item">
                    <span className="papel-timbrado-footer-label">{tx.papelTimbradoLabelCidade}</span>
                    <span className="papel-timbrado-footer-val">{cfg.cidade}</span>
                  </span>
                  <span className="papel-timbrado-footer-sep" aria-hidden="true">
                    |
                  </span>
                  <span className="papel-timbrado-footer-item">
                    <span className="papel-timbrado-footer-label">{tx.papelTimbradoLabelFreguesia}</span>
                    <span className="papel-timbrado-footer-val">{cfg.freguesia}</span>
                  </span>
                  <span className="papel-timbrado-footer-sep" aria-hidden="true">
                    |
                  </span>
                  <span className="papel-timbrado-footer-item">
                    <span className="papel-timbrado-footer-label">{tx.papelTimbradoLabelRua}</span>
                    <span className="papel-timbrado-footer-val">{cfg.rua}</span>
                  </span>
                  <span className="papel-timbrado-footer-sep" aria-hidden="true">
                    |
                  </span>
                  <span className="papel-timbrado-footer-item">
                    <span className="papel-timbrado-footer-label">{tx.papelTimbradoLabelCep}</span>
                    <span className="papel-timbrado-footer-val">{cfg.cep}</span>
                  </span>
                  <span className="papel-timbrado-footer-sep" aria-hidden="true">
                    |
                  </span>
                  <span className="papel-timbrado-footer-item">
                    <span className="papel-timbrado-footer-label">{tx.papelTimbradoLabelFone}</span>
                    <span className="papel-timbrado-footer-val">{cfg.telefone}</span>
                  </span>
                </div>
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
