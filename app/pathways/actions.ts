"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { getDashboardSummary, type SubgroupFilter } from "@/lib/db/dashboard";
import { getCampusSummaries } from "@/lib/db/campuses";
import { getAnnualSnapshots } from "@/lib/db/snapshots";
import type { CampusCCMRSummaryRow, SnapshotRow } from "@/types/database";
import type { DashboardSummary } from "@/lib/db/dashboard";

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
