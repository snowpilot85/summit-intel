import { createAdminClient } from "@/utils/supabase/admin";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { PathwaysDashboard } from "@/components/pathways/dashboard";
import { getDashboardSummary, getIndicatorBreakdown } from "@/lib/db/dashboard";
import { getCampusSummaries } from "@/lib/db/campuses";
import { getAnnualSnapshots } from "@/lib/db/snapshots";

// Hardcoded until auth is wired — Edinburg CISD from seed data
const DISTRICT_ID = "a0000001-0000-0000-0000-000000000001";

export default async function PathwaysDashboardPage() {
  const supabase = createAdminClient();

  const [summary, campusSummaries, snapshots, indicators] = await Promise.all([
    getDashboardSummary(supabase, DISTRICT_ID, "all"),
    getCampusSummaries(supabase, DISTRICT_ID),
    getAnnualSnapshots(supabase, DISTRICT_ID),
    getIndicatorBreakdown(supabase, DISTRICT_ID),
  ]);

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
        { label: "Dashboard" },
      ]}
      activeNavItem="dashboard"
    >
      <PathwaysDashboard
        districtId={DISTRICT_ID}
        initialSummary={summary}
        initialCampusSummaries={campusSummaries}
        initialSnapshots={snapshots}
        initialIndicators={indicators}
      />
    </PathwaysAppShell>
  );
}
