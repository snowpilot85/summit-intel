"use client";

import * as React from "react";
import { IntelAppShell } from "@/components/intel/app-shell";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Search, Filter, ChevronRight, AlertCircle } from "lucide-react";
import { getProficiencyClasses, getCompositeLabel } from "@/lib/proficiency-utils";

// Mock students data
const mockStudents = [
  {
    id: "stu-155196",
    initials: "MC",
    name: "Mia Carmen Ramirez",
    studentNumber: "155196",
    school: "Edinburg North H S",
    grade: 10,
    lepStatus: "EB",
    program: "ESL",
    composite: 2,
    hasAction: true,
    actionType: "Reclassification Review",
  },
  {
    id: "stu-155201",
    initials: "JG",
    name: "Jose Garcia",
    studentNumber: "155201",
    school: "Edinburg North H S",
    grade: 11,
    lepStatus: "EB",
    program: "ESL",
    composite: 3,
    hasAction: false,
  },
  {
    id: "stu-155215",
    initials: "AL",
    name: "Ana Lopez",
    studentNumber: "155215",
    school: "Edinburg North H S",
    grade: 9,
    lepStatus: "EB",
    program: "Bilingual",
    composite: 1,
    hasAction: true,
    actionType: "Missing HLS",
  },
  {
    id: "stu-155220",
    initials: "CM",
    name: "Carlos Martinez",
    studentNumber: "155220",
    school: "Edinburg H S",
    grade: 12,
    lepStatus: "EB",
    program: "ESL",
    composite: 4,
    hasAction: true,
    actionType: "Eligible for Exit",
  },
  {
    id: "stu-155228",
    initials: "SR",
    name: "Sofia Rodriguez",
    studentNumber: "155228",
    school: "Edinburg H S",
    grade: 10,
    lepStatus: "EB",
    program: "ESL",
    composite: 2,
    hasAction: false,
  },
];



export default function StudentsListPage() {
  const [searchTerm, setSearchTerm] = React.useState("");
  
  const filteredStudents = mockStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentNumber.includes(searchTerm)
  );

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
        { label: "Students" },
      ]}
      activeNavItem="students"
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[24px] font-semibold text-neutral-900">Students</h1>
          <p className="text-[14px] text-neutral-500 mt-1">
            View and manage EB student profiles and compliance status
          </p>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name or student number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-[14px] border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-200 rounded-md text-[14px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Students table */}
        <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">Student</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">School</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">Grade</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">Status</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">Program</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">Composite</th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">Action Needed</th>
                <th className="px-4 py-3 text-right text-[12px] font-semibold uppercase tracking-wide text-neutral-600"></th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors group"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[13px] font-bold text-neutral-0">{student.initials}</span>
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-neutral-900">{student.name}</p>
                        <p className="text-[12px] text-neutral-500">#{student.studentNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[14px] text-neutral-700">{student.school}</td>
                  <td className="px-4 py-4 text-[14px] text-neutral-700">{student.grade}</td>
                  <td className="px-4 py-4">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-[12px] font-semibold rounded">
                      {student.lepStatus}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[14px] text-neutral-700">{student.program}</td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      "px-2.5 py-1 text-[12px] font-medium rounded-full",
                      getProficiencyClasses(student.composite)
                    )}>
                      {getCompositeLabel(student.composite)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    {student.hasAction ? (
                      <span className="inline-flex items-center gap-1 text-[13px] text-warning-dark">
                        <AlertCircle className="w-4 h-4" />
                        {student.actionType}
                      </span>
                    ) : (
                      <span className="text-[13px] text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/intel/students/${student.id}`}
                      className="inline-flex items-center gap-1 text-[13px] font-medium text-teal-600 hover:text-teal-700 group-hover:text-teal-700"
                    >
                      View
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <p className="text-[13px] text-neutral-500">
          Showing {filteredStudents.length} of {mockStudents.length} students
        </p>
      </div>
    </IntelAppShell>
  );
}
