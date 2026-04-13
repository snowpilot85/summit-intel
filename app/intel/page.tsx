"use client";

import { IntelAppShell } from "@/components/intel/app-shell";
import { LPACDashboard } from "@/components/intel/lpac-dashboard";

export default function SummitIntelPage() {
  return (
    <IntelAppShell
      headerProps={{
        userName: "Carmen Martinez",
        userRole: "LPAC Coordinator",
        districtName: "Edinburg CISD",
        schoolYear: "2025-26",
        notificationCount: 5,
      }}
      breadcrumbs={[
        { label: "Summit Intel", href: "/intel" },
        { label: "Dashboard" },
      ]}
      activeNavItem="dashboard"
    >
      <LPACDashboard />
    </IntelAppShell>
  );
}
