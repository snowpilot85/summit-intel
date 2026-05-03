# CCMR Methodology — Phase 1 Architecture

> **Audience.** Engineers and PMs working on the Summit Insights CCMR
> module. This doc explains the dual-methodology architecture, the
> rules encoded in the derivation library, and the contract between
> ingestion, the recompute service, and the UI.

## TL;DR

Texas CCMR is bifurcating. Two rule sets coexist for years:

| Methodology key   | Cohort range    | Result shape                                        |
| ----------------- | --------------- | --------------------------------------------------- |
| `tx_binary`       | ≤ cohort 2029   | `met` / `not_met`                                   |
| `tx_tiered_2030`  | ≥ cohort 2030   | `foundational` / `demonstrated` / `advanced` / `none` |

Cohort year = `entry_grade_9_year + 4`. NOT `graduation_year` — the
latter drifts when a student is retained or accelerates and would
silently re-route the student onto the wrong rule set.

A district in 2026 has cohorts on **both** rule sets simultaneously.
The system never blends scores across methodologies; rollups are
always per-cohort.

## Schema layer

| Table / view                          | Purpose                                                           |
| ------------------------------------- | ----------------------------------------------------------------- |
| `students.entry_grade_9_year`         | PEIMS-sourced. Nullable until SIS integration is wired up.        |
| `students.cohort_year`                | `= entry_grade_9_year + 4`. **NOT NULL** — drives methodology routing. |
| `students.cohort_status`              | `active` / `graduated` / `withdrew` / `transferred`.              |
| `state_accountability_methodologies`  | Table-driven methodology registry, cohort year ranges.            |
| `ccmr_indicator_results`              | Per-indicator derived row, methodology-aware. Snapshots key.      |
| `student_ccmr_status`                 | Per-student highest-level snapshot. Drives the score views.       |
| `v_ccmr_score_tiered`                 | Tiered three-percentage rollup per (campus, cohort_year).         |
| `v_ccmr_score_binary`                 | Binary rate rollup per (campus, cohort_year).                     |
| `get_methodology_for_student(uuid)`   | SQL helper: returns methodology_key for a student.                |

The legacy `ccmr_indicators` table is preserved unchanged; binary
ingestion continues to write into it.

## Critical rules (encoded in `lib/ccmr/derive-tiered.ts`)

### 1. Highest-level scoring

A student's score-driving level is the **maximum tier across all
indicators**. A student with Foundational on TSI and Advanced on a
Tier 1 IBC gets credit for Advanced (career), not for both. The
`highest_level_source_indicator_id` column records which indicator
won, so the UI can show the contributing source.

Tie-break (same tier in multiple categories): College > Career >
Military. This is arbitrary but stable; revisit if product wants a
different priority.

### 2. Three-percentage score (tiered cohorts)

```
score = ( %Foundational+   +   %Demonstrated+   +   %Advanced ) / 3
```

- **Denominator: annual grads** — students with `cohort_status = 'graduated'`
  for that cohort_year on that campus. Not the full cohort start
  count.
- A student counts in `%Foundational+` if their highest level is
  Foundational, Demonstrated, or Advanced (each tier is cumulative).
- A student counts in `%Demonstrated+` if D or A.
- A student counts in `%Advanced` only if Advanced.

Encoded in `v_ccmr_score_tiered`.

### 3. CPC downgrade rule

If TSI is satisfied via an approved College Prep Course in either
subject, the TSI indicator caps at **Foundational** regardless of any
SAT/ACT/TSIA component that would otherwise qualify it as
Demonstrated. The downgrade triggers only when CPC is the *only*
satisfier for a subject — if the student has both a tested pathway
*and* CPC, the tested pathway wins.

`source_data.tsi_pathway_source` is `'cpc'` when the downgrade fires.

### 4. TSI Math + RLA gate (hard)

