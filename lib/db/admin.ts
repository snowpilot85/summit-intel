import type { TypedSupabaseClient } from '@/types/database'

// ============================================================
// TYPES
// ============================================================

export type CampusPathwayStat = {
  campusId: string
  campusName: string
  totalStudents: number
  studentsWithPathways: number
  credentialsEarned: number
  pathwayRate: number    // % of all 9-12 students with a pathway
  completionRate: number // % of pathway students who earned a credential
}

export type SubgroupPathwayStat = {
  label: string
  key: 'all' | 'eb' | 'econ' | 'sped'
  totalStudents: number
  studentsWithPathways: number
  credentialsEarned: number
  pathwayRate: number
  completionRate: number
}

export type ClusterEnrollmentStat = {
  clusterCode: string
  clusterName: string
  enrolled: number        // unique students enrolled in this cluster
  credentialsEarned: number // unique students with credential_earned = true
}

export type CredentialAttainmentSummary = {
  totalPathwayStudents: number
  credentialsEarned: number  // unique students with credential_earned = true
  ibcEarned: number          // unique students with ibc ccmr_indicator met
  dualCreditStudents: number // unique students with any dual_credit indicator met
}

export type AdminDashboardData = {
  totalStudents912: number
  campusStats: CampusPathwayStat[]
  subgroupStats: SubgroupPathwayStat[]
  clusterStats: ClusterEnrollmentStat[]
  attainment: CredentialAttainmentSummary
}

// ============================================================
// QUERY
// ============================================================

