"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  Check,
  X,
  Clock,
  Minus,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";

/* ============================================
   Summit Pathways Students Page
   Full Student-Level CCMR Tracker
   ============================================ */

// ============================================
// TYPES
// ============================================

type CCMRStatus = "met" | "on-track" | "almost" | "at-risk" | "too-early";
type SemesterMomentum = "positive" | "warning" | "negative" | "none";

interface SemesterProgress {
  momentum: SemesterMomentum;
  description: string;
}

interface StudentData {
  id: string;
  name: string;
  studentId: string;
  campus: string;
  grade: number;
  status: CCMRStatus;
  semesterProgress: SemesterProgress;
  indicators: string[];
  nearestPathway: string;
  daysLeft: number | null;
  isEB?: boolean;
  isEconDisadv?: boolean;
  isSpecialEd?: boolean;
}

// ============================================
// FILTER BAR
// ============================================

interface FilterBarProps {
  onSearch: (query: string) => void;
  searchQuery: string;
}

const FilterBar = ({ onSearch, searchQuery }: FilterBarProps) => {
  const [gradeFilter, setGradeFilter] = React.useState("All");
  const [campusFilter, setCampusFilter] = React.useState("All Campuses");
  const [statusFilter, setStatusFilter] = React.useState("All");
  const [groupFilter, setGroupFilter] = React.useState("All");

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Grade filter */}
        <div className="relative">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="appearance-none bg-neutral-0 border border-neutral-200 rounded-md px-3 py-2 pr-8 text-[13px] font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option>All</option>
            <option>9</option>
            <option>10</option>
            <option>11</option>
            <option>12</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>

        {/* Campus filter */}
        <div className="relative">
          <select
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            className="appearance-none bg-neutral-0 border border-neutral-200 rounded-md px-3 py-2 pr-8 text-[13px] font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option>All Campuses</option>
            <option>Edinburg North H S</option>
            <option>Edinburg H S</option>
            <option>Economedes H S</option>
            <option>Vela H S</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>

        {/* CCMR Status filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-neutral-0 border border-neutral-200 rounded-md px-3 py-2 pr-8 text-[13px] font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option>All</option>
            <option>Met</option>
            <option>On track</option>
            <option>Almost</option>
            <option>At risk</option>
            <option>No indicators</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>

        {/* Student group filter */}
        <div className="relative">
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="appearance-none bg-neutral-0 border border-neutral-200 rounded-md px-3 py-2 pr-8 text-[13px] font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option>All</option>
            <option>EB</option>
            <option>Econ disadvantaged</option>
            <option>Special ed</option>
            <option>504</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search by name or ID..."
            className="w-full bg-neutral-0 border border-neutral-200 rounded-md pl-9 pr-3 py-2 text-[13px] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Save as view button */}
        <button className="flex items-center gap-2 px-3 py-2 border border-neutral-200 rounded-md text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
          <Save className="w-4 h-4" />
          Save as view
        </button>
      </div>
    </div>
  );
};

// ============================================
// STATUS BADGE
// ============================================

const getStatusConfig = (status: CCMRStatus) => {
  switch (status) {
    case "met":
      return {
        label: "Met",
        icon: CheckCircle2,
        className: "bg-teal-100 text-teal-700",
      };
    case "on-track":
      return {
        label: "On track",
        icon: Clock,
        className: "bg-primary-100 text-primary-700",
      };
    case "almost":
      return {
        label: "Almost",
        icon: AlertCircle,
        className: "bg-warning-light text-warning-dark",
      };
    case "at-risk":
      return {
        label: "At risk",
        icon: X,
        className: "bg-error-light text-error-dark",
      };
    case "too-early":
      return {
        label: "Too early",
        icon: Minus,
        className: "bg-neutral-100 text-neutral-500",
      };
  }
};

const StatusBadge = ({ status }: { status: CCMRStatus }) => {
  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium", config.className)}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};

// ============================================
// INDICATOR PILL
// ============================================

const IndicatorPill = ({ indicator, inProgress }: { indicator: string; inProgress?: boolean }) => {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium",
        inProgress ? "bg-primary-50 text-primary-600 border border-primary-200" : "bg-teal-50 text-teal-700"
      )}
    >
      {indicator}
      {inProgress && <span className="text-[10px] ml-1">(in progress)</span>}
    </span>
  );
};

