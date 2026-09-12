/** Módulo demo — tipos e helpers puros de modo de módulo (gestão de demonstrações). */

export type {
  DemoModuleMode,
  DemoPackagePreset,
  DemoRecipientRecord,
  DemoRecipientStatus,
  DemoRecipientWithState,
} from './tipos'

export {
  isDemoModuleMode,
  pickValidDemoModuleModes,
  countActiveModules,
} from './modulesMode'

export type { DemoRecipientFormState, EmptyDemoRecipientFormOpts } from './formState'
export { defaultDemoModulesForActions, emptyDemoRecipientForm } from './formState'

export type {
  DemoRecipientFormPayload,
  CreateDemoRecipientFromFormOpts,
} from './fromForm'
export {
  isDemoRecipientFormValid,
  createDemoRecipientFromForm,
} from './fromForm'
