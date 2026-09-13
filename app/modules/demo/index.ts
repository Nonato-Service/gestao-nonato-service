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

export {
  DEMO_HIDDEN_ACTIONS,
  DEMO_ALLOWED_ACTIONS,
  FULL_DEMO_ACTION_KEYS,
  DEMO_EDITABLE_ACTION_KEYS,
  getDemoModuleLabelForGrid,
} from './actions'

export type { DemoModuleGroupId, DemoPresetCard } from './groups'
export {
  DEMO_MODULE_GROUP_ORDER,
  DEMO_MODULE_GROUP_LABELS,
  DEMO_PRESET_CARDS,
  getDemoModuleGroupId,
  getDemoPresetLabel,
} from './groups'

export {
  finalizeDemoModulesPolicy,
  buildDemoModulesComplete,
  normalizeDemoModulesForSession,
  buildDemoModulesFromPreset,
  createDefaultDemoLinkForm,
} from './policy'
