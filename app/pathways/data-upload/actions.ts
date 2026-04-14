"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getAuthDistrictId } from "@/lib/db/users";
import { createUpload, updateUploadStatus } from "@/lib/db/uploads";
import { computeCCMRReadiness } from "@/lib/ccmr";
import type { IndicatorType, UploadSourceType } from "@/types/database";

// ============================================
// TYPES
// ============================================

export interface ParsedStudentRow {
  tsdsId: string;
  firstName: string;
  lastName: string;
  metIndicators: IndicatorType[];
}

export interface ImportResult {
  uploadId: string;
  imported: number;
  skipped: number;
  errored: number;
  errors: string[];
}

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
  const districtId = await getAuthDistrictId(supabase);
  const errors: string[] = [];

  // Create the upload record first
  const upload = await createUpload(supabase, {
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

  // Batch-fetch matching students by TSDS ID (single query)
  const tsdsIds = rows.map((r) => r.tsdsId).filter(Boolean);
  const { data: students, error: studentErr } = await supabase
    .from("students")
    .select("id, tsds_id, grade_level, indicators_met_count")
    .eq("district_id", districtId)
    .eq("is_active", true)
    .in("tsds_id", tsdsIds);

  if (studentErr) {
    await updateUploadStatus(supabase, upload.id, {
      status: "failed",
      error_log: [{ message: studentErr.message }],
      completed_at: new Date().toISOString(),
    });
    throw new Error(`Student lookup failed: ${studentErr.message}`);
  }

  const studentByTsds = new Map(
    (students ?? []).map((s) => [s.tsds_id, s])
  );

  // Build indicator inserts for all students
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

  const indicatorInserts: IndicatorInsertRow[] = [];
  const matchedStudentIds: string[] = [];
  let skipped = 0;
  let errored = 0;

  for (const row of rows) {
    const student = studentByTsds.get(row.tsdsId);
    if (!student) {
      skipped++;
      continue;
    }
    matchedStudentIds.push(student.id);
    for (const indicatorType of row.metIndicators) {
      indicatorInserts.push({
        student_id: student.id,
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

  // Batch upsert all indicators (chunked at 500 rows to stay under limits)
  if (indicatorInserts.length > 0) {
    const CHUNK = 500;
    for (let i = 0; i < indicatorInserts.length; i += CHUNK) {
      const chunk = indicatorInserts.slice(i, i + CHUNK);
      const { error: upsertErr } = await supabase
        .from("ccmr_indicators")
        .upsert(chunk, { onConflict: "student_id,indicator_type" });
      if (upsertErr) {
        errors.push(`Indicator upsert error: ${upsertErr.message}`);
        errored += chunk.length;
      }
    }
  }

  // Bulk readiness recompute: fetch all indicators for matched students, compute locally, bulk update
  const uniqueIds = [...new Set(matchedStudentIds)];
  if (uniqueIds.length > 0) {
    const { data: allIndicators } = await supabase
      .from("ccmr_indicators")
      .select("student_id, indicator_type, status")
      .in("student_id", uniqueIds);

    // Group indicators by student
    const indicatorsByStudent = new Map<string, typeof allIndicators>();
    for (const ind of allIndicators ?? []) {
      const list = indicatorsByStudent.get(ind.student_id) ?? [];
      list.push(ind);
      indicatorsByStudent.set(ind.student_id, list);
    }

    // Compute readiness for each student and bulk update
    const studentUpdates = uniqueIds.map((studentId) => {
      const s = studentByTsds.get(
        (students ?? []).find((st) => st.id === studentId)?.tsds_id ?? ""
      );
      const gradeLevel = s?.grade_level ?? 12;
      const indicators = indicatorsByStudent.get(studentId) ?? [];
      const metCount = indicators.filter((i) => i.status === "met").length;
      const readiness = computeCCMRReadiness(indicators, gradeLevel);
      return { id: studentId, ccmr_readiness: readiness, indicators_met_count: metCount };
    });

    // Update students in batches
    const STUDENT_CHUNK = 50;
    for (let i = 0; i < studentUpdates.length; i += STUDENT_CHUNK) {
      const batch = studentUpdates.slice(i, i + STUDENT_CHUNK);
      await Promise.all(
        batch.map(({ id, ccmr_readiness, indicators_met_count }) =>
          supabase
            .from("students")
            .update({ ccmr_readiness, indicators_met_count })
            .eq("id", id)
        )
      );
    }
  }

  const imported = uniqueIds.length - (errored > 0 ? 1 : 0);
  const finalStatus =
    errored > 0 ? "completed_with_errors" : "completed";

  await updateUploadStatus(supabase, upload.id, {
    status: finalStatus,
    records_imported: imported,
    records_skipped: skipped,
    records_errored: errored,
    error_log: errors.length > 0 ? errors.map((e) => ({ message: e })) : undefined,
    completed_at: new Date().toISOString(),
  });

  return {
    uploadId: upload.id,
    imported,
    skipped,
    errored,
    errors: errors.slice(0, 10), // cap error log shown to user
  };
}
