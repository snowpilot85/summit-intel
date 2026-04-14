import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { PathwaysDashboard } from "@/components/pathways/dashboard";
import { getDashboardSummary, getIndicatorBreakdown } from "@/lib/db/dashboard";
import { getCampusSummaries } from "@/lib/db/campuses";
import { getAnnualSnapshots } from "@/lib/db/snapshots";
import { getUserContext } from "@/lib/db/users";

function formatRole(role: string): string {
  return role.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export default async function PathwaysDashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const userCtx = await getUserContext(supabase);
  if (!userCtx) redirect("/login");

  const { districtId, profile, districtName, schoolYearLabel } = userCtx;

  const [summary, campusSummaries, snapshots, indicators] = await Promise.all([
    getDashboardSummary(supabase, districtId, "all"),
    getCampusSummaries(supabase, districtId),
    getAnnualSnapshots(supabase, districtId),
    getIndicatorBreakdown(supabase, districtId),
  ]);

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
        { label: "Dashboard" },
      ]}
      activeNavItem="dashboard"
    >
      <PathwaysDashboard
        districtId={districtId}
        initialSummary={summary}
        initialCampusSummaries={campusSummaries}
        initialSnapshots={snapshots}
        initialIndicators={indicators}
      />
    </PathwaysAppShell>
  );
}
