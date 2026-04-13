"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Mail,
  Printer,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

/* ============================================
   Interventions Page
   The core differentiator for Summit Pathways
   ============================================ */

// ============================================
// TYPES
// ============================================

interface IBCStudent {
  id: string;
  name: string;
  campus: string;
  ctePathway: string;
  certification: string;
  examStatus: "Scheduled" | "Not registered";
  examDate: string | null;
}

interface CollegePrepStudent {
  id: string;
  name: string;
  campus: string;
  course: string;
  currentGrade: string;
  gradePercent: number;
  creditsOnTrack: boolean;
  atRiskOfFailing: boolean;
}

interface TSIStudent {
  id: string;
  name: string;
  campus: string;
  tsiElaReady: string;
  tsiMathReady: string;
  satScore: string | null;
  recommendedAction: string;
}

// ============================================
// MOCK DATA
// ============================================

const ibcStudents: IBCStudent[] = [
  { id: "201502", name: "Luis Hernandez", campus: "Edinburg H S", ctePathway: "Welding", certification: "AWS Welding", examStatus: "Scheduled", examDate: "Apr 28" },
  { id: "201567", name: "Maria Santos", campus: "Edinburg North", ctePathway: "Health Science", certification: "CNA", examStatus: "Not registered", examDate: null },
  { id: "201890", name: "Carlos Vega", campus: "Vela H S", ctePathway: "Auto Tech", certification: "ASE Brakes", examStatus: "Scheduled", examDate: "May 2" },
  { id: "201445", name: "Diana Torres", campus: "Economedes", ctePathway: "Cosmetology", certification: "TX Cosmetology", examStatus: "Not registered", examDate: null },
  { id: "201334", name: "Roberto Cruz", campus: "Edinburg H S", ctePathway: "IT", certification: "CompTIA A+", examStatus: "Scheduled", examDate: "Apr 25" },
  { id: "201556", name: "Ana Garcia", campus: "Vela H S", ctePathway: "Business", certification: "Microsoft Office", examStatus: "Not registered", examDate: null },
  { id: "201623", name: "Jose Martinez", campus: "Edinburg North", ctePathway: "HVAC", certification: "EPA 608", examStatus: "Scheduled", examDate: "May 8" },
  { id: "201789", name: "Elena Ruiz", campus: "Economedes", ctePathway: "Culinary", certification: "ServSafe", examStatus: "Scheduled", examDate: "Apr 30" },
];

const collegePrepStudents: CollegePrepStudent[] = [
  { id: "201678", name: "Ana Morales", campus: "Edinburg North", course: "College Prep ELA", currentGrade: "B+ (87)", gradePercent: 87, creditsOnTrack: true, atRiskOfFailing: false },
  { id: "201712", name: "Pedro Garza", campus: "Edinburg H S", course: "College Prep Math", currentGrade: "D (62)", gradePercent: 62, creditsOnTrack: false, atRiskOfFailing: true },
  { id: "201445", name: "Sofia Ruiz", campus: "Vela H S", course: "College Prep ELA", currentGrade: "C (74)", gradePercent: 74, creditsOnTrack: true, atRiskOfFailing: false },
  { id: "201890", name: "Miguel Flores", campus: "Economedes", course: "College Prep Math", currentGrade: "F (54)", gradePercent: 54, creditsOnTrack: false, atRiskOfFailing: true },
  { id: "201923", name: "Carmen Diaz", campus: "Edinburg North", course: "College Prep Math", currentGrade: "D- (61)", gradePercent: 61, creditsOnTrack: false, atRiskOfFailing: true },
  { id: "201834", name: "David Lopez", campus: "Edinburg H S", course: "College Prep ELA", currentGrade: "C+ (78)", gradePercent: 78, creditsOnTrack: true, atRiskOfFailing: false },
];

