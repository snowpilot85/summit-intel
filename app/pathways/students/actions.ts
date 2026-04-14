"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getAuthDistrictId } from "@/lib/db/users";
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

export interface StudentPageData {
  students: StudentRow[];
  count: number;
  indicators: IndicatorRow[];
}

export async function fetchStudentPage(
  filters: StudentFilters = {}
): Promise<StudentPageData> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const districtId = await getAuthDistrictId(supabase);

  const { data: students, count } = await getStudents(supabase, districtId, {
    ...filters,
    pageSize: PAGE_SIZE,
  });

  const studentIds = students.map((s) => s.id);
  const indicators = await getIndicatorsForStudents(supabase, studentIds);

  return { students, count, indicators };
}
