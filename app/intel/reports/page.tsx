"use client";

import { IntelAppShell } from "@/components/intel/app-shell";
import { ReportsPage } from "@/components/intel/reports";

export default function ReportsPageRoute() {
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
        { label: "Reports" },
      ]}
      activeNavItem="reports"
    >
      <ReportsPage />
    </IntelAppShell>
  );
}
