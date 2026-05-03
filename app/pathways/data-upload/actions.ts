"use server";

import { cookies } from "next/headers";
import Papa from "papaparse";
import { createClient } from "@/utils/supabase/server";
import { getAuthContext } from "@/lib/db/users";
import { createUpload, updateUploadStatus } from "@/lib/db/uploads";
import { computeCCMRReadiness, countCCMRPathways } from "@/lib/ccmr";
import { recomputeDistrict } from "@/lib/ccmr/recompute";
import type { TieredDerivationInput } from "@/lib/ccmr/derive-tiered";
import { generateInterventions } from "@/lib/interventions/generate";
import type {
  IndicatorType,
  UploadSourceType,
  StudentInsert,
  StudentUpdate,
  StudentPathwayInsert,
  StudentPathwayUpdate,
  StudentAssessmentInsert,
} from "@/types/database";

// ============================================
// TYPES
// ============================================

export interface ParsedStudentRow {
  tsdsId: string;
  firstName: string;
  lastName: string;
  metIndicators: IndicatorType[];
  demographics?: {
    grade?: number;
    graduationYear?: number;
    campus?: string;
    isEb?: boolean;
    isEconDisadvantaged?: boolean;
    isSpecialEd?: boolean;
    is504?: boolean;
    edFormCollected?: boolean;
    ctePathway?: string;
    cteCertification?: string;
    cteExamDate?: string;
  };
}

export interface ImportResult {
  uploadId: string;
  imported: number;
  skipped: number;
  errored: number;
  errors: string[];
}

// ============================================
// HELPERS
// ============================================

const CURRENT_YEAR = new Date().getFullYear();

/** Grade 12 → current year, grade 11 → current year + 1, etc. */
function gradeToGradYear(grade: number): number {
  return CURRENT_YEAR + (12 - grade);
}

// ─────────────────────────────────────────────────────────────────
// Tiered derivation input builder — placeholder.
//
// CSV ingestion currently produces only legacy ccmr_indicators rows.
// For tiered cohorts (≥ 2030) we don't yet have SIS or PEIMS feeds
// for the new fields (CPC course completions, IBC tier, JROTC AFQT,
// SpEd advanced diploma, workforce-ready IEP, etc.). Until those
// connectors land, we hand `recomputeStudent` a zero-filled
// TieredDerivationInput so it returns 'none' for every indicator.
// The recompute service still snapshots the methodology and writes
// the student_ccmr_status row — this is the right behavior for
// pre-SIS state. Real values will flow once the connectors ship.
// ─────────────────────────────────────────────────────────────────

function emptyTieredInput(): TieredDerivationInput {
  return {
    tsi: {
      rla_via_sat: false,
      rla_via_act: false,
      rla_via_tsia: false,
      rla_via_cpc: false,
      math_via_sat: false,
      math_via_act: false,
      math_via_tsia: false,
      math_via_cpc: false,
    },
    potential_college_credit: {
      ap_pass_count: 0,
      ib_pass_count: 0,
      onramps_credit_hours: 0,
      dual_credit_hours: 0,
    },
    cte: {
      is_completer: false,
      ibc_tier: null,
      has_level_1_certificate: false,
      has_level_2_certificate: false,
    },
    associate_degree: false,
    military_enlistment: false,
    sped_advanced_diploma: false,
    workforce_ready_iep_diploma: false,
    jrotc: {
      enrolled: false,
      afqt_score: null,
    },
  };
}

/**
 * Resolve the auth user id (for sync_jobs.triggered_by) without
 * widening the existing getAuthContext signature. Returns null on
 * any failure — the recompute still runs, just unattributed.
 */
async function getTriggeringUserId(
  supabase: ReturnType<typeof createClient>
): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

type IndicatorInsertRow = {
  student_id: string;
  indicator_type: IndicatorType;
  status: "met";
  met_date: null;
  score: null;
  threshold: null;
  course_grade: null;
  exam_date: null;
  source_year: string;
  notes: null;
};

// ============================================
// IMPORT ACTION
// ============================================

