/** Rascunhos de logo no Administrador (barra / dashboard / biblioteca) — só tipos. */

export type AdminInterfaceLogoDraft = {
  previewUrl: string
  isVideo: boolean
  imageDataUrl?: string
}

export type AdminBibliotecaLogoDraft = {
  previewUrl: string
  dataUrl: string
  fileName: string
}
