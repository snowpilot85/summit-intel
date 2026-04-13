"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Download,
  Printer,
  Mail,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";

/* ============================================
   Campus Reports Page
   Drill-down view for each high school
   ============================================ */

// ============================================
// TYPES
// ============================================

interface Campus {
  id: string;
  name: string;
  principal: string;
  totalStudents: number;
  seniors: number;
  ccmrMet: number;
  ccmrRate: number;
  atRiskSeniors: number;
  trend: number;
}

interface SubgroupData {
  group: string;
  seniors: number;
  ccmrMet: number;
  rate: number;
  gap: number;
}

interface AtRiskStudent {
  id: string;
  name: string;
  indicators: string[];
  nearestPathway: string;
  pathwayAction: string;
}

// ============================================
// MOCK DATA
// ============================================

const campuses: Campus[] = [
  { id: "economedes", name: "Economedes H S", principal: "Dr. Carlos Mendez", totalStudents: 1654, seniors: 312, ccmrMet: 234, ccmrRate: 75, atRiskSeniors: 78, trend: 3 },
  { id: "edinburg-north", name: "Edinburg North H S", principal: "Dr. Maria Gonzalez", totalStudents: 1842, seniors: 342, ccmrMet: 246, ccmrRate: 72, atRiskSeniors: 96, trend: 2 },
  { id: "vela", name: "Vela H S", principal: "Dr. Roberto Santos", totalStudents: 1523, seniors: 261, ccmrMet: 180, ccmrRate: 69, atRiskSeniors: 81, trend: -1 },
  { id: "edinburg", name: "Edinburg H S", principal: "Dr. Ana Rodriguez", totalStudents: 1712, seniors: 288, ccmrMet: 184, ccmrRate: 64, atRiskSeniors: 104, trend: 1 },
];

const indicatorData = [
  { indicator: "IBC", count: 89, percent: 26 },
  { indicator: "Dual credit", count: 78, percent: 23 },
  { indicator: "TSI", count: 52, percent: 15 },
  { indicator: "College prep", count: 41, percent: 12 },
  { indicator: "AP/IB 3+", count: 38, percent: 11 },
  { indicator: "SAT/ACT", count: 29, percent: 8 },
];

const subgroupData: SubgroupData[] = [
  { group: "All students", seniors: 342, ccmrMet: 246, rate: 72, gap: 0 },
  { group: "EB students", seniors: 144, ccmrMet: 87, rate: 60, gap: -12 },
  { group: "Econ disadvantaged", seniors: 198, ccmrMet: 129, rate: 65, gap: -7 },
  { group: "Special education", seniors: 38, ccmrMet: 19, rate: 50, gap: -22 },
  { group: "Male", seniors: 178, ccmrMet: 124, rate: 70, gap: -2 },
  { group: "Female", seniors: 164, ccmrMet: 122, rate: 74, gap: 2 },
];

const atRiskStudents: AtRiskStudent[] = [
  { id: "201502", name: "Luis Hernandez", indicators: [], nearestPathway: "IBC", pathwayAction: "Register for AWS exam" },
  { id: "201567", name: "Maria Santos", indicators: [], nearestPathway: "IBC", pathwayAction: "Register for CNA exam" },
  { id: "201890", name: "Carlos Vega", indicators: [], nearestPathway: "TSI", pathwayAction: "Schedule TSIA" },
  { id: "201445", name: "Diana Torres", indicators: [], nearestPathway: "College Prep", pathwayAction: "Monitor grade (67%)" },
  { id: "201334", name: "Roberto Cruz", indicators: [], nearestPathway: "IBC", pathwayAction: "Confirm exam registration" },
  { id: "201556", name: "Ana Garcia", indicators: [], nearestPathway: "TSI", pathwayAction: "Schedule TSIA" },
  { id: "201623", name: "Jose Martinez", indicators: [], nearestPathway: "Dual Credit", pathwayAction: "Complete final exam" },
  { id: "201789", name: "Elena Ruiz", indicators: [], nearestPathway: "IBC", pathwayAction: "Register for ServSafe" },
];

// ============================================
// CAMPUS SELECTOR
// ============================================

interface CampusSelectorProps {
  selectedCampus: Campus;
  onCampusChange: (campus: Campus) => void;
}

