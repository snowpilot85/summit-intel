"use client";

import { IntelAppShell } from "@/components/intel/app-shell";
import { StudentProfile, mockStudent } from "@/components/intel/student-profile";

export default function StudentProfilePage() {
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
        { label: "Students", href: "/intel/students" },
        { label: mockStudent.fullName },
      ]}
      activeNavItem="students"
    >
      <StudentProfile student={mockStudent} />
    </IntelAppShell>
  );
}
