// ============================================================
// CCMR Recompute Service
//
// One entry point per scope:
//   - recomputeStudent(client, studentId, opts)
//   - recomputeDistrict(client, districtId, opts)
//
// Behavior:
//   1. Resolve the student's methodology via cohort_year + state.
//   2. Run the methodology-specific derivation against assessment
//      and program data.
//   3. Upsert ccmr_indicator_results rows (snapshotting methodology_key).
//   4. Compute the highest level + driving indicator.
//   5. Upsert student_ccmr_status.
//
// This is intentionally NOT implemented as a Postgres trigger.
// Calling it from app code (ingestion service, admin job runner,
// route handlers) keeps the path debuggable and loggable.
//
// Default scope policy:
//   - recomputeDistrict targets cohort_status = 'active' only.
//     Graduated cohorts have locked methodologies — recomputing
//     them risks rewriting a frozen historical record. Pass
//     `includeGraduated: true` to override (rare; reserved for bug-
//     fix backfills).
// ============================================================

import type {
  CcmrIndicatorResultRow,
  IndicatorRow,
  StudentRow,
  TypedSupabaseClient,
} from '@/types/database'
import { resolveMethodology, type MethodologyRoutingConfig } from './methodology'
import {
  deriveHighestTiered,
  deriveTieredIndicators,
  type DerivedTieredIndicator,
  type TieredDerivationInput,
} from './derive-tiered'
import { deriveBinary } from './derive-binary'

// ─────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────

export interface RecomputeStudentOptions {
  /**
   * Builder that turns a student's existing ingestion data into the
   * input shape required by `deriveTieredIndicators`. Until the
   * ingestion-side refactor is complete, callers wire this up per
   * data source.
   */
  buildTieredInput: (studentId: string) => Promise<TieredDerivationInput>
  /** Opt-in logger so the call site can attribute recompute work. */
  log?: (msg: string, ctx?: Record<string, unknown>) => void
}

export interface RecomputeStudentResult {
  studentId: string
  methodologyKey: string | null
  outcome: 'tiered' | 'binary' | 'skipped_no_methodology' | 'skipped_no_cohort'
}

export async function recomputeStudent(
  client: TypedSupabaseClient,
  studentId: string,
  opts: RecomputeStudentOptions
): Promise<RecomputeStudentResult> {
  const log = opts.log ?? noop

  const methodologies = await loadMethodologies(client)
  const { data: student, error } = await client
    .from('students')
    .select('id, district_id, grade_level, cohort_year, cohort_status')
    .eq('id', studentId)
    .single()

  if (error || !student) {
    throw new Error(`recomputeStudent: student ${studentId} not found`)
  }

  const districtState = await getDistrictStateCode(client, student.district_id)
  const stateMethodologies = methodologies.filter((m) => m.state_code === districtState)
  const methodologyKey = resolveMethodology(student.cohort_year, stateMethodologies)

  if (student.cohort_year == null) {
    log('recompute skipped — no cohort_year', { studentId })
    return { studentId, methodologyKey: null, outcome: 'skipped_no_cohort' }
  }
  if (!methodologyKey) {
    log('recompute skipped — no methodology covers cohort', {
      studentId, cohortYear: student.cohort_year, districtState,
    })
    return { studentId, methodologyKey: null, outcome: 'skipped_no_methodology' }
  }

  if (isTiered(methodologyKey)) {
    const input = await opts.buildTieredInput(studentId)
    const indicators = deriveTieredIndicators(input)
    const writtenIds = await upsertTieredIndicatorResults(client, studentId, methodologyKey, indicators)
    const highest = deriveHighestTiered(indicators)
    const sourceId = highest.source_indicator_type
      ? writtenIds[highest.source_indicator_type] ?? null
      : null
    await upsertStudentCcmrStatus(client, {
      student_id: studentId,
      methodology_key: methodologyKey,
      highest_level: highest.status,
      highest_level_category: highest.category,
      highest_level_source_indicator_id: sourceId,
    })
    log('recompute tiered complete', { studentId, methodologyKey, highest: highest.status })
    return { studentId, methodologyKey, outcome: 'tiered' }
  }

  // Binary path: read existing ccmr_indicators and collapse.
  const { data: rows } = await client
    .from('ccmr_indicators')
    .select('indicator_type, status')
    .eq('student_id', studentId)
  const indicators = (rows ?? []) as Pick<IndicatorRow, 'indicator_type' | 'status'>[]
  const result = deriveBinary(indicators, student.grade_level)
  await upsertStudentCcmrStatus(client, {
    student_id: studentId,
    methodology_key: methodologyKey,
    highest_level: result.highest_level,
    highest_level_category: null,
    highest_level_source_indicator_id: null,
  })
  log('recompute binary complete', {
    studentId, methodologyKey, highest: result.highest_level, pathways: result.pathways_met,
  })
  return { studentId, methodologyKey, outcome: 'binary' }
}

