"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { getAuthContext } from "@/lib/db/users";
import { generateInterventions } from "@/lib/interventions/generate";
import type { InterventionStatus } from "@/types/database";

export async function updateInterventionStatus(
  interventionId: string,
  status: InterventionStatus,
): Promise<void> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { queryClient } = await getAuthContext(supabase);

  const update: { status: InterventionStatus; completed_date?: string } = { status };
  if (status === "completed") update.completed_date = new Date().toISOString();

  const { error } = await queryClient
    .from("interventions")
    .update(update)
    .eq("id", interventionId);
  if (error) throw error;
}

export async function updateInterventionNotes(
  interventionId: string,
  notes: string,
): Promise<void> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { queryClient } = await getAuthContext(supabase);

  const { error } = await queryClient
    .from("interventions")
    .update({ notes: notes.trim() || null })
    .eq("id", interventionId);
  if (error) throw error;
}

export async function refreshRecommendations(): Promise<{ count: number }> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { districtId, queryClient } = await getAuthContext(supabase);

  // Fetch at-risk and almost grade-12 students
  const { data: students, error: studentsErr } = await queryClient
    .from("students")
    .select("*")
    .eq("district_id", districtId)
    .eq("grade_level", 12)
    .eq("is_active", true)
    .in("ccmr_readiness", ["at_risk", "almost"]);

  if (studentsErr) throw studentsErr;
  if (!students?.length) return { count: 0 };

  const studentIds = students.map((s) => s.id);

  // Fetch all their indicators
  const { data: indicators, error: indErr } = await queryClient
    .from("ccmr_indicators")
    .select("*")
    .in("student_id", studentIds);

  if (indErr) throw indErr;

  // Delete existing recommended interventions for these students
  await queryClient
    .from("interventions")
    .delete()
    .eq("status", "recommended")
    .in("student_id", studentIds);

  // Generate and insert new interventions
  const generated = generateInterventions(students, indicators ?? []);
  if (!generated.length) return { count: 0 };

  const { error: insertErr } = await queryClient
    .from("interventions")
    .insert(generated);

  if (insertErr) throw insertErr;

  return { count: generated.length };
}

/** @deprecated Use updateInterventionStatus('completed') instead */
export async function markInterventionComplete(
  interventionId: string,
): Promise<void> {
  return updateInterventionStatus(interventionId, "completed");
}
