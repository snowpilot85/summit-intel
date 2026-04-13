"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  Check,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  ExternalLink,
  Wrench,
  BookOpen,
  ClipboardList,
  ChevronRight,
  GraduationCap,
} from "lucide-react";

// ============================================
// TYPES
// ============================================

type StudentGroup = "all" | "eb" | "econ" | "sped" | "custom";

interface CCMRStudent {
  id: string;
  name: string;
  studentId: string;
  campus: string;
  grade: 9 | 10 | 11 | 12;
  status: "met" | "on-track" | "at-risk" | "almost" | "too-early";
  indicatorsMet: string[];
  nearestPathway: string;
  pathwayDate?: string;
}

// ============================================
// MOCK DATA
// ============================================

const mockStudents: CCMRStudent[] = [
  { id: "1", name: "Garcia, Maria", studentId: "201445", campus: "Edinburg North H S", grade: 12, status: "met", indicatorsMet: ["IBC", "Dual credit"], nearestPathway: "—" },
  { id: "2", name: "Hernandez, Luis", studentId: "201502", campus: "Edinburg H S", grade: 12, status: "at-risk", indicatorsMet: [], nearestPathway: "IBC exam in 14 days" },
  { id: "3", name: "Rodriguez, Sofia", studentId: "201389", campus: "Economedes H S", grade: 11, status: "on-track", indicatorsMet: ["Dual credit (in progress)"], nearestPathway: "Complete course May 2026" },
  { id: "4", name: "Martinez, Carlos", studentId: "201220", campus: "Edinburg North H S", grade: 12, status: "at-risk", indicatorsMet: [], nearestPathway: "TSI not attempted" },
  { id: "5", name: "Ramirez, Ana", studentId: "201567", campus: "Vela H S", grade: 10, status: "on-track", indicatorsMet: ["CTE enrolled"], nearestPathway: "IBC eligible 2027" },
  { id: "6", name: "Lopez, Pedro", studentId: "201334", campus: "Edinburg H S", grade: 12, status: "met", indicatorsMet: ["TSI", "AP exam"], nearestPathway: "—" },
  { id: "7", name: "Alvarez, Diana", studentId: "201678", campus: "Edinburg North H S", grade: 12, status: "almost", indicatorsMet: ["College prep (in progress)"], nearestPathway: "Complete by May 23" },
  { id: "8", name: "Santos, Miguel", studentId: "201445", campus: "Economedes H S", grade: 9, status: "too-early", indicatorsMet: [], nearestPathway: "CTE pathway recommended" },
];

// ============================================
// HELPER COMPONENTS
// ============================================

const StatusBadge = ({ status }: { status: CCMRStudent["status"] }) => {
  const config = {
    met: { label: "Met", icon: "✓", classes: "bg-teal-100 text-teal-700" },
    "on-track": { label: "On track", icon: "◐", classes: "bg-primary-100 text-primary-700" },
    "at-risk": { label: "At risk", icon: "✗", classes: "bg-error-light text-error-dark" },
    almost: { label: "Almost", icon: "⚠", classes: "bg-warning-light text-warning-dark" },
    "too-early": { label: "Too early", icon: "—", classes: "bg-neutral-100 text-neutral-500" },
  };

  const { label, icon, classes } = config[status];

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 text-[12px] font-medium rounded-full", classes)}>
      <span>{icon}</span>
      {label}
    </span>
  );
};

