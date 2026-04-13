"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  CheckCircle2,
  X,
  Clock,
  AlertCircle,
  ChevronRight,
  Calendar,
  GraduationCap,
  Info,
  Minus,
} from "lucide-react";

/* ============================================
   Summit Pathways Student CCMR Profile
   Individual Student CCMR Detail View
   ============================================ */

// ============================================
// TYPES
// ============================================

type IndicatorStatus = "met" | "in-progress" | "not-met" | "not-attempted" | "info-only";

interface CCMRIndicator {
  name: string;
  status: IndicatorStatus;
  detail: string;
}

interface SemesterCard {
  semester: string;
  year: string;
  isCurrent?: boolean;
  isFuture?: boolean;
  events: SemesterEvent[];
}

interface SemesterEvent {
  status: "completed" | "in-progress" | "failed" | "upcoming" | "not-scheduled";
  label: string;
  detail?: string;
  isNextAction?: boolean;
}

interface StudentCCMRData {
  id: string;
  name: string;
  studentId: string;
  campus: string;
  grade: number;
  ctePathway?: string;
  isEB?: boolean;
  isEconDisadv?: boolean;
  isSpecialEd?: boolean;
  advancedTester?: { exam: string; grade: string }; // e.g., { exam: "Algebra I EOC", grade: "8th" }
  ccmrStatus: "at-risk" | "almost" | "on-track" | "met";
  indicators: CCMRIndicator[];
  gpa: number;
  attendance: number;
  creditsEarned: number;
  creditsRequired: number;
  pathwaySemesters: SemesterCard[];
  ccmrProjection: {
    activePaths: { name: string; probability: string; detail: string }[];
    recommendation: string;
  };
}

// ============================================
// MOCK DATA
// ============================================

