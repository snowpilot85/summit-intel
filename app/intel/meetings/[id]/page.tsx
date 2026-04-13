"use client";

import { IntelAppShell } from "@/components/intel/app-shell";
import { LPACMeetingForm } from "@/components/intel/lpac-meeting-form";

export default function LPACMeetingFormPage() {
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
        { label: "LPAC Meetings", href: "/intel/meetings" },
        { label: "EOY LPAC 24-25" },
        { label: "Mia Carmen Ramirez" },
      ]}
      activeNavItem="lpac-meetings"
    >
      <LPACMeetingForm />
    </IntelAppShell>
  );
}
