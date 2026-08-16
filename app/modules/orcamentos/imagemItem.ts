import { pecaBibliotecaTemImagemPropria } from '../../lib/pecaBibliotecaImagemStats'

/** Logo padrão da biblioteca de peças (UI/PDF quando a peça não tem foto própria). */
export const ORCAMENTO_PECA_IMAGEM_PADRAO_SRC = '/brand/nonato-logo-original.png'

type PecaBibliotecaImgRef = { id: string; imagem?: string }

/** Imagem gravada no item do orçamento (só foto real — não o logo padrão). */
export function resolveImagemItemOrcamentoParaGravar(
  item: { imagem?: string; pecaId?: string },
  pecasBiblioteca: PecaBibliotecaImgRef[],
  imagemPadraoSrc: string = ORCAMENTO_PECA_IMAGEM_PADRAO_SRC
): string {
  const imgSalva = typeof item.imagem === 'string' ? item.imagem.trim() : ''
  if (pecaBibliotecaTemImagemPropria(imgSalva) && imgSalva !== imagemPadraoSrc) return imgSalva
  if (item.pecaId) {
    const peca = pecasBiblioteca.find((p) => p.id === item.pecaId)
    const imgPeca = typeof peca?.imagem === 'string' ? peca.imagem.trim() : ''
    if (pecaBibliotecaTemImagemPropria(imgPeca) && imgPeca !== imagemPadraoSrc) return imgPeca
  }
  return imgSalva
}

/** Src para <img> na UI/PDF do orçamento (inclui logo padrão quando a peça não tem foto). */
export function resolveImagemItemOrcamentoDisplay(
  item: { imagem?: string; pecaId?: string },
  pecasBiblioteca: PecaBibliotecaImgRef[],
  imagemPadraoSrc: string = ORCAMENTO_PECA_IMAGEM_PADRAO_SRC
): string {
  const gravada = resolveImagemItemOrcamentoParaGravar(item, pecasBiblioteca, imagemPadraoSrc)
  if (pecaBibliotecaTemImagemPropria(gravada)) return gravada
  if (item.pecaId) return imagemPadraoSrc
  return ''
}

export function itemOrcamentoDeveMostrarImagem(item: { imagem?: string; pecaId?: string }): boolean {
  return Boolean(
    pecaBibliotecaTemImagemPropria(item.imagem) ||
      item.pecaId ||
      (typeof item.imagem === 'string' && item.imagem.trim() !== '')
  )
}