A student with SAT Math passing but no TSI Reading equivalent earns
**nothing** from the TSI pathway. Both subjects must be satisfied by
some pathway (tested or CPC) before TSI returns anything other than
`none`. Encoded as the first check in `deriveTsi`.

### 5. CTE credentials — three distinct types

| Indicator type        | Source     | Reporter         |
| --------------------- | ---------- | ---------------- |
| `ibc`                 | Industry   | District         |
| `level_1_certificate` | Comm. coll | THECB            |
| `level_2_certificate` | Comm. coll | THECB            |

Never conflate these. They live in three separate columns in
`TieredDerivationInput` and produce three separate
`ccmr_indicator_results` rows.

### 6. Per-cohort segmentation rule (load-bearing)

A district visible in 2026 may show cohorts 2027–2032: 2027–2029 on
binary, 2030–2032 on tiered. **Aggregated "% CCMR met" across mixed
cohorts is meaningless and must NOT be displayed as a single
number.** UI components must render cohorts as separate rows or chart
series. The `v_ccmr_score_*` views are deliberately keyed on
`cohort_year`; do not attempt to GROUP BY `(district, campus)` alone.

### 7. Methodology snapshot (historical preservation)

Once a cohort has graduated, its methodology is locked. The
`student_ccmr_status` and `ccmr_indicator_results` tables both store
`methodology_key` at calculation time, so a row written in 2031 under
`tx_tiered_2030` remains interpretable forever, even if a future
methodology supersedes it for active cohorts.

`recomputeDistrict` defaults to `cohort_status = 'active'` and skips
graduated cohorts. Override with `includeGraduated: true` only to
fix a bug that requires backfilling locked records — and document the
reason.

### 8. Recompute pattern (NOT a Postgres trigger)

`lib/ccmr/recompute.ts` is invoked from app code:

- After every assessment ingestion in `app/pathways/data-upload/actions.ts`
  (TODO — see "Follow-up integration points" below).
- After every indicator change written by counselor UI workflows.
- Manually, for bulk corrections, via `recomputeDistrict(districtId, opts)`.

This is intentional. Triggers hide work; the recompute path needs to
be loggable, profileable, and easy to reason about during a
production incident.

## Outcomes Bonus calculator — independence

The OB calculator at `/pathways/outcomes-bonus` reads from
`ccmr_ob_data`, which is TEA-published award data on already-
graduated cohorts. It is a **simulator** — it does not derive OB
qualification from per-student CCMR data and is not affected by any
of the recompute work in this phase.

Per-student OB pathway tracking and counselor recommendations are a
**separate Phase 2 feature**, not a refactor of the simulator. The
two will coexist.

Do not couple the OB calculator to `student_ccmr_status` until the
Phase 2 design lands.

## Forward-compat flags

### IBC tier cap (TEA 2028)

TEA's 2028 rule caps Tier 3 IBCs at 5% of graduates per campus. A
campus exceeding the cap will have students whose Tier 3 IBC is
earned but does not contribute to the campus's CCMR score. **This is
a separate accountability rule from the tier methodology and is not
implemented here.** When it comes online, expect:

- A campus-level cap evaluator that runs after `student_ccmr_status`
  is populated and produces a per-student "counts toward score" flag.
- The tiered score view (`v_ccmr_score_tiered`) will need a CASE on
  that flag for the `%Foundational+` and `%Advanced` calculations.

Flag this when the team scopes 2028 work.

### HB 8 differential weighting (~2033)

HB 8 introduces differential weighting of CCMR indicators based on
correlation with postsecondary success outcomes. When TEA publishes
the rule details:

1. Add a new methodology row, e.g. `tx_weighted_2033`, with
   `effective_cohort_year_min = 2033`.
2. Add a weighting table keyed by methodology + indicator type.
3. Extend the score view (or add `v_ccmr_score_weighted`) to apply
   per-indicator weights to the highest-level resolution.

