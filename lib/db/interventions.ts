import type { TypedSupabaseClient, InterventionRow, InterventionInsert, InterventionStatus } from '@/types/database'

export interface GetInterventionsFilters {
  campusId?: string
  studentId?: string
  status?: InterventionStatus
}

export async function getInterventions(
  client: TypedSupabaseClient,
  districtId: string,
  filters: GetInterventionsFilters = {}
): Promise<InterventionRow[]> {
  let query = client
    .from('interventions')
    .select('*, students!inner(district_id)')
    .eq('students.district_id', districtId)
    .order('priority', { ascending: true })

  if (filters.campusId) query = query.eq('campus_id', filters.campusId)
  if (filters.studentId) query = query.eq('student_id', filters.studentId)
  if (filters.status) query = query.eq('status', filters.status)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as InterventionRow[]
}

export async function upsertIntervention(
  client: TypedSupabaseClient,
  intervention: InterventionInsert & { id?: string }
): Promise<InterventionRow> {
  const { data, error } = await client
    .from('interventions')
    .upsert(intervention, { onConflict: 'id' })
    .select()
    .single()

  if (error) throw error
  return data
}
