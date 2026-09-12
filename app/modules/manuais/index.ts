/** Módulo Manuais — tipos (famílias/grupos/modelos/documentos). */

export type {
  ManuaisGrupo,
  ManuaisDocumento,
  ManuaisImagem,
  ManuaisModelo,
  EquipamentoManuaisRef,
} from './tipos'

export type {
  CreateManuaisGrupoFromFormOpts,
  CreateManuaisModeloFromFormOpts,
  CreateManuaisDocumentoFromFormOpts,
  CreateManuaisImagemFromFormOpts,
} from './fromForm'
export {
  newManuaisEntityId,
  isManuaisGrupoNomeValid,
  createManuaisGrupoFromForm,
  updateManuaisGrupoNomeFromForm,
  isManuaisModeloNomeValid,
  createManuaisModeloFromForm,
  updateManuaisModeloNomeFromForm,
  resolveManuaisDocumentoTipo,
  isManuaisDocumentoFormValid,
  createManuaisDocumentoFromForm,
  isManuaisImagemFormValid,
  createManuaisImagemFromForm,
} from './fromForm'
