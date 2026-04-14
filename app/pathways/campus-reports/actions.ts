"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getAuthContext } from "@/lib/db/users";
import { getAnnualSnapshots } from "@/lib/db/snapshots";
import { getInterventions } from "@/lib/db/interventions";
import type { InterventionRow, SnapshotRow } from "@/types/database";

export interface CampusDetailData {
  snapshots: SnapshotRow[];
  interventions: InterventionRow[];
}

export async function fetchCampusDetail(campusId: string): Promise<CampusDetailData> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { districtId, queryClient } = await getAuthContext(supabase);

  const [snapshots, interventions] = await Promise.all([
    getAnnualSnapshots(queryClient, districtId, { campusId }),
    getInterventions(queryClient, districtId, { campusId }),
  ]);

  const active = interventions.filter((i) =>
    i.status === "recommended" || i.status === "planned" || i.status === "in_progress"
  );

  return { snapshots, interventions: active };
}
