// ============================================================
// Summit Intel — CCMR Seed Script
// Run: npx tsx scripts/seed.ts
// Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
// Uses the service role key to bypass RLS during seeding.
// ============================================================

import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import type { Database, IndicatorType, IndicatorStatus, CCMRReadiness, EnrollmentStatus } from '../types/database'
import { computeCCMRReadiness } from '../lib/ccmr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

// ============================================================
// HELPERS
// ============================================================

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function chance(pct: number): boolean {
  return Math.random() < pct
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDate(start: string, end: string): string {
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  return new Date(s + Math.random() * (e - s)).toISOString().split('T')[0]
}

// Realistic South Texas names
const FIRST_NAMES = [
  'Maria', 'Luis', 'Sofia', 'Carlos', 'Diana', 'Miguel', 'Ana', 'Pedro',
  'Isabella', 'Diego', 'Valentina', 'Alejandro', 'Camila', 'Mateo', 'Lucia',
  'Daniel', 'Gabriela', 'Sebastian', 'Andrea', 'Santiago', 'Fernanda', 'Nicolas',
  'Paula', 'David', 'Daniela', 'Emilio', 'Victoria', 'Angel', 'Mariana', 'Jose',
  'Elena', 'Ricardo', 'Rosa', 'Fernando', 'Carmen', 'Roberto', 'Teresa', 'Eduardo',
  'Adriana', 'Oscar', 'Patricia', 'Manuel', 'Gloria', 'Rafael', 'Brenda', 'Arturo',
  'Jessica', 'Marco', 'Yolanda', 'Cesar', 'Lisa', 'James', 'Emily', 'Ethan',
  'Ashley', 'Brandon', 'Kaitlyn', 'Tyler', 'Samantha', 'Ryan', 'Morgan',
]

const LAST_NAMES = [
  'Garcia', 'Hernandez', 'Rodriguez', 'Martinez', 'Lopez', 'Gonzalez', 'Perez',
  'Ramirez', 'Sanchez', 'Torres', 'Rivera', 'Flores', 'Diaz', 'Morales', 'Reyes',
  'Cruz', 'Ortiz', 'Gutierrez', 'Chavez', 'Ramos', 'Vargas', 'Castillo', 'Mendoza',
  'Santos', 'Alvarez', 'Ruiz', 'Romero', 'Herrera', 'Medina', 'Aguilar', 'Vega',
  'Castro', 'Delgado', 'Vasquez', 'Salazar', 'Guerrero', 'Contreras', 'Fuentes',
  'Jimenez', 'Soto', 'Tran', 'Chen', 'Nguyen', 'Patel', 'Smith', 'Johnson',
  'Williams', 'Brown', 'Jones', 'Miller',
]

const CTE_PATHWAYS = [
  { pathway: 'Welding', cert: 'AWS D1.1', examWindow: '2026-04-15' },
  { pathway: 'Health Science', cert: 'CNA', examWindow: '2026-05-01' },
  { pathway: 'Cybersecurity', cert: 'CompTIA Security+', examWindow: '2026-04-20' },
  { pathway: 'Automotive', cert: 'ASE Student Certification', examWindow: '2026-05-10' },
  { pathway: 'Cosmetology', cert: 'TX Cosmetology License', examWindow: '2026-04-25' },
  { pathway: 'HVAC', cert: 'EPA 608', examWindow: '2026-05-05' },
  { pathway: 'Pharmacy Tech', cert: 'PTCB CPhT', examWindow: '2026-04-28' },
  { pathway: 'IT Networking', cert: 'CompTIA A+', examWindow: '2026-05-15' },
  { pathway: 'Criminal Justice', cert: 'TCOLE Concepts', examWindow: '2026-05-20' },
  { pathway: 'Culinary Arts', cert: 'ServSafe Manager', examWindow: '2026-04-18' },
]

// ============================================================
// FIXED IDS (so we can reference them reliably)
// ============================================================

const STATE_IDS = {
  texas:       'a1000001-0000-0000-0000-000000000001',
  connecticut: 'a2000002-0000-0000-0000-000000000001',
}

const DISTRICT_ID = 'a0000001-0000-0000-0000-000000000001'

const CAMPUS_IDS = {
  economedes: 'c0000001-0000-0000-0000-000000000001',
  edinburgNorth: 'c0000001-0000-0000-0000-000000000002',
  vela: 'c0000001-0000-0000-0000-000000000003',
  edinburg: 'c0000001-0000-0000-0000-000000000004',
}

const CAMPUSES = [
  { id: CAMPUS_IDS.economedes, name: 'Economedes High School', tea_campus_id: '108902001' },
  { id: CAMPUS_IDS.edinburgNorth, name: 'Edinburg North High School', tea_campus_id: '108902002' },
  { id: CAMPUS_IDS.vela, name: 'Vela High School', tea_campus_id: '108902003' },
  { id: CAMPUS_IDS.edinburg, name: 'Edinburg High School', tea_campus_id: '108902004' },
]

const SCHOOL_YEAR_ID = 'a0000002-0000-0000-0000-000000000001'

// Program of study UUIDs — must match migration 20260416000002
const PROGRAM_IDS = {
  // Health Science
  medAsst:         'a1000001-0000-0000-0000-000000000001',
  nursingScience:  'a1000001-0000-0000-0000-000000000002',
  emt:             'a1000001-0000-0000-0000-000000000003',
  pharmacyTech:    'a1000001-0000-0000-0000-000000000004',
  dentalAssisting: 'a1000001-0000-0000-0000-000000000005',
  // Information Technology
  cybersecurity:   'a1000002-0000-0000-0000-000000000001',
  networkAdmin:    'a1000002-0000-0000-0000-000000000002',
  webDigital:      'a1000002-0000-0000-0000-000000000003',
  computerScience: 'a1000002-0000-0000-0000-000000000004',
  // Manufacturing
  welding:         'a1000003-0000-0000-0000-000000000001',
  precisionMfg:    'a1000003-0000-0000-0000-000000000002',
  industrialMaint: 'a1000003-0000-0000-0000-000000000003',
  // Business Management
  businessMgmt:    'a1000004-0000-0000-0000-000000000001',
  financialSvc:    'a1000004-0000-0000-0000-000000000002',
  entrepreneurship:'a1000004-0000-0000-0000-000000000003',
  // Law, Public Safety
  lawEnforcement:  'a1000005-0000-0000-0000-000000000001',
  criminalJustice: 'a1000005-0000-0000-0000-000000000002',
  fireEms:         'a1000005-0000-0000-0000-000000000003',
  // Architecture & Construction
  hvac:            'a1000006-0000-0000-0000-000000000001',
  // Transportation
  automotive:      'a1000007-0000-0000-0000-000000000001',
  // Hospitality
  culinaryArts:    'a1000008-0000-0000-0000-000000000001',
  // Human Services
  cosmetology:     'a1000009-0000-0000-0000-000000000001',
}

// Cluster IDs are looked up at runtime — we store codes here for mapping
const CLUSTER_CODES = {
  HLTH: 'HLTH', INFO: 'INFO', MANU: 'MANU', BUSI: 'BUSI',
  LAWS: 'LAWS', ARCH: 'ARCH', TRAN: 'TRAN', HOSP: 'HOSP', HUMS: 'HUMS',
}

// ============================================================
// STUDENT GENERATION
// ============================================================

// Target counts per campus per grade (totals ~4,847 across district)
const STUDENTS_PER_CAMPUS_GRADE: Record<string, Record<number, number>> = {
  [CAMPUS_IDS.economedes]:   { 9: 85, 10: 82, 11: 78, 12: 312 },  // ~557 total, 312 seniors match v0
  [CAMPUS_IDS.edinburgNorth]: { 9: 90, 10: 88, 11: 85, 12: 342 },  // ~605 total, 342 seniors
  [CAMPUS_IDS.vela]:          { 9: 78, 10: 75, 11: 72, 12: 261 },  // ~486 total, 261 seniors
  [CAMPUS_IDS.edinburg]:      { 9: 82, 10: 80, 11: 76, 12: 288 },  // ~526 total, 288 seniors
}

// CCMR met rates by campus (targets from v0 prototype)
const SENIOR_CCMR_MET_RATES: Record<string, number> = {
  [CAMPUS_IDS.economedes]: 0.75,
  [CAMPUS_IDS.edinburgNorth]: 0.72,
  [CAMPUS_IDS.vela]: 0.69,
  [CAMPUS_IDS.edinburg]: 0.64,
}

type StudentSeed = {
  id: string
  district_id: string
  campus_id: string
  tsds_id: string
  first_name: string
  last_name: string
  grade_level: number
  graduation_year: number
  is_eb: boolean
  is_econ_disadvantaged: boolean
  is_special_ed: boolean
  is_504: boolean
  ed_form_collected: boolean
  ed_form_date: string | null
  ccmr_readiness: CCMRReadiness
  ccmr_met_date: string | null
  indicators_met_count: number
  metadata: Record<string, unknown>
  is_active: boolean
}

type IndicatorSeed = {
  student_id: string
  indicator_type: IndicatorType
  status: IndicatorStatus
  met_date: string | null
  score: number | null
  threshold: number | null
  course_grade: string | null
  exam_date: string | null
  source_year: string
  notes: string | null
}

function gradeToGradYear(grade: number): number {
  // For 2025-26 school year: grade 12 = Class of 2026
  return 2026 + (12 - grade)
}

function generateStudents(): { students: StudentSeed[]; indicators: IndicatorSeed[] } {
  const students: StudentSeed[] = []
  const indicators: IndicatorSeed[] = []
  let tsdsCounter = 200000

  for (const campus of CAMPUSES) {
    const gradeCounts = STUDENTS_PER_CAMPUS_GRADE[campus.id]
    const metRate = SENIOR_CCMR_MET_RATES[campus.id]

    for (const [gradeStr, count] of Object.entries(gradeCounts)) {
      const grade = parseInt(gradeStr)

      for (let i = 0; i < count; i++) {
        tsdsCounter++
        const studentId = crypto.randomUUID()
        const firstName = pick(FIRST_NAMES)
        const lastName = pick(LAST_NAMES)

        // Subgroup flags — realistic rates for South Texas
        const isEb = chance(0.40)         // ~40% EB in Edinburg CISD
        const isEcon = chance(0.82)       // ~82% econ disadvantaged
        const isSped = chance(0.10)       // ~10% special ed
        const is504 = !isSped && chance(0.03)

        // ED form collection — about 68% collected (matches v0 prototype gap)
        const edCollected = isEcon ? chance(0.68) : false

        // CTE metadata for some students
        const cte = chance(0.35) ? pick(CTE_PATHWAYS) : null
        const metadata: Record<string, unknown> = {}
        if (cte) {
          metadata.cte_pathway = cte.pathway
          metadata.cte_certification = cte.cert
          if (grade === 12) metadata.cte_exam_date = cte.examWindow
        }
        if (chance(0.6)) metadata.gpa = parseFloat((Math.random() * 2.5 + 1.5).toFixed(2))

        // Generate indicators based on grade and target rates
        const studentIndicators = generateIndicators(
          studentId, grade, metRate, isEb, isSped, cte
        )
        indicators.push(...studentIndicators)

        // Compute readiness from indicators
        const indicatorInputs = studentIndicators.map(ind => ({
          indicator_type: ind.indicator_type,
          status: ind.status,
        }))
        const readiness = computeCCMRReadiness(indicatorInputs, grade)
        const metCount = studentIndicators.filter(ind => ind.status === 'met').length
        const metDate = readiness === 'met'
          ? studentIndicators.find(ind => ind.status === 'met')?.met_date ?? null
          : null

        students.push({
          id: studentId,
          district_id: DISTRICT_ID,
          campus_id: campus.id,
          tsds_id: tsdsCounter.toString(),
          first_name: firstName,
          last_name: lastName,
          grade_level: grade,
          graduation_year: gradeToGradYear(grade),
          // cohort_year became NOT NULL in 20260428000004; for the seed
          // we mirror graduation_year since the demo cohort is the
          // student's expected graduation cohort.
          entry_grade_9_year: gradeToGradYear(grade) - 4,
          cohort_year: gradeToGradYear(grade),
          cohort_status: 'active' as const,
          is_eb: isEb,
          is_econ_disadvantaged: isEcon,
          is_special_ed: isSped,
          is_504: is504,
          ed_form_collected: edCollected,
          ed_form_date: edCollected ? randomDate('2025-09-01', '2025-11-15') : null,
          ccmr_readiness: readiness,
          ccmr_met_date: metDate,
          indicators_met_count: metCount,
          metadata,
          is_active: true,
        })
      }
    }
  }

  return { students, indicators }
}

function generateIndicators(
  studentId: string,
  grade: number,
  campusMetRate: number,
  isEb: boolean,
  isSped: boolean,
  cte: { pathway: string; cert: string; examWindow: string } | null
): IndicatorSeed[] {
  const indicators: IndicatorSeed[] = []

  // Adjust met probability based on grade and EB status
  // Seniors: use campus met rate. EB students have ~15% lower rate.
  // Underclassmen: scale down (they've had less time).
  let metProb = campusMetRate
  if (isEb) metProb *= 0.82  // EB students ~18% lower
  if (grade === 11) metProb *= 0.65
  if (grade === 10) metProb *= 0.35
  if (grade === 9) metProb *= 0.10

  const shouldMeet = chance(metProb)

  if (shouldMeet) {
    // Pick a pathway to have met
    const pathway = pickMeetPathway(cte !== null)

    for (const ind of pathway) {
      indicators.push({
        student_id: studentId,
        indicator_type: ind,
        status: 'met',
        met_date: randomDate('2024-01-15', '2026-03-15'),
        score: getScore(ind, true),
        threshold: getThreshold(ind),
        course_grade: null,
        exam_date: null,
        source_year: '2025-26',
        notes: null,
      })
    }

    // Some students meet multiple pathways
    if (chance(0.25)) {
      const bonus = pickBonusIndicator(pathway)
      if (bonus) {
        indicators.push({
          student_id: studentId,
          indicator_type: bonus,
          status: 'met',
          met_date: randomDate('2024-06-01', '2026-02-01'),
          score: getScore(bonus, true),
          threshold: getThreshold(bonus),
          course_grade: null,
          exam_date: null,
          source_year: '2025-26',
          notes: null,
        })
      }
    }
  } else if (grade === 12) {
    // At-risk or almost seniors — may have partial progress
    if (chance(0.35)) {
      // "Almost" — has one half of a paired pathway
      const half = pick<IndicatorType>(['tsi_reading', 'sat_math', 'college_prep_ela'])
      indicators.push({
        student_id: studentId,
        indicator_type: half,
        status: 'met',
        met_date: randomDate('2025-01-15', '2025-12-15'),
        score: getScore(half, true),
        threshold: getThreshold(half),
        course_grade: null,
        exam_date: null,
        source_year: '2025-26',
        notes: null,
      })
    } else if (chance(0.40)) {
      // In-progress on something
      if (cte) {
        indicators.push({
          student_id: studentId,
          indicator_type: 'ibc',
          status: 'in_progress',
          met_date: null,
          score: null,
          threshold: null,
          course_grade: null,
          exam_date: cte.examWindow,
          source_year: '2025-26',
          notes: `Enrolled in ${cte.pathway} — ${cte.cert} exam scheduled`,
        })
      } else {
        // Mix of score-bearing (SAT/ACT/TSI) and course-based pathways.
        // Score-bearing rows drive the Interventions leverage pill —
        // realistic sub-threshold scores via getScore(type, false).
        // Score-bearing rows use status='not_met' (they took the test,
        // didn't pass) so the student stays at_risk; using 'in_progress'
        // would promote them to on_track via lib/ccmr.ts and skip the
        // seed's intervention generator, leaving no intervention to
        // attach the leverage pill to.
        const inProgressType = pick<IndicatorType>([
          ...SCORE_BASED_INPROGRESS_TYPES,
          ...COURSE_BASED_TYPES,
        ])
        const scoreBased = isScoreBased(inProgressType)
        indicators.push({
          student_id: studentId,
          indicator_type: inProgressType,
          status: scoreBased ? 'not_met' : 'in_progress',
          met_date: null,
          score: scoreBased ? getScore(inProgressType, false) : null,
          threshold: scoreBased ? getThreshold(inProgressType) : null,
          course_grade: scoreBased ? null : pick(['A', 'B', 'B', 'C', 'C', 'D']),
          exam_date: null,
          source_year: '2025-26',
          notes: null,
        })
      }
    }
    // else: truly at-risk, no indicators at all
  } else if (grade === 11) {
    // Juniors — some in-progress work. Same score-vs-course split as
    // the senior branch, plus IBC for CTE-enrolled juniors.
    if (chance(0.55)) {
      const type = pick<IndicatorType>([
        ...SCORE_BASED_INPROGRESS_TYPES,
        ...COURSE_BASED_TYPES,
        'ibc',
      ])
      const isMet = chance(0.3)
      const scoreBased = isScoreBased(type)
      indicators.push({
        student_id: studentId,
        indicator_type: type,
        status: isMet ? 'met' : 'in_progress',
        met_date: isMet ? randomDate('2025-08-01', '2026-03-01') : null,
        score: scoreBased ? getScore(type, isMet) : null,
        threshold: scoreBased ? getThreshold(type) : null,
        course_grade: scoreBased || type === 'ibc' ? null : pick(['A', 'B', 'B+', 'C']),
        exam_date: type === 'ibc' && cte ? cte.examWindow : null,
        source_year: '2025-26',
        notes: null,
      })
    }
  } else if (grade === 10 || grade === 9) {
    // Underclassmen — mostly too early, maybe CTE enrolled
    if (cte && chance(0.20)) {
      indicators.push({
        student_id: studentId,
        indicator_type: 'ibc',
        status: 'in_progress',
        met_date: null,
        score: null,
        threshold: null,
        course_grade: null,
        exam_date: null,
        source_year: '2025-26',
        notes: `CTE: ${cte.pathway}`,
      })
    }
  }

  return indicators
}

function pickMeetPathway(hasCte: boolean): IndicatorType[] {
  // Weighted selection matching v0 prototype indicator breakdown
  const roll = Math.random()
  if (roll < 0.26 || (hasCte && roll < 0.40)) return ['ibc']                           // 26% IBC
  if (roll < 0.48) return ['dual_credit_ela', 'dual_credit_math', 'dual_credit_any']   // 22% dual credit
  if (roll < 0.64) return [                                                             // 16% TSI
    pick<IndicatorType>(['tsi_reading', 'sat_reading']),
    pick<IndicatorType>(['tsi_math', 'sat_math']),
  ]
  if (roll < 0.77) return ['college_prep_ela', 'college_prep_math']                     // 13% college prep
  if (roll < 0.88) return ['ap_exam']                                                   // 11% AP
  if (roll < 0.93) return [                                                             // 5% SAT/ACT
    pick<IndicatorType>(['sat_reading', 'act_reading']),
    pick<IndicatorType>(['sat_math', 'act_math']),
  ]
  if (roll < 0.96) return ['military_enlistment']                                       // 3% military
  if (roll < 0.98) return ['onramps']                                                   // 2% OnRamps
  return ['associate_degree']                                                            // 2% associate
}

function pickBonusIndicator(existing: IndicatorType[]): IndicatorType | null {
  const options: IndicatorType[] = [
    'ibc', 'ap_exam', 'dual_credit_ela', 'onramps', 'tsi_reading',
  ]
  const available = options.filter(o => !existing.includes(o))
  return available.length > 0 ? pick(available) : null
}

// Per-indicator score ranges. Thresholds match lib/ccmr-rules.ts and
// lib/interventions/leverage.ts so that getScore(type, false) values
// land in the realistic "5-40 below threshold" leverage range.
const SCORE_INFO: Partial<Record<IndicatorType, { met: [number, number]; threshold: number; minBelow: number }>> = {
  tsi_reading: { met: [945, 990], threshold: 945, minBelow: 40 },
  tsi_math:    { met: [950, 990], threshold: 950, minBelow: 40 },
  sat_reading: { met: [480, 700], threshold: 480, minBelow: 40 },
  sat_math:    { met: [530, 750], threshold: 530, minBelow: 40 },
  // ACT is 1-36 — gap below threshold is small.
  act_reading: { met: [19, 32],   threshold: 19,  minBelow: 7 },
  act_math:    { met: [19, 32],   threshold: 19,  minBelow: 7 },
  ap_exam:     { met: [3, 5],     threshold: 3,   minBelow: 2 },
  ib_exam:     { met: [4, 7],     threshold: 4,   minBelow: 3 },
}

function getScore(type: IndicatorType, met: boolean): number | null {
  const info = SCORE_INFO[type]
  if (!info) return null
  return met
    ? randomInt(info.met[0], info.met[1])
    : randomInt(info.threshold - info.minBelow, info.threshold - 1)
}

function getThreshold(type: IndicatorType): number | null {
  return SCORE_INFO[type]?.threshold ?? null
}

// Indicator types whose progress is course-based (course_grade column),
// not score-based. Used by the at-risk-senior / junior in-progress
// branches below to pick the right column shape.
const COURSE_BASED_TYPES: IndicatorType[] = [
  'college_prep_ela', 'college_prep_math',
  'dual_credit_ela', 'dual_credit_math',
]
const SCORE_BASED_INPROGRESS_TYPES: IndicatorType[] = [
  'tsi_reading', 'tsi_math',
  'sat_reading', 'sat_math',
  'act_reading', 'act_math',
]
function isScoreBased(type: IndicatorType): boolean {
  return SCORE_BASED_INPROGRESS_TYPES.includes(type)
}

// ============================================================
// INTERVENTION GENERATION
// ============================================================

type InterventionSeed = {
  student_id: string
  campus_id: string
  pathway_type: IndicatorType
  title: string
  description: string
  status: string
  priority: number
  due_date: string | null
  assigned_to: string
  projected_ccmr_impact: number | null
  notes: string | null
  metadata: Record<string, unknown>
}

function generateInterventions(
  students: StudentSeed[],
  indicators: IndicatorSeed[]
): InterventionSeed[] {
  const interventions: InterventionSeed[] = []
  const counselors = ['Mrs. Rivera', 'Mr. Garza', 'Mrs. Chen', 'Mr. Salazar', 'Mrs. Tran']

  // Create interventions for at-risk and almost seniors
  const targetStudents = students.filter(
    s => s.grade_level === 12 && (s.ccmr_readiness === 'at_risk' || s.ccmr_readiness === 'almost')
  )

  for (const student of targetStudents) {
    const studentInds = indicators.filter(i => i.student_id === student.id)
    const ctePathway = student.metadata.cte_pathway as string | undefined

    // IBC intervention for CTE students
    if (ctePathway && !studentInds.some(i => i.indicator_type === 'ibc' && i.status === 'met')) {
      interventions.push({
        student_id: student.id,
        campus_id: student.campus_id,
        pathway_type: 'ibc',
        title: `Register for ${student.metadata.cte_certification} exam`,
        description: `Student is enrolled in ${ctePathway}. Confirm exam registration before testing window closes.`,
        status: chance(0.3) ? 'planned' : 'recommended',
        priority: 1,
        due_date: (student.metadata.cte_exam_date as string) ?? '2026-05-01',
        assigned_to: pick(counselors),
        projected_ccmr_impact: null, // computed at campus level
        notes: null,
        metadata: {},
      })
    }

    // TSI intervention for students who haven't attempted it
    if (!studentInds.some(i =>
      ['tsi_reading', 'tsi_math', 'sat_reading', 'sat_math', 'act_reading', 'act_math'].includes(i.indicator_type)
      && i.status === 'met'
    )) {
      if (chance(0.5)) {
        interventions.push({
          student_id: student.id,
          campus_id: student.campus_id,
          // 'tsi' (umbrella) so the Interventions leverage helper can pick
          // the closest of either subject when computing distance-to-threshold.
          pathway_type: 'tsi',
          title: 'Schedule TSIA testing session',
          description: 'Student has never attempted the TSIA. Schedule before spring testing window closes.',
          status: 'recommended',
          priority: 2,
          due_date: '2026-04-30',
          assigned_to: pick(counselors),
          projected_ccmr_impact: null,
          notes: null,
          metadata: {},
        })
      }
    }

    // College prep intervention for "almost" students
    if (student.ccmr_readiness === 'almost') {
      const hasEla = studentInds.some(i => i.indicator_type === 'college_prep_ela' && i.status === 'met')
      const hasMath = studentInds.some(i => i.indicator_type === 'college_prep_math' && i.status === 'met')
      if (hasEla && !hasMath) {
        interventions.push({
          student_id: student.id,
          campus_id: student.campus_id,
          pathway_type: 'college_prep_math',
          title: 'Monitor college prep math completion',
          description: 'Student has college prep ELA but not math. Verify course completion by end of semester.',
          status: 'in_progress',
          priority: 1,
          due_date: '2026-05-23',
          assigned_to: pick(counselors),
          projected_ccmr_impact: null,
          notes: null,
          metadata: {},
        })
      }
    }
  }

  return interventions
}

// ============================================================
// HISTORICAL SNAPSHOTS (YoY trend table)
// ============================================================

function generateSnapshots() {
  // Matches the v0 prototype trend data
  return [
    {
      district_id: DISTRICT_ID,
      campus_id: null,
      graduation_year: 2023,
      total_graduates: 1156, ccmr_met_count: 786, ccmr_rate: 68.0, state_avg_rate: 76.0,
      eb_total: 462, eb_met_count: 236, eb_rate: 51.0,
      econ_disadv_total: 948, econ_disadv_met: 559, econ_disadv_rate: 59.0,
      sped_total: 116, sped_met_count: 35, sped_rate: 30.2,
      indicator_breakdown: { ibc: 245, dual_credit: 198, tsi: 156, college_prep: 112, ap_exam: 89, sat_act: 76, military: 42, onramps: 28, associate_degree: 15, level_i_ii: 8 },
    },
    {
      district_id: DISTRICT_ID,
      campus_id: null,
      graduation_year: 2024,
      total_graduates: 1178, ccmr_met_count: 826, ccmr_rate: 70.0, state_avg_rate: 76.0,
      eb_total: 471, eb_met_count: 259, eb_rate: 55.0,
      econ_disadv_total: 966, econ_disadv_met: 599, econ_disadv_rate: 62.0,
      sped_total: 118, sped_met_count: 39, sped_rate: 33.1,
      indicator_breakdown: { ibc: 268, dual_credit: 215, tsi: 167, college_prep: 125, ap_exam: 102, sat_act: 84, military: 48, onramps: 32, associate_degree: 18, level_i_ii: 12 },
    },
    {
      district_id: DISTRICT_ID,
      campus_id: null,
      graduation_year: 2025,
      total_graduates: 1190, ccmr_met_count: 857, ccmr_rate: 72.0, state_avg_rate: 76.0,
      eb_total: 476, eb_met_count: 276, eb_rate: 58.0,
      econ_disadv_total: 976, econ_disadv_met: 634, econ_disadv_rate: 65.0,
      sped_total: 119, sped_met_count: 43, sped_rate: 36.1,
      indicator_breakdown: { ibc: 289, dual_credit: 234, tsi: 178, college_prep: 138, ap_exam: 118, sat_act: 95, military: 51, onramps: 36, associate_degree: 22, level_i_ii: 16 },
    },
  ]
}

// ============================================================
// CTE PATHWAY GENERATION
// ============================================================

type StudentPathwaySeed = {
  student_id: string
  state_id: string
  cluster_id: string
  program_id: string
  credential_id: string | null
  enrollment_status: EnrollmentStatus
  start_grade: number
  enrollment_date: string | null
  expected_completion_date: string | null
  actual_completion_date: string | null
  credential_earned: boolean
  notes: string | null
  metadata: Record<string, unknown>
}

// Map CTE_PATHWAYS pathway names → program IDs + cluster codes
const CTE_PATHWAY_TO_PROGRAM: Record<string, { programId: string; clusterCode: string }> = {
  'Health Science':   { programId: PROGRAM_IDS.medAsst,       clusterCode: 'HLTH' },
  'Cybersecurity':    { programId: PROGRAM_IDS.cybersecurity,  clusterCode: 'INFO' },
  'IT Networking':    { programId: PROGRAM_IDS.networkAdmin,   clusterCode: 'INFO' },
  'Welding':          { programId: PROGRAM_IDS.welding,        clusterCode: 'MANU' },
  'Automotive':       { programId: PROGRAM_IDS.automotive,     clusterCode: 'TRAN' },
  'HVAC':             { programId: PROGRAM_IDS.hvac,           clusterCode: 'ARCH' },
  'Pharmacy Tech':    { programId: PROGRAM_IDS.pharmacyTech,   clusterCode: 'HLTH' },
  'Culinary Arts':    { programId: PROGRAM_IDS.culinaryArts,   clusterCode: 'HOSP' },
  'Cosmetology':      { programId: PROGRAM_IDS.cosmetology,    clusterCode: 'HUMS' },
  'Criminal Justice': { programId: PROGRAM_IDS.criminalJustice, clusterCode: 'LAWS' },
}

// Additional programs assigned to non-CTE students (weighted toward top 5 clusters)
const ADDITIONAL_PROGRAMS: Array<{ programId: string; clusterCode: string; weight: number }> = [
  { programId: PROGRAM_IDS.medAsst,       clusterCode: 'HLTH', weight: 0.30 },
  { programId: PROGRAM_IDS.cybersecurity, clusterCode: 'INFO', weight: 0.25 },
  { programId: PROGRAM_IDS.welding,       clusterCode: 'MANU', weight: 0.20 },
  { programId: PROGRAM_IDS.businessMgmt,  clusterCode: 'BUSI', weight: 0.15 },
  { programId: PROGRAM_IDS.lawEnforcement, clusterCode: 'LAWS', weight: 0.10 },
]

function pickWeighted(programs: typeof ADDITIONAL_PROGRAMS) {
  const r = Math.random()
  let cumulative = 0
  for (const p of programs) {
    cumulative += p.weight
    if (r < cumulative) return p
  }
  return programs[programs.length - 1]
}

function generateStudentPathways(
  students: StudentSeed[],
  indicators: IndicatorSeed[],
  clusterIdByCode: Record<string, string>,
): StudentPathwaySeed[] {
  const pathways: StudentPathwaySeed[] = []

  for (const student of students) {
    const cteName = student.metadata.cte_pathway as string | undefined

    // ---- Students with an existing CTE pathway in metadata ----
    if (cteName && CTE_PATHWAY_TO_PROGRAM[cteName]) {
      const { programId, clusterCode } = CTE_PATHWAY_TO_PROGRAM[cteName]
      const clusterId = clusterIdByCode[clusterCode]
      if (!clusterId) continue

      const hasIbcMet = indicators.some(
        i => i.student_id === student.id && i.indicator_type === 'ibc' && i.status === 'met'
      )
      const isCompleted = hasIbcMet || (student.grade_level === 12 && student.ccmr_readiness === 'met' && chance(0.4))
      const startGrade = Math.max(9, student.grade_level - 1)

      pathways.push({
        student_id: student.id,
        state_id: STATE_IDS.texas,
        cluster_id: clusterId,
        program_id: programId,
        credential_id: null,   // would need catalog lookup; left null — seed focuses on program enrollment
        enrollment_status: (isCompleted ? 'completed' : 'enrolled') as EnrollmentStatus,
        start_grade: startGrade,
        enrollment_date: randomDate('2024-08-18', '2025-09-15'),
        expected_completion_date: '2026-06-05',
        actual_completion_date: isCompleted ? randomDate('2025-10-01', '2026-03-31') : null,
        credential_earned: hasIbcMet,
        notes: null,
        metadata: {},
      })
      continue
    }

    // ---- ~20% of remaining students get a pathway assignment ----
    if (chance(0.20)) {
      const { programId, clusterCode } = pickWeighted(ADDITIONAL_PROGRAMS)
      const clusterId = clusterIdByCode[clusterCode]
      if (!clusterId) continue

      const startGrade = student.grade_level >= 11 ? student.grade_level - 1 : student.grade_level
      const isCompleted = student.grade_level === 12 && chance(0.25)

      pathways.push({
        student_id: student.id,
        state_id: STATE_IDS.texas,
        cluster_id: clusterId,
        program_id: programId,
        credential_id: null,
        enrollment_status: (isCompleted ? 'completed' : 'enrolled') as EnrollmentStatus,
        start_grade: startGrade,
        enrollment_date: randomDate('2024-08-18', '2025-10-01'),
        expected_completion_date: '2026-06-05',
        actual_completion_date: isCompleted ? randomDate('2025-11-01', '2026-04-01') : null,
        credential_earned: false,
        notes: null,
        metadata: {},
      })
    }
  }

  return pathways
}

// ============================================================
// MAIN SEED FUNCTION
// ============================================================

async function seed() {
  console.log('🌱 Starting CCMR seed...\n')

  // ---- Clean existing data (in reverse dependency order) ----
  console.log('🗑️  Clearing existing data...')
  // CTE tables (student_pathways refs students; pathway_credentials refs programs + credentials)
  await supabase.from('student_pathways').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('pathway_credentials').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('labor_market_data').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('programs_of_study').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('interventions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('ccmr_indicators').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('ccmr_annual_snapshots').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('data_uploads').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('school_years').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('campuses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('districts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  // State config tables (delete child rows before parent)
  await supabase.from('state_reporting_formats').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('state_partnerships').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('state_accountability_config').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('state_credential_catalog').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('state_career_clusters').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('states').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // ---- States ----
  console.log('🗺️  Creating states (Texas, Connecticut)...')
  const { error: stateErr } = await supabase.from('states').insert([
    {
      id: STATE_IDS.texas,
      name: 'Texas',
      code: 'TX',
      accountability_system: 'tea_af',
      career_cluster_framework: 'tea_16',
      settings: {
        ccmr_enabled: true,
        af_simulator_enabled: true,
        ibc_catalog_enabled: true,
        tsia_enabled: true,
        ed_form_tracking: true,
      },
      is_active: true,
    },
    {
      id: STATE_IDS.connecticut,
      name: 'Connecticut',
      code: 'CT',
      accountability_system: 'placeholder',
      career_cluster_framework: 'advance_cte_16',
      settings: {
        ccmr_enabled: false,
        af_simulator_enabled: false,
        ibc_catalog_enabled: false,
        tsia_enabled: false,
        ed_form_tracking: false,
        note: 'Placeholder — accountability rules and credential catalog not yet configured.',
      },
      is_active: true,
    },
  ])
  if (stateErr) throw new Error(`States insert failed: ${stateErr.message}`)

  // ---- Career Clusters (shared 16 for both states) ----
  console.log('📚 Creating career clusters...')
  const CLUSTERS = [
    { code: 'AGRI', name: 'Agriculture, Food & Natural Resources',       description: 'Careers in agriculture, food production, natural resources, and environmental science.',  sort_order: 1 },
    { code: 'ARCH', name: 'Architecture & Construction',                  description: 'Design, construction, and maintenance of buildings and infrastructure.',                   sort_order: 2 },
    { code: 'ARTS', name: 'Arts, A/V Technology & Communications',        description: 'Creative arts, audio/visual production, journalism, and telecommunications.',               sort_order: 3 },
    { code: 'BUSI', name: 'Business Management & Administration',         description: 'Business operations, management, entrepreneurship, and administrative services.',           sort_order: 4 },
    { code: 'EDUC', name: 'Education & Training',                         description: 'Teaching, training, and education administration across all levels.',                        sort_order: 5 },
    { code: 'FINA', name: 'Finance',                                      description: 'Banking, investments, insurance, and financial planning.',                                   sort_order: 6 },
    { code: 'GOVT', name: 'Government & Public Administration',           description: 'Planning, managing, and providing government and public-sector services.',                   sort_order: 7 },
    { code: 'HLTH', name: 'Health Science',                               description: 'Patient care, public health, health informatics, and biomedical research.',                 sort_order: 8 },
    { code: 'HOSP', name: 'Hospitality & Tourism',                        description: 'Travel, lodging, recreation, food service, and event management.',                          sort_order: 9 },
    { code: 'HUMS', name: 'Human Services',                               description: 'Family and community services, counseling, and personal care.',                             sort_order: 10 },
    { code: 'INFO', name: 'Information Technology',                       description: 'Networking, software development, cybersecurity, and data management.',                     sort_order: 11 },
    { code: 'LAWS', name: 'Law, Public Safety, Corrections & Security',   description: 'Legal services, law enforcement, fire protection, and emergency response.',                sort_order: 12 },
    { code: 'MANU', name: 'Manufacturing',                                description: 'Production, quality control, logistics, and maintenance of manufactured goods.',            sort_order: 13 },
    { code: 'MKTG', name: 'Marketing',                                    description: 'Marketing research, merchandising, distribution, and promotion.',                           sort_order: 14 },
    { code: 'STEM', name: 'Science, Technology, Engineering & Mathematics', description: 'Engineering, mathematics, scientific research, and technology development.',              sort_order: 15 },
    { code: 'TRAN', name: 'Transportation, Distribution & Logistics',     description: 'Moving people and goods via air, ground, rail, and water; supply chain management.',       sort_order: 16 },
  ]
  const clusterInsertRows = [
    ...CLUSTERS.map(c => ({ ...c, state_id: STATE_IDS.texas, is_active: true })),
    ...CLUSTERS.map(c => ({ ...c, state_id: STATE_IDS.connecticut, is_active: true })),
  ]
  const { error: clusterErr } = await supabase.from('state_career_clusters').insert(clusterInsertRows)
  if (clusterErr) throw new Error(`Career clusters insert failed: ${clusterErr.message}`)

  // ---- Texas: Credential Catalog ----
  console.log('📋 Creating Texas IBC credential catalog...')
  const TX_CREDENTIALS = [
    { cluster_code: 'HLTH', name: 'Certified Nursing Assistant (CNA)',              issuing_body: 'Texas DADS',                                credential_type: 'certification' as const, is_ccmr_eligible: true,  passing_score: '70%',              exam_window_notes: 'Spring: Apr–May; Fall: Oct–Nov' },
    { cluster_code: 'HLTH', name: 'Pharmacy Technician (CPhT)',                      issuing_body: 'PTCB',                                      credential_type: 'certification' as const, is_ccmr_eligible: true,  passing_score: '1400/1600',         exam_window_notes: 'Year-round at Pearson VUE' },
    { cluster_code: 'HLTH', name: 'Emergency Medical Technician — Basic (EMT-B)',   issuing_body: 'Texas DSHS',                                credential_type: 'license' as const,       is_ccmr_eligible: true,  passing_score: 'Pass cognitive + psychomotor', exam_window_notes: 'Regional windows vary' },
    { cluster_code: 'INFO', name: 'CompTIA Security+',                               issuing_body: 'CompTIA',                                   credential_type: 'certification' as const, is_ccmr_eligible: true,  passing_score: '750/900',           exam_window_notes: 'Year-round at Pearson VUE' },
    { cluster_code: 'INFO', name: 'CompTIA A+',                                      issuing_body: 'CompTIA',                                   credential_type: 'certification' as const, is_ccmr_eligible: true,  passing_score: '675/900 + 700/900', exam_window_notes: 'Year-round at Pearson VUE' },
    { cluster_code: 'INFO', name: 'CompTIA Network+',                                issuing_body: 'CompTIA',                                   credential_type: 'certification' as const, is_ccmr_eligible: true,  passing_score: '720/900',           exam_window_notes: 'Year-round at Pearson VUE' },
    { cluster_code: 'INFO', name: 'Cisco CCNA',                                      issuing_body: 'Cisco',                                     credential_type: 'certification' as const, is_ccmr_eligible: true,  passing_score: '825/1000',          exam_window_notes: 'Year-round at Pearson VUE' },
    { cluster_code: 'MANU', name: 'AWS Certified Welder — D1.1 Structural',          issuing_body: 'American Welding Society',                   credential_type: 'certification' as const, is_ccmr_eligible: true,  passing_score: 'Pass visual + mechanical', exam_window_notes: 'Spring: Mar–Apr; Fall: Sep–Oct' },
    { cluster_code: 'MANU', name: 'NIMS Machining Level 1',                          issuing_body: 'NIMS',                                      credential_type: 'certification' as const, is_ccmr_eligible: true,  passing_score: '70% + performance demo', exam_window_notes: 'Year-round; school-based proctoring' },
    { cluster_code: 'TRAN', name: 'ASE Student Certification — Brakes (B5)',         issuing_body: 'ASE',                                       credential_type: 'certification' as const, is_ccmr_eligible: true,  passing_score: 'Pass written exam',  exam_window_notes: 'Year-round online proctored' },
    { cluster_code: 'TRAN', name: 'EPA Section 608 Technician Certification',        issuing_body: 'U.S. EPA',                                  credential_type: 'license' as const,       is_ccmr_eligible: true,  passing_score: '70%',               exam_window_notes: 'Year-round at ESCO Institute locations' },
    { cluster_code: 'ARCH', name: 'NCCER Core Curriculum — Construction',            issuing_body: 'NCCER',                                     credential_type: 'certification' as const, is_ccmr_eligible: true,  passing_score: 'Performance + written', exam_window_notes: 'Year-round through accredited programs' },
    { cluster_code: 'FINA', name: 'AFC Student Certification',                        issuing_body: 'AFCPE',                                     credential_type: 'certification' as const, is_ccmr_eligible: true,  passing_score: 'Pass proctored exam', exam_window_notes: 'Semester-based windows' },
    { cluster_code: 'HOSP', name: 'ServSafe Manager Certification',                  issuing_body: 'National Restaurant Association EF',        credential_type: 'certification' as const, is_ccmr_eligible: true,  passing_score: '75%',               exam_window_notes: 'Year-round at approved centers' },
    { cluster_code: 'HUMS', name: 'Texas Cosmetology Operator License',              issuing_body: 'Texas TDLR',                                credential_type: 'license' as const,       is_ccmr_eligible: true,  passing_score: 'Pass written + practical state board', exam_window_notes: 'Monthly at TDLR locations' },
    { cluster_code: 'LAWS', name: 'TCOLE Concepts of Law Enforcement',               issuing_body: 'Texas Commission on Law Enforcement',       credential_type: 'certification' as const, is_ccmr_eligible: true,  passing_score: 'Pass written exam',  exam_window_notes: 'Spring and fall school-based' },
  ]
  const { error: credErr } = await supabase.from('state_credential_catalog').insert(
    TX_CREDENTIALS.map(c => ({ ...c, state_id: STATE_IDS.texas, metadata: {}, is_active: true }))
  )
  if (credErr) throw new Error(`Credential catalog insert failed: ${credErr.message}`)

  // ---- Texas: Accountability Config ----
  console.log('📐 Creating Texas A-F accountability config...')
  const { error: accErr } = await supabase.from('state_accountability_config').insert({
    state_id: STATE_IDS.texas,
    label: '2025 TEA A-F Accountability — HS/K-12',
    system_type: 'tea_af',
    effective_year: 2025,
    is_current: true,
    config: {
      grade_bands: { A: [90,100], B: [80,89], C: [70,79], D: [60,69], F: [0,59] },
      components: [
        {
          name: 'Student Achievement', weight: 1.0,
          sub_components: [
            { name: 'STAAR All Subjects', weight: 0.40, cut_points: { A:60, B:53, C:41, D:35 } },
            { name: 'CCMR',              weight: 0.40, cut_points: { A:88, B:78, C:64, D:51 } },
            { name: 'Graduation Rate',   weight: 0.20, cut_points: { A:94, B:90, C:80, D:70 } },
          ],
        },
        {
          name: 'School Progress', weight: 1.0,
          sub_components: [
            { name: 'Academic Growth (Part A)',     weight: null, note: 'Best of Part A or Part B used' },
            { name: 'Relative Performance (Part B)', weight: null, note: 'ED-adjusted CCMR; Table 5.5 lookup' },
          ],
          cap_rule: 'If either Part A or Part B < 60, domain capped at 89',
        },
      ],
      overall: {
        formula: 'max(StudentAchievement, SchoolProgress) * 0.70 + ClosingGaps * 0.30',
        safety_rules: {
          three_fs: { description: '3 of 4 areas < 60 → cap overall at 59', areas: ['student_achievement','part_a','part_b','closing_gaps'], threshold: 60, cap: 59, trigger_count: 3 },
          three_ds: { description: '3 of 4 areas < 70 AND SA < 70 → cap overall at 69', areas: ['student_achievement','part_a','part_b','closing_gaps'], threshold: 70, cap: 69, trigger_count: 3, additional_condition: 'student_achievement < 70' },
        },
      },
      source: 'TEA 2025 Accountability Technical Guide, Chapter 5',
    },
    notes: 'Matches lib/tea-accountability.ts cut points and scaling logic.',
  })
  if (accErr) throw new Error(`Accountability config insert failed: ${accErr.message}`)

  // ---- Texas: Partnerships ----
  console.log('🤝 Creating Texas partnerships...')
  const { error: partnerErr } = await supabase.from('state_partnerships').insert([
    { state_id: STATE_IDS.texas, name: 'Education Service Center Region 1',  partner_type: 'esc',          region_code: 'ESC-1',  website: 'https://www.esc1.net',       contact_info: { phone: '956-984-6000', address: '1900 W Schunior St, Edinburg, TX 78541' }, notes: 'Serves South Texas; primary ESC for Edinburg CISD.', is_active: true },
    { state_id: STATE_IDS.texas, name: 'Education Service Center Region 13', partner_type: 'esc',          region_code: 'ESC-13', website: 'https://www.esc13.net',      contact_info: { phone: '512-919-5313' },                                                    notes: 'Publishes the Region 13 CCMR Tracker upload format.', is_active: true },
    { state_id: STATE_IDS.texas, name: 'Texas Education Agency',             partner_type: 'state_agency', region_code: null,     website: 'https://tea.texas.gov',      contact_info: { phone: '512-463-9734' },                                                    notes: 'Administers A-F accountability and CCMR reporting.', is_active: true },
    { state_id: STATE_IDS.texas, name: 'Texas Workforce Commission',         partner_type: 'workforce_board', region_code: null,  website: 'https://www.twc.texas.gov',  contact_info: { phone: '512-463-2222' },                                                    notes: 'Administers apprenticeship programs and credential alignment.', is_active: true },
  ])
  if (partnerErr) throw new Error(`Partnerships insert failed: ${partnerErr.message}`)

  // ---- Texas: Reporting Formats ----
  console.log('📄 Creating Texas reporting formats...')
  const { error: fmtErr } = await supabase.from('state_reporting_formats').insert([
    {
      state_id: STATE_IDS.texas, format_code: 'region_13_tracker',
      name: 'Region 13 CCMR Tracker', file_types: ['xlsx'],
      description: 'ESC Region 13 Excel tracker; auto-detects class-year tabs and indicator columns.',
      column_spec: {
        detection_hints: ['CCMR', 'Region 13', 'Class of'],
        tab_pattern: 'Class of \\d{4}',
        required_columns: ['Student ID', 'Last Name', 'First Name'],
        indicator_columns: { 'TSI Reading': 'tsi_reading', 'TSI Math': 'tsi_math', 'SAT Reading': 'sat_reading', 'SAT Math': 'sat_math', 'ACT Reading': 'act_reading', 'ACT Math': 'act_math', 'College Prep ELA': 'college_prep_ela', 'College Prep Math': 'college_prep_math', 'AP Exam': 'ap_exam', 'IB Exam': 'ib_exam', 'Dual Credit ELA': 'dual_credit_ela', 'Dual Credit Math': 'dual_credit_math', 'OnRamps': 'onramps', 'IBC': 'ibc' },
      },
      is_active: true,
    },
    {
      state_id: STATE_IDS.texas, format_code: 'tea_ccmr_tracker',
      name: 'TEA CCMR Tracker', file_types: ['xlsx', 'csv'],
      description: 'Official TEA Part I or Part II tracker file distributed to districts.',
      column_spec: {
        detection_hints: ['TEA', 'Part I', 'Part II', 'PEIMS'],
        required_columns: ['TSDS ID', 'Student Name', 'Campus'],
        indicator_columns: { 'TSI-R': 'tsi_reading', 'TSI-M': 'tsi_math', 'SAT-R': 'sat_reading', 'SAT-M': 'sat_math', 'ACT-R': 'act_reading', 'ACT-M': 'act_math', 'IBC': 'ibc', 'DC': 'dual_credit_any', 'CP-ELA': 'college_prep_ela', 'CP-Math': 'college_prep_math' },
      },
      is_active: true,
    },
  ])
  if (fmtErr) throw new Error(`Reporting formats insert failed: ${fmtErr.message}`)

  // ---- Fetch cluster IDs (needed for programs_of_study + student_pathways) ----
  const { data: txClusters, error: clusterFetchErr } = await supabase
    .from('state_career_clusters')
    .select('id, code')
    .eq('state_id', STATE_IDS.texas)
  if (clusterFetchErr) throw new Error(`Cluster fetch failed: ${clusterFetchErr.message}`)
  const clusterIdByCode: Record<string, string> = {}
  for (const c of txClusters ?? []) clusterIdByCode[c.code] = c.id

  // ---- Texas: Programs of Study ----
  console.log('🎓 Creating Texas programs of study...')
  const TX_PROGRAMS = [
    // Health Science (HLTH)
    { id: PROGRAM_IDS.medAsst,         cluster_code: 'HLTH', code: 'MED-ASST',    name: 'Medical Assistant Technology',     description: 'Prepares students for entry-level clinical and administrative roles in physician offices and clinics.', cip_code: '51.0801', typical_duration_years: 2.0 },
    { id: PROGRAM_IDS.nursingScience,  cluster_code: 'HLTH', code: 'NURS-SCI',    name: 'Nursing Science',                  description: 'Foundation coursework for registered nursing; includes anatomy, physiology, and clinical rotations.', cip_code: '51.3801', typical_duration_years: 2.0 },
    { id: PROGRAM_IDS.emt,             cluster_code: 'HLTH', code: 'EMT-BASIC',   name: 'Emergency Medical Technician',     description: 'Prepares students for EMT-B certification; includes trauma care, patient assessment, and transport.', cip_code: '51.0904', typical_duration_years: 1.5 },
    { id: PROGRAM_IDS.pharmacyTech,    cluster_code: 'HLTH', code: 'PHARM-TECH',  name: 'Pharmacy Technology',              description: 'Trains students in prescription processing, drug interactions, and pharmacy law for retail and hospital settings.', cip_code: '51.0805', typical_duration_years: 2.0 },
    { id: PROGRAM_IDS.dentalAssisting, cluster_code: 'HLTH', code: 'DENT-ASST',   name: 'Dental Assisting',                 description: 'Covers chairside assisting, radiography, infection control, and dental materials.', cip_code: '51.0601', typical_duration_years: 2.0 },
    // Information Technology (INFO)
    { id: PROGRAM_IDS.cybersecurity,   cluster_code: 'INFO', code: 'CYBER',       name: 'Cybersecurity',                    description: 'Network defense, ethical hacking, cryptography, and incident response; targets CompTIA Security+.', cip_code: '11.1003', typical_duration_years: 2.0 },
    { id: PROGRAM_IDS.networkAdmin,    cluster_code: 'INFO', code: 'NET-ADMIN',   name: 'Network Administration',           description: 'Routing, switching, wireless networking, and cloud fundamentals; targets CompTIA A+ and Network+.', cip_code: '11.0901', typical_duration_years: 2.0 },
    { id: PROGRAM_IDS.webDigital,      cluster_code: 'INFO', code: 'WEB-DIG',     name: 'Web & Digital Communications',     description: 'HTML/CSS, JavaScript fundamentals, UI/UX design principles, and digital marketing.', cip_code: '11.0801', typical_duration_years: 2.0 },
    { id: PROGRAM_IDS.computerScience, cluster_code: 'INFO', code: 'CS-FOUND',    name: 'Computer Science Foundations',     description: 'Programming logic, Python, data structures, and computational thinking for STEM pathways.', cip_code: '11.0701', typical_duration_years: 2.0 },
    // Manufacturing (MANU)
    { id: PROGRAM_IDS.welding,         cluster_code: 'MANU', code: 'WELD-TECH',   name: 'Welding Technology',               description: 'SMAW, MIG, TIG, and plasma cutting; prepares for AWS D1.1 structural welding certification.', cip_code: '48.0508', typical_duration_years: 2.0 },
    { id: PROGRAM_IDS.precisionMfg,    cluster_code: 'MANU', code: 'PREC-MFG',    name: 'Precision Manufacturing',          description: 'CNC machining, blueprint reading, quality control, and metrology; targets NIMS Machining Level 1.', cip_code: '48.0501', typical_duration_years: 2.0 },
    { id: PROGRAM_IDS.industrialMaint, cluster_code: 'MANU', code: 'IND-MAINT',   name: 'Industrial Maintenance Technology', description: 'Electrical systems, pneumatics, hydraulics, and predictive maintenance for manufacturing environments.', cip_code: '47.0303', typical_duration_years: 2.0 },
    // Business Management (BUSI)
    { id: PROGRAM_IDS.businessMgmt,    cluster_code: 'BUSI', code: 'BUS-MGMT',    name: 'Business Management & Administration', description: 'Operations, human resources, project management, and business communication for entry-level management.', cip_code: '52.0201', typical_duration_years: 2.0 },
    { id: PROGRAM_IDS.financialSvc,    cluster_code: 'BUSI', code: 'FIN-SVC',     name: 'Financial Services',               description: 'Personal finance, banking operations, investment basics, and insurance; targets AFC certification.', cip_code: '52.0801', typical_duration_years: 2.0 },
    { id: PROGRAM_IDS.entrepreneurship,cluster_code: 'BUSI', code: 'ENTRE',       name: 'Entrepreneurship',                 description: 'Business plan development, marketing, financial literacy, and small business operations.', cip_code: '52.0701', typical_duration_years: 2.0 },
    // Law, Public Safety (LAWS)
    { id: PROGRAM_IDS.lawEnforcement,  cluster_code: 'LAWS', code: 'LAW-ENF',     name: 'Law Enforcement',                  description: 'Criminal law, patrol procedures, use-of-force continuum, and community policing; targets TCOLE concepts.', cip_code: '43.0107', typical_duration_years: 2.0 },
    { id: PROGRAM_IDS.criminalJustice, cluster_code: 'LAWS', code: 'CRIM-JUST',   name: 'Criminal Justice',                 description: 'Court systems, corrections, juvenile justice, and criminology for legal and public safety careers.', cip_code: '43.0104', typical_duration_years: 2.0 },
    { id: PROGRAM_IDS.fireEms,         cluster_code: 'LAWS', code: 'FIRE-EMS',    name: 'Fire & Emergency Medical Services', description: 'Firefighter fundamentals, hazmat awareness, and EMS operations; dual-certified pathway.', cip_code: '43.0202', typical_duration_years: 2.0 },
    // Architecture & Construction (ARCH)
    { id: PROGRAM_IDS.hvac,            cluster_code: 'ARCH', code: 'HVAC-TECH',   name: 'HVAC Technology',                  description: 'Refrigeration principles, system installation, EPA 608 certification, and residential/commercial service.', cip_code: '47.0201', typical_duration_years: 2.0 },
    // Transportation (TRAN)
    { id: PROGRAM_IDS.automotive,      cluster_code: 'TRAN', code: 'AUTO-TECH',   name: 'Automotive Technology',            description: 'Engine systems, brakes, suspension, electrical diagnostics; targets ASE Student Certification.', cip_code: '47.0604', typical_duration_years: 2.0 },
    // Hospitality (HOSP)
    { id: PROGRAM_IDS.culinaryArts,    cluster_code: 'HOSP', code: 'CULI-ARTS',   name: 'Culinary Arts',                    description: 'Knife skills, cooking methods, menu development, kitchen safety, and ServSafe certification.', cip_code: '12.0500', typical_duration_years: 2.0 },
    // Human Services (HUMS)
    { id: PROGRAM_IDS.cosmetology,     cluster_code: 'HUMS', code: 'COSM',        name: 'Cosmetology',                      description: 'Hair, skin, and nail theory and practice; 1,500 hours required for Texas state board licensure.', cip_code: '12.0401', typical_duration_years: 2.0 },
  ]

  const programRows = TX_PROGRAMS.map(p => ({
    id: p.id,
    state_id: STATE_IDS.texas,
    cluster_id: clusterIdByCode[p.cluster_code],
    code: p.code,
    name: p.name,
    description: p.description,
    cip_code: p.cip_code,
    typical_duration_years: p.typical_duration_years,
    is_active: true,
  }))
  const { error: progErr } = await supabase.from('programs_of_study').insert(programRows)
  if (progErr) throw new Error(`Programs of study insert failed: ${progErr.message}`)
  console.log(`  ✅ ${TX_PROGRAMS.length} programs of study created`)

  // ---- Texas: Pathway Credentials (link programs → credential catalog) ----
  console.log('🔗 Linking pathway credentials...')
  // Fetch credential IDs by name so we can build the join rows
  const { data: credRows, error: credFetchErr } = await supabase
    .from('state_credential_catalog')
    .select('id, name')
    .eq('state_id', STATE_IDS.texas)
  if (credFetchErr) throw new Error(`Credential fetch failed: ${credFetchErr.message}`)
  const credIdByName: Record<string, string> = {}
  for (const c of credRows ?? []) credIdByName[c.name] = c.id

  const PATHWAY_CREDENTIAL_LINKS: Array<{ programId: string; credentialName: string; isCapstone: boolean; typicalGrade: number }> = [
    { programId: PROGRAM_IDS.medAsst,         credentialName: 'Certified Nursing Assistant (CNA)',              isCapstone: true,  typicalGrade: 12 },
    { programId: PROGRAM_IDS.emt,             credentialName: 'Emergency Medical Technician — Basic (EMT-B)',   isCapstone: true,  typicalGrade: 12 },
    { programId: PROGRAM_IDS.pharmacyTech,    credentialName: 'Pharmacy Technician (CPhT)',                     isCapstone: true,  typicalGrade: 12 },
    { programId: PROGRAM_IDS.cybersecurity,   credentialName: 'CompTIA Security+',                              isCapstone: true,  typicalGrade: 12 },
    { programId: PROGRAM_IDS.networkAdmin,    credentialName: 'CompTIA A+',                                     isCapstone: false, typicalGrade: 11 },
    { programId: PROGRAM_IDS.networkAdmin,    credentialName: 'CompTIA Network+',                               isCapstone: true,  typicalGrade: 12 },
    { programId: PROGRAM_IDS.welding,         credentialName: 'AWS Certified Welder — D1.1 Structural',         isCapstone: true,  typicalGrade: 12 },
    { programId: PROGRAM_IDS.precisionMfg,    credentialName: 'NIMS Machining Level 1',                         isCapstone: true,  typicalGrade: 12 },
    { programId: PROGRAM_IDS.hvac,            credentialName: 'EPA Section 608 Technician Certification',       isCapstone: true,  typicalGrade: 12 },
    { programId: PROGRAM_IDS.automotive,      credentialName: 'ASE Student Certification — Brakes (B5)',        isCapstone: true,  typicalGrade: 12 },
    { programId: PROGRAM_IDS.financialSvc,    credentialName: 'AFC Student Certification',                      isCapstone: true,  typicalGrade: 12 },
    { programId: PROGRAM_IDS.culinaryArts,    credentialName: 'ServSafe Manager Certification',                 isCapstone: true,  typicalGrade: 12 },
    { programId: PROGRAM_IDS.cosmetology,     credentialName: 'Texas Cosmetology Operator License',             isCapstone: true,  typicalGrade: 12 },
    { programId: PROGRAM_IDS.lawEnforcement,  credentialName: 'TCOLE Concepts of Law Enforcement',              isCapstone: true,  typicalGrade: 12 },
  ]

  const pathwayCredRows = PATHWAY_CREDENTIAL_LINKS
    .filter(l => credIdByName[l.credentialName])
    .map((l, i) => ({
      program_id: l.programId,
      credential_id: credIdByName[l.credentialName],
      is_capstone: l.isCapstone,
      sequence_order: i + 1,
      typical_grade: l.typicalGrade,
    }))
  const { error: pcErr } = await supabase.from('pathway_credentials').insert(pathwayCredRows)
  if (pcErr) throw new Error(`Pathway credentials insert failed: ${pcErr.message}`)
  console.log(`  ✅ ${pathwayCredRows.length} pathway credentials linked`)

  // ---- Texas: Labor Market Data ----
  console.log('📈 Creating labor market data...')
  // Cluster ID lookups use clusterIdByCode built above
  const LMD_ROWS = [
    // Statewide
    { clusterCode: 'HLTH', region: 'statewide', totalJobs: 892000, openings: 45000, medSalary: 48200, entry: 30100, experienced: 72500, growth: 18.2, source: 'TWC LMCI / BLS OES 2024', topOcc: [{ title: 'Registered Nurse', soc_code: '29-1141', median_salary: 76000, annual_openings: 8200 }, { title: 'Medical Assistant', soc_code: '31-9092', median_salary: 38500, annual_openings: 6100 }, { title: 'LVN', soc_code: '29-1063', median_salary: 52000, annual_openings: 4800 }] },
    { clusterCode: 'INFO', region: 'statewide', totalJobs: 312000, openings: 22000, medSalary: 82000, entry: 54000, experienced: 118000, growth: 15.4, source: 'TWC LMCI / BLS OES 2024', topOcc: [{ title: 'Software Developer', soc_code: '15-1252', median_salary: 112000, annual_openings: 5800 }, { title: 'Information Security Analyst', soc_code: '15-1212', median_salary: 96000, annual_openings: 3100 }, { title: 'Network Administrator', soc_code: '15-1244', median_salary: 72000, annual_openings: 2400 }] },
    { clusterCode: 'MANU', region: 'statewide', totalJobs: 512000, openings: 28000, medSalary: 48500, entry: 32000, experienced: 68000, growth: 6.8, source: 'TWC LMCI / BLS OES 2024', topOcc: [{ title: 'Welder', soc_code: '51-4121', median_salary: 48000, annual_openings: 4200 }, { title: 'Machinist', soc_code: '51-4041', median_salary: 52000, annual_openings: 2100 }, { title: 'Industrial Maintenance Mechanic', soc_code: '49-9041', median_salary: 56000, annual_openings: 3400 }] },
    { clusterCode: 'BUSI', region: 'statewide', totalJobs: 445000, openings: 32000, medSalary: 52000, entry: 34000, experienced: 82000, growth: 7.2, source: 'TWC LMCI / BLS OES 2024', topOcc: [{ title: 'General Manager', soc_code: '11-1021', median_salary: 98000, annual_openings: 5200 }, { title: 'Accountant', soc_code: '13-2011', median_salary: 72000, annual_openings: 4800 }, { title: 'Financial Analyst', soc_code: '13-2051', median_salary: 84000, annual_openings: 3200 }] },
    { clusterCode: 'LAWS', region: 'statewide', totalJobs: 198000, openings: 12000, medSalary: 52000, entry: 38000, experienced: 76000, growth: 5.2, source: 'TWC LMCI / BLS OES 2024', topOcc: [{ title: 'Police Officer', soc_code: '33-3051', median_salary: 62000, annual_openings: 3800 }, { title: 'Firefighter', soc_code: '33-2011', median_salary: 56000, annual_openings: 2100 }, { title: 'Correctional Officer', soc_code: '33-1011', median_salary: 44000, annual_openings: 3200 }] },
    { clusterCode: 'TRAN', region: 'statewide', totalJobs: 285000, openings: 18000, medSalary: 46000, entry: 30000, experienced: 64000, growth: 4.6, source: 'TWC LMCI / BLS OES 2024', topOcc: [{ title: 'Automotive Service Technician', soc_code: '49-3023', median_salary: 48000, annual_openings: 4200 }, { title: 'Diesel Mechanic', soc_code: '49-3031', median_salary: 56000, annual_openings: 3100 }, { title: 'Aircraft Mechanic', soc_code: '49-3011', median_salary: 72000, annual_openings: 1800 }] },
    { clusterCode: 'ARCH', region: 'statewide', totalJobs: 224000, openings: 14000, medSalary: 52000, entry: 34000, experienced: 74000, growth: 9.4, source: 'TWC LMCI / BLS OES 2024', topOcc: [{ title: 'HVAC Technician', soc_code: '49-9021', median_salary: 52000, annual_openings: 3600 }, { title: 'Electrician', soc_code: '47-2111', median_salary: 58000, annual_openings: 3200 }, { title: 'Plumber', soc_code: '47-2152', median_salary: 56000, annual_openings: 2800 }] },
    // ESC Region 1 (South Texas)
    { clusterCode: 'HLTH', region: 'ESC-1', totalJobs: 42000, openings: 2800, medSalary: 42000, entry: 27000, experienced: 62000, growth: 21.5, source: 'TWC LMCI Region 1 2024', topOcc: [{ title: 'Registered Nurse', soc_code: '29-1141', median_salary: 68000, annual_openings: 620 }, { title: 'Medical Assistant', soc_code: '31-9092', median_salary: 34000, annual_openings: 480 }] },
    { clusterCode: 'INFO', region: 'ESC-1', totalJobs: 8200, openings: 580, medSalary: 62000, entry: 42000, experienced: 88000, growth: 14.2, source: 'TWC LMCI Region 1 2024', topOcc: [{ title: 'Network Administrator', soc_code: '15-1244', median_salary: 64000, annual_openings: 120 }, { title: 'Information Security Analyst', soc_code: '15-1212', median_salary: 82000, annual_openings: 88 }] },
    { clusterCode: 'MANU', region: 'ESC-1', totalJobs: 18500, openings: 1200, medSalary: 44000, entry: 28000, experienced: 60000, growth: 8.1, source: 'TWC LMCI Region 1 2024', topOcc: [{ title: 'Welder', soc_code: '51-4121', median_salary: 44000, annual_openings: 280 }, { title: 'Machinist', soc_code: '51-4041', median_salary: 48000, annual_openings: 140 }] },
  ]

  const lmdRows = LMD_ROWS.map(r => ({
    state_id: STATE_IDS.texas,
    cluster_id: clusterIdByCode[r.clusterCode],
    region_code: r.region,
    data_year: 2024,
    total_jobs: r.totalJobs,
    annual_job_openings: r.openings,
    median_annual_salary: r.medSalary,
    salary_entry_level: r.entry,
    salary_experienced: r.experienced,
    growth_rate_pct: r.growth,
    top_occupations: r.topOcc,
    data_source: r.source,
  }))
  const { error: lmdErr } = await supabase.from('labor_market_data').insert(lmdRows)
  if (lmdErr) throw new Error(`Labor market data insert failed: ${lmdErr.message}`)
  console.log(`  ✅ ${lmdRows.length} labor market data rows created`)

  // ---- District ----
  console.log('🏫 Creating Edinburg CISD...')
  const { error: distErr } = await supabase.from('districts').insert({
    id: DISTRICT_ID,
    state_id: STATE_IDS.texas,
    name: 'Edinburg CISD',
    tea_district_id: '108902',
    esc_region: 1,
    state_avg_ccmr_rate: 72.0,
    settings: {},
  })
  if (distErr) throw new Error(`District insert failed: ${distErr.message}`)

  // ---- Campuses ----
  console.log('🏫 Creating 4 high schools...')
  const { error: campErr } = await supabase.from('campuses').insert(
    CAMPUSES.map(c => ({
      id: c.id,
      district_id: DISTRICT_ID,
      name: c.name,
      tea_campus_id: c.tea_campus_id,
      metadata: {},
    }))
  )
  if (campErr) throw new Error(`Campus insert failed: ${campErr.message}`)

  // ---- School Year ----
  console.log('📅 Creating 2025-26 school year...')
  const { error: yearErr } = await supabase.from('school_years').insert({
    id: SCHOOL_YEAR_ID,
    district_id: DISTRICT_ID,
    label: '2025-26',
    start_date: '2025-08-18',
    end_date: '2026-06-05',
    is_current: true,
    graduation_date: '2026-06-05',
  })
  if (yearErr) throw new Error(`School year insert failed: ${yearErr.message}`)

  // ---- Students + Indicators ----
  console.log('👨‍🎓 Generating students and indicators...')
  const { students, indicators } = generateStudents()

  // Insert students in batches (Supabase has payload limits)
  const BATCH = 200
  for (let i = 0; i < students.length; i += BATCH) {
    const batch = students.slice(i, i + BATCH)
    const { error: stuErr } = await supabase.from('students').insert(batch)
    if (stuErr) throw new Error(`Student insert failed at batch ${i}: ${stuErr.message}`)
    process.stdout.write(`  📝 Students: ${Math.min(i + BATCH, students.length)}/${students.length}\r`)
  }
  console.log(`\n  ✅ ${students.length} students created`)

  // Insert indicators in batches
  for (let i = 0; i < indicators.length; i += BATCH) {
    const batch = indicators.slice(i, i + BATCH)
    const { error: indErr } = await supabase.from('ccmr_indicators').insert(batch)
    if (indErr) throw new Error(`Indicator insert failed at batch ${i}: ${indErr.message}`)
    process.stdout.write(`  📝 Indicators: ${Math.min(i + BATCH, indicators.length)}/${indicators.length}\r`)
  }
  console.log(`\n  ✅ ${indicators.length} indicators created`)

  // ---- Interventions ----
  console.log('🎯 Generating interventions...')
  const interventions = generateInterventions(students, indicators)
  if (interventions.length > 0) {
    for (let i = 0; i < interventions.length; i += BATCH) {
      const batch = interventions.slice(i, i + BATCH)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: intErr } = await supabase.from('interventions').insert(batch as any)
      if (intErr) throw new Error(`Intervention insert failed: ${intErr.message}`)
    }
  }
  console.log(`  ✅ ${interventions.length} interventions created`)

  // ---- Student Pathways ----
  console.log('🛤️  Generating student pathways...')
  const studentPathways = generateStudentPathways(students, indicators, clusterIdByCode)
  if (studentPathways.length > 0) {
    for (let i = 0; i < studentPathways.length; i += BATCH) {
      const batch = studentPathways.slice(i, i + BATCH)
      const { error: spErr } = await supabase.from('student_pathways').insert(batch)
      if (spErr) throw new Error(`Student pathways insert failed at batch ${i}: ${spErr.message}`)
      process.stdout.write(`  📝 Pathways: ${Math.min(i + BATCH, studentPathways.length)}/${studentPathways.length}\r`)
    }
  }
  console.log(`\n  ✅ ${studentPathways.length} student pathways created`)

  // ---- Work-Based Learning ----
  console.log('🏢 Generating work-based learning records...')
  // Add WBL records for ~every 12th student (roughly 8% of the cohort)
  const wblStudents = students.filter((_, i) => i % 12 === 0).slice(0, 40)

  type WblActivityType = 'internship' | 'job_shadow' | 'apprenticeship' | 'clinical' | 'cooperative_education'
  const EMPLOYERS: { name: string; type: WblActivityType }[] = [
    { name: 'DHR Health', type: 'clinical' },
    { name: 'Edinburg ISD Technology Services', type: 'internship' },
    { name: 'H-E-B', type: 'cooperative_education' },
    { name: 'Valley Baptist Medical Center', type: 'clinical' },
    { name: 'SpaceX Starbase', type: 'internship' },
    { name: 'Rio Grande Valley Electric Cooperative', type: 'apprenticeship' },
    { name: 'City of Edinburg Public Works', type: 'job_shadow' },
    { name: 'University of Texas Rio Grande Valley', type: 'internship' },
    { name: 'McAllen Fire Department', type: 'job_shadow' },
    { name: 'Hidalgo County Constable Office', type: 'job_shadow' },
  ]

  const wblRecords = wblStudents.map((student, idx) => {
    const employer = EMPLOYERS[idx % EMPLOYERS.length]
    const isPaid = employer.type === 'internship' || employer.type === 'cooperative_education' || employer.type === 'apprenticeship'
    return {
      student_id: student.id,
      district_id: DISTRICT_ID,
      activity_type: employer.type,
      employer_name: employer.name,
      supervisor_name: null as string | null,
      start_date: '2025-09-08',
      end_date: employer.type === 'job_shadow' ? '2025-09-08' : null as string | null,
      hours_completed: employer.type === 'job_shadow' ? 8 : 80 + (idx % 7) * 20,
      is_paid: isPaid,
      notes: null as string | null,
      metadata: {} as Record<string, unknown>,
    }
  })

  if (wblRecords.length > 0) {
    const { error: wblErr } = await supabase.from('work_based_learning').insert(wblRecords)
    if (wblErr) throw new Error(`WBL insert failed: ${wblErr.message}`)
  }
  console.log(`  ✅ ${wblRecords.length} work-based learning records created`)

  // ---- Historical Snapshots ----
  console.log('📊 Creating historical snapshots...')
  const snapshots = generateSnapshots()
  const { error: snapErr } = await supabase.from('ccmr_annual_snapshots').insert(snapshots)
  if (snapErr) throw new Error(`Snapshot insert failed: ${snapErr.message}`)
  console.log(`  ✅ ${snapshots.length} annual snapshots created`)

  // ---- Summary ----
  const seniors = students.filter(s => s.grade_level === 12)
  const met = seniors.filter(s => s.ccmr_readiness === 'met')
  const atRisk = seniors.filter(s => s.ccmr_readiness === 'at_risk')
  const almost = seniors.filter(s => s.ccmr_readiness === 'almost')

  console.log('\n============================================')
  console.log('🎉 Seed complete!\n')
  console.log(`  States:       Texas (TX), Connecticut (CT)`)
  console.log(`  District:     Edinburg CISD (TX)`)
  console.log(`  Campuses:     ${CAMPUSES.length}`)
  console.log(`  Students:     ${students.length}`)
  console.log(`  Seniors:      ${seniors.length}`)
  console.log(`  CCMR met:     ${met.length} (${(100 * met.length / seniors.length).toFixed(1)}%)`)
  console.log(`  Almost:       ${almost.length}`)
  console.log(`  At risk:      ${atRisk.length}`)
  console.log(`  Indicators:   ${indicators.length}`)
  console.log(`  Interventions:${interventions.length}`)
  console.log(`  Pathways:     ${studentPathways.length}`)
  console.log(`  WBL records:  ${wblRecords.length}`)
  console.log(`  Snapshots:    ${snapshots.length} years`)
  console.log('============================================\n')
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})