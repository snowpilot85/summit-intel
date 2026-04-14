"use server";

import { createAdminClient } from "@/utils/supabase/admin";

export async function markInterventionComplete(interventionId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("interventions")
    .update({
      status: "completed",
      completed_date: new Date().toISOString(),
    })
    .eq("id", interventionId);
  if (error) throw error;
}
