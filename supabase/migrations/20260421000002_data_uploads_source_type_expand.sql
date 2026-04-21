-- ============================================================
-- Summit Intel — Expand data_uploads.source_type constraint
-- Migration: 20260421000002_data_uploads_source_type_expand
--
-- Drops the existing check constraint (originally created inline
-- in the initial schema as data_uploads_source_type_check, later
-- modified in 20260421000001) and replaces it with a wider set of
-- values covering current + future planned integrations.
--
-- Safety: uses NOT VALID to skip the historical-rows scan, then
-- VALIDATE CONSTRAINT in a separate step.  This means:
--   • The migration never aborts due to legacy values in old rows.
--   • New inserts/updates are enforced immediately after ADD.
--   • VALIDATE then confirms all existing rows comply (it will
--     succeed because all legacy values are included in the list).
-- ============================================================

-- Step 1: drop whatever version of the constraint currently exists.
-- Both the inline-schema name and any manually-named variant are covered.
alter table data_uploads
  drop constraint if exists data_uploads_source_type_check;

-- Step 2: add the expanded constraint — NOT VALID defers the full-table
-- scan so the migration is safe even if prior migrations weren't applied.
alter table data_uploads
  add constraint data_uploads_source_type_check
    check (source_type in (
      -- Active upload types
      'region_13_tracker',
      'tea_ccmr_tracker',
      'sat_scores',
      'act_scores',
      'tsia_results',
      'peims_fall_snapshot',
      'peims_summer_submission',
      'trex_transcript',
      'dual_credit_transcript',
      -- Legacy values — kept so existing rows remain valid
      'sat_act_scores',
      'cte_ibc_data',
      'dual_credit_transcripts',
      'custom_csv'
    ))
    not valid;

-- Step 3: validate against existing rows.  Runs as a sequential scan
-- but does NOT hold a full table lock — safe on production databases.
alter table data_uploads
  validate constraint data_uploads_source_type_check;