export async function importRows(
  rows: ParsedStudentRow[],
  fileName: string,
  sourceType: UploadSourceType,
  columnMapping: Record<string, string>
): Promise<ImportResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { districtId, queryClient } = await getAuthContext(supabase);

  const errors: string[] = [];
  let errored = 0;

  // ── Create upload record ────────────────────────────────────────────────────
  const upload = await createUpload(queryClient, {
    district_id: districtId,
    file_name: fileName,
    source_type: sourceType,
    records_total: rows.length,
    records_imported: 0,
    records_skipped: 0,
    records_errored: 0,
    column_mapping: columnMapping,
    error_log: null,
    uploaded_by: null,
    school_year_id: null,
    completed_at: null,
  });

  // ── Phase 1: Campus resolution ──────────────────────────────────────────────
  // Collect unique non-empty campus names from the CSV
  const campusNamesInFile = [
    ...new Set(
      rows
        .map((r) => r.demographics?.campus?.trim())
        .filter((c): c is string => !!c)
    ),
  ];

  const { data: existingCampuses } = await queryClient
    .from("campuses")
    .select("id, name")
    .eq("district_id", districtId);

  // name.toLowerCase() → campus_id
  const campusByName = new Map<string, string>(
    (existingCampuses ?? []).map((c) => [c.name.toLowerCase(), c.id])
  );

  // Create any campus names from the CSV that don't exist yet
  const missingCampusNames = campusNamesInFile.filter(
    (n) => !campusByName.has(n.toLowerCase())
  );
  if (missingCampusNames.length > 0) {
    const { data: created, error: campusErr } = await queryClient
      .from("campuses")
      .insert(
        missingCampusNames.map((name) => ({
          district_id: districtId,
          name,
          tea_campus_id: null,
          metadata: {},
        }))
      )
      .select("id, name");
    if (campusErr) {
      errors.push(`Campus creation error: ${campusErr.message}`);
    } else {
      for (const c of created ?? []) {
        campusByName.set(c.name.toLowerCase(), c.id);
      }
    }
  }

  // Fallback campus for rows that don't specify one
  const fallbackCampusId =
    campusByName.size > 0 ? [...campusByName.values()][0] : null;

  if (!fallbackCampusId) {
    const msg =
      "District has no campuses. Create at least one campus before importing students.";
    await updateUploadStatus(queryClient, upload.id, {
      status: "failed",
      error_log: [{ message: msg }],
      completed_at: new Date().toISOString(),
    });
    return {
      uploadId: upload.id,
      imported: 0,
      skipped: 0,
      errored: rows.length,
      errors: [msg],
    };
  }

  // ── Phase 2: Batch-fetch existing students by TSDS ID ──────────────────────
  const tsdsIds = rows.map((r) => r.tsdsId).filter(Boolean);
  const { data: existingStudents, error: studentErr } = await queryClient
    .from("students")
    .select("id, tsds_id, grade_level")
    .eq("district_id", districtId)
    .eq("is_active", true)
    .in("tsds_id", tsdsIds);

  if (studentErr) {
    await updateUploadStatus(queryClient, upload.id, {
      status: "failed",
      error_log: [{ message: studentErr.message }],
      completed_at: new Date().toISOString(),
    });
    throw new Error(`Student lookup failed: ${studentErr.message}`);
  }

  const studentByTsds = new Map(
    (existingStudents ?? []).map((s) => [s.tsds_id, s])
  );
  const existingStudentIds = new Set((existingStudents ?? []).map((s) => s.id));

  // ── Phase 3: Split rows into create vs update ───────────────────────────────
  // processed holds every row we'll touch for indicators + readiness
  type ProcessedRow = {
    row: ParsedStudentRow;
    studentId: string;
    gradeLevel: number;
  };

  const processed: ProcessedRow[] = [];
  const toCreate: { row: ParsedStudentRow; insert: StudentInsert }[] = [];
  const toUpdateDemo: { studentId: string; update: StudentUpdate }[] = [];

  for (const row of rows) {
    const existing = studentByTsds.get(row.tsdsId);
    const d = row.demographics ?? {};
    const campusId =
      (d.campus ? campusByName.get(d.campus.toLowerCase()) : undefined) ??
      fallbackCampusId;
    const grade = d.grade ?? existing?.grade_level ?? 12;
    const gradYear = d.graduationYear ?? gradeToGradYear(grade);

    const cteMeta: Record<string, unknown> = {};
    if (d.ctePathway)       cteMeta.cte_pathway       = d.ctePathway;
    if (d.cteCertification) cteMeta.cte_certification = d.cteCertification;
    if (d.cteExamDate)      cteMeta.cte_exam_date     = d.cteExamDate;

    if (existing) {
      processed.push({ row, studentId: existing.id, gradeLevel: grade });

      // Build demographic update for this existing student
      const update: StudentUpdate = {};
      if (d.grade !== undefined)               update.grade_level           = d.grade;
      if (d.graduationYear !== undefined)      update.graduation_year       = d.graduationYear;
      if (d.isEb !== undefined)                update.is_eb                 = d.isEb;
      if (d.isEconDisadvantaged !== undefined) update.is_econ_disadvantaged = d.isEconDisadvantaged;
      if (d.isSpecialEd !== undefined)         update.is_special_ed         = d.isSpecialEd;
      if (d.is504 !== undefined)               update.is_504                = d.is504;
      if (d.edFormCollected !== undefined)     update.ed_form_collected     = d.edFormCollected;
      if (Object.keys(cteMeta).length > 0)    update.metadata              = cteMeta;
      if (Object.keys(update).length > 0) toUpdateDemo.push({ studentId: existing.id, update });
    } else {
      toCreate.push({
        row,
        insert: {
          district_id: districtId,
          campus_id: campusId!,
          tsds_id: row.tsdsId,
          first_name: row.firstName || "Unknown",
          last_name:  row.lastName  || "Unknown",
          grade_level:       grade,
          graduation_year:   gradYear,
          is_eb:                  d.isEb               ?? false,
          is_econ_disadvantaged:  d.isEconDisadvantaged ?? false,
          is_special_ed:          d.isSpecialEd         ?? false,
          is_504:                 d.is504               ?? false,
          ed_form_collected:      d.edFormCollected     ?? false,
          ed_form_date:     null,
          ccmr_readiness:   "too_early",
          ccmr_met_date:    null,
          indicators_met_count: 0,
          metadata: Object.keys(cteMeta).length > 0 ? cteMeta : {},
          is_active: true,
        },
      });
    }
  }

  // ── Phase 4: Batch-insert new students ────────────────────────────────────
  const INSERT_CHUNK = 100;
  for (let i = 0; i < toCreate.length; i += INSERT_CHUNK) {
    const chunk = toCreate.slice(i, i + INSERT_CHUNK);
    const { data: created, error: createErr } = await queryClient
      .from("students")
      .insert(chunk.map((c) => c.insert))
      .select("id, tsds_id, grade_level");

    if (createErr) {
      errors.push(`Student create error (rows ${i}–${i + chunk.length}): ${createErr.message}`);
      errored += chunk.length;
    } else {
      for (const s of created ?? []) {
        studentByTsds.set(s.tsds_id, s);
        const srcRow = chunk.find((c) => c.insert.tsds_id === s.tsds_id)!.row;
        const d = srcRow.demographics ?? {};
        processed.push({
          row: srcRow,
          studentId: s.id,
          gradeLevel: d.grade ?? s.grade_level,
        });
      }
    }
  }

  // ── Phase 5: Apply demographic updates to existing students ───────────────
  const DEMO_CHUNK = 50;
  for (let i = 0; i < toUpdateDemo.length; i += DEMO_CHUNK) {
    const batch = toUpdateDemo.slice(i, i + DEMO_CHUNK);
    await Promise.all(
      batch.map(({ studentId, update }) =>
        queryClient.from("students").update(update).eq("id", studentId)
      )
    );
  }

  // ── Phase 5.5: CTE pathway resolution ─────────────────────────────────────
  // For each processed row that has a CTE Pathway value, look up the matching
  // program_of_study and (optionally) credential, then upsert a student_pathways row.

  const cteRows = processed.filter((p) => !!p.row.demographics?.ctePathway);

  if (cteRows.length > 0) {
    const { data: districtRow } = await queryClient
      .from("districts")
      .select("state_id")
      .eq("id", districtId)
      .single();

    const stateId = (districtRow as { state_id: string | null } | null)?.state_id ?? null;

    if (!stateId) {
      errors.push("CTE pathways skipped: district has no state_id configured");
    } else {
      // Load all programs and credentials for this state once
      const [{ data: allPrograms }, { data: allCredentials }] = await Promise.all([
        queryClient
          .from("programs_of_study")
          .select("id, name, cluster_id")
          .eq("state_id", stateId)
          .eq("is_active", true),
        queryClient
          .from("state_credential_catalog")
          .select("id, name")
          .eq("state_id", stateId)
          .eq("is_active", true),
      ]);

      // Normalize: lowercase, collapse non-alphanumeric to single spaces
      function norm(s: string): string {
        return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      }

      // 4-tier fuzzy match: exact → DB-starts-with-CSV → CSV-starts-with-DB → all significant words present
      function fuzzyMatch<T extends { name: string }>(
        items: T[] | null,
        csvName: string
      ): T | null {
        if (!items?.length) return null;
        const needle = norm(csvName);
        const needleWords = needle.split(" ").filter((w) => w.length > 2);

        return (
          items.find((x) => norm(x.name) === needle) ??
          items.find((x) => norm(x.name).startsWith(needle)) ??
          items.find((x) => needle.startsWith(norm(x.name))) ??
          (needleWords.length > 0
            ? items.find((x) => {
                const hay = norm(x.name);
                return needleWords.every((w) => hay.includes(w));
              })
            : null) ??
          null
        );
      }

      // Fetch existing student_pathways rows for the CTE student set
      const cteStudentIds = cteRows.map((p) => p.studentId);
      const { data: existingPathways } = await queryClient
        .from("student_pathways")
        .select("id, student_id")
        .in("student_id", cteStudentIds);

      const existingPathwayId = new Map<string, string>(
        (existingPathways ?? []).map((r) => [r.student_id, r.id])
      );

      const pathwayInserts: StudentPathwayInsert[] = [];
      const pathwayUpdates: { id: string; update: StudentPathwayUpdate }[] = [];

      for (const { row, studentId, gradeLevel } of cteRows) {
        const d = row.demographics!;
        const program = fuzzyMatch(allPrograms ?? [], d.ctePathway!);

        if (!program) {
          errors.push(
            `CTE: no program match for "${d.ctePathway}" (TSDS ${row.tsdsId}) — pathway skipped`
          );
          continue;
        }

        const credential = d.cteCertification
          ? fuzzyMatch(allCredentials ?? [], d.cteCertification)
          : null;

        if (d.cteCertification && !credential) {
          errors.push(
            `CTE: no credential match for "${d.cteCertification}" (TSDS ${row.tsdsId}) — pathway linked without credential`
          );
        }

        // credential_earned = true only when cert is present AND IBC indicator is marked met
        const credentialEarned =
          !!credential && row.metIndicators.includes("ibc" as IndicatorType);

        const payload: StudentPathwayInsert = {
          student_id: studentId,
          state_id: stateId,
          cluster_id: program.cluster_id,
          program_id: program.id,
          credential_id: credential?.id ?? null,
          enrollment_status: "enrolled",
          start_grade: gradeLevel,
          enrollment_date: null,
          expected_completion_date: null,
          actual_completion_date: null,
          credential_earned: credentialEarned,
          notes: null,
          metadata: {},
        };

        const existingId = existingPathwayId.get(studentId);
        if (existingId) {
          pathwayUpdates.push({ id: existingId, update: payload });
        } else {
          pathwayInserts.push(payload);
        }
      }

      if (pathwayInserts.length > 0) {
        const { error: insertErr } = await queryClient
          .from("student_pathways")
          .insert(pathwayInserts);
        if (insertErr) {
          errors.push(`CTE pathway insert error: ${insertErr.message}`);
          errored += pathwayInserts.length;
        }
      }

      const PATHWAY_UPDATE_CHUNK = 50;
      for (let i = 0; i < pathwayUpdates.length; i += PATHWAY_UPDATE_CHUNK) {
        const batch = pathwayUpdates.slice(i, i + PATHWAY_UPDATE_CHUNK);
        await Promise.all(
          batch.map(({ id, update }) =>
            queryClient.from("student_pathways").update(update).eq("id", id)
          )
        );
      }
    }
  }

  // ── Phase 6: Upsert indicators ─────────────────────────────────────────────
  const indicatorInserts: IndicatorInsertRow[] = [];
  for (const { row, studentId } of processed) {
    for (const indicatorType of row.metIndicators) {
      indicatorInserts.push({
        student_id: studentId,
        indicator_type: indicatorType,
        status: "met",
        met_date: null,
        score: null,
        threshold: null,
        course_grade: null,
        exam_date: null,
        source_year: "2025-26",
        notes: null,
      });
    }
  }

  const INDICATOR_CHUNK = 500;
  for (let i = 0; i < indicatorInserts.length; i += INDICATOR_CHUNK) {
    const chunk = indicatorInserts.slice(i, i + INDICATOR_CHUNK);
    const { error: upsertErr } = await queryClient
      .from("ccmr_indicators")
      .upsert(chunk, { onConflict: "student_id,indicator_type" });
    if (upsertErr) {
      errors.push(`Indicator upsert error: ${upsertErr.message}`);
      errored += chunk.length;
    }
  }

  // ── Phase 7: Bulk readiness recompute ────────────────────────────────────
  const uniqueIds = [...new Set(processed.map((p) => p.studentId))];
  if (uniqueIds.length > 0) {
    const { data: allIndicators } = await queryClient
      .from("ccmr_indicators")
      .select("student_id, indicator_type, status")
      .in("student_id", uniqueIds);

    const indicatorsByStudent = new Map<string, typeof allIndicators>();
    for (const ind of allIndicators ?? []) {
      const list = indicatorsByStudent.get(ind.student_id) ?? [];
      list.push(ind);
      indicatorsByStudent.set(ind.student_id, list);
    }

    const readinessUpdates = processed.map(({ studentId, gradeLevel }) => {
      const indicators = indicatorsByStudent.get(studentId) ?? [];
      const metCount    = countCCMRPathways(indicators);
      const readiness   = computeCCMRReadiness(indicators, gradeLevel);
      return { id: studentId, ccmr_readiness: readiness, indicators_met_count: metCount };
    });

    const READINESS_CHUNK = 50;
    for (let i = 0; i < readinessUpdates.length; i += READINESS_CHUNK) {
      const batch = readinessUpdates.slice(i, i + READINESS_CHUNK);
      await Promise.all(
        batch.map(({ id, ccmr_readiness, indicators_met_count }) =>
          queryClient
            .from("students")
            .update({ ccmr_readiness, indicators_met_count })
            .eq("id", id)
        )
      );
    }

    // ── Phase 8: Regenerate interventions for affected at-risk/almost seniors ─
    const atRiskIds = readinessUpdates
      .filter((u) => {
        const p = processed.find((pr) => pr.studentId === u.id);
        return (
          p?.gradeLevel === 12 &&
          (u.ccmr_readiness === "at_risk" || u.ccmr_readiness === "almost")
        );
      })
      .map((u) => u.id);

    if (atRiskIds.length > 0) {
      const [{ data: atRiskStudents }, { data: atRiskIndicators }] =
        await Promise.all([
          queryClient.from("students").select("*").in("id", atRiskIds),
          queryClient
            .from("ccmr_indicators")
            .select("*")
            .in("student_id", atRiskIds),
        ]);

      await queryClient
        .from("interventions")
        .delete()
        .eq("status", "recommended")
        .in("student_id", atRiskIds);

      const newInterventions = generateInterventions(
        atRiskStudents ?? [],
        atRiskIndicators ?? [],
      );
      if (newInterventions.length > 0) {
        await queryClient.from("interventions").insert(newInterventions);
      }
    }
  }

  // ── Phase 9: Finalize ──────────────────────────────────────────────────────
  const imported = processed.length;

  await updateUploadStatus(queryClient, upload.id, {
    status: errored > 0 ? "completed_with_errors" : "completed",
    records_imported: imported,
    records_skipped: 0,
    records_errored: errored,
    error_log: errors.length > 0 ? errors.map((e) => ({ message: e })) : undefined,
    completed_at: new Date().toISOString(),
  });

  // ── Phase 10: CCMR recompute ───────────────────────────────────────────────
  // Refresh student_ccmr_status for active cohorts in this district.
  // Bulk recompute (one sync_jobs row), not per-student in a loop.
  // Failures here MUST NOT roll back the import — log and move on.
  if (imported > 0) {
    const triggeredBy = await getTriggeringUserId(supabase);
    try {
      await recomputeDistrict(queryClient, districtId, {
        buildTieredInput: async () => emptyTieredInput(),
        triggeredBy: triggeredBy ?? undefined,
      });
    } catch (err) {
      console.error("[importRows] recomputeDistrict failed:", err);
    }
  }

  return {
    uploadId: upload.id,
    imported,
    skipped: 0,
    errored,
    errors: errors.slice(0, 10),
  };
}

