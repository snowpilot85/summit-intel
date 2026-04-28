import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { CampusReportsPage } from "@/components/pathways/campus-reports";
import { getCampusSummaries, getCampuses } from "@/lib/db/campuses";
import { getUserContext } from "@/lib/db/users";

export const metadata: Metadata = {
  title: "Accountability Reports | Summit Insights",
  description: "Campus-by-campus accountability breakdown with action plans",
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

  const [summaries, campuses] = await Promise.all([
    getCampusSummaries(queryClient, districtId),
    getCampuses(queryClient, districtId),
  ]);

  // The view groups by graduation_year — keep only the current (max) year so
  // each campus appears once in the comparison table.
  const years = summaries.map((s) => s.graduation_year);
  const currentYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear();
  const currentSummaries = summaries.filter((s) => s.graduation_year === currentYear);

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
        { label: "Summit Insights", href: "/pathways" },
        { label: "Accountability Reports (TX)" },
      ]}
      activeNavItem="campus-reports"
      isSuperAdmin={isSuperAdmin}
      hasCCMR={userCtx.hasCCMR}
    >
      <CampusReportsPage summaries={currentSummaries} campuses={campuses} />
    </PathwaysAppShell>
  );
}
