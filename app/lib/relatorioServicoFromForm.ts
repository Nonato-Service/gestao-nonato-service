/**
 * I/O de relógio/aleatório — fromForm canónico em `app/modules/relatorio-servico`.
 */
import {
  createPecaSubstituicaoFromBiblioteca as createPecaSubstituicaoFromBibliotecaPure,
  createPecaSubstituicaoFromForm as createPecaSubstituicaoFromFormPure,
  type CreatePecaSubstituicaoFromFormOpts,
  type PecaBibliotecaParaSubstituicao,
} from '../modules/relatorio-servico/pecaSubstituicaoFromForm'
import {
  createDiaTrabalhoFromForm as createDiaTrabalhoFromFormPure,
  updateDiaTrabalhoFromForm as updateDiaTrabalhoFromFormPure,
  type DiaTrabalhoFromFormOpts,
} from '../modules/relatorio-servico/diaTrabalhoFromForm'
import {
  createRelatorioServicoFromForm as createRelatorioServicoFromFormPure,
  type CreateRelatorioServicoFromFormOpts,
} from '../modules/relatorio-servico/relatorioServicoFromForm'
import type { EquipamentoArmazemIdLookup } from '../modules/equipamentos/relatorio'
import type { PecaSubstituicao } from '../modules/relatorio-servico/pecaSubstituicao'
import type { RelatorioServico } from '../modules/relatorio-servico/relatorioServicoForm'
import type { DiaTrabalho } from '../modules/relatorio-servico/tipos'
import {
  createEmptyEquipamentoRelatorioForm as createEmptyEquipamentoRelatorioFormPure,
  criarEquipamentoRelatorioVazio as criarEquipamentoRelatorioVazioPure,
  type RelatorioEquipamentoOrigem,
  type RelatorioEquipamentoRef,
} from '../modules/relatorio-servico/equipamentoRelatorioForm'

/** Injeta Date.now() e Math.random() quando o call-site não envia. */
export function createPecaSubstituicaoFromForm(
  form: PecaSubstituicao,
  opts: Omit<CreatePecaSubstituicaoFromFormOpts, 'nowMs' | 'random'> = {}
): PecaSubstituicao {
  return createPecaSubstituicaoFromFormPure(form, { ...opts, nowMs: Date.now(), random: Math.random })
}

export function createPecaSubstituicaoFromBiblioteca(
  peca: PecaBibliotecaParaSubstituicao,
  quantidade = '1',
  opts: Omit<CreatePecaSubstituicaoFromFormOpts, 'nowMs' | 'random'> = {}
): PecaSubstituicao | null {
  return createPecaSubstituicaoFromBibliotecaPure(peca, quantidade, {
    ...opts,
    nowMs: Date.now(),
    random: Math.random,
  })
}

export function createDiaTrabalhoFromForm(
  form: DiaTrabalho,
  opts: Omit<DiaTrabalhoFromFormOpts, 'nowMs' | 'random'> = {}
): DiaTrabalho {
  return createDiaTrabalhoFromFormPure(form, { ...opts, nowMs: Date.now(), random: Math.random })
}

export function updateDiaTrabalhoFromForm(
  existing: DiaTrabalho,
  form: DiaTrabalho,
  opts: Omit<DiaTrabalhoFromFormOpts, 'id' | 'nowMs' | 'random'> = {}
): DiaTrabalho {
  return updateDiaTrabalhoFromFormPure(existing, form, {
    ...opts,
    nowMs: Date.now(),
    random: Math.random,
  })
}

export function createRelatorioServicoFromForm(
  form: RelatorioServico,
  equipamentosArmazem: EquipamentoArmazemIdLookup[] = [],
  opts: Omit<CreateRelatorioServicoFromFormOpts, 'nowMs'> = {}
): RelatorioServico {
  return createRelatorioServicoFromFormPure(form, equipamentosArmazem, {
    ...opts,
    nowMs: Date.now(),
  })
}

export function criarEquipamentoRelatorioVazio(
  origem: RelatorioEquipamentoOrigem = 'cliente'
): RelatorioEquipamentoRef {
  return criarEquipamentoRelatorioVazioPure(origem, { nowMs: Date.now(), random: Math.random })
}

export function createEmptyEquipamentoRelatorioForm(
  origem: RelatorioEquipamentoOrigem = 'cliente'
): RelatorioEquipamentoRef {
  return createEmptyEquipamentoRelatorioFormPure(origem, { nowMs: Date.now(), random: Math.random })
}