// ============================================
// SAT SCORE FILE IMPORT (College Board K12 ESR)
// ============================================

export interface SatImportResult {
  uploadId: string;
  matched: number;
  unmatched: number;
  inserted: number;
  updated: number;
  unmatchedIds: string[];   // TSDS IDs from the file with no matching student
  errors: string[];
}

// SAT CCMR thresholds (19 TAC §61.1028)
const SAT_EBRW_THRESHOLD = 480;
const SAT_MATH_THRESHOLD = 530;

type SatIndicatorUpsert = {
  student_id: string;
  indicator_type: IndicatorType;
  status: "met" | "in_progress" | "not_attempted";
  score: number | null;
  threshold: number;
  met_date: string | null;
  source_year: string;
  derivation_source: "sat";
  notes: string | null;
};

export async function importSatScores(
  csvText: string,
  fileName: string
): Promise<SatImportResult> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { districtId, queryClient } = await getAuthContext(supabase);

  const errors: string[] = [];
  const unmatchedIds: string[] = [];

  // ── Parse CSV ───────────────────────────────────────────────────────────────
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors.length > 0) {
    const fatal = parsed.errors.find((e) => e.type === "Delimiter" || e.type === "FieldMismatch");
    if (fatal) throw new Error(`CSV parse error: ${fatal.message}`);
  }

  const rows = parsed.data.filter((r) => r["STATE_STUDENT_ID"]?.trim());
  const totalRows = rows.length;

  // ── Create upload record ────────────────────────────────────────────────────
  const upload = await createUpload(queryClient, {
    district_id: districtId,
    file_name: fileName,
    source_type: "sat_scores" as UploadSourceType,
    records_total: totalRows,
    records_imported: 0,
    records_skipped: 0,
    records_errored: 0,
    column_mapping: {
      STATE_STUDENT_ID: "tsds_id",
      LATEST_SAT_EBRW: "sat_ebrw",
      LATEST_SAT_MATH_SECTION: "sat_math",
      LATEST_SAT_TOTAL: "sat_total",
    },
    error_log: null,
    uploaded_by: null,
    school_year_id: null,
    completed_at: null,
  });

  // ── Batch-fetch students by TSDS IDs in this file ──────────────────────────
  const tsdsIds = [...new Set(rows.map((r) => r["STATE_STUDENT_ID"].trim()))];

  const { data: students, error: studentErr } = await queryClient
    .from("students")
    .select("id, tsds_id, grade_level")
    .eq("district_id", districtId)
    .eq("is_active", true)
    .in("tsds_id", tsdsIds);

  if (studentErr) {
    await updateUploadStatus(queryClient, upload.id, {
      status: "failed",
      error_log: [{ message: studentErr.message }],
      completed_at: new Date().toISOString(),
    });
    throw new Error(`Student lookup failed: ${studentErr.message}`);
  }

  const studentByTsds = new Map((students ?? []).map((s) => [s.tsds_id, s]));

  // ── Fetch existing assessment rows for matched students ────────────────────
  const matchedStudentIds = [...studentByTsds.values()].map((s) => s.id);
  const { data: existingAssessments } = matchedStudentIds.length > 0
    ? await queryClient
        .from("student_assessments")
        .select("id, student_id")
        .eq("assessment_type", "sat")
        .in("student_id", matchedStudentIds)
    : { data: [] };

  const existingAssessmentId = new Map(
    (existingAssessments ?? []).map((a) => [a.student_id, a.id])
  );

  // ── Process rows ──────────────────────────────────────────────────────────
  const assessmentInserts: StudentAssessmentInsert[] = [];
  const assessmentUpdates: { id: string; data: Partial<StudentAssessmentInsert> }[] = [];
  const processedStudents: { studentId: string; gradeLevel: number; ebrw: number | null; math: number | null }[] = [];

  for (const row of rows) {
    const tsdsId = row["STATE_STUDENT_ID"].trim();
    const student = studentByTsds.get(tsdsId);

    if (!student) {
      unmatchedIds.push(tsdsId);
      continue;
    }

    const ebrw  = parseInt(row["LATEST_SAT_EBRW"] ?? "", 10) || null;
    const math  = parseInt(row["LATEST_SAT_MATH_SECTION"] ?? "", 10) || null;
    const total = parseInt(row["LATEST_SAT_TOTAL"] ?? "", 10) || null;
    const dateRaw = row["LATEST_SAT_DATE"]?.trim() || null;
    const assessmentDate = dateRaw ? new Date(dateRaw).toISOString().slice(0, 10) : null;

    const assessmentData: Partial<StudentAssessmentInsert> = {
      student_id:      student.id,
      district_id:     districtId,
      assessment_type: "sat",
      assessment_date: assessmentDate,
      sat_ebrw:        ebrw,
      sat_math:        math,
      sat_total:       total,
      raw_data:        row as Record<string, unknown>,
    };

    const existingId = existingAssessmentId.get(student.id);
    if (existingId) {
      assessmentUpdates.push({ id: existingId, data: assessmentData });
    } else {
      assessmentInserts.push(assessmentData as StudentAssessmentInsert);
    }

    processedStudents.push({ studentId: student.id, gradeLevel: student.grade_level, ebrw, math });
  }

  // ── Persist assessments ────────────────────────────────────────────────────
  let inserted = 0;
  let updated = 0;

  if (assessmentInserts.length > 0) {
    const { error: insertErr } = await queryClient
      .from("student_assessments")
      .insert(assessmentInserts);
    if (insertErr) {
      errors.push(`Assessment insert error: ${insertErr.message}`);
    } else {
      inserted = assessmentInserts.length;
    }
  }

  const ASSESSMENT_UPDATE_CHUNK = 50;
  for (let i = 0; i < assessmentUpdates.length; i += ASSESSMENT_UPDATE_CHUNK) {
    const batch = assessmentUpdates.slice(i, i + ASSESSMENT_UPDATE_CHUNK);
    const results = await Promise.all(
      batch.map(({ id, data }) =>
        queryClient.from("student_assessments").update(data).eq("id", id)
      )
    );
    const batchErrors = results.filter((r) => r.error);
    if (batchErrors.length > 0) {
      errors.push(`Assessment update error: ${batchErrors[0].error!.message}`);
    } else {
      updated += batch.length;
    }
  }

  // ── Derive CCMR indicators from SAT scores ─────────────────────────────────
  // Rules: 19 TAC §61.1028
  //   sat_reading  met if EBRW ≥ 480
  //   sat_math     met if Math ≥ 530
  //   tsi_reading  met if EBRW ≥ 480  (SAT satisfies TSI ELA exemption)
  //   tsi_math     met if Math ≥ 530  (SAT satisfies TSI Math exemption)
  const TODAY = new Date().toISOString().slice(0, 10);
  const SOURCE_YEAR = "2025-26";

  const indicatorUpserts: SatIndicatorUpsert[] = [];

  for (const { studentId, ebrw, math } of processedStudents) {
    const ebrwMet  = ebrw  != null && ebrw  >= SAT_EBRW_THRESHOLD;
    const mathMet  = math  != null && math  >= SAT_MATH_THRESHOLD;
    const hasEbrw  = ebrw  != null;
    const hasMath  = math  != null;

    // sat_reading
    indicatorUpserts.push({
      student_id:        studentId,
      indicator_type:    "sat_reading",
      status:            ebrwMet ? "met" : hasEbrw ? "in_progress" : "not_attempted",
      score:             ebrw,
      threshold:         SAT_EBRW_THRESHOLD,
      met_date:          ebrwMet ? TODAY : null,
      source_year:       SOURCE_YEAR,
      derivation_source: "sat",
      notes:             ebrw != null ? `EBRW: ${ebrw} (threshold ${SAT_EBRW_THRESHOLD})` : null,
    });

    // sat_math
    indicatorUpserts.push({
      student_id:        studentId,
      indicator_type:    "sat_math",
      status:            mathMet ? "met" : hasMath ? "in_progress" : "not_attempted",
      score:             math,
      threshold:         SAT_MATH_THRESHOLD,
      met_date:          mathMet ? TODAY : null,
      source_year:       SOURCE_YEAR,
      derivation_source: "sat",
      notes:             math != null ? `Math: ${math} (threshold ${SAT_MATH_THRESHOLD})` : null,
    });

    // tsi_reading — SAT EBRW ≥ 480 exempts TSI ELA (19 TAC §61.1028(b)(1))
    if (ebrwMet) {
      indicatorUpserts.push({
        student_id:        studentId,
        indicator_type:    "tsi_reading",
        status:            "met",
        score:             ebrw,
        threshold:         SAT_EBRW_THRESHOLD,
        met_date:          TODAY,
        source_year:       SOURCE_YEAR,
        derivation_source: "sat",
        notes:             `SAT EBRW ${ebrw} satisfies TSI ELA exemption`,
      });
    }

    // tsi_math — SAT Math ≥ 530 exempts TSI Math (19 TAC §61.1028(b)(2))
    if (mathMet) {
      indicatorUpserts.push({
        student_id:        studentId,
        indicator_type:    "tsi_math",
        status:            "met",
        score:             math,
        threshold:         SAT_MATH_THRESHOLD,
        met_date:          TODAY,
        source_year:       SOURCE_YEAR,
        derivation_source: "sat",
        notes:             `SAT Math ${math} satisfies TSI Math exemption`,
      });
    }
  }

  // Upsert indicators (only overwrite if new status is "met" or no existing row)
  const INDICATOR_CHUNK = 200;
  for (let i = 0; i < indicatorUpserts.length; i += INDICATOR_CHUNK) {
    const chunk = indicatorUpserts.slice(i, i + INDICATOR_CHUNK);
    const { error: upsertErr } = await queryClient
      .from("ccmr_indicators")
      .upsert(chunk, { onConflict: "student_id,indicator_type" });
    if (upsertErr) errors.push(`Indicator upsert error: ${upsertErr.message}`);
  }

  // ── Recompute CCMR readiness for all affected students ─────────────────────
  const affectedIds = [...new Set(processedStudents.map((p) => p.studentId))];
  if (affectedIds.length > 0) {
    const { data: allIndicators } = await queryClient
      .from("ccmr_indicators")
      .select("student_id, indicator_type, status")
      .in("student_id", affectedIds);

    const indicatorsByStudent = new Map<string, typeof allIndicators>();
    for (const ind of allIndicators ?? []) {
      const list = indicatorsByStudent.get(ind.student_id) ?? [];
      list.push(ind);
      indicatorsByStudent.set(ind.student_id, list);
    }

    const READINESS_CHUNK = 50;
    const readinessUpdates = processedStudents.map(({ studentId, gradeLevel }) => {
      const indicators = indicatorsByStudent.get(studentId) ?? [];
      const metCount = countCCMRPathways(indicators);
      const readiness = computeCCMRReadiness(indicators, gradeLevel);
      return { id: studentId, ccmr_readiness: readiness, indicators_met_count: metCount };
    });

    for (let i = 0; i < readinessUpdates.length; i += READINESS_CHUNK) {
      const batch = readinessUpdates.slice(i, i + READINESS_CHUNK);
      await Promise.all(
        batch.map(({ id, ccmr_readiness, indicators_met_count }) =>
          queryClient.from("students").update({ ccmr_readiness, indicators_met_count }).eq("id", id)
        )
      );
    }
  }

  // ── Finalize upload record ─────────────────────────────────────────────────
  const matched = processedStudents.length;
  const unmatched = unmatchedIds.length;

  await updateUploadStatus(queryClient, upload.id, {
    status: errors.length > 0 ? "completed_with_errors" : "completed",
    records_imported: matched,
    records_skipped: unmatched,
    records_errored: errors.length,
    error_log: errors.length > 0 ? errors.map((e) => ({ message: e })) : undefined,
    completed_at: new Date().toISOString(),
  });

  // CCMR recompute after the SAT bulk import. Same rules as importRows:
  // one sync_jobs row, failures don't roll back the import.
  if (matched > 0) {
    const triggeredBy = await getTriggeringUserId(supabase);
    try {
      await recomputeDistrict(queryClient, districtId, {
        buildTieredInput: async () => emptyTieredInput(),
        triggeredBy: triggeredBy ?? undefined,
      });
    } catch (err) {
      console.error("[importSatScores] recomputeDistrict failed:", err);
    }
  }

  return {
    uploadId: upload.id,
    matched,
    unmatched,
    inserted,
    updated,
    unmatchedIds: unmatchedIds.slice(0, 20),
    errors: errors.slice(0, 10),
  };
}
