"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getAuthContext } from "@/lib/db/users";
import { enrichStudents, getStudents, type EnrichedStudentRow } from "@/lib/db/students";
import { getIndicatorsForStudents } from "@/lib/db/indicators";
import type { CCMRReadiness, IndicatorRow, StudentRow } from "@/types/database";

const PAGE_SIZE = 50;

export interface StudentFilters {
  campusId?: string;
  gradeLevel?: number;
  readiness?: CCMRReadiness;
  isEb?: boolean;
  isEconDisadvantaged?: boolean;
  isSpecialEd?: boolean;
  is504?: boolean;
  search?: string;
  page?: number;
  // CTE pathway filters
  clusterCode?: string;
  credentialStatus?: "earned" | "in_progress" | "not_started";
  pathwayStatus?: "with_pathway" | "without_pathway";
}

export type StudentPathwayEntry = {
  student_id: string;
  cluster_name: string;
  cluster_code: string;
  credential_earned: boolean;
  enrollment_status: string;
};

export interface StudentPageData {
  students: EnrichedStudentRow[];
  count: number;
  indicators: IndicatorRow[];
  pathwaysByStudent: StudentPathwayEntry[];
}

// --------------------------------------------------------
// Fetch students with an optional server-side pathway filter.
//
// Cluster / credential filters:
//   Start from student_pathways and embed students!inner — the same
//   pattern used in getPathwayMetrics, which is proven to work.
//   Direct column filters on student_pathways (cluster_id, credential_earned,
//   enrollment_status) are applied to the base table.
//   Student-level filters go through the students!inner embedding.
//
// "Not started" filter:
//   Students with NO pathway row — use a LEFT join + IS NULL check
//   on the students side (students is the base table here).
// --------------------------------------------------------

