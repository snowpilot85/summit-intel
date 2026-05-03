# Data Ingestion Architecture

> **Audience.** Engineers building or maintaining ingestion paths
> into Summit Insights — SIS connectors, College Board score files,
> THECB transcript imports, manual CSV uploads, admin recomputes.

## Philosophy

Every external data source is treated the same way: a `source_type`
enum value, a connector that knows how to read from that source, and
a `sync_jobs` row recording what happened. The internal data model
does not change when we add a new connector.

This is the spine the future SIS and College Board integrations
will plug into. SIS-readiness here means **connector swap, not
schema rebuild**.

## The two foundation tables

### `student_external_ids`

Decouples our internal `students.id` UUID from the identifiers each
external system uses. The same student can simultaneously be:

| source_type           | external_id example         | who issues it          |
| --------------------- | --------------------------- | ---------------------- |
| `sis_skyward`         | `123456`                    | district SIS instance  |
| `sis_powerschool`     | `STU-99887`                 | district SIS instance  |
| `college_board_ssd`   | `1100012345`                | College Board          |
| `thecb_unique_id`     | `9-digit number`            | TX higher-ed coord. board |
| `state_tea_id`        | `XXX-XXX-XXXX`              | TEA                    |
| `peims_id`            | `9-digit number`            | TEA / district PEIMS   |
| `manual`              | freeform                    | admin override         |

Connector code resolves a student by `(source_type, external_id)`
before writing through to our UUID. The `students` table never
holds external identifiers (other than `tsds_id`, which exists for
historical reasons and may be migrated to a `state_tea_id` external
id row in a future cleanup).

**`is_primary`**. A student migrating from one Skyward instance to
another can briefly hold two `sis_skyward` rows. Exactly one is
primary at any time, enforced by a partial unique index. Connectors
should treat the primary row as authoritative for sync conflicts.

**`unique (source_type, external_id)`**. Two students cannot share
the same Skyward ID. If a connector hits this constraint, it has
detected a duplicate or a re-issued ID and must surface it as a
sync error rather than silently overwriting.

### `sync_jobs`

One row per ingestion run. Whether the run is a Skyward nightly
pull, an admin's CSV upload, or a manual recompute, it writes here
with timing, status, row counts, and an error log.

| job_type                  | When                                                |
| ------------------------- | --------------------------------------------------- |
| `student_sync`            | SIS roster pulls (full or delta)                    |
| `assessment_import`       | College Board / ACT / TSIA score files              |
| `credential_import`       | IBC / Level I/II certificates from THECB or vendor  |
| `csv_student_upload`      | Admin CSV with student records                      |
| `csv_assessment_upload`   | Admin CSV with assessment scores                    |
| `manual_recompute`        | Admin-triggered `recomputeDistrict` runs            |

Status transitions: `pending` → `running` → (`success` |
`partial_failure` | `failed`). Connectors are responsible for moving
the row through the lifecycle and writing the row counts +
`error_log` JSON before marking the job complete.

`triggered_by` is nullable so system runs (cron-driven SIS sync)
can omit it. Admin actions populate it from the auth user id.

### Granularity rule

`sync_jobs` records **runs**, not records. Per-student writes inside
a run are not logged here — that would create thousands of rows per
district sync and bury the meaningful audit signal. The error log
JSON inside a single sync_jobs row is the right place for
per-record failures.

The recompute service implements this rule:
`recomputeStudent` writes nothing to `sync_jobs`;
`recomputeDistrict` writes one row per call (when `triggered_by` is
provided).

## Adding a new connector

Walk-through for adding, e.g., Skyward. No schema changes required.

1. Implement a connector module under `lib/ingest/skyward/`. The
   connector:
   - Reads from the Skyward API (or a vendor-provided file feed).
   - For each external row, looks up the matching Summit student
     via `student_external_ids` `(source_type='sis_skyward', external_id=<sis id>)`.
   - On a hit, updates the Summit student.
   - On a miss, either creates a new student + external_id row, or
     queues the row in `error_log` for human review — connector's
     choice based on its tolerance for new students.
2. Wrap each run in a `sync_jobs` row:
   - Insert with `status='running'`, `source_type='sis_skyward'`,
     `source_identifier='<district_slug>_skyward'`,
     `job_type='student_sync'` (or `assessment_import`, etc.),
     `triggered_by` if applicable.
   - On completion, update `status`, `finished_at`, row counts,
     `error_log`.
3. After ingestion, call `recomputeDistrict(districtId, opts)` to
   refresh per-student CCMR status. Pass the same `triggered_by` so
   the recompute is attributable to the same admin (or omit it for
   automated nightly pulls).
4. Done. No tables, no enums, no derivation logic to change.

## What's intentionally not yet here (deferred)

- **Per-field provenance**. Currently a student row records its
  values without recording which source last touched each field.
  When two connectors disagree (e.g. SIS says grade 11, College
  Board file says grade 12), we have no record of who wrote what
  last. A future `field_provenance` table or per-column metadata
  will close this. For now, last-write-wins is acceptable because
  there is one connector path (CSV upload).
- **Sync reconciliation rules**. When a delta SIS pull doesn't
  include a student we've already seen, is the student withdrawn,
  transferred, or did the delta query miss them? Today we make no
  inference. The reconciliation rules will need a `reconciliation_
  policy` per source_type with policies like "absence_means_
  withdrew" vs. "absence_means_no_change."
- **Conflict resolution policy**. When two `student_external_ids`
  rows disagree about which Summit student a given external id
  belongs to, who wins? Today, the unique constraint refuses the
  second insert; that surfaces the conflict but doesn't resolve
  it. A future policy might be source-priority-based ("SIS
  primary > manual override > College Board match"), with an
  admin UI for reviewing conflicts.
- **Rate-limited / paginated long-running syncs**. The current
  recomputeDistrict loop is sequential with batching but doesn't
  support resumability. Long-running SIS syncs that span hours
  will need a job runner with checkpointing — likely Supabase Edge
  Functions or a queue worker, not the current serverless route
  handler model.
- **Outbound integrations**. Today everything writes inward. When
  Summit needs to push scheduling or roster updates back to a SIS,
  that's a different shape entirely (transactional writes, retry
  semantics, idempotency keys) and belongs in a separate doc.

## Relationship to existing tables

- **`data_uploads`** is preserved. It pre-dates `sync_jobs` and was
  the audit table for the CSV upload flow. The migration backfills
  every historical row into `sync_jobs` so the audit log is
  continuous, but the existing CSV upload code still writes to
  `data_uploads`. Aligning the CSV flow with `sync_jobs` is a
  follow-up — do it before adding the second connector, not before
  the first.
- **`student_assessments`** continues to be the assessment-of-record
  table. Connectors write here as before; the
  `(source_type, external_id)` resolution happens inside connector
  code on the read side, not on the write side.

## Outcomes Bonus calculator — independence

The OB calculator at `/pathways/outcomes-bonus` reads from
`ccmr_ob_data` (TEA-published award data on graduated cohorts). It
does not consume per-student CCMR or assessment data and is not
affected by anything in this doc. SIS connectors are not involved
in the OB calculator, by design.