// ============================================
// STUDENT TABLE
// ============================================

const mockStudents: StudentData[] = [
  {
    id: "1",
    name: "Garcia, Maria",
    studentId: "201445",
    campus: "Edinburg North H S",
    grade: 12,
    status: "met",
    semesterProgress: { momentum: "none", description: "—" },
    indicators: ["IBC", "Dual credit"],
    nearestPathway: "—",
    daysLeft: null,
    isEB: true,
  },
  {
    id: "2",
    name: "Hernandez, Luis",
    studentId: "201502",
    campus: "Edinburg H S",
    grade: 12,
    status: "at-risk",
    semesterProgress: { momentum: "positive", description: "IBC exam scheduled" },
    indicators: [],
    nearestPathway: "IBC exam Apr 28",
    daysLeft: 68,
    isEB: true,
    isEconDisadv: true,
  },
  {
    id: "3",
    name: "Rodriguez, Sofia",
    studentId: "201389",
    campus: "Economedes H S",
    grade: 11,
    status: "on-track",
    semesterProgress: { momentum: "positive", description: "DC course: B+ (87)" },
    indicators: ["Dual credit (prog)"],
    nearestPathway: "Complete May",
    daysLeft: 396,
  },
  {
    id: "4",
    name: "Martinez, Carlos",
    studentId: "201220",
    campus: "Edinburg North H S",
    grade: 12,
    status: "at-risk",
    semesterProgress: { momentum: "warning", description: "No new activity" },
    indicators: [],
    nearestPathway: "TSI not attempted",
    daysLeft: 68,
    isEconDisadv: true,
  },
  {
    id: "5",
    name: "Alvarez, Diana",
    studentId: "201678",
    campus: "Edinburg North H S",
    grade: 12,
    status: "almost",
    semesterProgress: { momentum: "warning", description: "CP course: D (62)" },
    indicators: ["College prep (prog)"],
    nearestPathway: "At risk of failing",
    daysLeft: 40,
    isEB: true,
  },
  {
    id: "6",
    name: "Santos, Miguel",
    studentId: "201445",
    campus: "Economedes H S",
    grade: 9,
    status: "too-early",
    semesterProgress: { momentum: "none", description: "—" },
    indicators: [],
    nearestPathway: "CTE pathway recommended",
    daysLeft: null,
  },
  {
    id: "7",
    name: "Chen, David",
    studentId: "201890",
    campus: "Vela H S",
    grade: 12,
    status: "met",
    semesterProgress: { momentum: "none", description: "—" },
    indicators: ["TSI", "AP Exam", "IBC"],
    nearestPathway: "—",
    daysLeft: null,
  },
  {
    id: "8",
    name: "Tran, Lisa",
    studentId: "201756",
    campus: "Edinburg H S",
    grade: 11,
    status: "on-track",
    semesterProgress: { momentum: "positive", description: "CTE course: A (94)" },
    indicators: ["CTE enrolled"],
    nearestPathway: "IBC eligible spring 2027",
    daysLeft: 396,
    isEB: true,
    isSpecialEd: true,
  },
];

