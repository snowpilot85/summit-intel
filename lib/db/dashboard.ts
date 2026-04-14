import type { TypedSupabaseClient, IndicatorType, CCMRReadiness } from '@/types/database'

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
