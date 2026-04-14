"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getAuthContext } from "@/lib/db/users";

export async function markInterventionComplete(interventionId: string): Promise<void> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { queryClient } = await getAuthContext(supabase);
  const { error } = await queryClient
    .from("interventions")
    .update({
      status: "completed",
      completed_date: new Date().toISOString(),
    })
    .eq("id", interventionId);
  if (error) throw error;
}