export const mockStudentCCMR: StudentCCMRData = {
  id: "2",
  name: "Luis Hernandez",
  studentId: "201502",
  campus: "Edinburg H S",
  grade: 11,
  ctePathway: "Welding (Year 2 of 2)",
  isEB: true,
  isEconDisadv: true,
  // advancedTester: { exam: "Algebra I EOC", grade: "8th" }, // Uncomment for students with advanced testing
  ccmrStatus: "at-risk",
  indicators: [
    { name: "Industry-based certification", status: "in-progress", detail: "AWS Welding cert — exam scheduled Apr 28" },
    { name: "TSI college ready (ELA)", status: "not-attempted", detail: "Has not taken TSIA" },
    { name: "TSI college ready (Math)", status: "not-attempted", detail: "Has not taken TSIA" },
    { name: "Dual credit course", status: "not-met", detail: "No dual credit courses on transcript" },
    { name: "AP exam (3+)", status: "not-met", detail: "Not enrolled in AP courses" },
    { name: "SAT college ready", status: "not-met", detail: "SAT: 890 (needs 1010). ELA: 420 (needs 480). Math: 470 (needs 530). 60 points from ELA threshold, 60 from Math." },
    { name: "PSAT (10th grade)", status: "info-only", detail: "PSAT: 820. Trending upward from 780 in 9th grade." },
    { name: "ACT college ready", status: "not-attempted", detail: "—" },
    { name: "College prep course", status: "not-met", detail: "—" },
    { name: "Military enlistment", status: "not-met", detail: "—" },
    { name: "OnRamps", status: "not-met", detail: "—" },
    { name: "Associate degree", status: "not-met", detail: "—" },
    { name: "Level I/II certificate", status: "not-met", detail: "—" },
  ],
  gpa: 2.4,
  attendance: 88,
  creditsEarned: 18,
  creditsRequired: 26,
  pathwaySemesters: [
    {
      semester: "Fall",
      year: "2024-25",
      events: [
        { status: "completed", label: "Enrolled in Welding I (CTE Year 1 of 2)", detail: "Completed, grade: B (82)" },
        { status: "completed", label: "PSAT taken: 820", detail: "Up from 780 freshman year" },
        { status: "not-scheduled", label: "No dual credit courses" },
      ],
    },
    {
      semester: "Spring",
      year: "2024-25",
      events: [
        { status: "completed", label: "Welding I completed", detail: "Passed with B (79)" },
        { status: "not-scheduled", label: "SAT not yet taken" },
        { status: "not-scheduled", label: "TSIA not attempted" },
      ],
    },
    {
      semester: "Fall",
      year: "2025-26",
      isCurrent: true,
      events: [
        { status: "in-progress", label: "Enrolled in Welding II (CTE Year 2 of 2)", detail: "In progress, current grade: B+ (86)" },
        { status: "failed", label: "SAT taken October: 890", detail: "Below 1010 threshold" },
        { status: "not-scheduled", label: "No college prep courses enrolled" },
      ],
    },
    {
      semester: "Spring",
      year: "2025-26",
      isCurrent: true,
      events: [
        { status: "upcoming", label: "Welding II completion expected May 2026" },
        { status: "upcoming", label: "AWS Welding certification exam: Apr 28", isNextAction: true },
        { status: "upcoming", label: "TSIA testing window: May 1-15", detail: "Not yet scheduled" },
        { status: "upcoming", label: "SAT retake opportunity: May 3", detail: "Not yet registered" },
      ],
    },
    {
      semester: "Fall",
      year: "2026-27",
      isFuture: true,
      events: [
        { status: "upcoming", label: "If IBC not earned junior year: Final exam opportunity in fall" },
        { status: "upcoming", label: "If SAT still below threshold: October SAT retake" },
        { status: "upcoming", label: "College prep ELA course available as backup pathway" },
      ],
    },
  ],
  ccmrProjection: {
    activePaths: [
      {
        name: "IBC (highest probability)",
        probability: "high",
        detail: "AWS Welding exam Apr 28. If he passes, CCMR is met immediately. His Welding II grade of B+ suggests strong preparation.",
      },
      {
        name: "TSIA (moderate probability)",
        probability: "medium",
        detail: "Has never attempted. Schedule for May testing window. Based on SAT of 890, estimated 40-50% chance of meeting TSI threshold.",
      },
      {
        name: "SAT retake (lower probability)",
        probability: "low",
        detail: "Needs 120-point improvement to reach 1010. Possible with targeted prep but unlikely by May.",
      },
    ],
    recommendation: "Focus on IBC exam preparation. Register for TSIA as backup. SAT retake only if both others fail.",
  },
};

// ============================================
// STATUS BADGE (Large)
// ============================================

const StatusBadgeLarge = ({ status }: { status: StudentCCMRData["ccmrStatus"] }) => {
  const config = {
    "at-risk": { label: "At Risk", className: "bg-error text-neutral-0" },
    "almost": { label: "Almost", className: "bg-warning text-neutral-0" },
    "on-track": { label: "On Track", className: "bg-primary-500 text-neutral-0" },
    "met": { label: "CCMR Met", className: "bg-teal-600 text-neutral-0" },
  };

  return (
    <span className={cn("px-4 py-2 rounded-lg text-[14px] font-bold uppercase tracking-wide", config[status].className)}>
      {config[status].label}
    </span>
  );
};

// ============================================
// INDICATOR STATUS ICON
// ============================================

const IndicatorStatusIcon = ({ status }: { status: IndicatorStatus }) => {
  switch (status) {
    case "met":
      return <CheckCircle2 className="w-5 h-5 text-teal-600" />;
    case "in-progress":
      return <Clock className="w-5 h-5 text-warning-dark" />;
    case "not-met":
      return <X className="w-5 h-5 text-error" />;
    case "not-attempted":
      return <X className="w-5 h-5 text-neutral-400" />;
    case "info-only":
      return <Info className="w-5 h-5 text-primary-400" />;
  }
};

const getIndicatorStatusLabel = (status: IndicatorStatus): string => {
  switch (status) {
    case "met": return "Met";
    case "in-progress": return "In progress";
    case "not-met": return "Below threshold";
    case "not-attempted": return "Not attempted";
    case "info-only": return "Info only";
  }
};

