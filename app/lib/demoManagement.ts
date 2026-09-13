/** Lógica partilhada — gestão de envio de demonstrações (validade configurável). */

/** Tipos canónicos → `app/modules/demo` (re-export fino para consumidores existentes). */
export type {
  DemoModuleMode,
  DemoPackagePreset,
  DemoRecipientRecord,
  DemoRecipientStatus,
  DemoRecipientWithState,
} from '../modules/demo'
export { isDemoModuleMode, pickValidDemoModuleModes, countActiveModules } from '../modules/demo'

import type { DemoRecipientRecord, DemoRecipientWithState } from '../modules/demo'
import { enrichDemoRecipients as enrichDemoRecipientsPure } from '../modules/demo/enrich'

export {
  DEMO_DAYS_DEFAULT,
  DEMO_DAYS_MIN,
  DEMO_DAYS_MAX,
  DEMO_DAYS,
  DEMO_RECIPIENTS_KEY,
  clampDemoDays,
  resolveDemoDaysForRecipient,
  DEMO_VISITOR_USER,
} from '../modules/demo/limits'
export {
  DEMO_HIDDEN_ACTIONS,
  DEMO_ALLOWED_ACTIONS,
  FULL_DEMO_ACTION_KEYS,
  DEMO_EDITABLE_ACTION_KEYS,
  getDemoModuleLabelForGrid,
} from '../modules/demo/actions'
export type { DemoModuleGroupId, DemoPresetCard } from '../modules/demo/groups'
export {
  DEMO_MODULE_GROUP_ORDER,
  DEMO_MODULE_GROUP_LABELS,
  DEMO_PRESET_CARDS,
  getDemoModuleGroupId,
  getDemoPresetLabel,
} from '../modules/demo/groups'
export {
  finalizeDemoModulesPolicy,
  buildDemoModulesComplete,
  normalizeDemoModulesForSession,
  buildDemoModulesFromPreset,
  createDefaultDemoLinkForm,
} from '../modules/demo/policy'
export type { DemoShareCreds } from '../modules/demo/share'
export {
  buildDemoShareMessage,
  buildDemoMailto,
  buildDemoWhatsAppUrl,
} from '../modules/demo/share'

/** Injeta Date.now() no enrich canónico. */
export function enrichDemoRecipients(
  recipients: DemoRecipientRecord[],
  demoLinkBaseUrl: string
): DemoRecipientWithState[] {
  return enrichDemoRecipientsPure(recipients, demoLinkBaseUrl, Date.now())
}
