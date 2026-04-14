import type { TypedSupabaseClient, SnapshotRow } from '@/types/database'

export interface GetSnapshotsFilters {
  campusId?: string
  graduationYears?: number[]
}

export async function getAnnualSnapshots(
  client: TypedSupabaseClient,
  districtId: string,
  filters: GetSnapshotsFilters = {}
): Promise<SnapshotRow[]> {
  let query = client
    .from('ccmr_annual_snapshots')
    .select('*')
    .eq('district_id', districtId)
    .order('graduation_year', { ascending: true })

  if (filters.campusId) {
    query = query.eq('campus_id', filters.campusId)
  } else {
    query = query.is('campus_id', null) // district-level rows
  }

  if (filters.graduationYears?.length) {
    query = query.in('graduation_year', filters.graduationYears)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
