"use client";

import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { PathwaysDashboard } from "@/components/pathways/dashboard";

export default function PathwaysDashboardPage() {
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
      <PathwaysDashboard />
    </PathwaysAppShell>
  );
}
