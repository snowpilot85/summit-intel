import type { CCMRReadiness, IndicatorType, IndicatorStatus } from '@/types/database'

export interface IndicatorInput {
  indicator_type: IndicatorType
  status: IndicatorStatus
}

const READING_GROUP: IndicatorType[] = ['tsi_reading', 'sat_reading', 'act_reading']
const MATH_GROUP: IndicatorType[] = ['tsi_math', 'sat_math', 'act_math']

const SINGLE_INDICATORS: IndicatorType[] = [
  'ap_exam',
  'ib_exam',
  'onramps',
  'ibc',
  'associate_degree',
  'level_i_ii_certificate',
  'military_enlistment',
  'iep_completion',
  'sped_advanced_degree',
]

function isMet(indicators: IndicatorInput[], type: IndicatorType): boolean {
  return indicators.some((i) => i.indicator_type === type && i.status === 'met')
}

function isInProgress(indicators: IndicatorInput[], type: IndicatorType): boolean {
  return indicators.some((i) => i.indicator_type === type && i.status === 'in_progress')
}

function anyMet(indicators: IndicatorInput[], types: IndicatorType[]): boolean {
  return types.some((t) => isMet(indicators, t))
}

// Paired pathway checks

function checkReadingMathPaired(indicators: IndicatorInput[]): boolean {
  return anyMet(indicators, READING_GROUP) && anyMet(indicators, MATH_GROUP)
}

function checkCollegePrepPaired(indicators: IndicatorInput[]): boolean {
  return isMet(indicators, 'college_prep_ela') && isMet(indicators, 'college_prep_math')
}

function checkDualCreditPaired(indicators: IndicatorInput[]): boolean {
  return (
    isMet(indicators, 'dual_credit_ela') &&
    isMet(indicators, 'dual_credit_math') &&
    isMet(indicators, 'dual_credit_any')
  )
}

function checkAnySingle(indicators: IndicatorInput[]): boolean {
  return SINGLE_INDICATORS.some((t) => isMet(indicators, t))
}

// "Almost" = one half of a paired pathway is satisfied but not both
function checkAlmost(indicators: IndicatorInput[]): boolean {
  const readingMet = anyMet(indicators, READING_GROUP)
  const mathMet = anyMet(indicators, MATH_GROUP)
  if (readingMet !== mathMet) return true // one side of reading/math pair

  if (isMet(indicators, 'college_prep_ela') !== isMet(indicators, 'college_prep_math')) return true

  const dcEla = isMet(indicators, 'dual_credit_ela')
  const dcMath = isMet(indicators, 'dual_credit_math')
  const dcAny = isMet(indicators, 'dual_credit_any')
  const dcMetCount = [dcEla, dcMath, dcAny].filter(Boolean).length
  if (dcMetCount > 0 && dcMetCount < 3) return true

  return false
}

function hasAnyActivity(indicators: IndicatorInput[]): boolean {
  return indicators.some((i) => i.status === 'met' || i.status === 'in_progress')
}

/**
 * Computes a student's CCMR readiness status from their indicator records.
 * This is pure business logic — no side effects, no Supabase dependency.
 */
export function computeCCMRReadiness(
  indicators: IndicatorInput[],
  gradeLevel: number
): CCMRReadiness {
  // 1. Any full pathway met → 'met'
  if (
    checkReadingMathPaired(indicators) ||
    checkCollegePrepPaired(indicators) ||
    checkDualCreditPaired(indicators) ||
    checkAnySingle(indicators)
  ) {
    return 'met'
  }

  // 2–4 are senior-specific
  if (gradeLevel === 12) {
    if (checkAlmost(indicators)) return 'almost'
    if (indicators.some((i) => i.status === 'in_progress')) return 'on_track'
    return 'at_risk'
  }

  // 5. Grade 9–10 with no activity → 'too_early'
  if (gradeLevel <= 10 && !hasAnyActivity(indicators)) return 'too_early'

  // 6. Everything else (grade 11, or 9-10 with some data)
  return 'on_track'
}
