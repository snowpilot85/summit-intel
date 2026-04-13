"use client";

import { IntelAppShell } from "@/components/intel/app-shell";
import { LPACMeetings } from "@/components/intel/lpac-meetings";

export default function MeetingsPage() {
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
        { label: "LPAC Meetings" },
      ]}
      activeNavItem="lpac-meetings"
    >
      <LPACMeetings />
    </IntelAppShell>
  );
}
