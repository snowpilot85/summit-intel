-- ============================================================
-- Summit Intel — Student Assessments + SAT Ingestion
-- Migration: 20260421000001_student_assessments
-- ============================================================

-- ============================================================
-- STUDENT ASSESSMENTS
-- One row per student per assessment type — stores latest scores
-- and the full raw payload for future re-processing.
-- ============================================================

create table if not exists student_assessments (
  id               uuid primary key default gen_random_uuid(),
  student_id       uuid not null references students(id) on delete cascade,
  district_id      uuid not null references districts(id) on delete cascade,
  assessment_type  text not null
                     check (assessment_type in ('sat','act','tsia','ap','ib','staar')),
  assessment_date  date,
  raw_data         jsonb not null default '{}',    -- full source-file row for re-derivation

  -- SAT
  sat_ebrw         int,
  sat_math         int,
  sat_total        int,

  -- ACT
  act_english      int,
  act_math         int,
  act_reading      int,
  act_composite    int,

  -- TSIA2
  tsia_elar        int,
  tsia_math        int,
  tsia_essay       int,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  -- One row per student per assessment type — upsert target
  unique (student_id, assessment_type)
);

create index if not exists student_assessments_student_type_idx
  on student_assessments(student_id, assessment_type);

create index if not exists student_assessments_district_id_idx
  on student_assessments(district_id);

create trigger student_assessments_updated_at
  before update on student_assessments
  for each row execute function set_updated_at();


-- ============================================================
-- ADD derivation_source TO ccmr_indicators
-- Tracks which data source satisfied the indicator
-- (e.g. 'sat', 'tsia', 'act', 'staar', 'tracker')
-- ============================================================

alter table ccmr_indicators
  add column if not exists derivation_source text;


-- ============================================================
-- EXTEND data_uploads source_type CHECK
-- Add 'sat_scores' as a valid source type
-- ============================================================

alter table data_uploads
  drop constraint if exists data_uploads_source_type_check;

alter table data_uploads
  add constraint data_uploads_source_type_check
    check (source_type in (
      'region_13_tracker',
      'tea_ccmr_tracker',
      'sat_scores',
      'sat_act_scores',
      'tsia_results',
      'cte_ibc_data',
      'dual_credit_transcripts',
      'custom_csv'
    ));


-- ============================================================
-- RLS
-- ============================================================

alter table student_assessments enable row level security;

-- Authenticated users read assessments scoped to their district
create policy "users read own district assessments"
  on student_assessments for select
  using (
    district_id in (
      select district_id from user_profiles where id = auth.uid()
    )
  );

-- Write access via service-role (admin client) only at app layer
create policy "service role manages assessments"
  on student_assessments for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');


-- ============================================================
-- SAT K12 ESR reporting format seed (Texas)
-- ============================================================

insert into state_reporting_formats
  (state_id, format_code, name, description, file_types, column_spec)
values
  (
    'a1000001-0000-0000-0000-000000000001',
    'sat_k12_esr',
    'SAT K12 ESR Score File (College Board)',
    'Educator Score Report file from College Board containing SAT scores for your district. Students are matched by State Student ID (TSDS).',
    '{csv}',
    '{
      "required_columns": [
        "STATE_STUDENT_ID",
        "NAME_FIRST",
        "NAME_LAST",
        "LATEST_SAT_TOTAL",
        "LATEST_SAT_EBRW",
        "LATEST_SAT_MATH_SECTION"
      ],
      "optional_columns": [
        "CB_ID",
        "BIRTH_DATE",
        "GRAD_DATE",
        "COHORT_YEAR",
        "LATEST_SAT_DATE",
        "EBRW_CCR_BENCHMARK",
        "MATH_CCR_BENCHMARK"
      ],
      "column_map": {
        "STATE_STUDENT_ID":        "tsds_id",
        "NAME_FIRST":              "first_name",
        "NAME_LAST":               "last_name",
        "LATEST_SAT_DATE":         "assessment_date",
        "LATEST_SAT_TOTAL":        "sat_total",
        "LATEST_SAT_EBRW":         "sat_ebrw",
        "LATEST_SAT_MATH_SECTION": "sat_math"
      },
      "detection_hints": ["STATE_STUDENT_ID", "LATEST_SAT_EBRW", "LATEST_SAT_MATH_SECTION", "CB_ID"]
    }'::jsonb
  )
on conflict (state_id, format_code) do nothing;
