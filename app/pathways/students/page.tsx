"use client";

import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { PathwaysStudents } from "@/components/pathways/students";

export default function PathwaysStudentsPage() {
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
        { label: "Students" },
      ]}
      activeNavItem="students"
    >
      <PathwaysStudents />
    </PathwaysAppShell>
  );
}
