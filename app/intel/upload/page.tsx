"use client";

import { IntelAppShell } from "@/components/intel/app-shell";
import { DataUpload } from "@/components/intel/data-upload";

export default function UploadPage() {
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
        { label: "Data Upload" },
      ]}
      activeNavItem="data-upload"
    >
      <DataUpload />
    </IntelAppShell>
  );
}