const tsiStudents: TSIStudent[] = [
  { id: "201556", name: "Jorge Ramirez", campus: "Edinburg North", tsiElaReady: "Unknown", tsiMathReady: "Unknown", satScore: null, recommendedAction: "Schedule TSIA — high priority" },
  { id: "201623", name: "Elena Vasquez", campus: "Edinburg H S", tsiElaReady: "Unknown", tsiMathReady: "Unknown", satScore: "890", recommendedAction: "Schedule TSIA — SAT was close" },
  { id: "201789", name: "David Tran", campus: "Vela H S", tsiElaReady: "Unknown", tsiMathReady: "Unknown", satScore: null, recommendedAction: "Schedule TSIA" },
  { id: "201834", name: "Carmen Reyes", campus: "Economedes", tsiElaReady: "Unknown", tsiMathReady: "Unknown", satScore: "940", recommendedAction: "Schedule TSIA — SAT was close" },
  { id: "201901", name: "Ricardo Mendez", campus: "Edinburg North", tsiElaReady: "Unknown", tsiMathReady: "Unknown", satScore: "870", recommendedAction: "Schedule TSIA — SAT was close" },
  { id: "201945", name: "Isabella Cruz", campus: "Vela H S", tsiElaReady: "Unknown", tsiMathReady: "Unknown", satScore: null, recommendedAction: "Schedule TSIA" },
];

// ============================================
// IBC PATHWAY CARD
// ============================================

const IBCPathwayCard = () => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(ibcStudents.length / itemsPerPage);
  const paginatedStudents = ibcStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-[18px] font-semibold text-neutral-900">IBC exam completion</h3>
            <p className="text-[14px] text-neutral-600 mt-1">
              134 at-risk seniors with IBC-aligned CTE enrollment
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 bg-teal-100 text-teal-700 text-[13px] font-semibold rounded-full">
              +11% CCMR rate if all pass
            </span>
          </div>
        </div>
        <p className="text-[13px] text-neutral-500 mt-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Spring testing window closes May 15, 2026
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Student</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Campus</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">CTE pathway</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Certification</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Exam status</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Exam date</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.map((student) => (
              <tr 
                key={student.id} 
                className={cn(
                  "border-b border-neutral-100 last:border-0",
                  student.examStatus === "Not registered" && "border-l-4 border-l-error bg-error-light/30"
                )}
              >
                <td className="px-4 py-3">
                  <Link href={`/pathways/students/${student.id}`} className="text-[13px] font-medium text-primary-500 hover:text-primary-600">
                    {student.name} #{student.id}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[13px] text-neutral-700">{student.campus}</td>
                <td className="px-4 py-3 text-[13px] text-neutral-700">{student.ctePathway}</td>
                <td className="px-4 py-3 text-[13px] text-neutral-700">{student.certification}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "px-2 py-1 text-[12px] font-medium rounded",
                    student.examStatus === "Scheduled" 
                      ? "bg-teal-100 text-teal-700"
                      : "bg-error-light text-error-dark"
                  )}>
                    {student.examStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px] text-neutral-700">
                  {student.examDate || "—"}
                </td>
                <td className="px-4 py-3">
                  {student.examStatus === "Scheduled" ? (
                    <span className="flex items-center gap-1 text-[13px] text-teal-600 font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Confirm registration
                    </span>
                  ) : (
                    <button className="text-[13px] font-medium text-error hover:text-error-dark">
                      Register now
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 bg-neutral-50">
        <p className="text-[13px] text-neutral-600">
          Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, ibcStudents.length)} of 134 students
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded border border-neutral-200 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[13px] text-neutral-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded border border-neutral-200 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-t border-neutral-200">
        <button className="px-4 py-2 border border-neutral-200 text-neutral-700 text-[13px] font-medium rounded-md hover:bg-neutral-50 transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export IBC intervention list
        </button>
        <button className="px-4 py-2 border border-neutral-200 text-neutral-700 text-[13px] font-medium rounded-md hover:bg-neutral-50 transition-colors flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Email CTE teachers
        </button>
        <button className="px-4 py-2 border border-neutral-200 text-neutral-700 text-[13px] font-medium rounded-md hover:bg-neutral-50 transition-colors flex items-center gap-2">
          <Printer className="w-4 h-4" />
          Print counselor checklist
        </button>
      </div>
    </div>
  );
};

