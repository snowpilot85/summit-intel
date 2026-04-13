"use client";

import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { PathwaysStudentProfile, mockStudentCCMR } from "@/components/pathways/student-profile";

export default function PathwaysStudentProfilePage() {
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
        { label: "Students", href: "/pathways/students" },
        { label: mockStudentCCMR.name },
      ]}
      activeNavItem="students"
    >
      <PathwaysStudentProfile student={mockStudentCCMR} />
    </PathwaysAppShell>
  );
}