const CampusSelector = ({ selectedCampus, onCampusChange }: CampusSelectorProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-4 p-4 bg-neutral-0 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
      >
        <div className="text-left">
          <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">Select a campus</p>
          <p className="text-[16px] font-semibold text-neutral-900">{selectedCampus.name}</p>
          <p className="text-[13px] text-neutral-600">
            {selectedCampus.seniors} seniors, {selectedCampus.ccmrRate}% CCMR
          </p>
        </div>
        <ChevronDown className={cn("w-5 h-5 text-neutral-500 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-0 border border-neutral-200 rounded-lg shadow-lg z-50">
          {campuses.map((campus) => (
            <button
              key={campus.id}
              onClick={() => {
                onCampusChange(campus);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-0 first:rounded-t-lg last:rounded-b-lg",
                selectedCampus.id === campus.id && "bg-teal-50"
              )}
            >
              <div className="text-left">
                <p className="text-[14px] font-medium text-neutral-900">{campus.name}</p>
                <p className="text-[12px] text-neutral-500">
                  {campus.seniors} seniors, {campus.ccmrRate}% CCMR
                </p>
              </div>
              <span className={cn(
                "text-[13px] font-semibold flex items-center gap-1",
                campus.trend > 0 ? "text-teal-600" : campus.trend < 0 ? "text-error" : "text-neutral-500"
              )}>
                {campus.trend > 0 ? <TrendingUp className="w-4 h-4" /> : campus.trend < 0 ? <TrendingDown className="w-4 h-4" /> : null}
                {campus.trend > 0 ? "+" : ""}{campus.trend}%
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// CAMPUS HEADER CARD
// ============================================

interface CampusHeaderProps {
  campus: Campus;
}

const CampusHeaderCard = ({ campus }: CampusHeaderProps) => {
  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[22px] font-bold text-neutral-900">{campus.name}</h2>
          <p className="text-[14px] text-neutral-600 flex items-center gap-2 mt-1">
            <User className="w-4 h-4" />
            Principal: {campus.principal}
          </p>
        </div>
        <span className={cn(
          "px-3 py-1.5 rounded-full text-[13px] font-semibold flex items-center gap-1",
          campus.trend > 0 ? "bg-teal-100 text-teal-700" : campus.trend < 0 ? "bg-error-light text-error-dark" : "bg-neutral-100 text-neutral-600"
        )}>
          {campus.trend > 0 ? <TrendingUp className="w-4 h-4" /> : campus.trend < 0 ? <TrendingDown className="w-4 h-4" /> : null}
          {campus.trend > 0 ? "+" : ""}{campus.trend}% vs. last year
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 bg-neutral-50 rounded-lg">
          <p className="text-[12px] text-neutral-500 mb-1">Total 9-12</p>
          <p className="text-[20px] font-bold text-neutral-900">{campus.totalStudents.toLocaleString()}</p>
        </div>
        <div className="p-4 bg-neutral-50 rounded-lg">
          <p className="text-[12px] text-neutral-500 mb-1">Seniors</p>
          <p className="text-[20px] font-bold text-neutral-900">{campus.seniors}</p>
        </div>
        <div className="p-4 bg-neutral-50 rounded-lg">
          <p className="text-[12px] text-neutral-500 mb-1">CCMR met</p>
          <p className="text-[20px] font-bold text-teal-600">{campus.ccmrMet} ({campus.ccmrRate}%)</p>
        </div>
        <div className="p-4 bg-neutral-50 rounded-lg">
          <p className="text-[12px] text-neutral-500 mb-1">At risk seniors</p>
          <p className="text-[20px] font-bold text-error">{campus.atRiskSeniors}</p>
        </div>
        <div className="p-4 bg-neutral-50 rounded-lg">
          <p className="text-[12px] text-neutral-500 mb-1">Trend</p>
          <p className={cn(
            "text-[20px] font-bold flex items-center gap-1",
            campus.trend > 0 ? "text-teal-600" : campus.trend < 0 ? "text-error" : "text-neutral-600"
          )}>
            {campus.trend > 0 ? <TrendingUp className="w-5 h-5" /> : campus.trend < 0 ? <TrendingDown className="w-5 h-5" /> : null}
            {campus.trend > 0 ? "+" : ""}{campus.trend}%
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CCMR BY INDICATOR SECTION
// ============================================

const CCMRByIndicatorSection = () => {
  const maxCount = Math.max(...indicatorData.map(d => d.count));

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <h3 className="text-[16px] font-semibold text-neutral-900 mb-4">CCMR by indicator (this campus)</h3>
      <div className="space-y-3">
        {indicatorData.map((item, idx) => (
          <div key={idx} className="flex items-center gap-4">
            <div className="w-24 text-[13px] text-neutral-700 flex-shrink-0">{item.indicator}</div>
            <div className="flex-1 h-6 bg-neutral-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-teal-500 rounded-full flex items-center justify-end pr-2"
                style={{ width: `${(item.count / maxCount) * 100}%` }}
              >
                <span className="text-[11px] font-semibold text-neutral-0">{item.count}</span>
              </div>
            </div>
            <div className="w-12 text-right text-[13px] font-medium text-neutral-600 flex-shrink-0">
              {item.percent}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================
// SUBGROUP COMPARISON SECTION
// ============================================

const SubgroupComparisonSection = () => {
  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-neutral-200">
        <h3 className="text-[16px] font-semibold text-neutral-900">Subgroup comparison</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Student group</th>
              <th className="px-4 py-3 text-right text-[12px] font-semibold text-neutral-700">Seniors</th>
              <th className="px-4 py-3 text-right text-[12px] font-semibold text-neutral-700">CCMR met</th>
              <th className="px-4 py-3 text-right text-[12px] font-semibold text-neutral-700">Rate</th>
              <th className="px-4 py-3 text-right text-[12px] font-semibold text-neutral-700">Gap vs. campus avg</th>
            </tr>
          </thead>
          <tbody>
            {subgroupData.map((row, idx) => (
              <tr key={idx} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3 text-[13px] font-medium text-neutral-900">{row.group}</td>
                <td className="px-4 py-3 text-[13px] text-neutral-700 text-right">{row.seniors}</td>
                <td className="px-4 py-3 text-[13px] text-neutral-700 text-right">{row.ccmrMet}</td>
                <td className="px-4 py-3 text-right">
                  <span className={cn(
                    "text-[13px] font-semibold",
                    row.rate >= 72 ? "text-teal-600" : row.rate >= 65 ? "text-warning-dark" : "text-error"
                  )}>
                    {row.rate}%
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {row.gap === 0 ? (
                    <span className="text-[13px] text-neutral-400">—</span>
                  ) : (
                    <span className={cn(
                      "text-[13px] font-semibold",
                      Math.abs(row.gap) > 10 ? "text-error" : Math.abs(row.gap) > 5 ? "text-warning-dark" : row.gap > 0 ? "text-teal-600" : "text-neutral-600"
                    )}>
                      {row.gap > 0 ? "+" : ""}{row.gap}%
                    </span>
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
// ED DOCUMENTATION SECTION
// ============================================

import { AlertTriangle, FileText } from "lucide-react";

const EDDocumentationSection = () => {
  const currentFormsCollected = 1247;
  const totalStudents = 1842;
  const currentPercent = 67.7;
  const estimatedFullPercent = 81.2;
  const missingForms = totalStudents - currentFormsCollected;
  
  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-neutral-200">
        <h3 className="text-[16px] font-semibold text-neutral-900">Economically disadvantaged documentation</h3>
        <p className="text-[13px] text-neutral-600 mt-1">
          ED form collection — hidden accountability lever
        </p>
        <p className="text-[12px] text-neutral-500 mt-0.5">
          Your documented ED% determines which scoring bracket TEA uses. Under-documenting ED students means you&apos;re graded against a harder standard.
        </p>
      </div>
      
      {/* Comparison Table */}
      <div className="p-6 border-b border-neutral-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="py-3 text-left text-[12px] font-semibold text-neutral-700">Metric</th>
                <th className="py-3 text-right text-[12px] font-semibold text-neutral-700">Current</th>
                <th className="py-3 text-right text-[12px] font-semibold text-teal-600">If fully documented</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-100">
                <td className="py-3 text-[13px] text-neutral-700">ED forms collected</td>
                <td className="py-3 text-[13px] text-neutral-900 text-right font-medium">
                  {currentFormsCollected.toLocaleString()} / {totalStudents.toLocaleString()} ({currentPercent}%)
                </td>
                <td className="py-3 text-[13px] text-teal-600 text-right font-medium">
                  {totalStudents.toLocaleString()} / {totalStudents.toLocaleString()} (100%)
                </td>
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="py-3 text-[13px] text-neutral-700">Documented ED%</td>
                <td className="py-3 text-[13px] text-neutral-900 text-right font-medium">67.9%</td>
                <td className="py-3 text-[13px] text-teal-600 text-right font-medium">Est. 81.2%</td>
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="py-3 text-[13px] text-neutral-700">CCMR cut score for B</td>
                <td className="py-3 text-[13px] text-neutral-900 text-right font-medium">75</td>
                <td className="py-3 text-[13px] text-teal-600 text-right font-medium">58</td>
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="py-3 text-[13px] text-neutral-700">Your CCMR raw score</td>
                <td className="py-3 text-[13px] text-neutral-900 text-right font-medium">72</td>
                <td className="py-3 text-[13px] text-neutral-600 text-right">72 (unchanged)</td>
              </tr>
              <tr className="border-b border-neutral-100">
                <td className="py-3 text-[13px] text-neutral-700">CCMR scaled score</td>
                <td className="py-3 text-[13px] text-neutral-900 text-right font-medium">82 (B)</td>
                <td className="py-3 text-[13px] text-teal-600 text-right font-semibold">89 (B+)</td>
              </tr>
              <tr className="bg-teal-50">
                <td className="py-3 text-[13px] font-semibold text-neutral-900">Impact on overall</td>
                <td className="py-3 text-[13px] text-neutral-400 text-right">—</td>
                <td className="py-3 text-[13px] text-teal-700 text-right font-bold">+4 points toward A</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="p-6 border-b border-neutral-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-medium text-neutral-700">Form collection progress</span>
          <span className="text-[13px] font-semibold text-neutral-900">{currentPercent}%</span>
        </div>
        <div className="h-4 bg-neutral-100 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-teal-500 rounded-l-full"
            style={{ width: `${currentPercent}%` }}
          />
          <div 
            className="h-full bg-warning/40"
            style={{ width: `${100 - currentPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-teal-600">{currentFormsCollected.toLocaleString()} collected</span>
          <span className="text-[11px] text-warning-dark">{missingForms} missing</span>
        </div>
      </div>
      
      {/* Callout */}
      <div className="p-6 border-b border-neutral-200 bg-warning-light">
        <div className="flex gap-3">
          <AlertTriangle className="w-5 h-5 text-warning-dark flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[14px] font-semibold text-warning-dark">
              {missingForms} students are missing ED documentation.
            </p>
            <p className="text-[13px] text-warning-dark/80 mt-1">
              If even half qualify as ED, your campus ED% moves from 67.9% to 74.5%, which lowers your CCMR scoring threshold. This costs nothing and could be worth 3-4 accountability points.
            </p>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="p-6 flex flex-wrap items-center gap-3">
        <Link 
          href="/pathways/students?filter=missing-ed"
          className="text-[13px] font-medium text-teal-600 hover:text-teal-700"
        >
          View students missing ED forms
        </Link>
        <button className="px-4 py-2 border border-neutral-200 text-neutral-700 text-[13px] font-medium rounded-md hover:bg-neutral-50 transition-colors flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Generate ED form collection report
        </button>
        <button className="px-4 py-2 border border-neutral-200 text-neutral-700 text-[13px] font-medium rounded-md hover:bg-neutral-50 transition-colors flex items-center gap-2">
          <Printer className="w-4 h-4" />
          Print parent form packets
        </button>
      </div>
    </div>
  );
};

// ============================================
// AT-RISK STUDENTS SECTION
// ============================================

interface AtRiskStudentsSectionProps {
  atRiskCount: number;
}

const AtRiskStudentsSection = ({ atRiskCount }: AtRiskStudentsSectionProps) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5;
  const totalPages = Math.ceil(atRiskStudents.length / itemsPerPage);
  const paginatedStudents = atRiskStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-neutral-200">
        <h3 className="text-[16px] font-semibold text-neutral-900">At-risk seniors at this campus</h3>
        <p className="text-[13px] text-neutral-600 mt-1">{atRiskCount} seniors without a CCMR indicator</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Student</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Nearest pathway</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Action needed</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.map((student) => (
              <tr key={student.id} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/pathways/students/${student.id}`} className="text-[13px] font-medium text-primary-500 hover:text-primary-600">
                    {student.name} #{student.id}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 text-[12px] font-medium rounded">
                    {student.nearestPathway}
                  </span>
                </td>
                <td className="px-4 py-3 text-[13px] text-neutral-700">{student.pathwayAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 bg-neutral-50">
        <p className="text-[13px] text-neutral-600">
          Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, atRiskStudents.length)} of {atRiskCount}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded border border-neutral-200 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[13px] text-neutral-600">Page {currentPage}</span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded border border-neutral-200 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CAMPUS ACTION PLAN
// ============================================

interface CampusActionPlanProps {
  campus: Campus;
}

const CampusActionPlan = ({ campus }: CampusActionPlanProps) => {
  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-neutral-200 bg-teal-50">
        <h3 className="text-[18px] font-bold text-neutral-900">{campus.name} — CCMR Action Plan</h3>
      </div>
      <div className="p-6">
        <p className="text-[14px] font-semibold text-neutral-900 mb-4">Three priority actions:</p>
        <div className="space-y-4">
          <div className="flex gap-4 p-4 bg-neutral-50 rounded-lg">
            <span className="w-7 h-7 flex-shrink-0 bg-teal-500 text-neutral-0 text-[14px] font-bold rounded-full flex items-center justify-center">1</span>
            <div>
              <p className="text-[14px] font-medium text-neutral-900">
                Register 34 CTE students for IBC exams before May 15
              </p>
              <p className="text-[13px] text-teal-600 mt-1">Projected impact: +10% CCMR</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 bg-neutral-50 rounded-lg">
            <span className="w-7 h-7 flex-shrink-0 bg-teal-500 text-neutral-0 text-[14px] font-bold rounded-full flex items-center justify-center">2</span>
            <div>
              <p className="text-[14px] font-medium text-neutral-900">
                Schedule TSIA testing session for 28 untested seniors
              </p>
              <p className="text-[13px] text-teal-600 mt-1">Projected impact: +4% (at 50% pass rate)</p>
            </div>
          </div>
          <div className="flex gap-4 p-4 bg-neutral-50 rounded-lg">
            <span className="w-7 h-7 flex-shrink-0 bg-teal-500 text-neutral-0 text-[14px] font-bold rounded-full flex items-center justify-center">3</span>
            <div>
              <p className="text-[14px] font-medium text-neutral-900">
                Monitor 18 college prep students at risk of failing
              </p>
              <p className="text-[13px] text-teal-600 mt-1">Ensure tutoring support through May 23</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
          <p className="text-[14px] font-semibold text-teal-700">
            If all three actions succeed, {campus.name} CCMR could reach 82% (up from {campus.ccmrRate}%).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-6">
          <button className="px-4 py-2 border border-neutral-200 text-neutral-700 text-[13px] font-medium rounded-md hover:bg-neutral-50 transition-colors flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print action plan
          </button>
          <button className="px-4 py-2 border border-neutral-200 text-neutral-700 text-[13px] font-medium rounded-md hover:bg-neutral-50 transition-colors flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Share with principal
          </button>
          <button className="px-4 py-2 border border-neutral-200 text-neutral-700 text-[13px] font-medium rounded-md hover:bg-neutral-50 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export campus data
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// A-F SIMULATOR LINK CARD
// ============================================

import { ArrowRight, Gauge } from "lucide-react";

const AFSimulatorLinkCard = () => {
  return (
    <Link
      href="/pathways/simulator"
      className="block p-5 bg-gradient-to-r from-teal-50 to-primary-50 border border-teal-200 rounded-lg hover:from-teal-100 hover:to-primary-100 transition-colors group"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center">
            <Gauge className="w-6 h-6 text-neutral-0" />
          </div>
          <div>
            <p className="text-[16px] font-semibold text-neutral-900">See how CCMR changes impact your A-F rating</p>
            <p className="text-[13px] text-neutral-600 mt-0.5">
              Use our simulator to model scenarios with TEA&apos;s actual accountability formula
            </p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-teal-500 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
};

// ============================================
// MAIN CAMPUS REPORTS PAGE
// ============================================

export const CampusReportsPage = () => {
  const [selectedCampus, setSelectedCampus] = React.useState<Campus>(campuses[1]); // Default to Edinburg North

  return (
    <div className="space-y-6">
      {/* Campus Selector */}
      <CampusSelector 
        selectedCampus={selectedCampus} 
        onCampusChange={setSelectedCampus} 
      />

      {/* Campus Header */}
      <CampusHeaderCard campus={selectedCampus} />

      {/* Two-column layout for indicator chart and subgroup comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CCMRByIndicatorSection />
        <SubgroupComparisonSection />
      </div>

      {/* ED Documentation */}
      <EDDocumentationSection />

      {/* At-Risk Students */}
      <AtRiskStudentsSection atRiskCount={selectedCampus.atRiskSeniors} />

      {/* Campus Action Plan */}
      <CampusActionPlan campus={selectedCampus} />
      
      {/* A-F Simulator Link Card */}
      <AFSimulatorLinkCard />
    </div>
  );
};

export default CampusReportsPage;
