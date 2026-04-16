"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getAuthContext } from "@/lib/db/users";
import { getStudents } from "@/lib/db/students";
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
}

export type StudentClusterEntry = {
  student_id: string;
  cluster_name: string;
  cluster_code: string;
};

export interface StudentPageData {
  students: StudentRow[];
  count: number;
  indicators: IndicatorRow[];
  clustersByStudent: StudentClusterEntry[];
}

export async function fetchStudentPage(
  filters: StudentFilters = {}
): Promise<StudentPageData> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { districtId, queryClient } = await getAuthContext(supabase);

  const { data: students, count } = await getStudents(queryClient, districtId, {
    ...filters,
    pageSize: PAGE_SIZE,
  });

  const studentIds = students.map((s) => s.id);

  const [indicators, pathwayRows] = await Promise.all([
    getIndicatorsForStudents(queryClient, studentIds),
    studentIds.length > 0
      ? queryClient
          .from("student_pathways")
          .select("student_id, state_career_clusters(name, code)")
          .in("student_id", studentIds)
      : Promise.resolve({ data: [] }),
  ]);

  type ClusterShape = { name: string; code: string };
  const clustersByStudent: StudentClusterEntry[] = (pathwayRows.data ?? []).map((r) => {
    const c = r.state_career_clusters as unknown as ClusterShape | null;
    return {
      student_id: r.student_id,
      cluster_name: c?.name ?? "",
      cluster_code: c?.code ?? "",
    };
  });

  return { students, count, indicators, clustersByStudent };
}