export async function getAdminDashboard(
  client: TypedSupabaseClient,
  districtId: string,
): Promise<AdminDashboardData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rc = client as any

  const [
    studentsResult,
    pathwayResult,
    campusResult,
    ibcResult,
    dualCreditResult,
  ] = await Promise.all([
    // All active grade 9-12 students
    client
      .from('students')
      .select('id, campus_id, is_eb, is_econ_disadvantaged, is_special_ed')
      .eq('district_id', districtId)
      .eq('is_active', true)
      .in('grade_level', [9, 10, 11, 12]),

    // Student pathways — base table so we can filter on direct columns
    // (cluster_id, credential_earned) while also getting student subgroup
    // and campus data via the students!inner embedding (same pattern as
    // getPathwayMetrics which is proven to work).
    rc
      .from('student_pathways')
      .select(
        'student_id, credential_earned, cluster_id, state_career_clusters(name, code), students!inner(campus_id, is_eb, is_econ_disadvantaged, is_special_ed)',
      )
      .eq('students.district_id', districtId)
      .eq('students.is_active', true)
      .range(0, 49999),

    // Campuses (for ordering and name lookup)
    client
      .from('campuses')
      .select('id, name')
      .eq('district_id', districtId)
      .order('name'),

    // IBC indicators met — join students!inner for district scoping
    rc
      .from('ccmr_indicators')
      .select('student_id, students!inner(district_id, is_active)')
      .eq('students.district_id', districtId)
      .eq('students.is_active', true)
      .eq('indicator_type', 'ibc')
      .eq('status', 'met')
      .range(0, 9999),

    // Dual credit indicators met
    rc
      .from('ccmr_indicators')
      .select('student_id, students!inner(district_id, is_active)')
      .eq('students.district_id', districtId)
      .eq('students.is_active', true)
      .in('indicator_type', ['dual_credit_ela', 'dual_credit_math', 'dual_credit_any'])
      .eq('status', 'met')
      .range(0, 9999),
  ])

  type StudentMini = {
    id: string
    campus_id: string
    is_eb: boolean
    is_econ_disadvantaged: boolean
    is_special_ed: boolean
  }
  type PathwayMini = {
    student_id: string
    credential_earned: boolean
    cluster_id: string
    state_career_clusters: { name: string; code: string } | null
    students: { campus_id: string; is_eb: boolean; is_econ_disadvantaged: boolean; is_special_ed: boolean } | null
  }
  type CampusMini = { id: string; name: string }
  type IndicatorMini = { student_id: string }

  const allStudents: StudentMini[] = (studentsResult.data ?? []) as StudentMini[]
  const pathwayRows: PathwayMini[] = (pathwayResult.data ?? []) as PathwayMini[]
  const campuses: CampusMini[] = (campusResult.data ?? []) as CampusMini[]
  const ibcRows: IndicatorMini[] = (ibcResult.data ?? []) as IndicatorMini[]
  const dcRows: IndicatorMini[] = (dualCreditResult.data ?? []) as IndicatorMini[]

  // Build lookup sets — intersect with allStudents so the denominators match.
  // pathwayRows has no grade-level filter; students from grades < 9 or > 12 could
  // appear there but must NOT be counted against the 9-12 denominator.
  const allStudentIdSet = new Set(allStudents.map(s => s.id))
  const pathwayStudentIds = new Set(
    pathwayRows
      .filter(r => allStudentIdSet.has(r.student_id))
      .map(r => r.student_id),
  )
  const credEarnedStudentIds = new Set(
    pathwayRows
      .filter(r => r.credential_earned && allStudentIdSet.has(r.student_id))
      .map(r => r.student_id),
  )

  // ── Campus stats ────────────────────────────────────────────
  // Group all 9-12 students by campus (denominator)
  const studentsByCampus = new Map<string, StudentMini[]>()
  for (const s of allStudents) {
    const arr = studentsByCampus.get(s.campus_id) ?? []
    arr.push(s)
    studentsByCampus.set(s.campus_id, arr)
  }

  // Group pathway data by campus (via embedded student.campus_id)
  const pathwaysByCampus = new Map<string, { withPathway: Set<string>; credEarned: Set<string> }>()
  for (const row of pathwayRows) {
    const campusId = row.students?.campus_id
    if (!campusId) continue
    if (!pathwaysByCampus.has(campusId)) {
      pathwaysByCampus.set(campusId, { withPathway: new Set(), credEarned: new Set() })
    }
    const entry = pathwaysByCampus.get(campusId)!
    entry.withPathway.add(row.student_id)
    if (row.credential_earned) entry.credEarned.add(row.student_id)
  }

  const campusStats: CampusPathwayStat[] = campuses.map(c => {
    const total = studentsByCampus.get(c.id)?.length ?? 0
    const pathwayEntry = pathwaysByCampus.get(c.id)
    const withPathways = pathwayEntry?.withPathway.size ?? 0
    const earned = pathwayEntry?.credEarned.size ?? 0
    return {
      campusId: c.id,
      campusName: c.name,
      totalStudents: total,
      studentsWithPathways: withPathways,
      credentialsEarned: earned,
      pathwayRate: total > 0 ? Math.round((withPathways / total) * 100) : 0,
      completionRate: withPathways > 0 ? Math.round((earned / withPathways) * 100) : 0,
    }
  })

  // ── Subgroup stats ───────────────────────────────────────────
  function subgroupStat(
    label: string,
    key: SubgroupPathwayStat['key'],
    filterFn: (s: StudentMini) => boolean,
  ): SubgroupPathwayStat {
    const filtered = allStudents.filter(filterFn)
    const total = filtered.length
    const withPathways = filtered.filter(s => pathwayStudentIds.has(s.id)).length
    const credEarned = filtered.filter(s => credEarnedStudentIds.has(s.id)).length
    return {
      label,
      key,
      totalStudents: total,
      studentsWithPathways: withPathways,
      credentialsEarned: credEarned,
      pathwayRate: total > 0 ? Math.round((withPathways / total) * 100) : 0,
      completionRate: withPathways > 0 ? Math.round((credEarned / withPathways) * 100) : 0,
    }
  }

  const subgroupStats: SubgroupPathwayStat[] = [
    subgroupStat('All Students', 'all', () => true),
    subgroupStat('English Learners', 'eb', s => s.is_eb),
    subgroupStat('Econ Disadvantaged', 'econ', s => s.is_econ_disadvantaged),
    subgroupStat('Special Education', 'sped', s => s.is_special_ed),
  ]

  // ── Cluster stats ────────────────────────────────────────────
  const clusterTally = new Map<string, { name: string; code: string; enrolled: Set<string>; credEarned: Set<string> }>()
  for (const row of pathwayRows) {
    const c = row.state_career_clusters
    if (!c) continue
    if (!clusterTally.has(c.code)) {
      clusterTally.set(c.code, { name: c.name, code: c.code, enrolled: new Set(), credEarned: new Set() })
    }
    const entry = clusterTally.get(c.code)!
    entry.enrolled.add(row.student_id)
    if (row.credential_earned) entry.credEarned.add(row.student_id)
  }

  const clusterStats: ClusterEnrollmentStat[] = Array.from(clusterTally.values())
    .sort((a, b) => b.enrolled.size - a.enrolled.size)
    .map(({ name, code, enrolled, credEarned }) => ({
      clusterCode: code,
      clusterName: name,
      enrolled: enrolled.size,
      credentialsEarned: credEarned.size,
    }))

  // ── Credential attainment ────────────────────────────────────
  const uniqueIbc = new Set(ibcRows.map(r => r.student_id))
  const uniqueDc = new Set(dcRows.map(r => r.student_id))

  const attainment: CredentialAttainmentSummary = {
    totalPathwayStudents: pathwayStudentIds.size,
    credentialsEarned: credEarnedStudentIds.size,
    ibcEarned: uniqueIbc.size,
    dualCreditStudents: uniqueDc.size,
  }

  return {
    totalStudents912: allStudents.length,
    campusStats,
    subgroupStats,
    clusterStats,
    attainment,
  }
}
