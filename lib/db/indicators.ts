import type { TypedSupabaseClient, IndicatorRow, IndicatorInsert, StudentUpdate, CCMRReadiness } from '@/types/database'
import { computeCCMRReadiness } from '@/lib/ccmr'

export async function getStudentIndicators(
  client: TypedSupabaseClient,
  studentId: string
): Promise<IndicatorRow[]> {
  const { data, error } = await client
    .from('ccmr_indicators')
    .select('*')
    .eq('student_id', studentId)
    .order('indicator_type', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function upsertIndicator(
  client: TypedSupabaseClient,
  indicator: IndicatorInsert
): Promise<IndicatorRow> {
  const { data, error } = await client
    .from('ccmr_indicators')
    .upsert(indicator, { onConflict: 'student_id,indicator_type' })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Fetches all indicators for a student, computes readiness, and persists
 * the result back to students.ccmr_readiness. Returns the computed value.
 */
export async function computeAndSaveReadiness(
  client: TypedSupabaseClient,
  studentId: string,
  gradeLevel: number
): Promise<CCMRReadiness> {
  const indicators = await getStudentIndicators(client, studentId)
  const readiness = computeCCMRReadiness(indicators, gradeLevel)

  const update: StudentUpdate = {
    ccmr_readiness: readiness,
    indicators_met_count: indicators.filter((i) => i.status === 'met').length,
  }

  // Only set ccmr_met_date the first time the student reaches 'met'
  if (readiness === 'met') {
    const { data: existing } = await client
      .from('students')
      .select('ccmr_met_date')
      .eq('id', studentId)
      .single()

    if (existing && !existing.ccmr_met_date) {
      update.ccmr_met_date = new Date().toISOString()
    }
  }

  const { error } = await client.from('students').update(update).eq('id', studentId)
  if (error) throw error

  return readiness
}
