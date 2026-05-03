// ============================================================
// TEA CCMR Tiered Derivation (cohort 2030+)
//
// Produces per-indicator tier results for one student. The score-
// driving "highest level" is computed separately via deriveHighest()
// which picks the maximum tier across all indicators.
//
// Critical rules encoded here (see docs/methodology.md for citations):
//
//   - TSI Math+RLA gate (hard): a student missing either subject
//     earns nothing from the TSI pathway. SAT Math passing alone
//     produces 'none' for the TSI indicator.
//
//   - CPC downgrade (soft): if TSI is satisfied via an approved
//     College Prep Course in either subject, the TSI indicator
//     caps at Foundational regardless of any SAT/ACT/TSIA component
//     that would otherwise upgrade it.
//
//   - IBC, Level I, Level II are three distinct credentials and
//     produce three distinct indicator rows. They are NOT merged.
//
//   - Highest-level scoring: the student's score-driving level is
//     the MAXIMUM tier across all indicators. A student who is
//     Advanced on IBC and Foundational on TSI gets credit for
//     Advanced (career), not for both.
// ============================================================

import type {
  CcmrIndicatorResultType,
  CcmrIndicatorResultStatus,
  CcmrIndicatorResultSourceData,
  IndicatorCategory,
  TieredStatus,
  TsiPathwaySource,
} from '@/types/database'

// ─────────────────────────────────────────────────────────────────
// Input shape — the upstream ingestion service should normalize
// per-student assessment + program data into this struct before
// calling deriveTieredIndicators().
// ─────────────────────────────────────────────────────────────────

export interface TieredDerivationInput {
  // TSI components — each is true when the student has met that
  // subject by that pathway. The CPC fields trigger the downgrade
  // rule described above.
  tsi: {
    rla_via_sat: boolean
    rla_via_act: boolean
    rla_via_tsia: boolean
    rla_via_cpc: boolean

    math_via_sat: boolean
    math_via_act: boolean
    math_via_tsia: boolean
    math_via_cpc: boolean
  }

  // Potential-college-credit components (any one earns Foundational
  // when paired with TSI; in combination with TSI tested-pathway
  // components earns Advanced under the College pathway).
  potential_college_credit: {
    ap_pass_count: number          // ≥ 1 AP exam with passing score
    ib_pass_count: number          // ≥ 1 IB exam with passing score
    onramps_credit_hours: number   // ≥ 3 SCH OnRamps
    dual_credit_hours: number      // ≥ 3 SCH dual credit
  }

  // CTE — three distinct credentials, never merged.
  cte: {
    is_completer: boolean          // earned a coherent sequence of CTE credits
    ibc_tier: 1 | 2 | 3 | null     // Industry-Based Cert tier (district-reported)
    ibc_program?: string
    has_level_1_certificate: boolean   // THECB-reported workforce education cert
    level_1_program?: string
    has_level_2_certificate: boolean   // THECB-reported, higher SCH count
    level_2_program?: string
  }

  // Other pathways
  associate_degree: boolean
  military_enlistment: boolean
  sped_advanced_diploma: boolean
  workforce_ready_iep_diploma: boolean
  jrotc: {
    enrolled: boolean              // completed JROTC sequence
    afqt_score: number | null
  }
}

// ─────────────────────────────────────────────────────────────────
// Output
// ─────────────────────────────────────────────────────────────────

export interface DerivedTieredIndicator {
  indicator_type: CcmrIndicatorResultType
  indicator_category: IndicatorCategory
  status: CcmrIndicatorResultStatus      // 'foundational' | 'demonstrated' | 'advanced' | 'none'
  source_data: CcmrIndicatorResultSourceData
}

// ─────────────────────────────────────────────────────────────────
// TIER RANK (for highest-level resolution)
// ─────────────────────────────────────────────────────────────────

const TIER_RANK: Record<TieredStatus, number> = {
  none: 0,
  foundational: 1,
  demonstrated: 2,
  advanced: 3,
}