// ============================================
// STUDENT HEADER
// ============================================

const StudentHeader = ({ student }: { student: StudentCCMRData }) => {
  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* Left: Avatar + Info */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-[24px] font-bold text-teal-700">
              {student.name.split(" ").map(n => n[0]).join("")}
            </span>
          </div>
          <div>
            <h1 className="text-[24px] font-semibold text-neutral-900">{student.name}</h1>
            <p className="text-[14px] text-neutral-500 mt-0.5">#{student.studentId}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-[12px] font-medium rounded-full">
                {student.campus}
              </span>
              <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-[12px] font-medium rounded-full">
                Grade {student.grade}
              </span>
              {student.advancedTester && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-[12px] font-medium rounded-full">
                  Adv tester: {student.advancedTester.exam} ({student.advancedTester.grade} grade)
                </span>
              )}
              {student.isEB && (
                <span className="px-3 py-1 bg-primary-100 text-primary-700 text-[12px] font-medium rounded-full">
                  EB
                </span>
              )}
              {student.ctePathway && (
                <span className="px-3 py-1 bg-teal-100 text-teal-700 text-[12px] font-medium rounded-full">
                  CTE: {student.ctePathway.split(" ")[0]}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Status Badge */}
        <div className="flex-shrink-0">
          <StatusBadgeLarge status={student.ccmrStatus} />
        </div>
      </div>
    </div>
  );
};

// ============================================
// CCMR INDICATOR CHECKLIST
// ============================================