export interface RecomputeDistrictOptions extends RecomputeStudentOptions {
  /** When true, also recomputes graduated cohorts. Default false. */
  includeGraduated?: boolean
  /** Optional cohort_year filter — pass to target a single cohort. */
  cohortYear?: number
  /** Batch size for sequential per-student calls. Default 50. */
  batchSize?: number
  /**
   * Auth user id of the admin who triggered this recompute. When
   * provided, a `sync_jobs` row is opened at job start and updated
   * with finished_at + counts on completion. Omit for system-driven
   * recomputes that should not appear in the audit log.
   *
   * Per-student recomputes intentionally do NOT log sync_jobs rows
   * (too granular — would write thousands per district sync).
   */
  triggeredBy?: string
}

export interface RecomputeDistrictResult {
  total: number
  byOutcome: Record<RecomputeStudentResult['outcome'], number>
  /** ID of the sync_jobs row opened for this run, if `triggeredBy` was set. */
  syncJobId: string | null
}

export async function recomputeDistrict(
  client: TypedSupabaseClient,
  districtId: string,
  opts: RecomputeDistrictOptions
): Promise<RecomputeDistrictResult> {
  const log = opts.log ?? noop
  const includeGraduated = opts.includeGraduated ?? false
  const batchSize = opts.batchSize ?? 50

  // Open the sync_jobs row eagerly so failures during enumeration
  // are still recorded. Only when triggeredBy is supplied — system
  // runs without an attribution shouldn't pollute the audit log.
  let syncJobId: string | null = null
  if (opts.triggeredBy) {
    syncJobId = await openSyncJob(client, {
      district_id: districtId,
      triggered_by: opts.triggeredBy,
      cohort_year: opts.cohortYear,
      include_graduated: includeGraduated,
    })
  }

  const tally: RecomputeDistrictResult['byOutcome'] = {
    tiered: 0,
    binary: 0,
    skipped_no_methodology: 0,
    skipped_no_cohort: 0,
  }
  let totalIds = 0
  let unrecoverableError: unknown = null
  const errorEntries: Record<string, unknown>[] = []

  try {
    let query = client
      .from('students')
      .select('id')
      .eq('district_id', districtId)
      .eq('is_active', true)

    if (!includeGraduated) {
      query = query.eq('cohort_status', 'active')
    }
    if (opts.cohortYear != null) {
      query = query.eq('cohort_year', opts.cohortYear)
    }

    const { data: students, error } = await query
    if (error) throw error

    const ids = (students ?? []).map((s) => (s as Pick<StudentRow, 'id'>).id)
    totalIds = ids.length
    log(`recomputeDistrict: ${ids.length} students queued`, {
      districtId, includeGraduated, cohortYear: opts.cohortYear, syncJobId,
    })

    for (let i = 0; i < ids.length; i += batchSize) {
      const slice = ids.slice(i, i + batchSize)
      const results = await Promise.all(
        slice.map((id) => recomputeStudent(client, id, opts).catch((err): RecomputeStudentResult => {
          const message = String(err)
          log('recomputeStudent failed', { studentId: id, error: message })
          errorEntries.push({ student_id: id, error: message })
          return { studentId: id, methodologyKey: null, outcome: 'skipped_no_methodology' }
        })),
      )
      for (const r of results) tally[r.outcome] += 1
    }
  } catch (err) {
    unrecoverableError = err
    log('recomputeDistrict failed', { districtId, error: String(err) })
  }

  if (syncJobId) {
    const rows_updated = tally.tiered + tally.binary
    const rows_skipped = tally.skipped_no_methodology + tally.skipped_no_cohort
    const rows_failed = errorEntries.length
    const status: SyncJobStatusValue = unrecoverableError
      ? 'failed'
      : rows_failed > 0
        ? 'partial_failure'
        : 'success'
    await closeSyncJob(client, syncJobId, {
      status,
      rows_inserted: 0,
      rows_updated,
      rows_failed,
      rows_skipped,
      error_log: unrecoverableError
        ? [{ error: String(unrecoverableError) }, ...errorEntries]
        : errorEntries.length > 0
          ? errorEntries
          : null,
    })
  }

  if (unrecoverableError) throw unrecoverableError

  return { total: totalIds, byOutcome: tally, syncJobId }
}

