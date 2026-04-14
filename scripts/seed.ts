// ============================================================
// Summit Intel — CCMR Seed Script
// Run: npx tsx scripts/seed.ts
// Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
// Uses the service role key to bypass RLS during seeding.
// ============================================================

import { config } from 'dotenv'
config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import type { Database, IndicatorType, IndicatorStatus, CCMRReadiness } from '../types/database'
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
        const inProgressType = pick<IndicatorType>(['college_prep_ela', 'college_prep_math', 'dual_credit_ela'])
        indicators.push({
          student_id: studentId,
          indicator_type: inProgressType,
          status: 'in_progress',
          met_date: null,
          score: null,
          threshold: null,
          course_grade: pick(['A', 'B', 'B', 'C', 'C', 'D']),
          exam_date: null,
          source_year: '2025-26',
          notes: null,
        })
      }
    }
    // else: truly at-risk, no indicators at all
  } else if (grade === 11) {
    // Juniors — some in-progress work
    if (chance(0.55)) {
      const type = pick<IndicatorType>(['dual_credit_ela', 'dual_credit_math', 'college_prep_ela', 'ibc'])
      indicators.push({
        student_id: studentId,
        indicator_type: type,
        status: chance(0.3) ? 'met' : 'in_progress',
        met_date: chance(0.3) ? randomDate('2025-08-01', '2026-03-01') : null,
        score: null,
        threshold: null,
        course_grade: type !== 'ibc' ? pick(['A', 'B', 'B+', 'C']) : null,
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

function getScore(type: IndicatorType, met: boolean): number | null {
  const scores: Partial<Record<IndicatorType, { met: [number, number]; threshold: number }>> = {
    tsi_reading: { met: [351, 390], threshold: 351 },
    tsi_math:    { met: [350, 390], threshold: 350 },
    sat_reading: { met: [480, 700], threshold: 480 },
    sat_math:    { met: [530, 750], threshold: 530 },
    act_reading: { met: [19, 35], threshold: 19 },
    act_math:    { met: [19, 34], threshold: 19 },
    ap_exam:     { met: [3, 5], threshold: 3 },
    ib_exam:     { met: [4, 7], threshold: 4 },
  }
  const info = scores[type]
  if (!info) return null
  return met
    ? randomInt(info.met[0], info.met[1])
    : randomInt(info.met[0] - 40, info.threshold - 1)
}

function getThreshold(type: IndicatorType): number | null {
  const thresholds: Partial<Record<IndicatorType, number>> = {
    tsi_reading: 351, tsi_math: 350,
    sat_reading: 480, sat_math: 530,
    act_reading: 19, act_math: 19,
    ap_exam: 3, ib_exam: 4,
  }
  return thresholds[type] ?? null
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
          pathway_type: 'tsi_reading',
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
// MAIN SEED FUNCTION
// ============================================================

async function seed() {
  console.log('🌱 Starting CCMR seed...\n')

  // ---- Clean existing data (in reverse dependency order) ----
  console.log('🗑️  Clearing existing data...')
  await supabase.from('interventions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('ccmr_indicators').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('ccmr_annual_snapshots').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('data_uploads').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('students').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('school_years').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('campuses').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('districts').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // ---- District ----
  console.log('🏫 Creating Edinburg CISD...')
  const { error: distErr } = await supabase.from('districts').insert({
    id: DISTRICT_ID,
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
      const { error: intErr } = await supabase.from('interventions').insert(batch)
      if (intErr) throw new Error(`Intervention insert failed: ${intErr.message}`)
    }
  }
  console.log(`  ✅ ${interventions.length} interventions created`)

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
  console.log(`  District:     Edinburg CISD`)
  console.log(`  Campuses:     ${CAMPUSES.length}`)
  console.log(`  Students:     ${students.length}`)
  console.log(`  Seniors:      ${seniors.length}`)
  console.log(`  CCMR met:     ${met.length} (${(100 * met.length / seniors.length).toFixed(1)}%)`)
  console.log(`  Almost:       ${almost.length}`)
  console.log(`  At risk:      ${atRisk.length}`)
  console.log(`  Indicators:   ${indicators.length}`)
  console.log(`  Interventions:${interventions.length}`)
  console.log(`  Snapshots:    ${snapshots.length} years`)
  console.log('============================================\n')
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})