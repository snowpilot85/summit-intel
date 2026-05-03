import type { TypedSupabaseClient, IndicatorType, CCMRReadiness, MethodologyKey } from '@/types/database'

export type SubgroupFilter = 'all' | 'eb' | 'econ' | 'sped'

export interface DashboardSummary {
  total912: number
  seniors: number
  ccmrMet: number
  ccmrPercent: number
  onTrack: number
  onTrackTotal: number
  onTrackPercent: number
  atRiskSeniors: number
}

export interface IndicatorCount {
  indicator_type: IndicatorType
  count: number
}

async function countStudents(
  client: TypedSupabaseClient,
  districtId: string,
  subgroup: SubgroupFilter,
  gradeIn: number[],
  readinessIn?: CCMRReadiness[]
): Promise<number> {
  let q = client
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('district_id', districtId)
    .eq('is_active', true)
    .in('grade_level', gradeIn)

  if (subgroup === 'eb') q = q.eq('is_eb', true)
  else if (subgroup === 'econ') q = q.eq('is_econ_disadvantaged', true)
  else if (subgroup === 'sped') q = q.eq('is_special_ed', true)

  if (readinessIn?.length) q = q.in('ccmr_readiness', readinessIn)

  const { count, error } = await q
  if (error) throw error
  return count ?? 0
}

export async function getDashboardSummary(
  client: TypedSupabaseClient,
  districtId: string,
  subgroup: SubgroupFilter = 'all'
): Promise<DashboardSummary> {
  const [total912, seniors, ccmrMet, onTrack, onTrackTotal, atRiskSeniors] = await Promise.all([
    countStudents(client, districtId, subgroup, [9, 10, 11, 12]),
    countStudents(client, districtId, subgroup, [12]),
    countStudents(client, districtId, subgroup, [12], ['met'] as CCMRReadiness[]),
    countStudents(client, districtId, subgroup, [9, 10, 11], ['on_track', 'met'] as CCMRReadiness[]),
    countStudents(client, districtId, subgroup, [9, 10, 11]),
    countStudents(client, districtId, subgroup, [12], ['at_risk'] as CCMRReadiness[]),
  ])

  return {
    total912,
    seniors,
    ccmrMet,
    ccmrPercent: seniors > 0 ? Math.round((ccmrMet / seniors) * 100) : 0,
    onTrack,
    onTrackTotal,
    onTrackPercent: onTrackTotal > 0 ? Math.round((onTrack / onTrackTotal) * 100) : 0,
    atRiskSeniors,
  }
}

export interface ClusterCount {
  clusterName: string
  clusterCode: string
  count: number
}

export interface PathwayMetrics {
  studentsWithPathways: number
  pathwayPercent: number       // pct of 9-12 students in the subgroup that have a pathway
  credentialsEarned: number
  credentialPercent: number    // pct of pathway students who earned a credential
  topClusters: ClusterCount[]
}

