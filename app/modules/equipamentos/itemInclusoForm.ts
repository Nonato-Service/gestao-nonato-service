/** Formulário vazio do item incluso do equipamento. */

export type ItemInclusoFormState = {
  nome: string
  imagem?: string
}

export function emptyItemInclusoForm(): ItemInclusoFormState {
  return { nome: '', imagem: undefined }
}
