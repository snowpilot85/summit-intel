import type { TypedSupabaseClient } from '@/types/database'

// ============================================================
// TYPES
// ============================================================

export type CredentialDetail = {
  id: string
  name: string
  issuingBody: string | null
  credentialType: string
  isCcmrEligible: boolean
  passingScore: string | null
  examWindowNotes: string | null
  // pathway_credentials fields (null when queried directly from catalog)
  isCapstone: boolean | null
  sequenceOrder: number | null
  typicalGrade: number | null
  notes: string | null
}

export type ProgramDetail = {
  id: string
  code: string
  name: string
  description: string | null
  cipCode: string | null
  typicalDurationYears: number
  // Credentials specifically linked to this program via pathway_credentials
  credentials: CredentialDetail[]
}

export type OccupationEntry = {
  title: string
  socCode: string
  medianSalary: number
  annualOpenings: number
}

export type LaborMarketDetail = {
  dataYear: number
  regionCode: string
  totalJobs: number | null
  annualJobOpenings: number | null
  medianAnnualSalary: number | null
  salaryEntryLevel: number | null
  salaryExperienced: number | null
  growthRatePct: number | null
  topOccupations: OccupationEntry[]
  dataSource: string | null
}

export type ClusterDetail = {
  id: string
  code: string
  name: string
  description: string | null
  sortOrder: number
  // District-scoped enrollment stats
  enrolled: number
  credentialsEarned: number
  // Sub-entities
  programs: ProgramDetail[]
  credentials: CredentialDetail[]   // all catalog credentials for this cluster
  laborMarket: LaborMarketDetail | null
  isBilingualAsset: boolean
}

export type ClusterExplorerData = {
  clusters: ClusterDetail[]
  totalDistrictEnrolled: number
}

// Clusters where bilingual candidates earn premium pay
const BILINGUAL_ASSET_CODES = new Set(['HLTH', 'LAWS', 'EDUC', 'HUMS'])

// ============================================================
// QUERY
// ============================================================