// ============================================
// COLLEGE PREP PATHWAY CARD
// ============================================

const CollegePrepPathwayCard = () => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(collegePrepStudents.length / itemsPerPage);
  const paginatedStudents = collegePrepStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-[18px] font-semibold text-neutral-900">College prep course verification</h3>
            <p className="text-[14px] text-neutral-600 mt-1">
              89 at-risk seniors enrolled in college prep ELA or Math
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 bg-teal-100 text-teal-700 text-[13px] font-semibold rounded-full">
              +7% CCMR rate
            </span>
          </div>
        </div>
        <p className="text-[13px] text-neutral-500 mt-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Semester ends May 23, 2026
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Student</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Campus</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Course</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Current grade</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Credits earned</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">At risk of failing?</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.map((student) => (
              <tr 
                key={student.id} 
                className={cn(
                  "border-b border-neutral-100 last:border-0",
                  student.atRiskOfFailing && "border-l-4 border-l-error bg-error-light/30"
                )}
              >
                <td className="px-4 py-3">
                  <Link href={`/pathways/students/${student.id}`} className="text-[13px] font-medium text-primary-500 hover:text-primary-600">
                    {student.name} #{student.id}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[13px] text-neutral-700">{student.campus}</td>
                <td className="px-4 py-3 text-[13px] text-neutral-700">{student.course}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "text-[13px] font-medium",
                    student.gradePercent >= 80 ? "text-teal-600" :
                    student.gradePercent >= 70 ? "text-neutral-700" :
                    student.gradePercent >= 60 ? "text-warning-dark" : "text-error"
                  )}>
                    {student.currentGrade}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px] text-neutral-700">
                  {student.creditsOnTrack ? "On track" : "At risk"}
                </td>
                <td className="px-4 py-3">
                  {student.atRiskOfFailing ? (
                    <span className="px-2 py-1 bg-error-light text-error-dark text-[12px] font-medium rounded">
                      Yes
                    </span>
                  ) : (
                    <span className="text-[13px] text-neutral-500">No</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {student.atRiskOfFailing ? (
                    <button className="text-[13px] font-medium text-error hover:text-error-dark">
                      Intervention needed
                    </button>
                  ) : (
                    <span className="text-[13px] text-neutral-500">Monitor</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 bg-neutral-50">
        <p className="text-[13px] text-neutral-600">
          Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, collegePrepStudents.length)} of 89 students
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded border border-neutral-200 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[13px] text-neutral-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded border border-neutral-200 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-t border-neutral-200">
        <button className="px-4 py-2 border border-neutral-200 text-neutral-700 text-[13px] font-medium rounded-md hover:bg-neutral-50 transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export college prep list
        </button>
        <button className="px-4 py-2 border border-neutral-200 text-neutral-700 text-[13px] font-medium rounded-md hover:bg-neutral-50 transition-colors flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Email teachers for grade updates
        </button>
      </div>
    </div>
  );
};

// ============================================
// TSI PATHWAY CARD
// ============================================

