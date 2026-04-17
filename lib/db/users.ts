import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import type { AccountabilitySystem, TypedSupabaseClient, UserProfileRow } from '@/types/database'
import { hasCCMRModule } from '@/lib/db/state'

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
  /** null for super_admin users who haven't selected a district */
  districtId: string | null
  districtName: string
  schoolYearLabel: string
  graduationDate: string | null
  // State-awareness — populated whenever districtId is set; null/defaults otherwise
  stateId: string | null
  stateCode: string
  accountabilitySystem: AccountabilitySystem
  hasCCMR: boolean
}

/**
 * Fetches the authenticated user's profile, district name, and current school year.
 * Returns null if the user is not authenticated or has no profile record.
 * For super_admin with no district_id, returns a context with districtId: null.
 *
 * NOTE: The DB column user_profiles.district_id must allow NULL for super_admin:
 *   ALTER TABLE user_profiles ALTER COLUMN district_id DROP NOT NULL;
 */
export async function getUserContext(
  client: TypedSupabaseClient
): Promise<UserContext | null> {
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) return null

  // Use admin client — the user_profiles RLS policy calls auth_user_district_id()
  // which itself queries user_profiles, causing recursive evaluation on first request.
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Authenticated but no profile row
  if (!profile) throw new ProfileNotFoundError()

  const typedProfile = profile as UserProfileRow

  // super_admin with no district assigned — check for a session cookie set
  // when the user selected a district from the district picker.
  if (!typedProfile.district_id) {
    const cookieStore = await cookies()
    const cookieDistrict = cookieStore.get('sa_district')?.value ?? null

    if (!cookieDistrict) {
      return {
        profile: typedProfile,
        districtId: null,
        districtName: '',
        schoolYearLabel: '2025-26',
        graduationDate: null,
        stateId: null,
        stateCode: '',
        accountabilitySystem: 'placeholder' as AccountabilitySystem,
        hasCCMR: false,
      }
    }

    const [dRes, syRes] = await Promise.all([
      admin.from('districts').select('name, state_id, states(code, accountability_system)').eq('id', cookieDistrict).single(),
      admin
        .from('school_years')
        .select('label, graduation_date')
        .eq('district_id', cookieDistrict)
        .eq('is_current', true)
        .single(),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dState = (dRes.data as any)?.states as { code: string; accountability_system: string } | null
    const accountabilitySystem = (dState?.accountability_system ?? 'placeholder') as AccountabilitySystem

    return {
      profile: typedProfile,
      districtId: cookieDistrict,
      districtName: dRes.data?.name ?? 'Unknown District',
      schoolYearLabel: syRes.data?.label ?? '2025-26',
      graduationDate: syRes.data?.graduation_date ?? null,
      stateId: (dRes.data as any)?.state_id ?? null,
      stateCode: dState?.code ?? '',
      accountabilitySystem,
      hasCCMR: hasCCMRModule(accountabilitySystem),
    }
  }

  const [districtResult, schoolYearResult] = await Promise.all([
    admin.from('districts').select('name, state_id, states(code, accountability_system)').eq('id', typedProfile.district_id).single(),
    admin
      .from('school_years')
      .select('label, graduation_date')
      .eq('district_id', typedProfile.district_id)
      .eq('is_current', true)
      .single(),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dState = (districtResult.data as any)?.states as { code: string; accountability_system: string } | null
  const accountabilitySystem = (dState?.accountability_system ?? 'placeholder') as AccountabilitySystem

  return {
    profile: typedProfile,
    districtId: typedProfile.district_id,
    districtName: districtResult.data?.name ?? 'Unknown District',
    schoolYearLabel: schoolYearResult.data?.label ?? '2025-26',
    graduationDate: schoolYearResult.data?.graduation_date ?? null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stateId: (districtResult.data as any)?.state_id ?? null,
    stateCode: dState?.code ?? '',
    accountabilitySystem,
    hasCCMR: hasCCMRModule(accountabilitySystem),
  }
}

/**
 * Lightweight helper for server actions: returns the authenticated user's district_id.
 * Throws if not authenticated, profile is missing, or user has no district (super_admin).
 */
export async function getAuthDistrictId(client: TypedSupabaseClient): Promise<string> {
  const { districtId } = await getAuthContext(client)
  return districtId
}

/**
 * Returns the district_id AND the appropriate Supabase client for data queries.
 * Super_admin users get the admin (service-role) client so RLS is bypassed —
 * their user_profiles.district_id is null, which would block RLS checks otherwise.
 * Regular users get the passed-in authenticated client (RLS applies normally).
 */
export async function getAuthContext(client: TypedSupabaseClient): Promise<{
  districtId: string
  queryClient: ReturnType<typeof createAdminClient>
}> {
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = createAdminClient()
  const { data: profile, error } = await admin
    .from('user_profiles')
    .select('district_id, role')
    .eq('id', user.id)
    .single()

  if (error || !profile) throw new Error('User profile not found')

  const isSuperAdmin = profile.role === 'super_admin'
  // Super_admin bypasses RLS via the admin client; regular users use the auth client
  const queryClient = (isSuperAdmin ? admin : client) as ReturnType<typeof createAdminClient>

  if (!profile.district_id) {
    if (isSuperAdmin) {
      const cookieStore = await cookies()
      const cookieDistrict = cookieStore.get('sa_district')?.value ?? null
      if (cookieDistrict) return { districtId: cookieDistrict, queryClient }
    }
    throw new Error('No district assigned to this user')
  }

  return { districtId: profile.district_id, queryClient }
}

/**
 * Guards a server action to super_admin only. Throws if the current user is not
 * authenticated or does not have the super_admin role.
 */
export async function requireSuperAdmin(): Promise<void> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    throw new Error('Access denied: super_admin role required')
  }
}
