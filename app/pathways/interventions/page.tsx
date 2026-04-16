import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { InterventionsPage } from "@/components/pathways/interventions";
import { getInterventions } from "@/lib/db/interventions";
import { getStudentsByIds } from "@/lib/db/students";
import { getCampuses } from "@/lib/db/campuses";
import { getUserContext } from "@/lib/db/users";

export const metadata: Metadata = {
  title: "Interventions | Summit Pathways",
  description: "CCMR intervention pathways sorted by potential impact",
};

function formatRole(role: string): string {
  return role.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const userCtx = await getUserContext(supabase);
  if (!userCtx) redirect("/login");

  const { districtId, profile, districtName, schoolYearLabel } = userCtx;
  if (!districtId) redirect("/pathways");
  const isSuperAdmin = profile.role === "super_admin";
  const queryClient = isSuperAdmin ? createAdminClient() : supabase;

  const [interventions, campuses, seniorCountResult] = await Promise.all([
    getInterventions(queryClient, districtId),
    getCampuses(queryClient, districtId),
    queryClient
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("district_id", districtId)
      .eq("is_active", true)
      .eq("grade_level", 12),
  ]);

  // Load active + dismissed (not completed/expired — those could be huge)
  const activeInterventions = interventions.filter((i) =>
    (["recommended", "planned", "in_progress", "dismissed"] as const).includes(
      i.status as "recommended" | "planned" | "in_progress" | "dismissed"
    )
  );

  const studentIds = [...new Set(activeInterventions.map((i) => i.student_id))];
  const students = await getStudentsByIds(queryClient, studentIds);

  const seniorCount = seniorCountResult.count ?? 0;

  return (
    <PathwaysAppShell
      headerProps={{
        userName: profile.full_name,
        userRole: formatRole(profile.role),
        districtName,
        schoolYear: schoolYearLabel,
        notificationCount: 0,
      }}
      breadcrumbs={[
        { label: "Summit Pathways", href: "/pathways" },
        { label: "Interventions" },
      ]}
      activeNavItem="interventions"
      isSuperAdmin={isSuperAdmin}
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
