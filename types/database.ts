import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================
// STRING LITERAL UNIONS (mirrors DB CHECK constraints)
// ============================================================

export type CCMRReadiness = 'met' | 'on_track' | 'almost' | 'at_risk' | 'too_early'

export type IndicatorType =
  | 'tsi_reading'
  | 'tsi_math'
  | 'sat_reading'
  | 'sat_math'
  | 'act_reading'
  | 'act_math'
  | 'college_prep_ela'
  | 'college_prep_math'
  | 'ap_exam'
  | 'ib_exam'
  | 'dual_credit_ela'
  | 'dual_credit_math'
  | 'dual_credit_any'
  | 'onramps'
  | 'ibc'
  | 'associate_degree'
  | 'level_i_ii_certificate'
  | 'military_enlistment'
  | 'iep_completion'
  | 'sped_advanced_degree'

export type IndicatorStatus = 'met' | 'in_progress' | 'not_attempted' | 'not_met'

export type InterventionStatus =
  | 'recommended'
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'expired'
  | 'dismissed'

export type UploadSourceType =
  // Active upload types
  | 'region_13_tracker'
  | 'tea_ccmr_tracker'
  | 'sat_scores'
  | 'act_scores'
  | 'tsia_results'
  | 'peims_fall_snapshot'
  | 'peims_summer_submission'
  | 'trex_transcript'
  | 'dual_credit_transcript'
  // Legacy values — kept for backward compatibility with existing rows
  | 'sat_act_scores'
  | 'cte_ibc_data'
  | 'dual_credit_transcripts'
  | 'custom_csv'

export type AssessmentType = 'sat' | 'act' | 'tsia' | 'ap' | 'ib' | 'staar'

export type UploadStatus = 'processing' | 'completed' | 'completed_with_errors' | 'failed'

export type UserRole = 'district_admin' | 'campus_admin' | 'counselor' | 'viewer' | 'super_admin'

// ============================================================
// ROW TYPES — exported for use throughout the app
// ============================================================

export type AccountabilitySystem = 'tea_af' | 'placeholder'

export type CareerClusterFramework = 'advance_cte_16' | 'tea_16'

export type CredentialType =
  | 'certification'
  | 'license'
  | 'associate_degree'
  | 'level_i_certificate'
  | 'level_ii_certificate'
  | 'apprenticeship'
  | 'military_enlistment'
  | 'other'

export type PartnerType =
  | 'esc'
  | 'community_college'
  | 'workforce_board'
  | 'state_agency'
  | 'higher_ed'
  | 'industry'
  | 'other'

// ============================================================
// STATE CONFIGURATION ROW TYPES
// ============================================================

