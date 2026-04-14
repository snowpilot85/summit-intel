"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { getAnnualSnapshots } from "@/lib/db/snapshots";
import { getInterventions } from "@/lib/db/interventions";
import type { InterventionRow, SnapshotRow } from "@/types/database";

const DISTRICT_ID = "a0000001-0000-0000-0000-000000000001";

export interface CampusDetailData {
  snapshots: SnapshotRow[];
  interventions: InterventionRow[];
}

export async function fetchCampusDetail(campusId: string): Promise<CampusDetailData> {
  const supabase = createAdminClient();

  const [snapshots, interventions] = await Promise.all([
    getAnnualSnapshots(supabase, DISTRICT_ID, { campusId }),
    getInterventions(supabase, DISTRICT_ID, { campusId }),
  ]);

  // Filter interventions to active statuses
  const active = interventions.filter((i) =>
    i.status === "recommended" || i.status === "planned" || i.status === "in_progress"
  );

  return { snapshots, interventions: active };
}
