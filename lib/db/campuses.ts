import type { TypedSupabaseClient, CampusRow, CampusCCMRSummaryRow } from '@/types/database'

export async function getCampuses(
  client: TypedSupabaseClient,
  districtId: string
): Promise<CampusRow[]> {
  const { data, error } = await client
    .from('campuses')
    .select('*')
    .eq('district_id', districtId)
    .order('name', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function getCampusSummaries(
  client: TypedSupabaseClient,
  districtId: string,
  campusId?: string
): Promise<CampusCCMRSummaryRow[]> {
  let query = client
    .from('v_campus_ccmr_summary')
    .select('*')
    .eq('district_id', districtId)
    .order('campus_name', { ascending: true })

  if (campusId) query = query.eq('campus_id', campusId)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