const TSIPathwayCard = () => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(tsiStudents.length / itemsPerPage);
  const paginatedStudents = tsiStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-[18px] font-semibold text-neutral-900">TSIA testing opportunity</h3>
            <p className="text-[14px] text-neutral-600 mt-1">
              138 at-risk seniors who have never attempted the TSIA
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 bg-teal-100 text-teal-700 text-[13px] font-semibold rounded-full">
              +11% CCMR rate (est. 50% pass)
            </span>
          </div>
        </div>
        <p className="text-[13px] text-neutral-500 mt-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Final testing window: May 1-15, 2026
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Student</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Campus</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">TSI ELA ready?</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">TSI Math ready?</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">SAT score (if taken)</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Recommended action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.map((student) => (
              <tr 
                key={student.id} 
                className="border-b border-neutral-100 last:border-0"
              >
                <td className="px-4 py-3">
                  <Link href={`/pathways/students/${student.id}`} className="text-[13px] font-medium text-primary-500 hover:text-primary-600">
                    {student.name} #{student.id}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[13px] text-neutral-700">{student.campus}</td>
                <td className="px-4 py-3 text-[13px] text-neutral-500">{student.tsiElaReady}</td>
                <td className="px-4 py-3 text-[13px] text-neutral-500">{student.tsiMathReady}</td>
                <td className="px-4 py-3 text-[13px] text-neutral-700">
                  {student.satScore ? (
                    <span className={cn(
                      parseInt(student.satScore) >= 940 ? "text-warning-dark" : "text-neutral-700"
                    )}>
                      {student.satScore} {parseInt(student.satScore) >= 900 && "(below threshold)"}
                    </span>
                  ) : (
                    <span className="text-neutral-400">Never taken</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <button className="text-[13px] font-medium text-primary-500 hover:text-primary-600">
                    {student.recommendedAction}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Note */}
      <div className="px-6 py-3 bg-primary-50 border-t border-primary-100">
        <p className="text-[12px] text-primary-700">
          Students with SAT scores near the threshold (1000+) are strong TSIA candidates — the TSIA has different cut scores and format.
        </p>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 bg-neutral-50">
        <p className="text-[13px] text-neutral-600">
          Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, tsiStudents.length)} of 138 students
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded border border-neutral-200 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[13px] text-neutral-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded border border-neutral-200 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 px-6 py-4 border-t border-neutral-200">
        <button className="px-4 py-2 border border-neutral-200 text-neutral-700 text-[13px] font-medium rounded-md hover:bg-neutral-50 transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export TSI scheduling list
        </button>
        <button className="px-4 py-2 bg-teal-600 text-neutral-0 text-[13px] font-medium rounded-md hover:bg-teal-700 transition-colors flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Schedule bulk TSIA session
        </button>
      </div>
    </div>
  );
};

// ============================================
// INTERVENTION TRACKING CARD
// ============================================

const InterventionTrackingCard = () => {
  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <h3 className="text-[16px] font-semibold text-neutral-900 mb-4">Intervention tracking</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-neutral-50 rounded-lg">
          <p className="text-[12px] text-neutral-500 mb-1">Interventions started this month</p>
          <p className="text-[24px] font-bold text-neutral-900">47 <span className="text-[14px] font-normal text-neutral-500">students</span></p>
        </div>
        <div className="p-4 bg-neutral-50 rounded-lg">
          <p className="text-[12px] text-neutral-500 mb-1">CCMR indicators earned since Sept 1</p>
          <p className="text-[24px] font-bold text-teal-600">89 <span className="text-[14px] font-normal text-neutral-500">students</span></p>
        </div>
        <div className="p-4 bg-neutral-50 rounded-lg">
          <p className="text-[12px] text-neutral-500 mb-1">Projected CCMR rate if interventions succeed</p>
          <p className="text-[24px] font-bold text-primary-500">74% <span className="text-[14px] font-normal text-teal-600 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> up from 70%</span></p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN INTERVENTIONS PAGE
// ============================================

export const InterventionsPage = () => {
  return (
    <div className="space-y-6">
      {/* Top callout banner */}
      <div className="p-5 bg-warning-light border border-warning/30 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning-dark flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[16px] font-semibold text-warning-dark">
              361 seniors are at risk of graduating without CCMR.
            </p>
            <p className="text-[14px] text-warning-dark/80 mt-1">
              Below are the three fastest intervention pathways, sorted by potential impact. Each list is actionable — counselors can work through these students one by one.
            </p>
          </div>
        </div>
      </div>

      {/* Pathway 1: IBC */}
      <IBCPathwayCard />

      {/* Pathway 2: College Prep */}
      <CollegePrepPathwayCard />

      {/* Pathway 3: TSI */}
      <TSIPathwayCard />

      {/* Intervention Tracking */}
      <InterventionTrackingCard />
    </div>
  );
};

export default InterventionsPage;
