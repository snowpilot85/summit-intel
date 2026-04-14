"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function markInterventionComplete(interventionId: string): Promise<void> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { error } = await supabase
    .from("interventions")
    .update({
      status: "completed",
      completed_date: new Date().toISOString(),
    })
    .eq("id", interventionId);
  if (error) throw error;
}
