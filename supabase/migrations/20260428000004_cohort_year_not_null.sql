-- ============================================================
-- Summit Intel — Phase 1 CCMR: promote cohort_year to NOT NULL
-- Migration: 20260428000004_cohort_year_not_null
--
-- Follow-up to 20260428000001_cohort_modeling. The 2,234 existing
-- student rows have been backfilled (cohort_year populated for every
-- row, distributed across 2026-2029). With backfill complete:
--
--   1. Add NOT NULL on students.cohort_year so the methodology
--      router can no longer hit a NULL fallback.
--   2. Drop v_students_missing_cohort_data — its purpose was the
--      manual-review queue during backfill, which is now done.
--
-- entry_grade_9_year stays nullable. The synthetic backfill set it
-- to graduation_year - 4, which is a fine placeholder until the SIS
-- integration populates it from PEIMS. No student data is touched
-- here.
-- ============================================================

-- Defensive guard: refuse to add NOT NULL if any row still has a
-- NULL cohort_year. Surfaces the problem with a clear message
-- instead of failing inside the ALTER.
do $$
declare
  null_count integer;
begin
  select count(*) into null_count from students where cohort_year is null;
  if null_count > 0 then
    raise exception
      'Cannot promote students.cohort_year to NOT NULL: % row(s) still NULL. Backfill before retrying.',
      null_count;
  end if;
end$$;

-- The view depends on cohort_year; drop it before changing the
-- column's nullability so we don't fight the dependency tracker.
drop view if exists v_students_missing_cohort_data;

alter table students
  alter column cohort_year set not null;