const CCMRIndicatorChecklist = ({ indicators }: { indicators: CCMRIndicator[] }) => {
  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <h2 className="text-[18px] font-semibold text-neutral-900 mb-4">CCMR indicator checklist</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left text-[12px] font-semibold text-neutral-700 pb-3 w-[220px]">Indicator</th>
              <th className="text-left text-[12px] font-semibold text-neutral-700 pb-3 w-[130px]">Status</th>
              <th className="text-left text-[12px] font-semibold text-neutral-700 pb-3">Detail</th>
            </tr>
          </thead>
          <tbody>
            {indicators.map((indicator, idx) => (
              <tr 
                key={idx} 
                className={cn(
                  "border-b border-neutral-100 last:border-0",
                  indicator.status === "info-only" && "bg-primary-50/30"
                )}
              >
                <td className="py-3 text-[13px] text-neutral-900">{indicator.name}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <IndicatorStatusIcon status={indicator.status} />
                    <span className={cn(
                      "text-[12px]",
                      indicator.status === "met" ? "text-teal-600" :
                      indicator.status === "in-progress" ? "text-warning-dark" :
                      indicator.status === "not-met" ? "text-error" :
                      indicator.status === "info-only" ? "text-primary-500" :
                      "text-neutral-400"
                    )}>
                      {getIndicatorStatusLabel(indicator.status)}
                    </span>
                  </div>
                </td>
                <td className="py-3 text-[13px] text-neutral-600">
                  {indicator.detail === "—" ? (
                    <span className="text-neutral-400">—</span>
                  ) : (
                    indicator.detail
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================
// RECOMMENDED INTERVENTIONS
// ============================================

const RecommendedInterventions = ({ student }: { student: StudentCCMRData }) => {
  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <h2 className="text-[18px] font-semibold text-neutral-900 mb-4">Recommended interventions</h2>
      
      <div className="space-y-4">
        {/* Primary recommendation */}
        <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-4 h-4 text-neutral-0" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-teal-800">
                Fastest path to CCMR: Industry-based certification
              </h3>
              <p className="text-[13px] text-teal-700 mt-2 leading-relaxed">
                {student.name.split(" ")[0]} is enrolled in the Welding program and has an AWS certification exam scheduled for April 28. If he passes, he meets CCMR. Ensure he&apos;s prepared and the exam registration is confirmed.
              </p>
            </div>
          </div>
        </div>

        {/* Backup recommendation */}
        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-neutral-400 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-neutral-0" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-neutral-800">
                Backup path: TSI Assessment
              </h3>
              <p className="text-[13px] text-neutral-600 mt-2 leading-relaxed">
                {student.name.split(" ")[0]} has never attempted the TSIA. Scheduling a testing session before the May window would give him a second chance at CCMR if the IBC exam doesn&apos;t work out.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ACADEMIC SNAPSHOT
// ============================================

const AcademicSnapshot = ({ student }: { student: StudentCCMRData }) => {
  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <h2 className="text-[18px] font-semibold text-neutral-900 mb-4">Academic snapshot</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-[12px] text-neutral-500 mb-1">GPA</p>
          <p className={cn(
            "text-[20px] font-bold",
            student.gpa >= 3.0 ? "text-teal-600" : student.gpa >= 2.0 ? "text-warning-dark" : "text-error"
          )}>
            {student.gpa.toFixed(1)}
          </p>
        </div>
        <div>
          <p className="text-[12px] text-neutral-500 mb-1">Attendance</p>
          <p className={cn(
            "text-[20px] font-bold",
            student.attendance >= 95 ? "text-teal-600" : student.attendance >= 85 ? "text-warning-dark" : "text-error"
          )}>
            {student.attendance}%
          </p>
        </div>
        <div>
          <p className="text-[12px] text-neutral-500 mb-1">CTE pathway</p>
          <p className="text-[14px] font-medium text-neutral-900">{student.ctePathway || "—"}</p>
        </div>
        <div>
          <p className="text-[12px] text-neutral-500 mb-1">Credits earned</p>
          <p className="text-[20px] font-bold text-neutral-900">
            {student.creditsEarned} <span className="text-[14px] font-normal text-neutral-500">of {student.creditsRequired}</span>
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SEMESTER EVENT STATUS ICON
// ============================================

const SemesterEventIcon = ({ status, isNextAction }: { status: SemesterEvent["status"]; isNextAction?: boolean }) => {
  if (isNextAction) {
    return (
      <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center ring-2 ring-teal-200">
        <ChevronRight className="w-3 h-3 text-neutral-0" />
      </div>
    );
  }
  
  switch (status) {
    case "completed":
      return <CheckCircle2 className="w-5 h-5 text-teal-600" />;
    case "in-progress":
      return <Clock className="w-5 h-5 text-primary-500" />;
    case "failed":
      return <X className="w-5 h-5 text-error" />;
    case "upcoming":
      return <div className="w-5 h-5 rounded-full border-2 border-neutral-300 flex items-center justify-center">
        <ChevronRight className="w-3 h-3 text-neutral-400" />
      </div>;
    case "not-scheduled":
      return <Minus className="w-5 h-5 text-neutral-300" />;
  }
};

// ============================================
// CCMR PATHWAY PLANNER
// ============================================

const CCMRPathwayPlanner = ({ student }: { student: StudentCCMRData }) => {
  // Group semesters by academic year
  const semestersByYear: Record<string, SemesterCard[]> = {};
  student.pathwaySemesters.forEach(sem => {
    if (!semestersByYear[sem.year]) {
      semestersByYear[sem.year] = [];
    }
    semestersByYear[sem.year].push(sem);
  });

  const yearLabels: Record<string, string> = {
    "2024-25": "Sophomore year (2024-25)",
    "2025-26": "Junior year (2025-26) — CURRENT",
    "2026-27": "Senior year (2026-27) — PROJECTED",
  };

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-neutral-200">
        <h2 className="text-[18px] font-semibold text-neutral-900">
          {student.name} — CCMR pathway planner
        </h2>
        <p className="text-[13px] text-neutral-500 mt-1">
          Tracking progress across semesters toward CCMR indicators
        </p>
      </div>

      <div className="p-6 space-y-8">
        {Object.entries(semestersByYear).map(([year, semesters]) => (
          <div key={year}>
            {/* Year heading */}
            <h3 className={cn(
              "text-[14px] font-semibold mb-4",
              semesters.some(s => s.isCurrent) ? "text-teal-700" :
              semesters.some(s => s.isFuture) ? "text-neutral-400" :
              "text-neutral-700"
            )}>
              {yearLabels[year] || year}
            </h3>

            {/* Semester cards in a grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {semesters.map((semester, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-4 rounded-lg border",
                    semester.isFuture ? "bg-neutral-50 border-neutral-200 opacity-70" :
                    semester.isCurrent ? "bg-primary-50/50 border-primary-200" :
                    "bg-neutral-0 border-neutral-200"
                  )}
                >
                  <p className={cn(
                    "text-[12px] font-semibold uppercase tracking-wide mb-3",
                    semester.isCurrent ? "text-primary-600" :
                    semester.isFuture ? "text-neutral-400" :
                    "text-neutral-500"
                  )}>
                    {semester.semester} semester
                    {semester.isFuture && " (projected)"}
                  </p>

                  <div className="space-y-2.5">
                    {semester.events.map((event, eventIdx) => (
                      <div
                        key={eventIdx}
                        className={cn(
                          "flex items-start gap-2.5",
                          event.isNextAction && "p-2 -mx-2 bg-teal-100 rounded-md"
                        )}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          <SemesterEventIcon status={event.status} isNextAction={event.isNextAction} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-[13px]",
                            event.isNextAction ? "text-teal-800 font-semibold" :
                            event.status === "completed" ? "text-neutral-700" :
                            event.status === "failed" ? "text-error" :
                            event.status === "in-progress" ? "text-primary-700" :
                            event.status === "not-scheduled" ? "text-neutral-400" :
                            "text-neutral-600"
                          )}>
                            {event.label}
                          </p>
                          {event.detail && (
                            <p className={cn(
                              "text-[11px] mt-0.5",
                              event.isNextAction ? "text-teal-600" : "text-neutral-400"
                            )}>
                              {event.detail}
                            </p>
                          )}
                          {event.isNextAction && (
                            <span className="inline-block mt-1.5 px-2 py-0.5 bg-teal-600 text-neutral-0 text-[10px] font-bold uppercase rounded">
                              Next Action
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CCMR Projection Summary */}
      <div className="p-6 border-t border-neutral-200 bg-teal-50">
        <h3 className="text-[14px] font-semibold text-teal-800 mb-3">
          {student.name.split(" ")[0]} has {student.ccmrProjection.activePaths.length} active pathways to CCMR this year:
        </h3>
        
        <div className="space-y-3">
          {student.ccmrProjection.activePaths.map((path, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                path.probability === "high" ? "bg-teal-600" :
                path.probability === "medium" ? "bg-warning" :
                "bg-neutral-400"
              )} />
              <div>
                <p className="text-[13px] font-medium text-teal-900">{path.name}</p>
                <p className="text-[12px] text-teal-700 mt-0.5">{path.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-teal-100 rounded-lg">
          <p className="text-[13px] font-semibold text-teal-800">Recommended priority:</p>
          <p className="text-[13px] text-teal-700 mt-1">{student.ccmrProjection.recommendation}</p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN STUDENT PROFILE COMPONENT
// ============================================

export const PathwaysStudentProfile = ({ student }: { student: StudentCCMRData }) => {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/pathways/students"
        className="inline-flex items-center gap-1 text-[13px] font-medium text-primary-500 hover:text-primary-600"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Back to Students
      </Link>

      {/* Student Header */}
      <StudentHeader student={student} />

      {/* Two column layout for main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Indicator checklist (wider) */}
        <div className="lg:col-span-2">
          <CCMRIndicatorChecklist indicators={student.indicators} />
        </div>

        {/* Right column: Interventions + Academic */}
        <div className="space-y-6">
          <RecommendedInterventions student={student} />
          <AcademicSnapshot student={student} />
        </div>
      </div>

      {/* CCMR Pathway Planner (full width) */}
      <CCMRPathwayPlanner student={student} />
    </div>
  );
};
