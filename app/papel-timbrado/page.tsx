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
  linhaMorada: string
  linhaLocal: string
  telefone: string
  logoUrl: string
}

type FichaCadastralLite = {
  nomeEmpresa?: string
  telefone?: string
  morada?: string
  logo?: string
}

const DEFAULTS: PapelTimbradoConfig = {
  nomeEmpresa: 'NONATO SERVICE',
  linhaMorada: 'Rua das Mimosas, 303',
  linhaLocal: '4905-642 Viana do Castelo — Vila de Punhe',
  telefone: '+351 911 115 470',
  logoUrl: '/brand/nonato-logo-original.png',
}

const FALLBACK_LOGO = '/brand/nonato-letterhead-logo.svg'

function getLang(): keyof typeof translations {
  if (typeof window === 'undefined') return 'pt-BR'
  const v = localStorage.getItem('nonato-language')
  if (v && v in translations) return v as keyof typeof translations
  return 'pt-BR'
}

function loadConfig(): PapelTimbradoConfig {
  if (typeof window === 'undefined') return { ...DEFAULTS }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const j = JSON.parse(raw) as Partial<PapelTimbradoConfig>
    return {
      nomeEmpresa: typeof j.nomeEmpresa === 'string' ? j.nomeEmpresa : DEFAULTS.nomeEmpresa,
      linhaMorada: typeof j.linhaMorada === 'string' ? j.linhaMorada : DEFAULTS.linhaMorada,
      linhaLocal: typeof j.linhaLocal === 'string' ? j.linhaLocal : DEFAULTS.linhaLocal,
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
  const { linhaMorada, linhaLocal } = moradaParaDuasLinhas(fc.morada)
  const logo = (fc.logo || '').trim()
  if (nome) out.nomeEmpresa = nome
  if (tel) out.telefone = tel
  if (linhaMorada) out.linhaMorada = linhaMorada
  if (linhaLocal) out.linhaLocal = linhaLocal
  if (logo) out.logoUrl = logo
  if (!nome && !tel && !linhaMorada && !logo) return null
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
            <label htmlFor="pt-mor">{tx.papelTimbradoLinhaMorada || 'Morada'}</label>
            <input
              id="pt-mor"
              value={cfg.linhaMorada}
              onChange={(e) => setCfg((c) => ({ ...c, linhaMorada: e.target.value }))}
            />
          </div>
          <div className="papel-timbrado-field">
            <label htmlFor="pt-loc">{tx.papelTimbradoLinhaLocal || 'Localidade'}</label>
            <input
              id="pt-loc"
              value={cfg.linhaLocal}
              onChange={(e) => setCfg((c) => ({ ...c, linhaLocal: e.target.value }))}
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
                  <p className="addr">
                    {cfg.linhaMorada}
                    <br />
                    {cfg.linhaLocal}
                  </p>
                  <p className="tel">{cfg.telefone}</p>
                </div>
              </header>
              <section className="papel-timbrado-body-zone">
                <span>{tx.papelTimbradoAreaCorpo || 'Área da correspondência'}</span>
              </section>
              <footer className="papel-timbrado-footer">
                {cfg.nomeEmpresa} · {cfg.telefone}
              </footer>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