export function maxTier(a: TieredStatus, b: TieredStatus): TieredStatus {
  return TIER_RANK[a] >= TIER_RANK[b] ? a : b
}

// ─────────────────────────────────────────────────────────────────
// MAIN DERIVATION
// ─────────────────────────────────────────────────────────────────

export function deriveTieredIndicators(
  input: TieredDerivationInput
): DerivedTieredIndicator[] {
  const out: DerivedTieredIndicator[] = []

  out.push(deriveTsi(input))
  out.push(deriveIbc(input))
  out.push(deriveLevel1(input))
  out.push(deriveLevel2(input))
  out.push(deriveDualCredit(input))
  out.push(deriveAp(input))
  out.push(deriveIb(input))
  out.push(deriveOnramps(input))
  out.push(deriveAssociateDegree(input))
  out.push(deriveJrotc(input))
  out.push(deriveMilitaryEnlistment(input))
  out.push(deriveSpedAdvancedDiploma(input))
  out.push(deriveWorkforceReadyIep(input))

  return out
}

// ─────────────────────────────────────────────────────────────────
// TSI — Math+RLA gate, CPC downgrade
// ─────────────────────────────────────────────────────────────────

function deriveTsi(input: TieredDerivationInput): DerivedTieredIndicator {
  const { tsi } = input

  const rlaTested = tsi.rla_via_sat || tsi.rla_via_act || tsi.rla_via_tsia
  const mathTested = tsi.math_via_sat || tsi.math_via_act || tsi.math_via_tsia

  const rlaAny = rlaTested || tsi.rla_via_cpc
  const mathAny = mathTested || tsi.math_via_cpc

  // Hard gate: BOTH subjects required by some pathway.
  if (!rlaAny || !mathAny) {
    return tsiResult('none', null, {})
  }

  // CPC downgrade: if either subject is satisfied only via CPC, cap
  // at Foundational. (If a subject has BOTH a tested pathway AND CPC,
  // we treat the CPC as decorative and use the tested pathway — the
  // student demonstrated the higher pathway elsewhere.)
  const rlaCpcOnly = !rlaTested && tsi.rla_via_cpc
  const mathCpcOnly = !mathTested && tsi.math_via_cpc

  if (rlaCpcOnly || mathCpcOnly) {
    return tsiResult('foundational', 'cpc', {
      rla_via_cpc: tsi.rla_via_cpc,
      math_via_cpc: tsi.math_via_cpc,
    })
  }

  // Both subjects tested via SAT/ACT/TSIA → Demonstrated.
  // Upgrade to Advanced is handled in the College pathway combination
  // logic via the potential_college_credit indicators (see TEA tier
  // rules: TSI tested pathway + potential college credit = Advanced).
  // We encode that combination on the TSI indicator itself for
  // simplicity — the highest-level resolver picks it up.
  const hasPotentialCollegeCredit = anyPotentialCollegeCredit(input)
  const status: TieredStatus = hasPotentialCollegeCredit ? 'advanced' : 'demonstrated'

  // Pick the strongest single tested pathway as the source label.
  const source: TsiPathwaySource =
    tsi.rla_via_sat || tsi.math_via_sat ? 'sat'
    : tsi.rla_via_act || tsi.math_via_act ? 'act'
    : 'tsia'

  return tsiResult(status, source, {})
}

function tsiResult(
  status: TieredStatus,
  pathway: TsiPathwaySource | null,
  extra: Record<string, unknown>
): DerivedTieredIndicator {
  return {
    indicator_type: 'tsi',
    indicator_category: 'college',
    status,
    source_data: {
      ...(pathway ? { tsi_pathway_source: pathway } : {}),
      ...extra,
    },
  }
}

function anyPotentialCollegeCredit(input: TieredDerivationInput): boolean {
  const p = input.potential_college_credit
  return p.ap_pass_count >= 1
      || p.ib_pass_count >= 1
      || p.onramps_credit_hours >= 3
      || p.dual_credit_hours >= 3
}

