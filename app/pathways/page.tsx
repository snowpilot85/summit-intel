import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { PathwaysDashboard } from "@/components/pathways/dashboard";
import { DistrictPicker } from "@/components/pathways/district-picker";
import { getDashboardSummary, getIndicatorBreakdown, getPathwayMetrics } from "@/lib/db/dashboard";
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

  const { profile } = userCtx;
  const isSuperAdmin = profile.role === "super_admin";

  // super_admin with no district selected (no cookie set) → show district picker
  if (isSuperAdmin && !userCtx.districtId) {
    const admin = createAdminClient();
    const { data: districts } = await admin
      .from("districts")
      .select("id, name, tea_district_id, esc_region")
      .order("name");

    return (
      <DistrictPicker
        districts={districts ?? []}
        userName={profile.full_name}
      />
    );
  }

  const districtId = userCtx.districtId;
  if (!districtId) redirect("/login");

  // super_admin → bypass RLS with admin client
  const queryClient = isSuperAdmin ? createAdminClient() : supabase;

  const districtName = userCtx.districtName;
  const schoolYearLabel = userCtx.schoolYearLabel;

  const [summary, campusSummaries, snapshots, indicators, pathwayMetrics] = await Promise.all([
    getDashboardSummary(queryClient, districtId, "all"),
    getCampusSummaries(queryClient, districtId),
    getAnnualSnapshots(queryClient, districtId),
    getIndicatorBreakdown(queryClient, districtId),
    getPathwayMetrics(queryClient, districtId, "all"),
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
        { label: "Summit Insights", href: "/pathways" },
        { label: "Dashboard" },
      ]}
      activeNavItem="dashboard"
      isSuperAdmin={isSuperAdmin}
      hasCCMR={userCtx.hasCCMR}
    >
      <PathwaysDashboard
        districtId={districtId}
        initialSummary={summary}
        initialCampusSummaries={campusSummaries}
        initialSnapshots={snapshots}
        initialIndicators={indicators}
        initialPathwayMetrics={pathwayMetrics}
        hasCCMR={userCtx.hasCCMR}
      />
    </PathwaysAppShell>
  );
}
