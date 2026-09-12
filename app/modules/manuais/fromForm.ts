/** Validação e mapeamento puro de grupo, modelo, documento e imagem de manuais. */

import type { BibliaAnexo } from '../../components/bibliaNonatoTypes'
import type { ManuaisDocumento, ManuaisGrupo, ManuaisImagem, ManuaisModelo } from './tipos'

export function newManuaisEntityId(prefix: string, suffix?: string | number): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return suffix == null ? `${prefix}-${Date.now()}` : `${prefix}-${Date.now()}-${suffix}`
}

export function isManuaisGrupoNomeValid(nome: string): boolean {
  return Boolean(nome.trim())
}

export type CreateManuaisGrupoFromFormOpts = {
  id?: string
  idPrefix?: string
}

export function createManuaisGrupoFromForm(
  nome: string,
  familia: string,
  opts: CreateManuaisGrupoFromFormOpts = {}
): ManuaisGrupo {
  return {
    id: opts.id ?? newManuaisEntityId(opts.idPrefix ?? 'g'),
    nome: nome.trim(),
    familia,
  }
}

export function updateManuaisGrupoNomeFromForm(existing: ManuaisGrupo, nome: string): ManuaisGrupo {
  return { ...existing, nome: nome.trim() }
}

export function isManuaisModeloNomeValid(nome: string): boolean {
  return Boolean(nome.trim())
}

export type CreateManuaisModeloFromFormOpts = {
  id?: string
  idPrefix?: string
}

export function createManuaisModeloFromForm(
  nome: string,
  grupoId: string,
  opts: CreateManuaisModeloFromFormOpts = {}
): ManuaisModelo {
  return {
    id: opts.id ?? newManuaisEntityId(opts.idPrefix ?? 'm'),
    nome: nome.trim(),
    grupoId,
  }
}

export function updateManuaisModeloNomeFromForm(existing: ManuaisModelo, nome: string): ManuaisModelo {
  return { ...existing, nome: nome.trim() }
}

export function resolveManuaisDocumentoTipo(fileName: string, mimeType?: string): string {
  const mime = String(mimeType || '').trim()
  if (mime) return mime
  return /\.pdf$/i.test(fileName) ? 'application/pdf' : 'application/octet-stream'
}

export function isManuaisDocumentoFormValid(
  form: Pick<ManuaisDocumento, 'nome' | 'dados'>
): boolean {
  return Boolean(form.nome && form.dados)
}

export type CreateManuaisDocumentoFromFormOpts = {
  id?: string
  idPrefix?: string
  idSuffix?: string | number
}

export function createManuaisDocumentoFromForm(
  form: Omit<ManuaisDocumento, 'id'>,
  opts: CreateManuaisDocumentoFromFormOpts = {}
): ManuaisDocumento {
  const doc: ManuaisDocumento = {
    id: opts.id ?? newManuaisEntityId(opts.idPrefix ?? 'doc', opts.idSuffix),
    nome: form.nome,
    tipo: form.tipo,
    dados: form.dados,
  }
  if (form.caminhoRelativo) doc.caminhoRelativo = form.caminhoRelativo
  if (form.secao) doc.secao = form.secao
  return doc
}

export function isManuaisImagemFormValid(form: Pick<ManuaisImagem, 'nome' | 'dados'>): boolean {
  return Boolean(form.nome && form.dados)
}

export type CreateManuaisImagemFromFormOpts = {
  id?: string
  idPrefix?: string
}

export function createManuaisImagemFromForm(
  form: Omit<ManuaisImagem, 'id'>,
  opts: CreateManuaisImagemFromFormOpts = {}
): ManuaisImagem {
  const img: ManuaisImagem = {
    id: opts.id ?? newManuaisEntityId(opts.idPrefix ?? 'img'),
    nome: form.nome,
    dados: form.dados,
  }
  if (form.secao) img.secao = form.secao
  return img
}

export function isBibliaAnexoFormValid(form: Pick<BibliaAnexo, 'nome' | 'dataUrl'>): boolean {
  return Boolean(form.nome && form.dataUrl)
}

export type CreateBibliaAnexoFromFormOpts = {
  id?: string
  idPrefix?: string
}

export function createBibliaAnexoFromForm(
  form: Omit<BibliaAnexo, 'id'>,
  opts: CreateBibliaAnexoFromFormOpts = {}
): BibliaAnexo {
  const anexo: BibliaAnexo = {
    id: opts.id ?? newManuaisEntityId(opts.idPrefix ?? 'anx'),
    nome: form.nome,
    mime: form.mime,
    dataUrl: form.dataUrl,
  }
  if (form.secao) anexo.secao = form.secao
  return anexo
}
