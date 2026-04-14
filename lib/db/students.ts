import type { TypedSupabaseClient, StudentRow, CCMRReadiness } from '@/types/database'

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
  data: StudentRow[]
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
  return { data: data ?? [], count: count ?? 0 }
}

export async function getStudentById(
  client: TypedSupabaseClient,
  studentId: string
): Promise<StudentRow | null> {
  const { data, error } = await client
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw error
  }
  return data
}