const StudentGroupToggle = ({
  selected,
  onChange,
}: {
  selected: StudentGroup;
  onChange: (group: StudentGroup) => void;
}) => {
  const groups = [
    { id: "all" as const, label: "All students" },
    { id: "eb" as const, label: "EB students" },
    { id: "econ" as const, label: "Economically disadvantaged" },
    { id: "sped" as const, label: "Special education" },
    { id: "custom" as const, label: "Custom filter" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 p-1 bg-neutral-100 rounded-lg">
      {groups.map((group) => (
        <button
          key={group.id}
          onClick={() => onChange(group.id)}
          className={cn(
            "px-4 py-2 text-[13px] font-medium rounded-md transition-colors",
            selected === group.id
              ? "bg-neutral-0 text-neutral-900 shadow-sm"
              : "text-neutral-600 hover:text-neutral-900"
          )}
        >
          {group.label}
        </button>
      ))}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const CCMRTracker = () => {
  const [studentGroup, setStudentGroup] = React.useState<StudentGroup>("all");
  const [gradeFilter, setGradeFilter] = React.useState("all");
  const [campusFilter, setCampusFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter students based on search and filters
  const filteredStudents = mockStudents.filter((student) => {
    if (searchQuery && !student.name.toLowerCase().includes(searchQuery.toLowerCase()) && !student.studentId.includes(searchQuery)) {
      return false;
    }
    if (gradeFilter !== "all" && student.grade !== parseInt(gradeFilter)) {
      return false;
    }
    if (campusFilter !== "all" && student.campus !== campusFilter) {
      return false;
    }
    if (statusFilter !== "all" && student.status !== statusFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-neutral-900">CCMR Tracker</h1>
          <p className="text-[14px] text-neutral-600 mt-1">
            Track college, career, and military readiness indicators across your high school campuses
          </p>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-neutral-600 bg-neutral-100 px-4 py-2 rounded-lg">
          <span className="font-medium">Edinburg CISD</span>
          <span className="text-neutral-400">•</span>
          <span>2025-26</span>
          <span className="text-neutral-400">•</span>
          <span>Grades 9-12</span>
        </div>
      </div>

      {/* Student group toggle */}
      <StudentGroupToggle selected={studentGroup} onChange={setStudentGroup} />

      {/* Row 1: Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-4">
          <p className="text-[12px] text-neutral-500 mb-1">Total 9-12 students</p>
          <p className="text-[28px] font-bold text-neutral-900">4,847</p>
        </div>
        <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-4">
          <p className="text-[12px] text-neutral-500 mb-1">Seniors (Class of 2026)</p>
          <p className="text-[28px] font-bold text-neutral-900">1,203</p>
        </div>
        <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-4">
          <p className="text-[12px] text-neutral-500 mb-1">CCMR met (seniors)</p>
          <p className="text-[28px] font-bold text-primary-500">842 <span className="text-[16px] font-normal">(70%)</span></p>
          <p className="text-[11px] text-neutral-500">vs. 72% state avg</p>
        </div>
        <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-4">
          <p className="text-[12px] text-neutral-500 mb-1">On track (grades 9-11)</p>
          <p className="text-[28px] font-bold text-teal-600">2,418 <span className="text-[16px] font-normal">(66%)</span></p>
          <p className="text-[11px] text-neutral-500">Met at least 1 indicator so far</p>
        </div>
        <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-4 relative">
          <span className="absolute top-2 right-2 px-2 py-0.5 bg-error text-neutral-0 text-[10px] font-bold rounded-full">
            ACTION NEEDED
          </span>
          <p className="text-[12px] text-neutral-500 mb-1">At risk (seniors)</p>
          <p className="text-[28px] font-bold text-error">361</p>
          <p className="text-[11px] text-neutral-500">No indicator met, graduating in 68 days</p>
        </div>
      </div>

      {/* Row 2: Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CCMR by indicator */}
        <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
          <h2 className="text-[16px] font-semibold text-neutral-900 mb-4">CCMR by indicator</h2>
          <div className="space-y-3">
            {[
              { indicator: "Industry-based certification (IBC)", count: 312, pct: 26 },
              { indicator: "Dual credit course", count: 267, pct: 22 },
              { indicator: "TSI college ready (ELA + Math)", count: 198, pct: 16 },
              { indicator: "College prep course completed", count: 156, pct: 13 },
              { indicator: "AP/IB exam score of 3+", count: 134, pct: 11 },
              { indicator: "SAT/ACT college ready", count: 112, pct: 9 },
              { indicator: "Military enlistment", count: 54, pct: 4 },
              { indicator: "OnRamps course", count: 43, pct: 4 },
              { indicator: "Associate degree", count: 28, pct: 2 },
              { indicator: "Level I/II certificate", count: 21, pct: 2 },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-neutral-700 truncate">{item.indicator}</p>
                  <div className="mt-1 h-4 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0 w-20">
                  <span className="text-[13px] font-semibold text-neutral-900">{item.count}</span>
                  <span className="text-[12px] text-neutral-500 ml-1">({item.pct}%)</span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-neutral-500 mt-4">
            Students may meet multiple indicators. Unduplicated CCMR-met count: 842.
          </p>
        </div>

        {/* CCMR by campus */}
        <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
          <h2 className="text-[16px] font-semibold text-neutral-900 mb-4">CCMR by campus</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="px-2 py-2 text-left text-[12px] font-semibold text-neutral-700">Campus</th>
                  <th className="px-2 py-2 text-right text-[12px] font-semibold text-neutral-700">Seniors</th>
                  <th className="px-2 py-2 text-right text-[12px] font-semibold text-neutral-700">Met</th>
                  <th className="px-2 py-2 text-right text-[12px] font-semibold text-neutral-700">Rate</th>
                  <th className="px-2 py-2 text-right text-[12px] font-semibold text-neutral-700">Trend</th>
                  <th className="px-2 py-2 text-right text-[12px] font-semibold text-neutral-700">At risk</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { campus: "Economedes H S", seniors: 312, met: 234, rate: 75, trend: 3, atRisk: 78 },
                  { campus: "Edinburg North H S", seniors: 342, met: 246, rate: 72, trend: 2, atRisk: 96 },
                  { campus: "Vela H S", seniors: 261, met: 179, rate: 69, trend: 0, atRisk: 82 },
                  { campus: "Edinburg H S", seniors: 288, met: 183, rate: 64, trend: -2, atRisk: 105 },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 cursor-pointer">
                    <td className="px-2 py-3 text-[13px] font-medium text-neutral-900">{row.campus}</td>
                    <td className="px-2 py-3 text-[13px] text-neutral-700 text-right">{row.seniors}</td>
                    <td className="px-2 py-3 text-[13px] text-neutral-700 text-right">{row.met}</td>
                    <td className="px-2 py-3 text-right">
                      <span className={cn(
                        "px-2 py-0.5 text-[12px] font-medium rounded-full",
                        row.rate >= 75 ? "bg-teal-100 text-teal-700" :
                        row.rate >= 70 ? "bg-primary-100 text-primary-700" :
                        "bg-warning-light text-warning-dark"
                      )}>
                        {row.rate}%
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <span className={cn(
                        "inline-flex items-center gap-0.5 text-[12px] font-medium",
                        row.trend > 0 ? "text-teal-600" :
                        row.trend < 0 ? "text-error" :
                        "text-neutral-500"
                      )}>
                        {row.trend > 0 ? <TrendingUp className="w-3 h-3" /> :
                         row.trend < 0 ? <TrendingDown className="w-3 h-3" /> :
                         <Minus className="w-3 h-3" />}
                        {row.trend > 0 ? `+${row.trend}%` : row.trend < 0 ? `${row.trend}%` : "0%"}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-[13px] font-medium text-error text-right">{row.atRisk}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 3: Intervention planner */}
      <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
        <div className="p-4 bg-warning-light border border-warning/30 rounded-lg mb-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-warning-dark flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-semibold text-warning-dark">
                361 seniors are on track to graduate without meeting any CCMR indicator.
              </p>
              <p className="text-[13px] text-warning-dark/80">
                This impacts your Domain 1 and Domain 3 accountability ratings.
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-[16px] font-semibold text-neutral-900 mb-4">Intervention pathways</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="border border-neutral-200 rounded-lg p-5">
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center mb-3">
              <Wrench className="w-5 h-5 text-primary-500" />
            </div>
            <h3 className="text-[14px] font-semibold text-neutral-900 mb-2">Industry-based certification</h3>
            <p className="text-[13px] text-neutral-600 mb-3">
              <span className="font-semibold">134 at-risk seniors</span> are enrolled in CTE courses with IBC-aligned certifications
            </p>
            <p className="text-[12px] text-neutral-500 mb-2">
              <span className="font-medium">Action:</span> Confirm exam registration before the spring testing window
            </p>
            <p className="text-[12px] text-teal-600 font-medium mb-4">
              Potential impact: +11% CCMR rate if all pass
            </p>
            <button className="text-[13px] font-medium text-primary-500 hover:text-primary-600 flex items-center gap-1">
              View 134 students <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="border border-neutral-200 rounded-lg p-5">
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-primary-500" />
            </div>
            <h3 className="text-[14px] font-semibold text-neutral-900 mb-2">College prep course completion</h3>
            <p className="text-[13px] text-neutral-600 mb-3">
              <span className="font-semibold">89 at-risk seniors</span> are enrolled in college prep math or ELA courses
            </p>
            <p className="text-[12px] text-neutral-500 mb-2">
              <span className="font-medium">Action:</span> Verify course completion and credit by end of semester
            </p>
            <p className="text-[12px] text-teal-600 font-medium mb-4">
              Potential impact: +7% CCMR rate
            </p>
            <button className="text-[13px] font-medium text-primary-500 hover:text-primary-600 flex items-center gap-1">
              View 89 students <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="border border-neutral-200 rounded-lg p-5">
            <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center mb-3">
              <ClipboardList className="w-5 h-5 text-primary-500" />
            </div>
            <h3 className="text-[14px] font-semibold text-neutral-900 mb-2">TSI assessment</h3>
            <p className="text-[13px] text-neutral-600 mb-3">
              <span className="font-semibold">138 at-risk seniors</span> have never attempted the TSIA
            </p>
            <p className="text-[12px] text-neutral-500 mb-2">
              <span className="font-medium">Action:</span> Schedule a TSIA testing session before March deadline
            </p>
            <p className="text-[12px] text-teal-600 font-medium mb-4">
              Potential impact: +11% CCMR rate (assuming 50% pass rate)
            </p>
            <button className="text-[13px] font-medium text-primary-500 hover:text-primary-600 flex items-center gap-1">
              View 138 students <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <p className="text-[12px] text-neutral-500">
          Some students appear in multiple pathways. Addressing all three could move district CCMR from 70% to 82%.
        </p>
      </div>

      {/* Row 4: Student-level tracker */}
      <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
        <h2 className="text-[16px] font-semibold text-neutral-900 mb-4">Student-level CCMR tracker</h2>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 border border-neutral-200 rounded-md text-[13px] bg-neutral-0 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All grades</option>
              <option value="9">Grade 9</option>
              <option value="10">Grade 10</option>
              <option value="11">Grade 11</option>
              <option value="12">Grade 12</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 border border-neutral-200 rounded-md text-[13px] bg-neutral-0 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All campuses</option>
              <option value="Edinburg North H S">Edinburg North H S</option>
              <option value="Edinburg H S">Edinburg H S</option>
              <option value="Economedes H S">Economedes H S</option>
              <option value="Vela H S">Vela H S</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 border border-neutral-200 rounded-md text-[13px] bg-neutral-0 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All statuses</option>
              <option value="met">Met</option>
              <option value="on-track">On track</option>
              <option value="at-risk">At risk</option>
              <option value="almost">Almost</option>
              <option value="too-early">Too early</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-neutral-200 rounded-md text-[13px] focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Student table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-3 py-3 text-left text-[12px] font-semibold text-neutral-700">Student</th>
                <th className="px-3 py-3 text-left text-[12px] font-semibold text-neutral-700">Campus</th>
                <th className="px-3 py-3 text-center text-[12px] font-semibold text-neutral-700">Grade</th>
                <th className="px-3 py-3 text-center text-[12px] font-semibold text-neutral-700">CCMR status</th>
                <th className="px-3 py-3 text-left text-[12px] font-semibold text-neutral-700">Indicators met</th>
                <th className="px-3 py-3 text-left text-[12px] font-semibold text-neutral-700">Nearest pathway</th>
                <th className="px-3 py-3 text-right text-[12px] font-semibold text-neutral-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[11px] font-semibold text-neutral-600">
                          {student.name.split(",")[0].slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-neutral-900">{student.name}</p>
                        <p className="text-[11px] text-neutral-500">#{student.studentId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[13px] text-neutral-700">{student.campus}</td>
                  <td className="px-3 py-3 text-[13px] text-neutral-700 text-center">{student.grade}</td>
                  <td className="px-3 py-3 text-center">
                    <StatusBadge status={student.status} />
                  </td>
                  <td className="px-3 py-3 text-[13px] text-neutral-700">
                    {student.indicatorsMet.length > 0 ? student.indicatorsMet.join(", ") : "None"}
                  </td>
                  <td className="px-3 py-3 text-[13px] text-neutral-600">{student.nearestPathway}</td>
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/intel/students/${student.id}`}
                        className="text-[13px] font-medium text-primary-500 hover:text-primary-600"
                      >
                        View
                      </Link>
                      {(student.status === "at-risk" || student.status === "almost") && (
                        <>
                          <span className="text-neutral-300">·</span>
                          <button className="text-[13px] font-medium text-teal-600 hover:text-teal-700">
                            {student.status === "almost" ? "Track" : "Intervene"}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[12px] text-neutral-500 mt-3">
          Showing {filteredStudents.length} of 4,847 students
        </p>
      </div>

      {/* Row 5: Year-over-year trend */}
      <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
        <h2 className="text-[16px] font-semibold text-neutral-900 mb-4">Year-over-year trend</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-3 py-3 text-left text-[12px] font-semibold text-neutral-700">Graduating class</th>
                <th className="px-3 py-3 text-right text-[12px] font-semibold text-neutral-700">Total grads</th>
                <th className="px-3 py-3 text-right text-[12px] font-semibold text-neutral-700">CCMR met</th>
                <th className="px-3 py-3 text-right text-[12px] font-semibold text-neutral-700">Rate</th>
                <th className="px-3 py-3 text-right text-[12px] font-semibold text-neutral-700">Vs. state</th>
                <th className="px-3 py-3 text-right text-[12px] font-semibold text-neutral-700">EB rate</th>
                <th className="px-3 py-3 text-right text-[12px] font-semibold text-neutral-700">Econ disadv rate</th>
              </tr>
            </thead>
            <tbody>
              {[
                { year: "Class of 2023", grads: 1156, met: 786, rate: 68, vsState: -8, eb: 51, econ: 59 },
                { year: "Class of 2024", grads: 1178, met: 826, rate: 70, vsState: -6, eb: 55, econ: 62 },
                { year: "Class of 2025", grads: 1190, met: 857, rate: 72, vsState: -4, eb: 58, econ: 65 },
                { year: "Class of 2026 (projected)", grads: 1203, met: 842, rate: 70, vsState: null, eb: 58, econ: 63, projected: true },
              ].map((row, idx) => (
                <tr key={idx} className={cn("border-b border-neutral-100 last:border-0", row.projected && "bg-neutral-50")}>
                  <td className={cn("px-3 py-3 text-[13px]", row.projected ? "font-semibold text-neutral-900" : "text-neutral-700")}>
                    {row.year}
                  </td>
                  <td className="px-3 py-3 text-[13px] text-neutral-700 text-right">{row.grads.toLocaleString()}</td>
                  <td className="px-3 py-3 text-[13px] text-neutral-700 text-right">{row.met.toLocaleString()}</td>
                  <td className={cn("px-3 py-3 text-[13px] font-medium text-right", row.projected ? "text-neutral-900" : "text-neutral-700")}>
                    {row.rate}%
                  </td>
                  <td className="px-3 py-3 text-[13px] text-right">
                    {row.vsState !== null ? (
                      <span className="text-error">{row.vsState}% below</span>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-[13px] text-neutral-700 text-right">{row.eb}%</td>
                  <td className="px-3 py-3 text-[13px] text-neutral-700 text-right">{row.econ}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[12px] text-teal-600 mt-4 flex items-center gap-1">
          <TrendingUp className="w-4 h-4" />
          District CCMR rate has improved 4 points over 3 years. EB rate improved 7 points in the same period — gap narrowing.
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-neutral-200">
          <button className="px-4 py-2 bg-primary-500 text-neutral-0 text-[13px] font-medium rounded-md hover:bg-primary-600 transition-colors">
            Generate full CCMR report
          </button>
          <button className="px-4 py-2 border border-neutral-200 text-neutral-700 text-[13px] font-medium rounded-md hover:bg-neutral-50 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CCMR data
          </button>
          <a
            href="https://tea.texas.gov/reports-and-data/school-performance/accountability-research/accountability-reports"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-medium text-primary-500 hover:text-primary-600 flex items-center gap-1"
          >
            View on TEA CCMR Tracker
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
