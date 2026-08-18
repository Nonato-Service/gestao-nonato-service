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
