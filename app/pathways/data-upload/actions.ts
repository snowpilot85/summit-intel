"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getAuthContext } from "@/lib/db/users";
import { createUpload, updateUploadStatus } from "@/lib/db/uploads";
import { computeCCMRReadiness } from "@/lib/ccmr";
import { generateInterventions } from "@/lib/interventions/generate";
import type {
  IndicatorType,
  UploadSourceType,
  StudentInsert,
  StudentUpdate,
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
      const metCount    = indicators.filter((i) => i.status === "met").length;
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

  return {
    uploadId: upload.id,
    imported,
    skipped: 0,
    errored,
    errors: errors.slice(0, 10),
  };
}
