-- ============================================================
-- Summit Intel — Phase 1 CCMR: per-student status + score rollups
-- Migration: 20260428000003_ccmr_status_and_rollups
--
-- 1. student_ccmr_status: per-student highest-level snapshot,
--    populated by the recompute service (lib/ccmr/recompute.ts).
--    NOT a trigger — recompute is invoked from app code so it is
--    debuggable and loggable.
-- 2. v_ccmr_score_tiered: campus × cohort_year tiered score view
--    implementing the three-percentage formula:
--       (% Foundational+ + % Demonstrated+ + % Advanced) / 3
--    Denominator = annual grads (cohort_status = 'graduated' for
--    that cohort_year on that campus).
-- 3. v_ccmr_score_binary: campus × cohort_year binary score view
--    using the existing met/not_met snapshot.
--
-- A blended score across cohorts on different methodologies is
-- intentionally NOT provided — see docs/methodology.md for the
-- per-cohort segmentation rule.
-- ============================================================

create table if not exists student_ccmr_status (
  student_id                          uuid primary key
                                       references students(id) on delete cascade,
  methodology_key                     text not null,
  highest_level                       text not null
                                       check (highest_level in (
                                         -- binary
                                         'met', 'not_met',
                                         -- tiered
                                         'foundational', 'demonstrated', 'advanced', 'none'
                                       )),
  highest_level_category              text
                                       check (highest_level_category in ('college', 'career', 'military')),
  highest_level_source_indicator_id   uuid references ccmr_indicator_results(id) on delete set null,
  calculated_at                       timestamptz not null default now(),
  created_at                          timestamptz not null default now(),
  updated_at                          timestamptz not null default now()
);

create index if not exists student_ccmr_status_methodology_idx
  on student_ccmr_status(methodology_key);
create index if not exists student_ccmr_status_highest_level_idx
  on student_ccmr_status(highest_level);

create trigger student_ccmr_status_updated_at
  before update on student_ccmr_status
  for each row execute function set_updated_at();

alter table student_ccmr_status enable row level security;

create policy "district users read ccmr status"
  on student_ccmr_status for select
  using (
    exists (
      select 1 from students s
      where s.id = student_ccmr_status.student_id
        and s.district_id = auth_user_district_id()
    )
  );

create policy "service role manages ccmr status"
  on student_ccmr_status for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');


-- ============================================================
-- TIERED SCORE ROLLUP VIEW
--
-- Per (district, campus, cohort_year): the three-percentage CCMR
-- raw score for tiered cohorts. Denominator is annual graduates
-- (cohort_status = 'graduated'), matching the TEA framework which
-- treats CCMR as a senior-year graduating-class metric.
--
-- A row only appears for cohorts whose methodology is tx_tiered_2030
-- (or any other methodology_key starting with a tier-aware prefix)
-- so binary cohorts are excluded.
-- ============================================================

create or replace view v_ccmr_score_tiered as
with grads as (
  select
    s.district_id,
    s.campus_id,
    s.cohort_year,
    s.id as student_id
  from students s
  where s.cohort_status = 'graduated'
    and s.cohort_year is not null
),
status_for_grads as (
  select
    g.district_id,
    g.campus_id,
    g.cohort_year,
    g.student_id,
    coalesce(st.highest_level, 'none') as highest_level,
    st.methodology_key
  from grads g
  left join student_ccmr_status st on st.student_id = g.student_id
)
select
  district_id,
  campus_id,
  cohort_year,
  count(*)                                                            as annual_grads,
  count(*) filter (where highest_level in ('foundational','demonstrated','advanced')) as foundational_plus,
  count(*) filter (where highest_level in ('demonstrated','advanced'))                as demonstrated_plus,
  count(*) filter (where highest_level = 'advanced')                                  as advanced_count,
  round(
    (
      100.0 * count(*) filter (where highest_level in ('foundational','demonstrated','advanced'))
      / nullif(count(*), 0)
      +
      100.0 * count(*) filter (where highest_level in ('demonstrated','advanced'))
      / nullif(count(*), 0)
      +
      100.0 * count(*) filter (where highest_level = 'advanced')
      / nullif(count(*), 0)
    ) / 3.0,
    2
  )                                                                                    as ccmr_raw_score
from status_for_grads
where methodology_key is null
   or methodology_key like 'tx_tiered%'
   or methodology_key like '%tiered%'
group by district_id, campus_id, cohort_year;


-- ============================================================
-- BINARY SCORE ROLLUP VIEW
--
-- Per (district, campus, cohort_year): single-rate CCMR score for
-- binary cohorts. Mirrors the legacy v_campus_ccmr_summary metric
-- but groups by cohort_year (not graduation_year) so it stays
-- aligned with the methodology routing.
-- ============================================================

create or replace view v_ccmr_score_binary as
with grads as (
  select
    s.district_id,
    s.campus_id,
    s.cohort_year,
    s.id as student_id
  from students s
  where s.cohort_status = 'graduated'
    and s.cohort_year is not null
),
status_for_grads as (
  select
    g.district_id,
    g.campus_id,
    g.cohort_year,
    g.student_id,
    coalesce(st.highest_level, 'not_met') as highest_level,
    st.methodology_key
  from grads g
  left join student_ccmr_status st on st.student_id = g.student_id
)
select
  district_id,
  campus_id,
  cohort_year,
  count(*)                                              as annual_grads,
  count(*) filter (where highest_level = 'met')         as ccmr_met,
  round(
    100.0 * count(*) filter (where highest_level = 'met')
    / nullif(count(*), 0),
    2
  )                                                      as ccmr_rate
from status_for_grads
where methodology_key is null
   or methodology_key like '%binary%'
group by district_id, campus_id, cohort_year;
