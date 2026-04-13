"use client";

import { IntelAppShell } from "@/components/intel/app-shell";
import { CCMRTracker } from "@/components/intel/ccmr-tracker";

export default function CCMRTrackerPage() {
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
        { label: "CCMR Tracker" },
      ]}
      activeNavItem="ccmr"
    >
      <CCMRTracker />
    </IntelAppShell>
  );
}