export type StateRow = {
  id: string
  name: string
  code: string                              // 'TX', 'CT', etc.
  accountability_system: AccountabilitySystem
  career_cluster_framework: CareerClusterFramework
  settings: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

export type StateCareerClusterRow = {
  id: string
  state_id: string
  code: string                              // 'HLTH', 'INFO', etc.
  name: string
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export type StateCredentialRow = {
  id: string
  state_id: string
  cluster_code: string
  name: string
  issuing_body: string | null
  credential_type: CredentialType
  is_ccmr_eligible: boolean
  passing_score: string | null
  exam_window_notes: string | null
  metadata: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

export type StateAccountabilityConfigRow = {
  id: string
  state_id: string
  label: string
  system_type: string
  effective_year: number
  is_current: boolean
  config: Record<string, unknown>
  notes: string | null
  created_at: string
  updated_at: string
}

export type StatePartnershipRow = {
  id: string
  state_id: string
  name: string
  partner_type: PartnerType
  region_code: string | null
  website: string | null
  contact_info: Record<string, unknown>
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type StateReportingFormatRow = {
  id: string
  state_id: string
  format_code: string
  name: string
  description: string | null
  file_types: string[]
  column_spec: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

export type DistrictRow = {
  id: string
  state_id?: string | null                  // FK → states; null for unassigned districts
  name: string
  tea_district_id: string | null
  esc_region: number | null
  state_avg_ccmr_rate: number | null
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type CampusRow = {
  id: string
  district_id: string
  name: string
  tea_campus_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type SchoolYearRow = {
  id: string
  district_id: string
  label: string
  start_date: string
  end_date: string
  is_current: boolean
  graduation_date: string | null
  created_at: string
}

export type StudentRow = {
  id: string
  district_id: string
  campus_id: string
  tsds_id: string
  first_name: string
  last_name: string
  grade_level: number
  graduation_year: number
  // Phase 1 CCMR — cohort modeling. cohort_year drives methodology
  // routing; entry_grade_9_year is the canonical PEIMS field. The
  // entry_grade_9_year column stays nullable until the SIS
  // integration backfills it from PEIMS; cohort_year is required.
  entry_grade_9_year: number | null
  cohort_year: number
  cohort_status: CohortStatus
  is_eb: boolean
  is_econ_disadvantaged: boolean
  is_special_ed: boolean
  is_504: boolean
  ed_form_collected: boolean
  ed_form_date: string | null
  ccmr_readiness: CCMRReadiness
  ccmr_met_date: string | null
  indicators_met_count: number
  metadata: Record<string, unknown>
  is_active: boolean
  created_at: string
  updated_at: string
}

export type IndicatorRow = {
  id: string
  student_id: string
  indicator_type: IndicatorType
  status: IndicatorStatus
  met_date: string | null
  score: number | null
  threshold: number | null
  course_grade: string | null
  exam_date: string | null
  source_year: string | null
  derivation_source: string | null   // e.g. 'sat', 'tsia', 'act', 'staar', 'tracker'
  notes: string | null
  created_at: string
  updated_at: string
}

export type StudentAssessmentRow = {
  id: string
  student_id: string
  district_id: string
  assessment_type: AssessmentType
  assessment_date: string | null
  raw_data: Record<string, unknown>
  sat_ebrw: number | null
  sat_math: number | null
  sat_total: number | null
  act_english: number | null
  act_math: number | null
  act_reading: number | null
  act_composite: number | null
  tsia_elar: number | null
  tsia_math: number | null
  tsia_essay: number | null
  created_at: string
  updated_at: string
}

export type StudentAssessmentInsert = Omit<StudentAssessmentRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type StudentAssessmentUpdate = Partial<StudentAssessmentInsert>

export type InterventionRow = {
  id: string
  student_id: string
  campus_id: string
  pathway_type: string | null
  title: string
  description: string | null
  status: InterventionStatus
  priority: number
  due_date: string | null
  completed_date: string | null
  assigned_to: string | null
  projected_ccmr_impact: number | null
  notes: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type DataUploadRow = {
  id: string
  district_id: string
  school_year_id: string | null
  file_name: string
  source_type: UploadSourceType
  status: UploadStatus
  records_total: number
  records_imported: number
  records_skipped: number
  records_errored: number
  column_mapping: Record<string, unknown> | null
  error_log: Record<string, unknown>[] | null
  uploaded_by: string | null
  created_at: string
  completed_at: string | null
}

export type UserProfileRow = {
  id: string
  district_id: string | null   // null for super_admin users not tied to a district
  campus_id: string | null
  full_name: string
  role: UserRole
  created_at: string
  updated_at: string
}

export type SnapshotRow = {
  id: string
  district_id: string
  campus_id: string | null
  graduation_year: number
  total_graduates: number
  ccmr_met_count: number
  ccmr_rate: number
  state_avg_rate: number | null
  eb_total: number
  eb_met_count: number
  eb_rate: number | null
  econ_disadv_total: number
  econ_disadv_met: number
  econ_disadv_rate: number | null
  sped_total: number
  sped_met_count: number
  sped_rate: number | null
  indicator_breakdown: Record<string, number>
  created_at: string
}

export type CampusCCMRSummaryRow = {
  district_id: string
  campus_id: string
  campus_name: string
  graduation_year: number
  total_seniors: number
  ccmr_met: number
  at_risk: number
  almost: number
  ccmr_rate: number
  eb_total: number
  eb_met: number
  eb_rate: number | null
  econ_total: number
  econ_met: number
  missing_ed_forms: number
}

export type IndicatorBreakdownRow = {
  district_id: string
  graduation_year: number
  indicator_type: IndicatorType
  student_count: number
}

export type EnrollmentStatus = 'enrolled' | 'completed' | 'withdrawn' | 'transferred'

export type ProgramOfStudyRow = {
  id: string
  state_id: string
  cluster_id: string
  code: string                          // e.g., 'CYBER', 'WELD-TECH'
  name: string
  description: string | null
  cip_code: string | null
  typical_duration_years: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PathwayCredentialRow = {
  id: string
  program_id: string
  credential_id: string
  is_capstone: boolean
  sequence_order: number
  typical_grade: number | null
  notes?: string | null
  created_at: string
}

export type StudentPathwayRow = {
  id: string
  student_id: string
  state_id: string
  cluster_id: string
  program_id: string
  credential_id: string | null
  enrollment_status: EnrollmentStatus
  start_grade: number | null
  enrollment_date: string | null
  expected_completion_date: string | null
  actual_completion_date: string | null
  credential_earned: boolean
  notes: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type LaborMarketDataRow = {
  id: string
  state_id: string
  cluster_id: string
  region_code: string                   // 'statewide' | 'ESC-N'
  data_year: number
  total_jobs: number | null
  annual_job_openings: number | null
  median_annual_salary: number | null
  salary_entry_level: number | null
  salary_experienced: number | null
  growth_rate_pct: number | null
  top_occupations: Record<string, unknown>[]
  data_source: string | null
  created_at: string
  updated_at: string
}

// ============================================================
// INSERT / UPDATE TYPES
// ============================================================

export type StateInsert = Omit<StateRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type StateUpdate = Partial<StateInsert>

export type StateCareerClusterInsert = Omit<StateCareerClusterRow, 'id' | 'created_at'> & { id?: string }
export type StateCareerClusterUpdate = Partial<StateCareerClusterInsert>

export type StateCredentialInsert = Omit<StateCredentialRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type StateCredentialUpdate = Partial<StateCredentialInsert>

export type StateAccountabilityConfigInsert = Omit<StateAccountabilityConfigRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type StateAccountabilityConfigUpdate = Partial<StateAccountabilityConfigInsert>

export type StatePartnershipInsert = Omit<StatePartnershipRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type StatePartnershipUpdate = Partial<StatePartnershipInsert>

export type StateReportingFormatInsert = Omit<StateReportingFormatRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type StateReportingFormatUpdate = Partial<StateReportingFormatInsert>

export type DistrictInsert = Omit<DistrictRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type DistrictUpdate = Partial<DistrictInsert>

export type CampusInsert = Omit<CampusRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type CampusUpdate = Partial<CampusInsert>

export type SchoolYearInsert = Omit<SchoolYearRow, 'id' | 'created_at'> & { id?: string }
export type SchoolYearUpdate = Partial<SchoolYearInsert>

export type StudentInsert = Omit<StudentRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type StudentUpdate = Partial<StudentInsert>

export type IndicatorInsert = Omit<IndicatorRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type IndicatorUpdate = Partial<IndicatorInsert>

export type InterventionInsert = Omit<InterventionRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type InterventionUpdate = Partial<InterventionInsert>

export type DataUploadInsert = Omit<DataUploadRow, 'id' | 'created_at'> & { id?: string }
export type DataUploadUpdate = Partial<DataUploadInsert>

export type UserProfileInsert = Omit<UserProfileRow, 'created_at' | 'updated_at'>
export type UserProfileUpdate = Partial<UserProfileInsert>

export type ProgramOfStudyInsert = Omit<ProgramOfStudyRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type ProgramOfStudyUpdate = Partial<ProgramOfStudyInsert>

export type PathwayCredentialInsert = Omit<PathwayCredentialRow, 'id' | 'created_at'> & { id?: string }
export type PathwayCredentialUpdate = Partial<PathwayCredentialInsert>

export type StudentPathwayInsert = Omit<StudentPathwayRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type StudentPathwayUpdate = Partial<StudentPathwayInsert>

export type LaborMarketDataInsert = Omit<LaborMarketDataRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type LaborMarketDataUpdate = Partial<LaborMarketDataInsert>

export type WblActivityType =
  | 'internship'
  | 'job_shadow'
  | 'apprenticeship'
  | 'clinical'
  | 'cooperative_education'
  | 'other'

export type WorkBasedLearningRow = {
  id: string
  student_id: string
  district_id: string
  activity_type: WblActivityType
  employer_name: string
  supervisor_name: string | null
  start_date: string
  end_date: string | null
  hours_completed: number
  is_paid: boolean
  notes: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type WorkBasedLearningInsert = Omit<WorkBasedLearningRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type WorkBasedLearningUpdate = Partial<WorkBasedLearningInsert>

// ============================================================
// PHASE 1 CCMR — methodology config, indicator results, status
// ============================================================

export type CohortStatus = 'active' | 'graduated' | 'withdrew' | 'transferred'

export type MethodologyKey =
  | 'tx_binary'
  | 'tx_tiered_2030'
  | (string & {})  // accept future methodology keys (e.g. tx_weighted_2033)

export type IndicatorCategory = 'college' | 'career' | 'military'

export type TieredStatus = 'foundational' | 'demonstrated' | 'advanced' | 'none'

export type BinaryStatus = 'met' | 'not_met'

export type CcmrIndicatorResultStatus =
  | TieredStatus
  | BinaryStatus

export type CcmrIndicatorResultType =
  | 'tsi'
  | 'ibc'
  | 'level_1_certificate'
  | 'level_2_certificate'
  | 'dual_credit'
  | 'ap'
  | 'ib'
  | 'onramps'
  | 'associate_degree'
  | 'jrotc'
  | 'military_enlistment'
  | 'sped_advanced_diploma'
  | 'workforce_ready_iep'

export type TsiPathwaySource = 'sat' | 'act' | 'tsia' | 'cpc'

export interface CcmrIndicatorResultSourceData {
  tsi_pathway_source?: TsiPathwaySource
  ibc_tier?: 1 | 2 | 3
  certificate_program?: string
  afqt_score?: number
  // Open-ended; ingestion may attach additional provenance fields.
  [key: string]: unknown
}

export type StateAccountabilityMethodologyRow = {
  id: string
  state_code: string
  methodology_key: string
  effective_cohort_year_min: number | null
  effective_cohort_year_max: number | null
  display_name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type CcmrIndicatorResultRow = {
  id: string
  student_id: string
  methodology_key: string
  indicator_type: CcmrIndicatorResultType
  indicator_category: IndicatorCategory
  status: CcmrIndicatorResultStatus
  source_data: CcmrIndicatorResultSourceData
  calculated_at: string
  created_at: string
  updated_at: string
}

export type StudentCcmrStatusRow = {
  student_id: string
  methodology_key: string
  highest_level: CcmrIndicatorResultStatus
  highest_level_category: IndicatorCategory | null
  highest_level_source_indicator_id: string | null
  calculated_at: string
  created_at: string
  updated_at: string
}

export type StateAccountabilityMethodologyInsert =
  Omit<StateAccountabilityMethodologyRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type StateAccountabilityMethodologyUpdate = Partial<StateAccountabilityMethodologyInsert>

export type CcmrIndicatorResultInsert =
  Omit<CcmrIndicatorResultRow, 'id' | 'created_at' | 'updated_at' | 'calculated_at'> & {
    id?: string
    calculated_at?: string
  }
export type CcmrIndicatorResultUpdate = Partial<CcmrIndicatorResultInsert>

export type StudentCcmrStatusInsert =
  Omit<StudentCcmrStatusRow, 'created_at' | 'updated_at' | 'calculated_at'> & {
    calculated_at?: string
  }
export type StudentCcmrStatusUpdate = Partial<StudentCcmrStatusInsert>

// ============================================================
// SIS-READINESS — external IDs + sync job audit log
//
// Plumbing for future SIS / College Board / THECB / TEA connectors.
// Every external data source maps to a source_type enum value;
// every ingestion run logs a sync_jobs row. See docs/architecture.md.
// ============================================================

export type ExternalIdSourceType =
  | 'sis_skyward'
  | 'sis_frontline'
  | 'sis_powerschool'
  | 'sis_infinite_campus'
  | 'sis_other'
  | 'college_board_ssd'
  | 'thecb_unique_id'
  | 'state_tea_id'
  | 'peims_id'
  | 'manual'

export type SyncJobType =
  | 'student_sync'
  | 'assessment_import'
  | 'credential_import'
  | 'csv_student_upload'
  | 'csv_assessment_upload'
  | 'manual_recompute'

export type SyncJobStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'partial_failure'
  | 'failed'

export type StudentExternalIdRow = {
  id: string
  student_id: string
  source_type: ExternalIdSourceType
  external_id: string
  is_primary: boolean
  created_at: string
  updated_at: string
}

export type StudentExternalIdInsert =
  Omit<StudentExternalIdRow, 'id' | 'created_at' | 'updated_at'> & { id?: string }
export type StudentExternalIdUpdate = Partial<StudentExternalIdInsert>

export type SyncJobRow = {
  id: string
  source_type: ExternalIdSourceType
  source_identifier: string | null
  job_type: SyncJobType
  district_id: string
  started_at: string
  finished_at: string | null
  status: SyncJobStatus
  rows_inserted: number
  rows_updated: number
  rows_failed: number
  rows_skipped: number
  error_log: Record<string, unknown> | Record<string, unknown>[] | null
  triggered_by: string | null
  created_at: string
  updated_at: string
}

export type SyncJobInsert =
  Omit<SyncJobRow, 'id' | 'created_at' | 'updated_at' | 'started_at'> & {
    id?: string
    started_at?: string
  }
export type SyncJobUpdate = Partial<SyncJobInsert>


// ============================================================
// CCMR OUTCOMES BONUS — TEA Annual Graduates Early Counts
// Source: tea.texas.gov performance reporting, refreshed annually each August.
// ============================================================

export type CcmrObDataRow = {
  cdn: string                          // 6-digit County-District Number, zero-padded
  district_name: string
  county?: string | null               // not present in current table; reserved
  region?: string | null               // not present in current table; reserved

  // Counts by group — null when TEA masks small-cell data
  ed_grads: number | null
  ed_met_ob: number | null
  ed_above_threshold: number | null
  non_ed_grads: number | null
  non_ed_met_ob: number | null
  non_ed_above_threshold: number | null
  sped_grads: number | null
  sped_met_ob: number | null
  sped_above_threshold: number | null

  // Pre-calculated dollars
  ed_earned: number
  non_ed_earned: number
  sped_earned: number
  total_earned: number

  ed_max: number
  non_ed_max: number
  sped_max: number
  total_max: number

  total_left_on_table: number
}

export type CcmrObDataInsert = CcmrObDataRow
export type CcmrObDataUpdate = Partial<CcmrObDataRow>

// ============================================================
// DATABASE TYPE — generic for SupabaseClient<Database>
//
// Row types in this interface use `& Record<string, unknown>` so that
// they satisfy Supabase's internal GenericTable constraint, which checks
// `Row extends Record<string, unknown>` via a conditional type. Plain
// TypeScript object types without an explicit index signature fail that
// check, even though all their property types extend `unknown`.
// The exported Row/Insert/Update types above remain clean for app use.
// ============================================================

type Indexed<T> = T & Record<string, unknown>

export interface Database {
  public: {
    Tables: {
      states: {
        Row: Indexed<StateRow>
        Insert: StateInsert
        Update: StateUpdate
        Relationships: []
      }
      state_career_clusters: {
        Row: Indexed<StateCareerClusterRow>
        Insert: StateCareerClusterInsert
        Update: StateCareerClusterUpdate
        Relationships: []
      }
      state_credential_catalog: {
        Row: Indexed<StateCredentialRow>
        Insert: StateCredentialInsert
        Update: StateCredentialUpdate
        Relationships: []
      }
      state_accountability_config: {
        Row: Indexed<StateAccountabilityConfigRow>
        Insert: StateAccountabilityConfigInsert
        Update: StateAccountabilityConfigUpdate
        Relationships: []
      }
      state_partnerships: {
        Row: Indexed<StatePartnershipRow>
        Insert: StatePartnershipInsert
        Update: StatePartnershipUpdate
        Relationships: []
      }
      state_reporting_formats: {
        Row: Indexed<StateReportingFormatRow>
        Insert: StateReportingFormatInsert
        Update: StateReportingFormatUpdate
        Relationships: []
      }
      districts: {
        Row: Indexed<DistrictRow>
        Insert: DistrictInsert
        Update: DistrictUpdate
        Relationships: []
      }
      campuses: {
        Row: Indexed<CampusRow>
        Insert: CampusInsert
        Update: CampusUpdate
        Relationships: []
      }
      school_years: {
        Row: Indexed<SchoolYearRow>
        Insert: SchoolYearInsert
        Update: SchoolYearUpdate
        Relationships: []
      }
      students: {
        Row: Indexed<StudentRow>
        Insert: StudentInsert
        Update: StudentUpdate
        Relationships: []
      }
      ccmr_indicators: {
        Row: Indexed<IndicatorRow>
        Insert: IndicatorInsert
        Update: IndicatorUpdate
        Relationships: []
      }
      interventions: {
        Row: Indexed<InterventionRow>
        Insert: InterventionInsert
        Update: InterventionUpdate
        Relationships: []
      }
      data_uploads: {
        Row: Indexed<DataUploadRow>
        Insert: DataUploadInsert
        Update: DataUploadUpdate
        Relationships: []
      }
      user_profiles: {
        Row: Indexed<UserProfileRow>
        Insert: UserProfileInsert
        Update: UserProfileUpdate
        Relationships: []
      }
      ccmr_annual_snapshots: {
        Row: Indexed<SnapshotRow>
        Insert: Omit<SnapshotRow, 'id' | 'created_at'> & { id?: string }
        Update: Partial<Omit<SnapshotRow, 'id' | 'created_at'>>
        Relationships: []
      }
      programs_of_study: {
        Row: Indexed<ProgramOfStudyRow>
        Insert: ProgramOfStudyInsert
        Update: ProgramOfStudyUpdate
        Relationships: []
      }
      pathway_credentials: {
        Row: Indexed<PathwayCredentialRow>
        Insert: PathwayCredentialInsert
        Update: PathwayCredentialUpdate
        Relationships: []
      }
      student_pathways: {
        Row: Indexed<StudentPathwayRow>
        Insert: StudentPathwayInsert
        Update: StudentPathwayUpdate
        Relationships: []
      }
      labor_market_data: {
        Row: Indexed<LaborMarketDataRow>
        Insert: LaborMarketDataInsert
        Update: LaborMarketDataUpdate
        Relationships: []
      }
      work_based_learning: {
        Row: Indexed<WorkBasedLearningRow>
        Insert: WorkBasedLearningInsert
        Update: WorkBasedLearningUpdate
        Relationships: []
      }
      ccmr_ob_data: {
        Row: Indexed<CcmrObDataRow>
        Insert: CcmrObDataInsert
        Update: CcmrObDataUpdate
        Relationships: []
      }
      state_accountability_methodologies: {
        Row: Indexed<StateAccountabilityMethodologyRow>
        Insert: StateAccountabilityMethodologyInsert
        Update: StateAccountabilityMethodologyUpdate
        Relationships: []
      }
      ccmr_indicator_results: {
        Row: Indexed<CcmrIndicatorResultRow>
        Insert: CcmrIndicatorResultInsert
        Update: CcmrIndicatorResultUpdate
        Relationships: []
      }
      student_ccmr_status: {
        Row: Indexed<StudentCcmrStatusRow>
        Insert: StudentCcmrStatusInsert
        Update: StudentCcmrStatusUpdate
        Relationships: []
      }
      student_external_ids: {
        Row: Indexed<StudentExternalIdRow>
        Insert: StudentExternalIdInsert
        Update: StudentExternalIdUpdate
        Relationships: []
      }
      sync_jobs: {
        Row: Indexed<SyncJobRow>
        Insert: SyncJobInsert
        Update: SyncJobUpdate
        Relationships: []
      }
    }
    Views: {
      v_campus_ccmr_summary: {
        Row: Indexed<CampusCCMRSummaryRow>
        Relationships: []
      }
      v_indicator_breakdown: {
        Row: Indexed<IndicatorBreakdownRow>
        Relationships: []
      }
      v_ccmr_score_tiered: {
        Row: Indexed<{
          district_id: string
          campus_id: string
          cohort_year: number
          annual_grads: number
          foundational_plus: number
          demonstrated_plus: number
          advanced_count: number
          ccmr_raw_score: number
        }>
        Relationships: []
      }
      v_ccmr_score_binary: {
        Row: Indexed<{
          district_id: string
          campus_id: string
          cohort_year: number
          annual_grads: number
          ccmr_met: number
          ccmr_rate: number
        }>
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Typed Supabase client — first param in every query function
export type TypedSupabaseClient = SupabaseClient<Database>
