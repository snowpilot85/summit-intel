-- ============================================================
-- Summit Intel — Phase 1 CCMR: cohort modeling
-- Migration: 20260428000001_cohort_modeling
--
-- Adds cohort_year, entry_grade_9_year, and cohort_status to
-- students. cohort_year is the load-bearing field for methodology
-- routing — TX cohorts ≤2029 use binary CCMR, ≥2030 use tiered.
--
-- cohort_year is intentionally derived from entry_grade_9_year + 4
-- and NOT from graduation_year, because graduation_year drifts when
-- a student is retained or accelerated — drift would silently shift
-- a student onto the wrong methodology mid-flight.
--
-- entry_grade_9_year is left nullable here; districts populate it
-- from PEIMS during ETL. Existing rows where entry_grade_9_year is
-- unknown are surfaced via v_students_missing_cohort_data so the
-- team can do manual review before the NOT NULL constraint is
-- promoted in a follow-up migration. We do NOT guess.
-- ============================================================

alter table students
  add column if not exists entry_grade_9_year smallint;

alter table students
  add column if not exists cohort_year smallint;

alter table students
  add column if not exists cohort_status text not null default 'active'
    check (cohort_status in ('active', 'graduated', 'withdrew', 'transferred'));

create index if not exists students_cohort_year_idx
  on students(cohort_year);

create index if not exists students_cohort_status_idx
  on students(cohort_status);

create index if not exists students_district_cohort_idx
  on students(district_id, cohort_year, cohort_status);

-- Backfill: only where entry_grade_9_year is known. We do NOT infer
-- from graduation_year, per the methodology spec. Rows missing
-- entry_grade_9_year stay NULL and are surfaced for manual review.
update students
   set cohort_year = entry_grade_9_year + 4
 where cohort_year is null
   and entry_grade_9_year is not null;

-- View: surfaces students that need entry_grade_9_year populated
-- before cohort_year can be derived. Drives a manual-review queue.
create or replace view v_students_missing_cohort_data as
select
  s.id                  as student_id,
  s.district_id,
  s.campus_id,
  s.tsds_id,
  s.first_name,
  s.last_name,
  s.grade_level,
  s.graduation_year,
  s.entry_grade_9_year,
  s.cohort_year,
  s.cohort_status
from students s
where s.cohort_year is null
   or s.entry_grade_9_year is null;

-- NOT NULL on cohort_year is intentionally NOT applied here. It is
-- promoted in a follow-up migration once districts have backfilled
-- entry_grade_9_year via PEIMS ETL and v_students_missing_cohort_data
-- is empty. See docs/methodology.md.
do $$
declare
  missing_count integer;
begin
  select count(*) into missing_count from v_students_missing_cohort_data;
  if missing_count > 0 then
    raise notice
      'Phase 1 cohort backfill: % student row(s) need entry_grade_9_year populated. See v_students_missing_cohort_data. Promote cohort_year to NOT NULL in a follow-up migration after manual review.',
      missing_count;
  end if;
end$$;
