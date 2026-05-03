-- ============================================================
-- Summit Intel — SIS-readiness foundation
-- Migration: 20260428000005_sis_readiness
--
-- Two new tables establish the integration spine:
--
--   student_external_ids: maps a Summit student.id to one or more
--     external identifiers (SIS, College Board SSD, THECB, TEA,
--     PEIMS, manual). Connector code resolves a student by
--     (source_type, external_id) and writes through to our UUID.
--
--   sync_jobs: one row per ingestion run with timing, status,
--     row counts, and error log. SIS connectors, CSV uploads, and
--     manual admin recomputes all write here. data_uploads is
--     left intact and backfilled into sync_jobs as historical
--     records.
--
-- This is plumbing only — no connector logic in this migration.
-- See docs/architecture.md for the ingestion philosophy.
-- ============================================================

-- ============================================================
-- STUDENT_EXTERNAL_IDS
-- ============================================================

create table if not exists student_external_ids (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  source_type   text not null
                  check (source_type in (
                    'sis_skyward',
                    'sis_frontline',
                    'sis_powerschool',
                    'sis_infinite_campus',
                    'sis_other',
                    'college_board_ssd',
                    'thecb_unique_id',
                    'state_tea_id',
                    'peims_id',
                    'manual'
                  )),
  external_id   text not null,
  is_primary    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  -- An external_id is unique within its source — two students cannot
  -- share the same Skyward ID, for example.
  unique (source_type, external_id)
);

create index if not exists student_external_ids_student_source_idx
  on student_external_ids(student_id, source_type);

-- Only one primary mapping per (student, source_type). A student
-- migrating from one Skyward instance to another can have two
-- sis_skyward rows, but only one is_primary=true at a time.
create unique index if not exists student_external_ids_one_primary_per_source
  on student_external_ids(student_id, source_type)
  where is_primary = true;

create trigger student_external_ids_updated_at
  before update on student_external_ids
  for each row execute function set_updated_at();


-- ============================================================
-- SYNC_JOBS
-- ============================================================

create table if not exists sync_jobs (
  id                  uuid primary key default gen_random_uuid(),
  source_type         text not null
                        check (source_type in (
                          'sis_skyward',
                          'sis_frontline',
                          'sis_powerschool',
                          'sis_infinite_campus',
                          'sis_other',
                          'college_board_ssd',
                          'thecb_unique_id',
                          'state_tea_id',
                          'peims_id',
                          'manual'
                        )),
  source_identifier   text,                    -- e.g. 'edinburg_cisd_skyward'
  job_type            text not null
                        check (job_type in (
                          'student_sync',
                          'assessment_import',
                          'credential_import',
                          'csv_student_upload',
                          'csv_assessment_upload',
                          'manual_recompute'
                        )),
  district_id         uuid not null references districts(id) on delete cascade,
  started_at          timestamptz not null default now(),
  finished_at         timestamptz,
  status              text not null default 'pending'
                        check (status in (
                          'pending',
                          'running',
                          'success',
                          'partial_failure',
                          'failed'
                        )),
  rows_inserted       integer not null default 0,
  rows_updated        integer not null default 0,
  rows_failed         integer not null default 0,
  rows_skipped        integer not null default 0,
  error_log           jsonb,
  triggered_by        uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists sync_jobs_district_idx
  on sync_jobs(district_id);
create index if not exists sync_jobs_status_idx
  on sync_jobs(status);
create index if not exists sync_jobs_district_status_started_idx
  on sync_jobs(district_id, status, started_at desc);
create index if not exists sync_jobs_source_type_idx
  on sync_jobs(source_type);

create trigger sync_jobs_updated_at
  before update on sync_jobs
  for each row execute function set_updated_at();


-- ============================================================
-- BACKFILL: historical data_uploads → sync_jobs
--
-- Treat every prior data_uploads row as a successful manual upload.
-- Row counts are not preserved — data_uploads tracked them at the
-- time but their semantics differ from sync_jobs (records vs. rows).
-- Mapping data_uploads.source_type → sync_jobs.job_type:
--
--   tea_ccmr_tracker / region_13_tracker   → csv_student_upload
--   sat_scores / sat_act_scores / tsia_results → csv_assessment_upload
--   peims_fall_snapshot / peims_summer_submission → csv_student_upload
--   trex_transcript / dual_credit_transcript / cte_ibc_data
--                                          → csv_assessment_upload
--   custom_csv (and anything unrecognized) → csv_student_upload
--
-- Historical accuracy isn't critical here — this is to keep the
-- audit log continuous so dashboards can show "last sync" without
-- juggling two tables.
-- ============================================================

insert into sync_jobs (
  source_type,
  source_identifier,
  job_type,
  district_id,
  started_at,
  finished_at,
  status,
  rows_inserted,
  rows_updated,
  rows_failed,
  rows_skipped,
  error_log,
  triggered_by,
  created_at,
  updated_at
)
select
  'manual'                                               as source_type,
  du.file_name                                           as source_identifier,
  case du.source_type
    when 'sat_scores'              then 'csv_assessment_upload'
    when 'sat_act_scores'          then 'csv_assessment_upload'
    when 'tsia_results'            then 'csv_assessment_upload'
    when 'cte_ibc_data'            then 'csv_assessment_upload'
    when 'dual_credit_transcripts' then 'csv_assessment_upload'
    when 'dual_credit_transcript'  then 'csv_assessment_upload'
    when 'trex_transcript'         then 'csv_assessment_upload'
    else                                'csv_student_upload'
  end                                                    as job_type,
  du.district_id,
  du.created_at                                          as started_at,
  coalesce(du.completed_at, du.created_at)               as finished_at,
  'success'                                              as status,
  0, 0, 0, 0,
  null                                                   as error_log,
  du.uploaded_by                                         as triggered_by,
  du.created_at                                          as created_at,
  coalesce(du.completed_at, du.created_at)               as updated_at
from data_uploads du
-- Idempotency: don't double-insert if this migration is re-run.
where not exists (
  select 1 from sync_jobs sj
  where sj.district_id = du.district_id
    and sj.source_identifier = du.file_name
    and sj.started_at = du.created_at
);


-- ============================================================
-- RLS — district-scoped, mirroring the existing students/uploads pattern
-- ============================================================

alter table student_external_ids enable row level security;
alter table sync_jobs enable row level security;

-- student_external_ids: read follows student access; write via service role.
create policy "district users read external ids"
  on student_external_ids for select
  using (
    exists (
      select 1 from students s
      where s.id = student_external_ids.student_id
        and s.district_id = auth_user_district_id()
    )
  );

create policy "service role manages external ids"
  on student_external_ids for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- sync_jobs: district-scoped read, service-role write.
create policy "district users read sync jobs"
  on sync_jobs for select
  using (district_id = auth_user_district_id());

create policy "district admins read all district sync jobs"
  on sync_jobs for select
  using (
    district_id = auth_user_district_id()
    and auth_user_role() in ('district_admin', 'campus_admin')
  );

create policy "service role manages sync jobs"
  on sync_jobs for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
