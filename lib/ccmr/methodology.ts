// ============================================================
// CCMR Methodology — routing and configuration helpers
//
// Two methodologies coexist in production:
//   - tx_binary       (cohorts ≤ 2029, 19 TAC §61.1028)
//   - tx_tiered_2030  (cohorts ≥ 2030, HB 2 89th Leg.)
//
// A district in 2026 has cohorts on both rule sets simultaneously.
// Code that aggregates across cohorts MUST segment by methodology
// or by cohort_year — see docs/methodology.md.
// ============================================================

import type { MethodologyKey } from '@/types/database'

export interface MethodologyRoutingConfig {
  state_code: string
  methodology_key: MethodologyKey
  effective_cohort_year_min: number | null
  effective_cohort_year_max: number | null
}

/**
 * Pure helper: given a cohort_year and the active methodologies for
 * the student's state, return the matching methodology_key.
 *
 * Returns null if cohort_year is missing or no methodology covers
 * the cohort. Callers MUST handle the null case rather than guessing.
 */
export function resolveMethodology(
  cohortYear: number | null,
  methodologies: MethodologyRoutingConfig[]
): MethodologyKey | null {
  if (cohortYear == null) return null
  const match = methodologies.find((m) => {
    const minOk = m.effective_cohort_year_min == null || cohortYear >= m.effective_cohort_year_min
    const maxOk = m.effective_cohort_year_max == null || cohortYear <= m.effective_cohort_year_max
    return minOk && maxOk
  })
  return match?.methodology_key ?? null
}

/**
 * Static fallback for the TX rule set used during migrations and
 * unit tests. Production code should read from the
 * state_accountability_methodologies table — see
 * `lib/db/methodology.ts` once that helper lands.
 */
export const TX_METHODOLOGIES: MethodologyRoutingConfig[] = [
  {
    state_code: 'TX',
    methodology_key: 'tx_binary',
    effective_cohort_year_min: null,
    effective_cohort_year_max: 2029,
  },
  {
    state_code: 'TX',
    methodology_key: 'tx_tiered_2030',
    effective_cohort_year_min: 2030,
    effective_cohort_year_max: null,
  },
]

/**
 * Returns true when a methodology produces tiered (Foundational /
 * Demonstrated / Advanced) results. Used by UI code to decide which
 * badge component to render.
 */
export function isTieredMethodology(key: MethodologyKey | null | undefined): boolean {
  if (!key) return false
  return key.includes('tiered') || key.includes('weighted')
}