async function fetchStudentsWithFilters(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryClient: any,
  districtId: string,
  filters: StudentFilters,
  clusterUuid: string | null,
): Promise<{ students: EnrichedStudentRow[]; count: number }> {
  const {
    page = 1, campusId, gradeLevel, readiness,
    isEb, isEconDisadvantaged, isSpecialEd, is504, search,
    credentialStatus, pathwayStatus,
  } = filters;

  const from = (page - 1) * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  const noPathway = credentialStatus === "not_started" || pathwayStatus === "without_pathway";
  const needsJoin = clusterUuid !== null || credentialStatus !== undefined || pathwayStatus !== undefined;

  // ── No pathway filter ────────────────────────────────────────────────────
  if (!needsJoin) {
    const result = await getStudents(queryClient, districtId, { ...filters, pageSize: PAGE_SIZE });
    return { students: result.data, count: result.count };
  }

  // ── "Not started": students with no pathway row ──────────────────────────
  if (noPathway) {
    let q = queryClient
      .from("students")
      .select("*, student_pathways(student_id)", { count: "exact" })
      .is("student_pathways.student_id", null)
      .eq("district_id", districtId)
      .eq("is_active", true)
      .range(from, to)
      .order("last_name", { ascending: true });

    if (campusId)          q = q.eq("campus_id", campusId);
    if (gradeLevel)        q = q.eq("grade_level", gradeLevel);
    if (readiness)         q = q.eq("ccmr_readiness", readiness);
    if (isEb)              q = q.eq("is_eb", true);
    if (isEconDisadvantaged) q = q.eq("is_econ_disadvantaged", true);
    if (isSpecialEd)       q = q.eq("is_special_ed", true);
    if (is504)             q = q.eq("is_504", true);
    if (search) {
      const term = `%${search}%`;
      q = q.or(`first_name.ilike.${term},last_name.ilike.${term},tsds_id.ilike.${term}`);
    }

    const { data, error, count } = await q;
    if (error) throw new Error(error.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawStudents = (data ?? []).map((row: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { student_pathways: _sp, ...studentFields } = row;
      return studentFields as StudentRow;
    });
    const students = await enrichStudents(queryClient, rawStudents);
    return { students, count: count ?? 0 };
  }

  // ── Cluster / credential filter ──────────────────────────────────────────
  // Base table: student_pathways (same as getPathwayMetrics).
  // Direct column filters on student_pathways: cluster_id, credential_earned,
  //   enrollment_status — these are top-level filters, guaranteed to work.
  // Student-level filters: via students!inner embedding (proven pattern).
  //
  // Two-step pagination: collect all matching student IDs, then fetch the
  // full StudentRow page with a small .in() (≤ PAGE_SIZE UUIDs — no URL limit risk).
  let pathwayQ = queryClient
    .from("student_pathways")
    .select(
      "student_id, students!inner(district_id, is_active, campus_id, grade_level, ccmr_readiness, is_eb, is_econ_disadvantaged, is_special_ed, is_504)",
    )
    .eq("students.district_id", districtId)
    .eq("students.is_active", true)
    .range(0, 9999); // override PostgREST default 1 000-row cap

  if (clusterUuid)                 pathwayQ = pathwayQ.eq("cluster_id", clusterUuid);
  if (credentialStatus === "earned")
    pathwayQ = pathwayQ.eq("credential_earned", true);
  if (credentialStatus === "in_progress")
    pathwayQ = pathwayQ.eq("credential_earned", false).eq("enrollment_status", "enrolled");

  if (campusId)          pathwayQ = pathwayQ.eq("students.campus_id", campusId);
  if (gradeLevel)        pathwayQ = pathwayQ.eq("students.grade_level", gradeLevel);
  if (readiness)         pathwayQ = pathwayQ.eq("students.ccmr_readiness", readiness);
  if (isEb)              pathwayQ = pathwayQ.eq("students.is_eb", true);
  if (isEconDisadvantaged) pathwayQ = pathwayQ.eq("students.is_econ_disadvantaged", true);
  if (isSpecialEd)       pathwayQ = pathwayQ.eq("students.is_special_ed", true);
  if (is504)             pathwayQ = pathwayQ.eq("students.is_504", true);

  const { data: pathwayRows, error: pError } = await pathwayQ;
  if (pError) throw new Error(pError.message);

  // Deduplicate: one student may have multiple pathway rows
  const seen = new Set<string>();
  const allIds: string[] = [];
  for (const row of pathwayRows ?? []) {
    if (!seen.has(row.student_id)) {
      seen.add(row.student_id);
      allIds.push(row.student_id);
    }
  }

  const total   = allIds.length;
  const pageIds = allIds.slice(from, from + PAGE_SIZE); // at most PAGE_SIZE UUIDs

  if (pageIds.length === 0) return { students: [], count: total };

  // Fetch full student rows for this page. Search is applied here; it filters
  // within the page but does not affect the total count.
  let studentQ = queryClient
    .from("students")
    .select("*")
    .in("id", pageIds)
    .order("last_name", { ascending: true });

  if (search) {
    const term = `%${search}%`;
    studentQ = studentQ.or(`first_name.ilike.${term},last_name.ilike.${term},tsds_id.ilike.${term}`);
  }

  const { data: studentData, error: sError } = await studentQ;
  if (sError) throw new Error(sError.message);

  const enriched = await enrichStudents(queryClient, (studentData ?? []) as StudentRow[]);
  return { students: enriched, count: total };
}

export async function fetchStudentPage(
  filters: StudentFilters = {}
): Promise<StudentPageData> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { districtId, queryClient } = await getAuthContext(supabase);

  // Resolve clusterCode → UUID scoped to the district's state.
  // Must filter by state_id — the same cluster code (e.g. "HLTH") exists in multiple
  // states, so querying by code alone causes .maybeSingle() to error on multiple rows.
  let clusterUuid: string | null = null;
  if (filters.clusterCode) {
    const { data: districtRow } = await queryClient
      .from("districts")
      .select("state_id")
      .eq("id", districtId)
      .single();
    const stateId = districtRow?.state_id ?? null;

    if (!stateId) {
      return { students: [], count: 0, indicators: [], pathwaysByStudent: [] };
    }

    const { data: clusterRow } = await queryClient
      .from("state_career_clusters")
      .select("id")
      .eq("code", filters.clusterCode)
      .eq("state_id", stateId)
      .maybeSingle();
    clusterUuid = clusterRow?.id ?? null;
    // Unknown cluster code → return empty page
    if (!clusterUuid) {
      return { students: [], count: 0, indicators: [], pathwaysByStudent: [] };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { students, count } = await fetchStudentsWithFilters(queryClient as any, districtId, filters, clusterUuid);

  const studentIds = students.map((s) => s.id);

  const [indicators, pathwayRows] = await Promise.all([
    getIndicatorsForStudents(queryClient, studentIds),
    studentIds.length > 0
      ? queryClient
          .from("student_pathways")
          .select("student_id, credential_earned, enrollment_status, state_career_clusters(name, code)")
          .in("student_id", studentIds)
      : Promise.resolve({ data: [] }),
  ]);

  type ClusterShape = { name: string; code: string };
  const pathwaysByStudent: StudentPathwayEntry[] = (pathwayRows.data ?? []).map((r) => {
    const c = r.state_career_clusters as unknown as ClusterShape | null;
    return {
      student_id: r.student_id,
      cluster_name: c?.name ?? "",
      cluster_code: c?.code ?? "",
      credential_earned: r.credential_earned ?? false,
      enrollment_status: r.enrollment_status ?? "",
    };
  });

  return { students, count, indicators, pathwaysByStudent };
}