The table-driven `state_accountability_methodologies` design exists
specifically so this can ship without code changes to the routing
layer.

## Cohort backfill — complete

Backfill landed in migration `20260428000004_cohort_year_not_null`.
All 2,234 rows have a `cohort_year` populated (range 2026-2029) and
the column is now `NOT NULL`. The `v_students_missing_cohort_data`
review view has been dropped.

`entry_grade_9_year` remains nullable — the synthetic backfill set
it to `graduation_year - 4`, which is a working placeholder until the
SIS integration populates it from PEIMS. When that integration
lands, expect to:

1. Replace the placeholder values with PEIMS-sourced
   `entry_grade_9_year`.
2. Recompute `cohort_year = entry_grade_9_year + 4` for any row
   where the new value differs from the placeholder. Run
   `recomputeDistrict(districtId, { includeGraduated: false })`
   after to refresh `student_ccmr_status` for affected students.
3. Optionally promote `entry_grade_9_year` to NOT NULL in a further
   migration once every row has a real PEIMS value.

We do **not** infer `entry_grade_9_year` from `graduation_year` in
production. A retained 11th-grader has graduation_year = entry+5; an
accelerated junior has entry+3. The placeholder is acceptable only
as a development-stage default.

## Follow-up integration points (not done in this PR)

These files need methodology-aware updates. Listed but not modified
in Phase 1:

| File                                                  | Change required                                                                          |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `app/pathways/data-upload/actions.ts`                 | Call `recomputeStudent` after each assessment write. Build the tiered input adapter.     |
| `lib/db/dashboard.ts`                                 | Replace blended CCMR rate queries with per-cohort, per-methodology rollups.              |
| `lib/db/students.ts`                                  | Surface `cohort_year`, `methodology_key`, `highest_level` in the caseload query.         |
| `components/pathways/student-profile.tsx`             | Methodology-aware badge: tiered students show level + category + source indicator.       |
| `components/pathways/students.tsx`                    | Caseload table: per-row methodology badge + columns appropriate to the student's tier.   |
| `components/pathways/dashboard.tsx`                   | Render cohorts as separate chart series. No blended single-number CCMR rate.             |
| `app/pathways/page.tsx` / `lib/db/dashboard.ts`       | Drive dashboard from `v_ccmr_score_tiered` + `v_ccmr_score_binary`, segmented by cohort. |
| `components/pathways/campus-reports.tsx`              | Same per-cohort segmentation rule. Update the comparison table layout.                   |
| `components/pathways/ccmr-rules.tsx` + `lib/ccmr-rules.ts` | Render both methodologies side-by-side. Add the three TEA tier definitions.          |
| `lib/ccmr.ts`                                         | Keep for binary derivation; eventually deprecate once binary cohorts have graduated.     |

`outcomes-bonus` is intentionally absent from this list — see
"Outcomes Bonus calculator — independence" above.

## Testing strategy

Unit tests (out of scope for this migration PR but tracked):

- `lib/ccmr/derive-tiered.test.ts`
  - TSI Math+RLA gate: math-only and RLA-only inputs produce `none`.
  - CPC downgrade fires when the only satisfier is CPC.
  - CPC + tested pathway in same subject does NOT downgrade.
  - IBC tier 1/2/3 + completer mapping.
  - Non-completer + IBC produces `none`.
  - JROTC AFQT cutoffs at 31 / 50 / 65.
  - `deriveHighestTiered` picks Advanced over Demonstrated regardless of category.
  - Same-tier tie-break uses category priority.
- `lib/ccmr/methodology.test.ts`
  - `resolveMethodology(2029, ...)` → `tx_binary`.
  - `resolveMethodology(2030, ...)` → `tx_tiered_2030`.
  - `resolveMethodology(null, ...)` → null.
- Integration test against a seeded mixed-cohort district verifying
  `v_ccmr_score_tiered` and `v_ccmr_score_binary` produce per-cohort
  rows, never blended.