export async function getPathwayMetrics(
  client: TypedSupabaseClient,
  districtId: string,
  subgroup: SubgroupFilter = 'all',
): Promise<PathwayMetrics> {
  // Build the pathway query; cast to any so we can filter on embedded-resource columns
  // (Relationships[] is empty in Database interface, so TS can't infer the join shape)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rc = client as any
  let pathwayQ = rc
    .from('student_pathways')
    .select(
      'student_id, credential_earned, state_career_clusters(name, code), students!inner(district_id, is_active, is_eb, is_econ_disadvantaged, is_special_ed)',
    )
    .eq('students.district_id', districtId)
    .eq('students.is_active', true)
    .range(0, 9999) // override PostgREST default 1 000-row cap

  if (subgroup === 'eb') pathwayQ = pathwayQ.eq('students.is_eb', true)
  else if (subgroup === 'econ') pathwayQ = pathwayQ.eq('students.is_econ_disadvantaged', true)
  else if (subgroup === 'sped') pathwayQ = pathwayQ.eq('students.is_special_ed', true)

  // Run count query and pathway query in parallel
  const [total912, pathwayResult] = await Promise.all([
    countStudents(client, districtId, subgroup, [9, 10, 11, 12]),
    pathwayQ as Promise<{ data: unknown[] | null; error: { message: string } | null }>,
  ])

  if (pathwayResult.error) throw new Error(pathwayResult.error.message)

  type Row = { student_id: string; credential_earned: boolean; state_career_clusters: { name: string; code: string } | null }
  const rows = (pathwayResult.data ?? []) as Row[]

  // Unique students (a student may have multiple pathway records)
  const uniqueStudents = new Set(rows.map(r => r.student_id))
  const studentsWithPathways = uniqueStudents.size
  const credentialsEarned = rows.filter(r => r.credential_earned).length

  // Tally by cluster code (one entry per pathway row, not per unique student)
  const tally = new Map<string, { name: string; code: string; count: number }>()
  for (const row of rows) {
    const c = row.state_career_clusters
    if (!c) continue
    const entry = tally.get(c.code)
    if (entry) entry.count++
    else tally.set(c.code, { name: c.name, code: c.code, count: 1 })
  }

  const topClusters: ClusterCount[] = Array.from(tally.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(({ name, code, count }) => ({ clusterName: name, clusterCode: code, count }))

  return {
    studentsWithPathways,
    pathwayPercent: total912 > 0 ? Math.round((studentsWithPathways / total912) * 100) : 0,
    credentialsEarned,
    credentialPercent: studentsWithPathways > 0 ? Math.round((credentialsEarned / studentsWithPathways) * 100) : 0,
    topClusters,
  }
}

// ─────────────────────────────────────────────────────────────────
// PER-COHORT CCMR SCORE ROLLUPS
//
// Drives the dashboard's mixed-methodology cohort breakdown. Reads
// from v_ccmr_score_tiered and v_ccmr_score_binary (migration
// 20260428000003_ccmr_status_and_rollups). Each cohort_year is a
// separate row tagged with its methodology — the dashboard MUST
// render these as distinct rows / chart series and NEVER blend a
// single % CCMR rate across mixed methodologies.
// See docs/methodology.md, "Per-cohort segmentation rule."
//
// Both views are keyed on graduated cohorts (cohort_status = 'graduated').
// Active cohorts in-progress have no score yet — that's the canonical
// behavior; in-progress projections live in the existing summary
// query for grade-12 seniors only.
// ─────────────────────────────────────────────────────────────────

export interface CohortScoreRow {
  district_id: string
  campus_id: string
  cohort_year: number
  methodology: 'tiered' | 'binary'
  /** Annual graduates (denominator) for this cohort on this campus. */
  annualGrads: number
  /** Tiered: three-percentage CCMR raw score. Binary: % met. */
  ccmrRawScore: number
  /** Tiered only — count at each tier. Null for binary rows. */
  foundationalPlus: number | null
  demonstratedPlus: number | null
  advanced: number | null
  /** Binary only — met count. Null for tiered rows. */
  ccmrMet: number | null
}

interface RawTieredRow {
  district_id: string
  campus_id: string
  cohort_year: number
  annual_grads: number
  foundational_plus: number
  demonstrated_plus: number
  advanced_count: number
  ccmr_raw_score: number
}

interface RawBinaryRow {
  district_id: string
  campus_id: string
  cohort_year: number
  annual_grads: number
  ccmr_met: number
  ccmr_rate: number
}

export async function getCohortScores(
  client: TypedSupabaseClient,
  districtId: string
): Promise<CohortScoreRow[]> {
  const [tieredResult, binaryResult] = await Promise.all([
    client
      .from('v_ccmr_score_tiered')
      .select('district_id, campus_id, cohort_year, annual_grads, foundational_plus, demonstrated_plus, advanced_count, ccmr_raw_score')
      .eq('district_id', districtId),
    client
      .from('v_ccmr_score_binary')
      .select('district_id, campus_id, cohort_year, annual_grads, ccmr_met, ccmr_rate')
      .eq('district_id', districtId),
  ])

  if (tieredResult.error) throw tieredResult.error
  if (binaryResult.error) throw binaryResult.error

  const tiered = ((tieredResult.data ?? []) as unknown as RawTieredRow[]).map(
    (r): CohortScoreRow => ({
      district_id: r.district_id,
      campus_id: r.campus_id,
      cohort_year: r.cohort_year,
      methodology: 'tiered',
      annualGrads: r.annual_grads ?? 0,
      ccmrRawScore: Number(r.ccmr_raw_score ?? 0),
      foundationalPlus: r.foundational_plus ?? 0,
      demonstratedPlus: r.demonstrated_plus ?? 0,
      advanced: r.advanced_count ?? 0,
      ccmrMet: null,
    })
  )

  const binary = ((binaryResult.data ?? []) as unknown as RawBinaryRow[]).map(
    (r): CohortScoreRow => ({
      district_id: r.district_id,
      campus_id: r.campus_id,
      cohort_year: r.cohort_year,
      methodology: 'binary',
      annualGrads: r.annual_grads ?? 0,
      ccmrRawScore: Number(r.ccmr_rate ?? 0),
      foundationalPlus: null,
      demonstratedPlus: null,
      advanced: null,
      ccmrMet: r.ccmr_met ?? 0,
    })
  )

  return [...tiered, ...binary].sort((a, b) => {
    if (a.cohort_year !== b.cohort_year) return a.cohort_year - b.cohort_year
    return a.campus_id.localeCompare(b.campus_id)
  })
}

// ─────────────────────────────────────────────────────────────────
// ACTIVE COHORT DISTRIBUTION
//
// Counts students by (cohort_year, methodology) for active cohorts.
// Used to surface the spread of methodologies a district has on its
// books today, so the dashboard can call out "you have students on
// both rule sets" before the user is misled by a single number.
// ─────────────────────────────────────────────────────────────────

export interface ActiveCohortRow {
  cohort_year: number
  methodology: MethodologyKey
  studentCount: number
}

export async function getActiveCohortDistribution(
  client: TypedSupabaseClient,
  districtId: string
): Promise<ActiveCohortRow[]> {
  const { data, error } = await client
    .from('students')
    .select('cohort_year')
    .eq('district_id', districtId)
    .eq('is_active', true)
    .eq('cohort_status', 'active')
  if (error) throw error
  const counts = new Map<number, number>()
  for (const r of (data ?? []) as { cohort_year: number | null }[]) {
    if (r.cohort_year == null) continue
    counts.set(r.cohort_year, (counts.get(r.cohort_year) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([cohort_year, studentCount]): ActiveCohortRow => ({
      cohort_year,
      methodology: cohort_year <= 2029 ? 'tx_binary' : 'tx_tiered_2030',
      studentCount,
    }))
    .sort((a, b) => a.cohort_year - b.cohort_year)
}

export async function getIndicatorBreakdown(
  client: TypedSupabaseClient,
  districtId: string
): Promise<IndicatorCount[]> {
  const { data, error } = await client
    .from('v_indicator_breakdown')
    .select('indicator_type, student_count')
    .eq('district_id', districtId)

  if (error) throw error

  // Aggregate student_count by indicator type across all graduation years
  const totals = new Map<IndicatorType, number>()
  for (const row of data ?? []) {
    const prev = totals.get(row.indicator_type) ?? 0
    totals.set(row.indicator_type, prev + (row.student_count ?? 0))
  }

  return Array.from(totals.entries())
    .map(([indicator_type, count]) => ({ indicator_type, count }))
    .sort((a, b) => b.count - a.count)
}
