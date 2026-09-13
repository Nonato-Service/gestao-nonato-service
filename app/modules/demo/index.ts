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

export { buildDemoUsername, formatDemoCredentialsText } from './credentials'

export {
  DEMO_DAYS_DEFAULT,
  DEMO_DAYS_MIN,
  DEMO_DAYS_MAX,
  DEMO_DAYS,
  DEMO_RECIPIENTS_KEY,
  clampDemoDays,
  resolveDemoDaysForRecipient,
  DEMO_VISITOR_USER,
} from './limits'
