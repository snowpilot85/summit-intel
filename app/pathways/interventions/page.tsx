import { Metadata } from "next";
import { createAdminClient } from "@/utils/supabase/admin";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { InterventionsPage } from "@/components/pathways/interventions";
import { getInterventions } from "@/lib/db/interventions";
import { getStudentsByIds } from "@/lib/db/students";
import { getCampuses } from "@/lib/db/campuses";

export const metadata: Metadata = {
  title: "Interventions | Summit Pathways",
  description: "CCMR intervention pathways sorted by potential impact",
};

const DISTRICT_ID = "a0000001-0000-0000-0000-000000000001";

export default async function Page() {
  const supabase = createAdminClient();

  const [interventions, campuses, seniorCountResult] = await Promise.all([
    getInterventions(supabase, DISTRICT_ID),
    getCampuses(supabase, DISTRICT_ID),
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("district_id", DISTRICT_ID)
      .eq("is_active", true)
      .eq("grade_level", 12),
  ]);

  // Filter to active statuses only
  const activeInterventions = interventions.filter((i) =>
    (["recommended", "planned", "in_progress"] as const).includes(
      i.status as "recommended" | "planned" | "in_progress"
    )
  );

  // Batch-fetch student records for all unique student IDs
  const studentIds = [...new Set(activeInterventions.map((i) => i.student_id))];
  const students = await getStudentsByIds(supabase, studentIds);

  const seniorCount = seniorCountResult.count ?? 0;

  return (
    <PathwaysAppShell
      headerProps={{
        userName: "Sarah Chen",
        userRole: "CCMR Coordinator",
        districtName: "Edinburg CISD",
        schoolYear: "2025-26",
        notificationCount: 3,
      }}
      breadcrumbs={[
        { label: "Summit Pathways", href: "/pathways" },
        { label: "Interventions" },
      ]}
      activeNavItem="interventions"
    >
      <InterventionsPage
        interventions={activeInterventions}
        students={students}
        campuses={campuses}
        seniorCount={seniorCount}
      />
    </PathwaysAppShell>
  );
}