// ─────────────────────────────────────────────────────────────────
// CTE — IBC tier ladder (career)
// CTE Completer + Tier 1 → Advanced
// CTE Completer + Tier 2 → Demonstrated
// CTE Completer + Tier 3 → Foundational
// Non-completer with IBC → none
// ─────────────────────────────────────────────────────────────────

function deriveIbc(input: TieredDerivationInput): DerivedTieredIndicator {
  const { is_completer, ibc_tier, ibc_program } = input.cte
  if (!is_completer || ibc_tier == null) {
    return {
      indicator_type: 'ibc',
      indicator_category: 'career',
      status: 'none',
      source_data: ibc_tier != null ? { ibc_tier } : {},
    }
  }
  const status: TieredStatus =
    ibc_tier === 1 ? 'advanced'
    : ibc_tier === 2 ? 'demonstrated'
    : 'foundational'
  return {
    indicator_type: 'ibc',
    indicator_category: 'career',
    status,
    source_data: {
      ibc_tier,
      ...(ibc_program ? { certificate_program: ibc_program } : {}),
    },
  }
}

// Level I and Level II Certificates — both Advanced under the
// career pathway. Tracked separately because they're different
// credentials with different reporting (THECB vs. district).
function deriveLevel1(input: TieredDerivationInput): DerivedTieredIndicator {
  return {
    indicator_type: 'level_1_certificate',
    indicator_category: 'career',
    status: input.cte.has_level_1_certificate ? 'advanced' : 'none',
    source_data: input.cte.level_1_program
      ? { certificate_program: input.cte.level_1_program }
      : {},
  }
}

function deriveLevel2(input: TieredDerivationInput): DerivedTieredIndicator {
  return {
    indicator_type: 'level_2_certificate',
    indicator_category: 'career',
    status: input.cte.has_level_2_certificate ? 'advanced' : 'none',
    source_data: input.cte.level_2_program
      ? { certificate_program: input.cte.level_2_program }
      : {},
  }
}

// ─────────────────────────────────────────────────────────────────
// Potential college-credit indicators
//
// These are recorded as their own indicator rows for explainability
// (the student detail page shows what the student earned). The TSI
// upgrade combination is encoded inside deriveTsi above.
// ─────────────────────────────────────────────────────────────────

function deriveAp(input: TieredDerivationInput): DerivedTieredIndicator {
  return {
    indicator_type: 'ap',
    indicator_category: 'college',
    status: input.potential_college_credit.ap_pass_count >= 1 ? 'foundational' : 'none',
    source_data: { ap_pass_count: input.potential_college_credit.ap_pass_count },
  }
}

function deriveIb(input: TieredDerivationInput): DerivedTieredIndicator {
  return {
    indicator_type: 'ib',
    indicator_category: 'college',
    status: input.potential_college_credit.ib_pass_count >= 1 ? 'foundational' : 'none',
    source_data: { ib_pass_count: input.potential_college_credit.ib_pass_count },
  }
}

function deriveOnramps(input: TieredDerivationInput): DerivedTieredIndicator {
  return {
    indicator_type: 'onramps',
    indicator_category: 'college',
    status: input.potential_college_credit.onramps_credit_hours >= 3 ? 'foundational' : 'none',
    source_data: { onramps_credit_hours: input.potential_college_credit.onramps_credit_hours },
  }
}

function deriveDualCredit(input: TieredDerivationInput): DerivedTieredIndicator {
  return {
    indicator_type: 'dual_credit',
    indicator_category: 'college',
    status: input.potential_college_credit.dual_credit_hours >= 3 ? 'foundational' : 'none',
    source_data: { dual_credit_hours: input.potential_college_credit.dual_credit_hours },
  }
}

function deriveAssociateDegree(input: TieredDerivationInput): DerivedTieredIndicator {
  return {
    indicator_type: 'associate_degree',
    indicator_category: 'college',
    status: input.associate_degree ? 'advanced' : 'none',
    source_data: {},
  }
}

