"use client";

import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { AFSimulatorPage } from "@/components/pathways/af-simulator";

export default function SimulatorPage() {
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
        { label: "A-F Simulator" },
      ]}
      activeNavItem="simulator"
    >
      <AFSimulatorPage />
    </PathwaysAppShell>
  );
}
