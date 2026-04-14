"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { getStudents } from "@/lib/db/students";
import { getIndicatorsForStudents } from "@/lib/db/indicators";
import type { CCMRReadiness, IndicatorRow, StudentRow } from "@/types/database";

const DISTRICT_ID = "a0000001-0000-0000-0000-000000000001";
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

export interface StudentPageData {
  students: StudentRow[];
  count: number;
  indicators: IndicatorRow[];
}

export async function fetchStudentPage(
  filters: StudentFilters = {}
): Promise<StudentPageData> {
  const supabase = createAdminClient();

  const { data: students, count } = await getStudents(supabase, DISTRICT_ID, {
    ...filters,
    pageSize: PAGE_SIZE,
  });

  const studentIds = students.map((s) => s.id);
  const indicators = await getIndicatorsForStudents(supabase, studentIds);

  return { students, count, indicators };
}
