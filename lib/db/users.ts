import type { TypedSupabaseClient, UserProfileRow } from '@/types/database'
import { createAdminClient } from '@/utils/supabase/admin'

/**
 * Thrown when the auth user exists but has no matching user_profiles row.
 * Caught by the /pathways error boundary to show a setup error instead of
 * looping back to /login.
 */
export class ProfileNotFoundError extends Error {
  constructor() {
    super('No user_profiles row found for this auth user.')
    this.name = 'ProfileNotFoundError'
  }
}

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

  // Use admin client for these lookups — the user_profiles RLS policy calls
  // auth_user_district_id() which itself queries user_profiles, causing a
  // recursive evaluation that returns 0 rows on the first authenticated request.
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Authenticated but no profile row — throw so callers can distinguish this
  // from "not authenticated" and avoid a /login ↔ /pathways redirect loop.
  if (!profile) throw new ProfileNotFoundError()

  const [districtResult, schoolYearResult] = await Promise.all([
    admin.from('districts').select('name').eq('id', profile.district_id).single(),
    admin
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

  // Use admin client for the same reason as getUserContext above
  const admin = createAdminClient()
  const { data: profile, error } = await admin
    .from('user_profiles')
    .select('district_id')
    .eq('id', user.id)
    .single()

  if (error || !profile) throw new Error('User profile not found')
  return profile.district_id
}
