import type { AccountabilitySystem } from '@/types/database'

// ============================================================
// TYPES
// ============================================================

/**
 * State-awareness context for a district. Included in UserContext so every
 * server component that calls getUserContext gets this for free.
 *
 * districtId is string (non-null) here — pages that receive a DistrictContext
 * have already confirmed a district is selected.
 */
export type DistrictContext = {
  districtId: string
  districtName: string
  stateId: string | null
  stateCode: string
  accountabilitySystem: AccountabilitySystem
  hasCCMR: boolean
}

// ============================================================
// HELPER
// ============================================================

/**
 * Single source of truth for whether CCMR features should render.
 * Returns true only when the district's state uses the TEA A-F accountability system.
 *
 * CCMR features include:
 *   - CCMR Indicators tab on the student profile
 *   - A-F Simulator page
 *   - Accountability Reports page
 *   - CCMR-specific copy and metrics
 */
export function hasCCMRModule(accountabilitySystem: string): boolean {
  return accountabilitySystem === 'tea_af'
}
