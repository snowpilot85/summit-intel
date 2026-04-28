import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { CampusReportsPage } from "@/components/pathways/campus-reports";
import { PageHeader } from "@/components/layout/page-header";
import { getCampusSummaries, getCampuses } from "@/lib/db/campuses";
import { getUserContext } from "@/lib/db/users";

export const metadata: Metadata = {
  title: "Accountability Reports | Summit Insights",
  description: "Campus-by-campus accountability breakdown with action plans",
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
    <>
      <PageHeader
        title="Accountability Reports (TX)"
        breadcrumbs={[
          { label: "Summit Insights", href: "/pathways" },
          { label: "Accountability Reports (TX)" },
        ]}
      />
      <PathwaysAppShell
        activeNavItem="campus-reports"
        isSuperAdmin={isSuperAdmin}
        hasCCMR={userCtx.hasCCMR}
      >
        <CampusReportsPage summaries={currentSummaries} campuses={campuses} />
      </PathwaysAppShell>
    </>
  );
}