const StudentTable = ({ students }: { students: StudentData[] }) => {
  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="text-left text-[12px] font-semibold text-neutral-700 px-4 py-3">Student</th>
              <th className="text-left text-[12px] font-semibold text-neutral-700 px-4 py-3">Campus</th>
              <th className="text-center text-[12px] font-semibold text-neutral-700 px-4 py-3">Grade</th>
              <th className="text-left text-[12px] font-semibold text-neutral-700 px-4 py-3">CCMR status</th>
              <th className="text-left text-[12px] font-semibold text-neutral-700 px-4 py-3">This semester</th>
              <th className="text-left text-[12px] font-semibold text-neutral-700 px-4 py-3">Indicators met</th>
              <th className="text-left text-[12px] font-semibold text-neutral-700 px-4 py-3">Nearest pathway</th>
              <th className="text-center text-[12px] font-semibold text-neutral-700 px-4 py-3">Days left</th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[13px] font-semibold text-teal-700">
                        {student.name.split(",")[0][0]}{student.name.split(" ")[1]?.[0] || ""}
                      </span>
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-neutral-900">{student.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-neutral-500">#{student.studentId}</span>
                        {student.isEB && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary-100 text-primary-700 rounded">EB</span>
                        )}
                        {student.isEconDisadv && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-warning-light text-warning-dark rounded">Econ</span>
                        )}
                        {student.isSpecialEd && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 rounded">SpEd</span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-[13px] text-neutral-700">{student.campus}</td>
                <td className="px-4 py-4 text-center text-[13px] font-medium text-neutral-900">{student.grade}</td>
                <td className="px-4 py-4">
                  <StatusBadge status={student.status} />
                </td>
                <td className="px-4 py-4">
                  {student.semesterProgress.momentum === "none" ? (
                    <span className="text-[12px] text-neutral-400">—</span>
                  ) : (
                    <span className={cn(
                      "inline-flex items-center gap-1.5 text-[12px] font-medium",
                      student.semesterProgress.momentum === "positive" && "text-teal-600",
                      student.semesterProgress.momentum === "warning" && "text-warning-dark",
                      student.semesterProgress.momentum === "negative" && "text-error"
                    )}>
                      {student.semesterProgress.description}
                      <span className={cn(
                        "flex-shrink-0",
                        student.semesterProgress.momentum === "positive" && "text-teal-500",
                        student.semesterProgress.momentum === "warning" && "text-warning",
                        student.semesterProgress.momentum === "negative" && "text-error"
                      )}>
                        {student.semesterProgress.momentum === "positive" && <Check className="w-3.5 h-3.5" />}
                        {student.semesterProgress.momentum === "warning" && <AlertCircle className="w-3.5 h-3.5" />}
                        {student.semesterProgress.momentum === "negative" && <X className="w-3.5 h-3.5" />}
                      </span>
                    </span>
                  )}
                </td>
                <td className="px-4 py-4">
                  {student.indicators.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {student.indicators.map((indicator, idx) => (
                        <IndicatorPill
                          key={idx}
                          indicator={indicator.replace(" (in progress)", "")}
                          inProgress={indicator.includes("in progress")}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-[12px] text-neutral-400">None</span>
                  )}
                </td>
                <td className="px-4 py-4 text-[13px] text-neutral-700">
                  {student.nearestPathway === "—" ? (
                    <span className="text-neutral-400">—</span>
                  ) : (
                    student.nearestPathway
                  )}
                </td>
                <td className="px-4 py-4 text-center">
                  {student.daysLeft !== null ? (
                    <span className={cn(
                      "text-[13px] font-medium",
                      student.daysLeft <= 68 ? "text-error" : "text-neutral-700"
                    )}>
                      {student.daysLeft}
                    </span>
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/pathways/students/${student.id}`}
                      className="text-[13px] font-medium text-primary-500 hover:text-primary-600"
                    >
                      View
                    </Link>
                    {student.status === "at-risk" && (
                      <>
                        <span className="text-neutral-300">·</span>
                        <Link
                          href={`/pathways/students/${student.id}?tab=interventions`}
                          className="text-[13px] font-medium text-error hover:text-error-dark"
                        >
                          Intervene
                        </Link>
                      </>
                    )}
                    {student.status === "almost" && (
                      <>
                        <span className="text-neutral-300">·</span>
                        <Link
                          href={`/pathways/students/${student.id}?tab=track`}
                          className="text-[13px] font-medium text-warning-dark hover:text-warning"
                        >
                          Track
                        </Link>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="px-4 py-3 border-t border-neutral-200 flex items-center justify-between">
        <p className="text-[13px] text-neutral-600">
          Showing <span className="font-medium">8</span> of <span className="font-medium">4,847</span> students
        </p>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-[13px] font-medium text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-50 disabled:opacity-50" disabled>
            Previous
          </button>
          <button className="px-3 py-1.5 text-[13px] font-medium text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN STUDENTS COMPONENT
// ============================================

export const PathwaysStudents = () => {
  const [searchQuery, setSearchQuery] = React.useState("");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-[24px] font-semibold text-neutral-900">Students</h1>
        <p className="text-[14px] text-neutral-600 mt-1">
          Full student-level CCMR tracker for grades 9-12
        </p>
      </div>

      {/* Filter Bar */}
      <FilterBar onSearch={setSearchQuery} searchQuery={searchQuery} />

      {/* Student Table */}
      <StudentTable students={mockStudents} />
    </div>
  );
};
