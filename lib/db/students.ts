import type {
  CCMRReadiness,
  CcmrIndicatorResultStatus,
  IndicatorCategory,
  MethodologyKey,
  StudentRow,
  TypedSupabaseClient,
} from '@/types/database'

// ─────────────────────────────────────────────────────────────────
// Methodology-enriched student row
//
// Extends StudentRow with fields drawn from student_ccmr_status.
// Callers expecting plain StudentRow continue to compile because
// EnrichedStudentRow is a strict superset.
//
// `is_fallback_status` is true when the student had no row in
// student_ccmr_status and we synthesized methodology + highest_level
// from the legacy ccmr_readiness field. This will go away once the
// recompute service has run across all districts.
// ─────────────────────────────────────────────────────────────────

export interface EnrichedStudentRow extends StudentRow {
  methodology_key: MethodologyKey | null
  highest_level: CcmrIndicatorResultStatus | null
  highest_level_category: IndicatorCategory | null
  highest_level_source_indicator_id: string | null
  is_fallback_status: boolean
}

export interface GetStudentsFilters {
  campusId?: string
  gradeLevel?: number
  readiness?: CCMRReadiness
  isEb?: boolean
  isEconDisadvantaged?: boolean
  isSpecialEd?: boolean
  is504?: boolean
  search?: string
  page?: number
  pageSize?: number
}

export interface GetStudentsResult {
  data: EnrichedStudentRow[]
  count: number
}

export async function getStudents(
  client: TypedSupabaseClient,
  districtId: string,
  filters: GetStudentsFilters = {}
): Promise<GetStudentsResult> {
  const { page = 1, pageSize = 50, ...rest } = filters
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = client
    .from('students')
    .select('*', { count: 'exact' })
    .eq('district_id', districtId)
    .eq('is_active', true)
    .range(from, to)
    .order('last_name', { ascending: true })

  if (rest.campusId) query = query.eq('campus_id', rest.campusId)
  if (rest.gradeLevel) query = query.eq('grade_level', rest.gradeLevel)
  if (rest.readiness) query = query.eq('ccmr_readiness', rest.readiness)
  if (rest.isEb) query = query.eq('is_eb', true)
  if (rest.isEconDisadvantaged) query = query.eq('is_econ_disadvantaged', true)
  if (rest.isSpecialEd) query = query.eq('is_special_ed', true)
  if (rest.is504) query = query.eq('is_504', true)
  if (rest.search) {
    const term = `%${rest.search}%`
    query = query.or(`first_name.ilike.${term},last_name.ilike.${term},tsds_id.ilike.${term}`)
  }

  const { data, error, count } = await query

  if (error) throw error
  const enriched = await enrichStudents(client, (data ?? []) as StudentRow[])
  return { data: enriched, count: count ?? 0 }
}

export async function getStudentsByIds(
  client: TypedSupabaseClient,
  studentIds: string[]
): Promise<EnrichedStudentRow[]> {
  if (studentIds.length === 0) return []
  const { data, error } = await client
    .from('students')
    .select('*')
    .in('id', studentIds)
    .order('last_name', { ascending: true })
  if (error) throw error
  return enrichStudents(client, (data ?? []) as StudentRow[])
}

export async function getStudentById(
  client: TypedSupabaseClient,
  studentId: string
): Promise<EnrichedStudentRow | null> {
  const { data, error } = await client
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw error
  }
  const [enriched] = await enrichStudents(client, [data as StudentRow])
  return enriched ?? null
}

// ─────────────────────────────────────────────────────────────────
// Enrichment: join student_ccmr_status onto a list of students.
//
// student_ccmr_status is populated by lib/ccmr/recompute.ts. Until
// that has run for every district, many rows will be missing. For
// those students, we fall back to a synthesized status:
//   - methodology_key derived from cohort_year using the TX
//     binary≤2029 / tiered≥2030 split.
//   - highest_level mirrored from ccmr_readiness:
//       'met'   → 'met'   (binary)
//       other   → 'not_met' (binary) — for tiered cohorts we set
//       'none' since binary readiness can't be projected onto tiers.
//
// Logged once per call (not per row) in dev so the team can see
// when the fallback path is being exercised.
// ─────────────────────────────────────────────────────────────────

export async function enrichStudents(
  client: TypedSupabaseClient,
  students: StudentRow[]
): Promise<EnrichedStudentRow[]> {
  if (students.length === 0) return []

  const ids = students.map((s) => s.id)
  const { data: statusRows } = await client
    .from('student_ccmr_status')
    .select(
      'student_id, methodology_key, highest_level, highest_level_category, highest_level_source_indicator_id'
    )
    .in('student_id', ids)

  const statusByStudent = new Map(
    (statusRows ?? []).map((r) => [
      (r as { student_id: string }).student_id,
      r as {
        student_id: string
        methodology_key: MethodologyKey
        highest_level: CcmrIndicatorResultStatus
        highest_level_category: IndicatorCategory | null
        highest_level_source_indicator_id: string | null
      },
    ])
  )

  let fallbackCount = 0
  const enriched = students.map((s): EnrichedStudentRow => {
    const status = statusByStudent.get(s.id)
    if (status) {
      return {
        ...s,
        methodology_key: status.methodology_key,
        highest_level: status.highest_level,
        highest_level_category: status.highest_level_category,
        highest_level_source_indicator_id: status.highest_level_source_indicator_id,
        is_fallback_status: false,
      }
    }
    fallbackCount += 1
    const methodology = inferTxMethodologyFromCohort(s.cohort_year)
    return {
      ...s,
      methodology_key: methodology,
      highest_level: synthesizeHighestLevel(methodology, s.ccmr_readiness),
      highest_level_category: null,
      highest_level_source_indicator_id: null,
      is_fallback_status: true,
    }
  })

  if (fallbackCount > 0 && process.env.NODE_ENV !== 'production') {
    console.warn(
      `[students] ${fallbackCount} of ${students.length} student(s) on CCMR fallback path — student_ccmr_status row missing. Run recomputeDistrict to populate.`
    )
  }

  return enriched
}

function inferTxMethodologyFromCohort(
  cohortYear: number | null
): MethodologyKey | null {
  if (cohortYear == null) return null
  if (cohortYear <= 2029) return 'tx_binary'
  return 'tx_tiered_2030'
}

function synthesizeHighestLevel(
  methodology: MethodologyKey | null,
  readiness: CCMRReadiness
): CcmrIndicatorResultStatus | null {
  if (!methodology) return null
  if (methodology === 'tx_binary') {
    return readiness === 'met' ? 'met' : 'not_met'
  }
  // Tiered cohorts cannot be reliably projected from binary readiness.
  // Surface 'none' until the recompute populates the real tier.
  return 'none'
}