export async function getClusterExplorer(
  client: TypedSupabaseClient,
  districtId: string,
): Promise<ClusterExplorerData> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rc = client as any

  // Step 1: get district's state_id
  const { data: districtRow } = await client
    .from('districts')
    .select('state_id')
    .eq('id', districtId)
    .single()
  const stateId = districtRow?.state_id ?? null
  if (!stateId) return { clusters: [], totalDistrictEnrolled: 0 }

  // Step 2: parallel fetch of all reference data + enrollment stats
  const [
    clustersResult,
    programsResult,
    pathwayCredResult,
    catalogResult,
    lmdResult,
    enrollmentResult,
  ] = await Promise.all([
    // All active clusters for the state
    client
      .from('state_career_clusters')
      .select('id, code, name, description, sort_order')
      .eq('state_id', stateId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),

    // Programs of study for the state
    client
      .from('programs_of_study')
      .select('id, code, name, description, cip_code, typical_duration_years, cluster_id')
      .eq('state_id', stateId)
      .eq('is_active', true)
      .order('name', { ascending: true }),

    // Pathway credentials with catalog join — links programs to credentials
    rc
      .from('pathway_credentials')
      .select(
        'id, program_id, credential_id, is_capstone, sequence_order, typical_grade, notes, state_credential_catalog(id, name, issuing_body, credential_type, is_ccmr_eligible, passing_score, exam_window_notes)',
      )
      .order('sequence_order', { ascending: true }),

    // All catalog credentials for this state — for cluster-level display
    client
      .from('state_credential_catalog')
      .select('id, cluster_code, name, issuing_body, credential_type, is_ccmr_eligible, passing_score, exam_window_notes')
      .eq('state_id', stateId)
      .eq('is_active', true)
      .order('name', { ascending: true }),

    // Labor market data for this state — prefer most recent year
    client
      .from('labor_market_data')
      .select('cluster_id, region_code, data_year, total_jobs, annual_job_openings, median_annual_salary, salary_entry_level, salary_experienced, growth_rate_pct, top_occupations, data_source')
      .eq('state_id', stateId)
      .order('data_year', { ascending: false }),

    // District enrollment counts from student_pathways (via students!inner for scoping)
    rc
      .from('student_pathways')
      .select('student_id, cluster_id, credential_earned, students!inner(district_id, is_active)')
      .eq('students.district_id', districtId)
      .eq('students.is_active', true)
      .range(0, 49999),
  ])

  // ── Type shapes ──────────────────────────────────────────────
  type ClusterRow = { id: string; code: string; name: string; description: string | null; sort_order: number }
  type ProgramRow = { id: string; code: string; name: string; description: string | null; cip_code: string | null; typical_duration_years: number; cluster_id: string }
  type CatalogShape = { id: string; name: string; issuing_body: string | null; credential_type: string; is_ccmr_eligible: boolean; passing_score: string | null; exam_window_notes: string | null }
  type PathwayCredRow = { id: string; program_id: string; credential_id: string; is_capstone: boolean; sequence_order: number; typical_grade: number | null; notes: string | null; state_credential_catalog: CatalogShape | null }
  type CatalogRow = { id: string; cluster_code: string; name: string; issuing_body: string | null; credential_type: string; is_ccmr_eligible: boolean; passing_score: string | null; exam_window_notes: string | null }
  type LMDRow = { cluster_id: string; region_code: string; data_year: number; total_jobs: number | null; annual_job_openings: number | null; median_annual_salary: number | null; salary_entry_level: number | null; salary_experienced: number | null; growth_rate_pct: number | null; top_occupations: unknown[]; data_source: string | null }
  type EnrollRow = { student_id: string; cluster_id: string; credential_earned: boolean }

  const clusters = (clustersResult.data ?? []) as ClusterRow[]
  const programs = (programsResult.data ?? []) as ProgramRow[]
  const pathwayCreds = (pathwayCredResult.data ?? []) as PathwayCredRow[]
  const catalog = (catalogResult.data ?? []) as CatalogRow[]
  const lmdRows = (lmdResult.data ?? []) as LMDRow[]
  const enrollRows = (enrollmentResult.data ?? []) as EnrollRow[]

  // ── Build indexes ────────────────────────────────────────────

  // Programs by cluster_id
  const programsByCluster = new Map<string, ProgramRow[]>()
  for (const p of programs) {
    const arr = programsByCluster.get(p.cluster_id) ?? []
    arr.push(p)
    programsByCluster.set(p.cluster_id, arr)
  }

  // Pathway credentials by program_id
  const credsByProgram = new Map<string, PathwayCredRow[]>()
  for (const pc of pathwayCreds) {
    const arr = credsByProgram.get(pc.program_id) ?? []
    arr.push(pc)
    credsByProgram.set(pc.program_id, arr)
  }

  // Catalog credentials by cluster_code
  const catalogByCluster = new Map<string, CatalogRow[]>()
  for (const c of catalog) {
    const arr = catalogByCluster.get(c.cluster_code) ?? []
    arr.push(c)
    catalogByCluster.set(c.cluster_code, arr)
  }

  // Labor market by cluster_id — prefer statewide then regional, take most recent
  const lmdByCluster = new Map<string, LMDRow>()
  for (const row of lmdRows) {
    const existing = lmdByCluster.get(row.cluster_id)
    if (!existing) {
      lmdByCluster.set(row.cluster_id, row)
    } else {
      // Prefer statewide; if same region prefer more recent year
      const existingIsStatewide = existing.region_code === 'statewide'
      const rowIsStatewide = row.region_code === 'statewide'
      if (!existingIsStatewide && rowIsStatewide) {
        lmdByCluster.set(row.cluster_id, row)
      }
    }
  }

  // Enrollment/credential counts by cluster_id
  const enrollByCluster = new Map<string, { enrolled: Set<string>; credEarned: Set<string> }>()
  for (const row of enrollRows) {
    if (!enrollByCluster.has(row.cluster_id)) {
      enrollByCluster.set(row.cluster_id, { enrolled: new Set(), credEarned: new Set() })
    }
    const entry = enrollByCluster.get(row.cluster_id)!
    entry.enrolled.add(row.student_id)
    if (row.credential_earned) entry.credEarned.add(row.student_id)
  }

  // ── Assemble ClusterDetail objects ───────────────────────────
  const result: ClusterDetail[] = clusters.map((c) => {
    const clusterPrograms = programsByCluster.get(c.id) ?? []
    const enrollEntry = enrollByCluster.get(c.id)

    const programDetails: ProgramDetail[] = clusterPrograms.map((p) => {
      const pcs = credsByProgram.get(p.id) ?? []
      const credentials: CredentialDetail[] = pcs.map((pc) => {
        const cat = pc.state_credential_catalog
        return {
          id: pc.id,
          name: cat?.name ?? 'Unknown credential',
          issuingBody: cat?.issuing_body ?? null,
          credentialType: cat?.credential_type ?? 'other',
          isCcmrEligible: cat?.is_ccmr_eligible ?? false,
          passingScore: cat?.passing_score ?? null,
          examWindowNotes: cat?.exam_window_notes ?? null,
          isCapstone: pc.is_capstone,
          sequenceOrder: pc.sequence_order,
          typicalGrade: pc.typical_grade,
          notes: pc.notes,
        }
      })
      return {
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description,
        cipCode: p.cip_code,
        typicalDurationYears: p.typical_duration_years,
        credentials,
      }
    })

    const catalogCreds = catalogByCluster.get(c.code) ?? []
    const credentials: CredentialDetail[] = catalogCreds.map((cat) => ({
      id: cat.id,
      name: cat.name,
      issuingBody: cat.issuing_body,
      credentialType: cat.credential_type,
      isCcmrEligible: cat.is_ccmr_eligible,
      passingScore: cat.passing_score,
      examWindowNotes: cat.exam_window_notes,
      isCapstone: null,
      sequenceOrder: null,
      typicalGrade: null,
      notes: null,
    }))

    const lmd = lmdByCluster.get(c.id) ?? null
    const laborMarket: LaborMarketDetail | null = lmd
      ? {
          dataYear: lmd.data_year,
          regionCode: lmd.region_code,
          totalJobs: lmd.total_jobs,
          annualJobOpenings: lmd.annual_job_openings,
          medianAnnualSalary: lmd.median_annual_salary,
          salaryEntryLevel: lmd.salary_entry_level,
          salaryExperienced: lmd.salary_experienced,
          growthRatePct: lmd.growth_rate_pct,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          topOccupations: (lmd.top_occupations as any[]).map((o) => ({
            title: o.title ?? '',
            socCode: o.soc_code ?? '',
            medianSalary: o.median_salary ?? 0,
            annualOpenings: o.annual_openings ?? 0,
          })),
          dataSource: lmd.data_source,
        }
      : null

    return {
      id: c.id,
      code: c.code,
      name: c.name,
      description: c.description,
      sortOrder: c.sort_order,
      enrolled: enrollEntry?.enrolled.size ?? 0,
      credentialsEarned: enrollEntry?.credEarned.size ?? 0,
      programs: programDetails,
      credentials,
      laborMarket,
      isBilingualAsset: BILINGUAL_ASSET_CODES.has(c.code),
    }
  })

  const totalDistrictEnrolled = new Set(enrollRows.map((r) => r.student_id)).size

  return { clusters: result, totalDistrictEnrolled }
}