// ─────────────────────────────────────────────────────────────────
// Military pathways
// JROTC + AFQT 65+ → Advanced
// JROTC + AFQT 50-64 → Demonstrated
// JROTC + AFQT 31-49 → Foundational
// Military enlistment → Advanced
// SPED Advanced Diploma → Demonstrated
// Workforce Ready IEP Diploma → Demonstrated
// ─────────────────────────────────────────────────────────────────

function deriveJrotc(input: TieredDerivationInput): DerivedTieredIndicator {
  const { enrolled, afqt_score } = input.jrotc
  if (!enrolled || afqt_score == null) {
    return {
      indicator_type: 'jrotc',
      indicator_category: 'military',
      status: 'none',
      source_data: afqt_score != null ? { afqt_score } : {},
    }
  }
  let status: TieredStatus = 'none'
  if (afqt_score >= 65) status = 'advanced'
  else if (afqt_score >= 50) status = 'demonstrated'
  else if (afqt_score >= 31) status = 'foundational'
  return {
    indicator_type: 'jrotc',
    indicator_category: 'military',
    status,
    source_data: { afqt_score },
  }
}

function deriveMilitaryEnlistment(input: TieredDerivationInput): DerivedTieredIndicator {
  return {
    indicator_type: 'military_enlistment',
    indicator_category: 'military',
    status: input.military_enlistment ? 'advanced' : 'none',
    source_data: {},
  }
}

function deriveSpedAdvancedDiploma(input: TieredDerivationInput): DerivedTieredIndicator {
  return {
    indicator_type: 'sped_advanced_diploma',
    indicator_category: 'college',
    status: input.sped_advanced_diploma ? 'demonstrated' : 'none',
    source_data: {},
  }
}

function deriveWorkforceReadyIep(input: TieredDerivationInput): DerivedTieredIndicator {
  return {
    indicator_type: 'workforce_ready_iep',
    indicator_category: 'career',
    status: input.workforce_ready_iep_diploma ? 'demonstrated' : 'none',
    source_data: {},
  }
}

// ─────────────────────────────────────────────────────────────────
// HIGHEST LEVEL RESOLVER
//
// Picks the indicator whose tier is highest. Ties broken by category
// preference (college > career > military) — arbitrary but stable;
// can be revisited if the team wants a different tie-break.
// Returns null when no indicator has reached any tier.
// ─────────────────────────────────────────────────────────────────

const CATEGORY_PRIORITY: Record<IndicatorCategory, number> = {
  college: 3,
  career: 2,
  military: 1,
}

export interface HighestLevelResult {
  status: TieredStatus
  category: IndicatorCategory | null
  source_indicator_type: CcmrIndicatorResultType | null
}

export function deriveHighestTiered(
  indicators: DerivedTieredIndicator[]
): HighestLevelResult {
  let best: DerivedTieredIndicator | null = null
  for (const ind of indicators) {
    if (ind.status === 'not_met' || ind.status === 'met') continue  // binary statuses don't apply
    const candidate = ind as DerivedTieredIndicator & { status: TieredStatus }
    if (!best) {
      best = candidate
      continue
    }
    const bestStatus = best.status as TieredStatus
    const candStatus = candidate.status
    if (TIER_RANK[candStatus] > TIER_RANK[bestStatus]) {
      best = candidate
    } else if (TIER_RANK[candStatus] === TIER_RANK[bestStatus]) {
      if (CATEGORY_PRIORITY[candidate.indicator_category] >
          CATEGORY_PRIORITY[best.indicator_category]) {
        best = candidate
      }
    }
  }
  if (!best || best.status === 'none') {
    return { status: 'none', category: null, source_indicator_type: null }
  }
  return {
    status: best.status as TieredStatus,
    category: best.indicator_category,
    source_indicator_type: best.indicator_type,
  }
}
