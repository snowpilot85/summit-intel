import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { InterventionsPage } from "@/components/pathways/interventions";
import { PageHeader } from "@/components/layout/page-header";
import { getInterventions } from "@/lib/db/interventions";
import { getStudentsByIds } from "@/lib/db/students";
import { getCampuses } from "@/lib/db/campuses";
import { getUserContext } from "@/lib/db/users";

export const metadata: Metadata = {
  title: "Interventions | Summit Insights",
  description: "CCMR intervention pathways sorted by potential impact",
};

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const userCtx = await getUserContext(supabase);
  if (!userCtx) redirect("/login");

  const { districtId, profile } = userCtx;
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
    <>
      <PageHeader
        title="Interventions"
        breadcrumbs={[
          { label: "Summit Insights", href: "/pathways" },
          { label: "Interventions" },
        ]}
      />
      <PathwaysAppShell
        activeNavItem="interventions"
        isSuperAdmin={isSuperAdmin}
        hasCCMR={userCtx.hasCCMR}
      >
        <InterventionsPage
          interventions={activeInterventions}
          students={students}
          campuses={campuses}
          seniorCount={seniorCount}
          hasCCMR={userCtx.hasCCMR}
        />
      </PathwaysAppShell>
    </>
  );
}
