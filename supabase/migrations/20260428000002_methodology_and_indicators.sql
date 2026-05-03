-- ============================================================
-- Summit Intel — Phase 1 CCMR: methodology config + indicator results
-- Migration: 20260428000002_methodology_and_indicators
--
-- 1. state_accountability_methodologies: table-driven methodology
--    config with cohort year ranges. Designed to accommodate future
--    methodologies (HB 8 differential weighting circa 2033) without
--    code changes.
-- 2. ccmr_indicator_results: per-student per-indicator result row,
--    methodology-aware. Stores tier status + category + source data
--    for explainability. The legacy ccmr_indicators table is left
--    in place (binary cohorts continue to use it) and will be
--    deprecated once tiered ingestion is wired in.
-- ============================================================

-- ============================================================
-- STATE_ACCOUNTABILITY_METHODOLOGIES
-- ============================================================

create table if not exists state_accountability_methodologies (
  id                              uuid primary key default gen_random_uuid(),
  state_code                      char(2) not null,
  methodology_key                 text not null unique,
  effective_cohort_year_min       smallint,
  effective_cohort_year_max       smallint,
  display_name                    text not null,
  description                     text,
  is_active                       boolean not null default true,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now(),
  -- Either bound may be null (open-ended), but at least one must be set.
  check (
    effective_cohort_year_min is not null
    or effective_cohort_year_max is not null
  ),
  -- If both bounds are present, max must be >= min.
  check (
    effective_cohort_year_min is null
    or effective_cohort_year_max is null
    or effective_cohort_year_min <= effective_cohort_year_max
  )
);

create index if not exists state_methodologies_state_idx
  on state_accountability_methodologies(state_code);
create index if not exists state_methodologies_cohort_range_idx
  on state_accountability_methodologies(state_code, effective_cohort_year_min, effective_cohort_year_max);

create trigger state_methodologies_updated_at
  before update on state_accountability_methodologies
  for each row execute function set_updated_at();

-- TX seed: binary (≤2029) and tiered (≥2030).
insert into state_accountability_methodologies
  (state_code, methodology_key, effective_cohort_year_min, effective_cohort_year_max, display_name, description)
values
  ('TX', 'tx_binary',         null, 2029, 'TEA CCMR (Binary, 19 TAC §61.1028)',
    'Met / not met across 17 indicators. In effect for cohorts graduating 2029 or earlier.'),
  ('TX', 'tx_tiered_2030',    2030, null, 'TEA CCMR (Tiered, HB 2 89th Leg.)',
    'Foundational / Demonstrated / Advanced tiers. Highest-level scoring across College, Career, and Military categories. Effective for cohorts entering 9th grade Fall 2026 (graduating 2030) and later.')
on conflict (methodology_key) do nothing;

-- Helper: returns the methodology_key applicable to a student.
-- Joins via student → district → state, then matches cohort_year
-- against the methodology's effective range. Returns NULL if the
-- student has no cohort_year, no district state, or no matching
-- methodology — callers must handle the NULL case.
create or replace function get_methodology_for_student(p_student_id uuid)
returns text
language sql
stable
as $$
  select m.methodology_key
    from students s
    join districts d on d.id = s.district_id
    left join states st on st.id = d.state_id
    join state_accountability_methodologies m
      on m.state_code = st.code
     and (m.effective_cohort_year_min is null or s.cohort_year >= m.effective_cohort_year_min)
     and (m.effective_cohort_year_max is null or s.cohort_year <= m.effective_cohort_year_max)
   where s.id = p_student_id
     and s.cohort_year is not null
     and m.is_active
   order by m.effective_cohort_year_min nulls last
   limit 1;
$$;


-- ============================================================
-- CCMR_INDICATOR_RESULTS
--
-- Per-student per-indicator derived result, methodology-aware.
-- Snapshots methodology_key at calculation time so historical
-- rows remain interpretable after methodology changes.
--
-- status values:
--   binary  → 'met' | 'not_met'
--   tiered  → 'foundational' | 'demonstrated' | 'advanced' | 'none'
-- ============================================================

create table if not exists ccmr_indicator_results (
  id                  uuid primary key default gen_random_uuid(),
  student_id          uuid not null references students(id) on delete cascade,
  methodology_key     text not null,
  indicator_type      text not null
                        check (indicator_type in (
                          -- Tiered + binary share most types; binary-only
                          -- types stay in legacy ccmr_indicators.
                          'tsi',
                          'ibc',
                          'level_1_certificate',
                          'level_2_certificate',
                          'dual_credit',
                          'ap',
                          'ib',
                          'onramps',
                          'associate_degree',
                          'jrotc',
                          'military_enlistment',
                          'sped_advanced_diploma',
                          'workforce_ready_iep'
                        )),
  indicator_category  text not null
                        check (indicator_category in ('college', 'career', 'military')),
  status              text not null
                        check (status in (
                          'not_met', 'met', 'none',
                          'foundational', 'demonstrated', 'advanced'
                        )),
  source_data         jsonb not null default '{}',  -- e.g. { tsi_pathway_source: 'sat' | 'act' | 'tsia' | 'cpc',
                                                    --        ibc_tier: 1|2|3,
                                                    --        certificate_program: text,
                                                    --        afqt_score: int }
  calculated_at       timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (student_id, indicator_type)
);

create index if not exists ccmr_indicator_results_student_idx
  on ccmr_indicator_results(student_id);
create index if not exists ccmr_indicator_results_methodology_idx
  on ccmr_indicator_results(methodology_key);
create index if not exists ccmr_indicator_results_status_idx
  on ccmr_indicator_results(status);

create trigger ccmr_indicator_results_updated_at
  before update on ccmr_indicator_results
  for each row execute function set_updated_at();


-- ============================================================
-- RLS
-- ============================================================

alter table state_accountability_methodologies enable row level security;
alter table ccmr_indicator_results enable row level security;

-- Methodology config is global reference data — readable by any
-- authenticated user, writable only by service role.
create policy "authenticated read methodologies"
  on state_accountability_methodologies for select
  using (auth.role() = 'authenticated' or auth.role() = 'service_role');

create policy "service role manages methodologies"
  on state_accountability_methodologies for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Indicator results follow student access via existing helpers.
create policy "district users read indicator results"
  on ccmr_indicator_results for select
  using (
    exists (
      select 1 from students s
      where s.id = ccmr_indicator_results.student_id
        and s.district_id = auth_user_district_id()
    )
  );

create policy "service role manages indicator results"
  on ccmr_indicator_results for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
