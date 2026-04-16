/**
 * Automated Intervention Generation
 * Pure function — no Supabase dependency.
 *
 * Generates recommended interventions for at-risk/almost seniors
 * based on their CCMR indicators and demographics.
 */

import type { StudentRow, IndicatorRow, InterventionInsert } from '@/types/database'

// TSI-family indicator types (any one section satisfies a TSI pathway)
const TSI_TYPES = new Set([
  'tsi_reading', 'tsi_math',
  'sat_reading', 'sat_math',
  'act_reading', 'act_math',
])

// Days from today → ISO date string
function daysOut(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

export function generateInterventions(
  students: StudentRow[],
  indicators: IndicatorRow[],
): InterventionInsert[] {
  // Build per-student indicator lookup
  const byStudent = new Map<string, IndicatorRow[]>()
  for (const ind of indicators) {
    const arr = byStudent.get(ind.student_id) ?? []
    arr.push(ind)
    byStudent.set(ind.student_id, arr)
  }

  const results: InterventionInsert[] = []

  for (const student of students) {
    // Only grade 12, only students who still need CCMR
    if (student.grade_level !== 12) continue
    if (
      student.ccmr_readiness === 'met' ||
      student.ccmr_readiness === 'on_track' ||
      student.ccmr_readiness === 'too_early'
    ) continue

    const inds   = byStudent.get(student.id) ?? []
    const met    = new Set(inds.filter(i => i.status === 'met').map(i => i.indicator_type))
    const active = new Set(inds.filter(i => i.status === 'in_progress').map(i => i.indicator_type))

    let fired = false

    // ── Rule 1: IBC ────────────────────────────────────────────────────────
    // Student has an active IBC enrollment (metadata.cte_pathway set) or
    // has an in_progress ibc indicator, but hasn't met ibc yet.
    const ctePathway = student.metadata?.cte_pathway as string | undefined
    if ((ctePathway || active.has('ibc')) && !met.has('ibc')) {
      results.push({
        student_id: student.id,
        campus_id: student.campus_id,
        pathway_type: 'ibc',
        title: 'Register for IBC exam',
        description:
          'Student is enrolled in a CTE pathway. Register them for the industry-based certification exam before the district deadline.',
        status: 'recommended',
        priority: 1,
        due_date: daysOut(30),
        completed_date: null,
        assigned_to: null,
        projected_ccmr_impact: 1,
        notes: null,
        metadata: {},
      })
      fired = true
    }

    // ── Rule 2: Complete the TSI pair ──────────────────────────────────────
    // Has reading but not math, or vice versa.
    const hasTsiRead = met.has('tsi_reading') || met.has('sat_reading') || met.has('act_reading')
    const hasTsiMath = met.has('tsi_math')    || met.has('sat_math')    || met.has('act_math')

    if (hasTsiRead && !hasTsiMath) {
      results.push({
        student_id: student.id,
        campus_id: student.campus_id,
        pathway_type: 'tsi_math',
        title: 'Complete TSI Math to finalize CCMR',
        description:
          'Student has TSI Reading complete. One TSI Math attempt that meets the threshold will satisfy the full TSI CCMR pathway.',
        status: 'recommended',
        priority: 2,
        due_date: daysOut(45),
        completed_date: null,
        assigned_to: null,
        projected_ccmr_impact: 1,
        notes: null,
        metadata: {},
      })
      fired = true
    } else if (hasTsiMath && !hasTsiRead) {
      results.push({
        student_id: student.id,
        campus_id: student.campus_id,
        pathway_type: 'tsi_reading',
        title: 'Complete TSI Reading to finalize CCMR',
        description:
          'Student has TSI Math complete. One TSI Reading attempt that meets the threshold will satisfy the full TSI CCMR pathway.',
        status: 'recommended',
        priority: 2,
        due_date: daysOut(45),
        completed_date: null,
        assigned_to: null,
        projected_ccmr_impact: 1,
        notes: null,
        metadata: {},
      })
      fired = true
    }

    // ── Rule 3: TSI — no attempt at all ────────────────────────────────────
    const hasTSIActivity = inds.some(i => TSI_TYPES.has(i.indicator_type))
    const hasDualCredit  = met.has('dual_credit_ela') || met.has('dual_credit_math') || met.has('dual_credit_any')
    if (!hasTSIActivity && !hasDualCredit && !met.has('ap_exam') && !met.has('ib_exam')) {
      results.push({
        student_id: student.id,
        campus_id: student.campus_id,
        pathway_type: 'tsi',
        title: 'Schedule TSIA assessment',
        description:
          'No TSI attempt on record. Passing at least one TSIA section is a strong near-term CCMR pathway for this student.',
        status: 'recommended',
        priority: 2,
        due_date: daysOut(21),
        completed_date: null,
        assigned_to: null,
        projected_ccmr_impact: 1,
        notes: null,
        metadata: {},
      })
      fired = true
    }

    // ── Rule 4: College prep course in progress ────────────────────────────
    if (active.has('college_prep_ela') || active.has('college_prep_math')) {
      const isELA       = active.has('college_prep_ela')
      const subject     = isELA ? 'ELA' : 'Math'
      const pathwayType = isELA ? 'college_prep_ela' : 'college_prep_math'
      results.push({
        student_id: student.id,
        campus_id: student.campus_id,
        pathway_type: pathwayType,
        title: `Support College Prep ${subject} completion`,
        description: `Student is enrolled in College Prep ${subject}. Passing this course counts as a CCMR indicator — monitor for grade concerns.`,
        status: 'recommended',
        priority: 2,
        due_date: daysOut(60),
        completed_date: null,
        assigned_to: null,
        projected_ccmr_impact: 1,
        notes: null,
        metadata: {},
      })
      fired = true
    }

    // ── Rule 5: Dual credit in progress but not met ────────────────────────
    const dcInProgress =
      active.has('dual_credit_ela') || active.has('dual_credit_math') || active.has('dual_credit_any')
    if (dcInProgress && !hasDualCredit) {
      results.push({
        student_id: student.id,
        campus_id: student.campus_id,
        pathway_type: 'dual_credit',
        title: 'Confirm dual credit enrollment & completion',
        description:
          'Student has a dual credit course in progress. Verify enrollment is active and support course completion for CCMR credit.',
        status: 'recommended',
        priority: 2,
        due_date: daysOut(60),
        completed_date: null,
        assigned_to: null,
        projected_ccmr_impact: 1,
        notes: null,
        metadata: {},
      })
      fired = true
    }

    // ── Rule 6: Fallback — at-risk with no identified pathway ──────────────
    if (!fired && student.ccmr_readiness === 'at_risk') {
      results.push({
        student_id: student.id,
        campus_id: student.campus_id,
        pathway_type: null,
        title: 'Schedule counselor review session',
        description:
          'Student is at risk with no active CCMR pathway identified. A counselor meeting is needed to explore available options.',
        status: 'recommended',
        priority: 3,
        due_date: daysOut(14),
        completed_date: null,
        assigned_to: null,
        projected_ccmr_impact: 1,
        notes: null,
        metadata: {},
      })
    }
  }

  return results
}
