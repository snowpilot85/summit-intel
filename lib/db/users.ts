import type { TypedSupabaseClient, UserProfileRow } from '@/types/database'

export interface UserContext {
  profile: UserProfileRow
  districtId: string
  districtName: string
  schoolYearLabel: string
  graduationDate: string | null
}

/**
 * Fetches the authenticated user's profile, district name, and current school year.
 * Returns null if the user is not authenticated or has no profile record.
 */
export async function getUserContext(
  client: TypedSupabaseClient
): Promise<UserContext | null> {
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) return null

  const { data: profile } = await client
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  const [districtResult, schoolYearResult] = await Promise.all([
    client.from('districts').select('name').eq('id', profile.district_id).single(),
    client
      .from('school_years')
      .select('label, graduation_date')
      .eq('district_id', profile.district_id)
      .eq('is_current', true)
      .single(),
  ])

  return {
    profile: profile as UserProfileRow,
    districtId: profile.district_id,
    districtName: districtResult.data?.name ?? 'Unknown District',
    schoolYearLabel: schoolYearResult.data?.label ?? '2025-26',
    graduationDate: schoolYearResult.data?.graduation_date ?? null,
  }
}

/**
 * Lightweight helper for server actions: returns the authenticated user's district_id.
 * Throws if not authenticated or profile is missing.
 */
export async function getAuthDistrictId(client: TypedSupabaseClient): Promise<string> {
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile, error } = await client
    .from('user_profiles')
    .select('district_id')
    .eq('id', user.id)
    .single()

  if (error || !profile) throw new Error('User profile not found')
  return profile.district_id
}
