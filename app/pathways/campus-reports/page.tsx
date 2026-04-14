import { Metadata } from "next";
import { createAdminClient } from "@/utils/supabase/admin";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { CampusReportsPage } from "@/components/pathways/campus-reports";
import { getCampusSummaries, getCampuses } from "@/lib/db/campuses";

export const metadata: Metadata = {
  title: "Campus Reports | Summit Pathways",
  description: "CCMR breakdown by campus with action plans",
};

const DISTRICT_ID = "a0000001-0000-0000-0000-000000000001";

export default async function Page() {
  const supabase = createAdminClient();

  const [summaries, campuses] = await Promise.all([
    getCampusSummaries(supabase, DISTRICT_ID),
    getCampuses(supabase, DISTRICT_ID),
  ]);

  // The view groups by graduation_year — keep only the current (max) year so
  // each campus appears once in the comparison table.
  const years = summaries.map((s) => s.graduation_year);
  const currentYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear();
  const currentSummaries = summaries.filter((s) => s.graduation_year === currentYear);

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
        { label: "Campus Reports" },
      ]}
      activeNavItem="campus-reports"
    >
      <CampusReportsPage summaries={currentSummaries} campuses={campuses} />
    </PathwaysAppShell>
  );
}
