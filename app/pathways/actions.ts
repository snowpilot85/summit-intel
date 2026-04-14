"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/db/users";
import { createAdminClient } from "@/utils/supabase/admin";
import { getDashboardSummary, type SubgroupFilter } from "@/lib/db/dashboard";
import { getCampusSummaries } from "@/lib/db/campuses";
import { getAnnualSnapshots } from "@/lib/db/snapshots";
import type { CampusCCMRSummaryRow, SnapshotRow } from "@/types/database";
import type { DashboardSummary } from "@/lib/db/dashboard";

/**
 * Persists a super_admin's district selection in a cookie so it survives
 * navigation between pages (students, interventions, etc.).
 */
export async function selectDistrict(districtId: string): Promise<never> {
  await requireSuperAdmin();
  const cookieStore = await cookies();
  cookieStore.set("sa_district", districtId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
  redirect("/pathways");
}

/**
 * Clears the super_admin district cookie and redirects to the district picker.
 */
export async function clearDistrict(): Promise<never> {
  await requireSuperAdmin();
  const cookieStore = await cookies();
  cookieStore.delete("sa_district");
  redirect("/pathways");
}

export interface GroupDataResult {
  summary: DashboardSummary;
  campusSummaries: CampusCCMRSummaryRow[];
  snapshots: SnapshotRow[];
}

export async function fetchGroupData(
  districtId: string,
  subgroup: SubgroupFilter
): Promise<GroupDataResult> {
  const supabase = createAdminClient();

  const [summary, campusSummaries, snapshots] = await Promise.all([
    getDashboardSummary(supabase, districtId, subgroup),
    getCampusSummaries(supabase, districtId),
    getAnnualSnapshots(supabase, districtId),
  ]);

  return { summary, campusSummaries, snapshots };
}