// ─────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────

function isTiered(key: string): boolean {
  return key.includes('tiered') || key.includes('weighted')
}

function noop(): void {
  /* intentional no-op */
}

async function loadMethodologies(
  client: TypedSupabaseClient
): Promise<MethodologyRoutingConfig[]> {
  const { data, error } = await client
    .from('state_accountability_methodologies')
    .select('state_code, methodology_key, effective_cohort_year_min, effective_cohort_year_max, is_active')
    .eq('is_active', true)
  if (error) throw error
  return (data ?? []) as MethodologyRoutingConfig[]
}

async function getDistrictStateCode(
  client: TypedSupabaseClient,
  districtId: string
): Promise<string> {
  const { data, error } = await client
    .from('districts')
    .select('state_id, states(code)')
    .eq('id', districtId)
    .single()
  if (error || !data) throw new Error(`district ${districtId} not found`)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data as any).states?.code ?? '') as string
}

async function upsertTieredIndicatorResults(
  client: TypedSupabaseClient,
  studentId: string,
  methodologyKey: string,
  indicators: DerivedTieredIndicator[]
): Promise<Record<string, string>> {
  if (indicators.length === 0) return {}
  const rows = indicators.map((ind) => ({
    student_id: studentId,
    methodology_key: methodologyKey,
    indicator_type: ind.indicator_type,
    indicator_category: ind.indicator_category,
    status: ind.status,
    source_data: ind.source_data,
    calculated_at: new Date().toISOString(),
  }))
  const { data, error } = await client
    .from('ccmr_indicator_results')
    .upsert(rows, { onConflict: 'student_id,indicator_type' })
    .select('id, indicator_type')
  if (error) throw error
  const idByType: Record<string, string> = {}
  for (const r of (data ?? []) as Pick<CcmrIndicatorResultRow, 'id' | 'indicator_type'>[]) {
    idByType[r.indicator_type] = r.id
  }
  return idByType
}

interface StatusUpsertInput {
  student_id: string
  methodology_key: string
  highest_level: string
  highest_level_category: string | null
  highest_level_source_indicator_id: string | null
}

type SyncJobStatusValue = 'success' | 'partial_failure' | 'failed'

interface OpenSyncJobInput {
  district_id: string
  triggered_by: string
  cohort_year?: number
  include_graduated: boolean
}

async function openSyncJob(
  client: TypedSupabaseClient,
  input: OpenSyncJobInput,
): Promise<string> {
  const { data, error } = await client
    .from('sync_jobs')
    .insert({
      source_type: 'manual',
      source_identifier:
        input.cohort_year != null
          ? `recompute_district:${input.district_id}:cohort_${input.cohort_year}`
          : `recompute_district:${input.district_id}`,
      job_type: 'manual_recompute',
      district_id: input.district_id,
      status: 'running',
      rows_inserted: 0,
      rows_updated: 0,
      rows_failed: 0,
      rows_skipped: 0,
      error_log: null,
      triggered_by: input.triggered_by,
    })
    .select('id')
    .single()
  if (error || !data) throw error ?? new Error('sync_jobs insert returned no row')
  return (data as { id: string }).id
}

interface CloseSyncJobInput {
  status: SyncJobStatusValue
  rows_inserted: number
  rows_updated: number
  rows_failed: number
  rows_skipped: number
  error_log: Record<string, unknown>[] | null
}

async function closeSyncJob(
  client: TypedSupabaseClient,
  syncJobId: string,
  input: CloseSyncJobInput,
): Promise<void> {
  const { error } = await client
    .from('sync_jobs')
    .update({
      status: input.status,
      rows_inserted: input.rows_inserted,
      rows_updated: input.rows_updated,
      rows_failed: input.rows_failed,
      rows_skipped: input.rows_skipped,
      error_log: input.error_log,
      finished_at: new Date().toISOString(),
    })
    .eq('id', syncJobId)
  if (error) throw error
}

async function upsertStudentCcmrStatus(
  client: TypedSupabaseClient,
  input: StatusUpsertInput
): Promise<void> {
  const { error } = await client
    .from('student_ccmr_status')
    .upsert(
      {
        ...input,
        calculated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id' }
    )
  if (error) throw error
}
