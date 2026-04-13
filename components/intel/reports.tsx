"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Shield,
  Mail,
  TrendingUp,
  Download,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Check,
  Printer,
  ExternalLink,
  GraduationCap,
} from "lucide-react";

/* ============================================
   Reports Page Components
   Summit Intel - EL Compliance Platform
   ============================================ */

// ============================================
// CATEGORY CARDS (Top Row)
// ============================================

interface CategoryCardProps {
  title: string;
  subtitle: string;
  count: string;
  icon: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const CategoryCard = ({ title, subtitle, count, icon, onClick, className }: CategoryCardProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start p-5 bg-neutral-0 border border-neutral-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all text-left",
        className
      )}
    >
      <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center text-primary-500 mb-3">
        {icon}
      </div>
      <h3 className="text-[15px] font-semibold text-neutral-900 mb-1">{title}</h3>
      <p className="text-[12px] text-neutral-500 mb-2">{subtitle}</p>
      <span className="text-[11px] font-medium text-primary-500">{count}</span>
    </button>
  );
};

// ============================================
// REPORT ROW
// ============================================

interface ReportRowProps {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

const ReportRow = ({ title, description, children, className }: ReportRowProps) => {
  return (
    <div className={cn("border-b border-neutral-100 py-5 last:border-0", className)}>
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="text-[14px] font-semibold text-neutral-900 mb-1">{title}</h4>
          <p className="text-[13px] text-neutral-500 leading-relaxed">{description}</p>
        </div>
        <div className="flex-shrink-0">{children}</div>
      </div>
    </div>
  );
};

// ============================================
// STAT BADGE
// ============================================

interface StatBadgeProps {
  label: string;
  value: string;
  variant?: "default" | "warning" | "success" | "error";
}

const StatBadge = ({ label, value, variant = "default" }: StatBadgeProps) => {
  const variants = {
    default: "bg-neutral-100 text-neutral-700",
    warning: "bg-warning-light text-warning-dark",
    success: "bg-teal-100 text-teal-700",
    error: "bg-error-light text-error-dark",
  };

  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-medium", variants[variant])}>
      {label}: <span className="font-semibold">{value}</span>
    </span>
  );
};

// ============================================
// SELECT DROPDOWN
// ============================================

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
}

const Select = ({ value, onChange, options, className }: SelectProps) => {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full px-3 py-2 pr-8 text-[13px] bg-neutral-0 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
    </div>
  );
};

// ============================================
// HORIZONTAL BAR CHART
// ============================================

interface HorizontalBarProps {
  label: string;
  percentage: number;
  className?: string;
}

const HorizontalBar = ({ label, percentage, className }: HorizontalBarProps) => {
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-neutral-700">{label}</span>
        <span className="font-semibold text-teal-600">{percentage}%</span>
      </div>
      <div className="h-6 bg-neutral-100 rounded overflow-hidden flex items-center">
        <div
          className="h-full bg-teal-500 rounded flex items-center justify-end pr-2 transition-all"
          style={{ width: `${percentage}%` }}
        >
          {percentage > 15 && (
            <span className="text-[11px] font-medium text-neutral-0">{percentage}%</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// CHECKBOX
// ============================================

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const Checkbox = ({ label, checked, onChange }: CheckboxProps) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        className={cn(
          "w-4 h-4 rounded border flex items-center justify-center transition-colors",
          checked ? "bg-primary-500 border-primary-500" : "border-neutral-300 bg-neutral-0"
        )}
        onClick={() => onChange(!checked)}
      >
        {checked && <Check className="w-3 h-3 text-neutral-0" />}
      </div>
      <span className="text-[13px] text-neutral-700">{label}</span>
    </label>
  );
};

// ============================================
// LETTER STATUS BADGE
// ============================================

type LetterStatus = "sent" | "signed" | "pending" | "not-sent";

const letterStatusConfig: Record<LetterStatus, { label: string; className: string; icon?: React.ReactNode }> = {
  sent: { label: "Sent", className: "bg-teal-100 text-teal-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  signed: { label: "Signed", className: "bg-teal-100 text-teal-700", icon: <CheckCircle2 className="w-3 h-3" /> },
  pending: { label: "Pending", className: "bg-warning-light text-warning-dark" },
  "not-sent": { label: "Not sent", className: "bg-error-light text-error-dark" },
};

const LetterStatusBadge = ({ status }: { status: LetterStatus }) => {
  const config = letterStatusConfig[status];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium", config.className)}>
      {config.icon}
      {config.label}
    </span>
  );
};

// ============================================
// MAIN REPORTS PAGE
// ============================================

export const ReportsPage = () => {
  // Refs for scroll targets
  const complianceRef = React.useRef<HTMLDivElement>(null);
  const lettersRef = React.useRef<HTMLDivElement>(null);
  const growthRef = React.useRef<HTMLDivElement>(null);
  const ccmrRef = React.useRef<HTMLDivElement>(null);
  const exportsRef = React.useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // State for filters
  const [schoolYear, setSchoolYear] = React.useState("2024-25");
  const [campus, setCampus] = React.useState("all");
  const [letterType, setLetterType] = React.useState("eoy-review");
  const [letterLang, setLetterLang] = React.useState("spanish");
  const [letterStatus, setLetterStatus] = React.useState("pending");

  // State for custom export checkboxes
  const [exportFields, setExportFields] = React.useState({
    studentName: true,
    studentId: true,
    school: true,
    gradeLevel: true,
    homeLanguage: false,
    nativeLanguage: false,
    dateEnteredEL: false,
    yearsInUS: false,
    telpasDomains: false,
    summitBOY: false,
    summitMOY: false,
    compositeLevel: false,
    programType: false,
    lpacStatus: false,
    tedsCodes: false,
    reclassStatus: false,
  });

  const selectedFieldCount = Object.values(exportFields).filter(Boolean).length;

  // Sample letter tracking data
  const letterTracking = [
    { student: "Jose Garcia", id: "155201", type: "Reclassification", lang: "Spanish", status: "sent" as LetterStatus, sent: "Apr 2", returned: "—" },
    { student: "Ana Lopez", id: "155215", type: "Identification", lang: "Spanish", status: "signed" as LetterStatus, sent: "Sep 20", returned: "Oct 1" },
    { student: "Carlos Martinez", id: "155220", type: "Reclassification", lang: "Spanish", status: "signed" as LetterStatus, sent: "Apr 2", returned: "Apr 8" },
    { student: "Pedro Alvarez", id: "155301", type: "Identification", lang: "Spanish", status: "not-sent" as LetterStatus, sent: "—", returned: "—" },
    { student: "Mia Carmen Ramirez", id: "155196", type: "EOY Review", lang: "Spanish", status: "pending" as LetterStatus, sent: "—", returned: "—" },
  ];

  // Campus growth data
  const campusGrowth = [
    { name: "Carmen V Avila El", total: 432, growth: 44, maintained: 38, stagnant: 10, regressed: 8, avgChange: "+0.5" },
    { name: "Villarreal El", total: 987, growth: 41, maintained: 40, stagnant: 11, regressed: 8, avgChange: "+0.4" },
    { name: "Edinburg North H S", total: 1842, growth: 38, maintained: 42, stagnant: 12, regressed: 8, avgChange: "+0.3" },
    { name: "Edinburg H S", total: 1654, growth: 34, maintained: 45, stagnant: 14, regressed: 7, avgChange: "+0.2" },
    { name: "Hargill Elem", total: 645, growth: 29, maintained: 48, stagnant: 15, regressed: 8, avgChange: "+0.1" },
  ];

  // Quick exports
  const quickExports = [
    "All EB students with proficiency levels",
    "LPAC meeting decisions (2024-25)",
    "TEDS codes for all students",
    "Parent notification tracking log",
    "Students with incomplete data",
    "Reclassification candidates with criteria",
  ];

  return (
    <div className="space-y-8">
      {/* Category Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <CategoryCard
          title="Compliance Reports"
          subtitle="LPAC documentation, audit trails, PEIMS exports"
          count="3 reports ready"
          icon={<Shield className="w-5 h-5" />}
          onClick={() => scrollToSection(complianceRef)}
        />
        <CategoryCard
          title="Parent Letters"
          subtitle="Notification letters in 60+ languages"
          count="1,247 pending"
          icon={<Mail className="w-5 h-5" />}
          onClick={() => scrollToSection(lettersRef)}
        />
        <CategoryCard
          title="Student Growth"
          subtitle="Year-over-year proficiency tracking"
          count="Current through MOY"
          icon={<TrendingUp className="w-5 h-5" />}
          onClick={() => scrollToSection(growthRef)}
        />
        <CategoryCard
          title="CCMR Readiness"
          subtitle="College, career, and military readiness for EB students"
          count="Grades 9-12 only"
          icon={<GraduationCap className="w-5 h-5" />}
          onClick={() => scrollToSection(ccmrRef)}
        />
        <CategoryCard
          title="Data Exports"
          subtitle="CSV exports, listings, spreadsheets"
          count="Custom filtered exports"
          icon={<Download className="w-5 h-5" />}
          onClick={() => scrollToSection(exportsRef)}
        />
      </div>

      {/* Section 1: Compliance Reports */}
      <div ref={complianceRef} className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-neutral-500" />
          <h2 className="text-[18px] font-semibold text-neutral-900">Compliance Reports</h2>
        </div>

        {/* PEIMS Submission File */}
        <ReportRow
          title="PEIMS submission file"
          description="Export district-wide TEDS codes formatted for TSDS PEIMS submission. Includes all EB indicators, program codes, language codes, and funding codes."
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[13px] text-neutral-600">11,284 of 11,705 students ready</span>
              <span className="text-[13px] font-semibold text-teal-600">(96%)</span>
            </div>
            <div className="w-48 h-2 bg-neutral-200 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: "96%" }} />
            </div>
            <div className="flex items-start gap-2 p-2 bg-warning-light rounded text-[12px] text-warning-dark">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>421 students have incomplete LPAC decisions — resolve before export</span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <button className="px-4 py-2 bg-primary-500 text-neutral-0 text-[13px] font-medium rounded-md hover:bg-primary-600 transition-colors">
                Generate PEIMS file
              </button>
              <Link href="/intel/students?filter=incomplete" className="text-[13px] font-medium text-teal-600 hover:text-teal-700">
                View incomplete students
              </Link>
            </div>
            <p className="text-[11px] text-neutral-400">Last generated: Never</p>
          </div>
        </ReportRow>

        {/* LPAC Compliance Audit Report */}
        <ReportRow
          title="LPAC compliance audit report"
          description="Complete audit trail showing LPAC meeting documentation, signature status, parent notification records, and timeline compliance for all EB students."
        >
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Select
                value={schoolYear}
                onChange={setSchoolYear}
                options={[
                  { value: "2024-25", label: "2024-25" },
                  { value: "2023-24", label: "2023-24" },
                ]}
                className="w-28"
              />
              <Select
                value={campus}
                onChange={setCampus}
                options={[
                  { value: "all", label: "All Campuses" },
                  { value: "edinburg-north", label: "Edinburg North H S" },
                  { value: "edinburg-hs", label: "Edinburg H S" },
                ]}
                className="w-40"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <StatBadge label="Meetings finalized" value="5,514 / 11,705 (47%)" />
              <StatBadge label="Signatures complete" value="5,514 / 5,514 (100%)" variant="success" />
              <StatBadge label="Overdue identifications" value="23" variant="error" />
              <StatBadge label="Parent notifications" value="7,960 / 11,705 (68%)" />
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button className="px-4 py-2 bg-primary-500 text-neutral-0 text-[13px] font-medium rounded-md hover:bg-primary-600 transition-colors">
                Generate audit report
              </button>
              <button className="px-4 py-2 border border-neutral-200 text-neutral-700 text-[13px] font-medium rounded-md hover:bg-neutral-50 transition-colors">
                Download PDF
              </button>
            </div>
            <p className="text-[11px] text-neutral-400">Last generated: March 15, 2025</p>
          </div>
        </ReportRow>

        {/* Reclassification Eligibility Report */}
        <ReportRow
          title="Reclassification eligibility report"
          description="Students who meet or partially meet reclassification criteria with criterion-by-criterion breakdown."
        >
          <div className="space-y-3">
            <p className="text-[13px] text-neutral-600">
              <span className="font-semibold text-teal-600">847 fully eligible</span>
              {" • "}
              <span className="font-medium">1,203 meet 4 of 6</span>
              {" • "}
              <span>234 pending STAAR</span>
            </p>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-primary-500 text-neutral-0 text-[13px] font-medium rounded-md hover:bg-primary-600 transition-colors">
                Generate report
              </button>
              <Link href="/intel/meetings?bulk=reclassification" className="text-[13px] font-medium text-teal-600 hover:text-teal-700">
                Bulk schedule reclassification LPACs
              </Link>
            </div>
          </div>
        </ReportRow>

        {/* Monitoring Status Report */}
        <ReportRow
          title="Monitoring status report"
          description="Students in post-reclassification monitoring periods."
        >
          <div className="space-y-3">
            <p className="text-[13px] text-neutral-600">
              <span className="font-medium">Year 1: 823</span>
              {" • "}
              <span className="font-medium">Year 2: 629</span>
              {" • "}
              <span className="font-semibold text-warning-dark">Exit review due: 312</span>
            </p>
            <button className="px-4 py-2 bg-primary-500 text-neutral-0 text-[13px] font-medium rounded-md hover:bg-primary-600 transition-colors">
              Generate report
            </button>
          </div>
        </ReportRow>
      </div>

      {/* Section 2: Parent Letters */}
      <div ref={lettersRef} className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Mail className="w-5 h-5 text-neutral-500" />
          <h2 className="text-[18px] font-semibold text-neutral-900">Parent Letters</h2>
        </div>

        {/* Bulk letter generation controls */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={letterType}
              onChange={setLetterType}
              options={[
                { value: "eoy-review", label: "EOY LPAC review notification" },
                { value: "identification", label: "Identification notification" },
                { value: "program-placement", label: "Program placement approval" },
                { value: "reclassification", label: "Reclassification notification" },
                { value: "annual-review", label: "Annual review notification" },
                { value: "parent-denial", label: "Parent denial acknowledgment" },
              ]}
              className="w-64"
            />
            <Select
              value={letterLang}
              onChange={setLetterLang}
              options={[
                { value: "spanish", label: "Spanish" },
                { value: "english", label: "English" },
                { value: "vietnamese", label: "Vietnamese" },
                { value: "arabic", label: "Arabic" },
                { value: "mandarin", label: "Mandarin" },
              ]}
              className="w-36"
            />
            <Select
              value={campus}
              onChange={setCampus}
              options={[
                { value: "all", label: "All Campuses" },
                { value: "edinburg-north", label: "Edinburg North H S" },
              ]}
              className="w-40"
            />
            <Select
              value={letterStatus}
              onChange={setLetterStatus}
              options={[
                { value: "pending", label: "Pending only" },
                { value: "all", label: "All statuses" },
              ]}
              className="w-36"
            />
          </div>
          <p className="text-[12px] text-neutral-500">60+ languages available including Vietnamese, Arabic, Mandarin, Somali</p>
        </div>

        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-[14px] text-teal-700 font-medium mb-6">
          1,247 parent letters ready to generate • EOY LPAC review notification • Spanish • All Campuses
        </div>

        {/* Letter preview card */}
        <div className="border border-neutral-200 rounded-lg bg-neutral-50 p-4 mb-6">
          <div className="bg-neutral-0 border border-neutral-200 rounded p-4 shadow-sm">
            <div className="border-b border-neutral-200 pb-3 mb-3">
              <div className="h-4 w-32 bg-neutral-200 rounded mb-1" />
              <div className="h-2 w-48 bg-neutral-100 rounded" />
            </div>
            <div className="space-y-2 text-[12px] text-neutral-600">
              <p>Dear Parent/Guardian of <span className="bg-yellow-200 px-1 rounded">[Student Name]</span>,</p>
              <p className="h-2 w-full bg-neutral-100 rounded" />
              <p className="h-2 w-4/5 bg-neutral-100 rounded" />
              <p>Your child attends <span className="bg-yellow-200 px-1 rounded">[School Name]</span> and is enrolled in the <span className="bg-yellow-200 px-1 rounded">[Program Type]</span> program.</p>
              <p className="h-2 w-full bg-neutral-100 rounded" />
              <p>The LPAC meeting was held on <span className="bg-yellow-200 px-1 rounded">[Meeting Date]</span>.</p>
              <p className="h-2 w-3/4 bg-neutral-100 rounded" />
            </div>
          </div>
          <p className="text-[11px] text-neutral-500 mt-3 text-center">
            Preview for: Mia Carmen Ramirez — Edinburg North H S
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <button className="px-4 py-2 bg-primary-500 text-neutral-0 text-[13px] font-medium rounded-md hover:bg-primary-600 transition-colors">
            Generate all 1,247 letters
          </button>
          <button className="px-4 py-2 border border-neutral-200 text-neutral-700 text-[13px] font-medium rounded-md hover:bg-neutral-50 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download as PDF bundle
          </button>
          <button className="px-4 py-2 border border-neutral-200 text-neutral-700 text-[13px] font-medium rounded-md hover:bg-neutral-50 transition-colors flex items-center gap-2">
            <Printer className="w-4 h-4" />
            Print all
          </button>
        </div>
        <p className="text-[12px] text-neutral-500 mb-6">Large batches may take several minutes. You&apos;ll be notified when ready.</p>

        {/* Letter tracking table */}
        <div>
          <h3 className="text-[14px] font-semibold text-neutral-900 mb-3">Recent letter tracking</h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-neutral-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Student</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Letter Type</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Language</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Status</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Sent</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Returned signed</th>
                </tr>
              </thead>
              <tbody>
                {letterTracking.map((letter, idx) => (
                  <tr key={idx} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-medium text-neutral-900">{letter.student}</span>
                      <span className="text-[12px] text-neutral-500 ml-1">#{letter.id}</span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-neutral-700">{letter.type}</td>
                    <td className="px-4 py-3 text-[13px] text-neutral-700">{letter.lang}</td>
                    <td className="px-4 py-3"><LetterStatusBadge status={letter.status} /></td>
                    <td className="px-4 py-3 text-[13px] text-neutral-600">{letter.sent}</td>
                    <td className="px-4 py-3 text-[13px] text-neutral-600">{letter.returned}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 3: Student Growth */}
      <div ref={growthRef} className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-neutral-500" />
          <h2 className="text-[18px] font-semibold text-neutral-900">Student Growth</h2>
        </div>

        {/* Growth summary metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-neutral-50 rounded-lg">
            <p className="text-[12px] text-neutral-500 mb-1">Growth (improved 1+ level)</p>
            <p className="text-[24px] font-bold text-teal-600">4,218</p>
            <p className="text-[12px] text-neutral-500">36% of students</p>
          </div>
          <div className="p-4 bg-neutral-50 rounded-lg">
            <p className="text-[12px] text-neutral-500 mb-1">Maintained (same level)</p>
            <p className="text-[24px] font-bold text-primary-500">5,126</p>
            <p className="text-[12px] text-neutral-500">44% of students</p>
          </div>
          <div className="p-4 bg-neutral-50 rounded-lg">
            <p className="text-[12px] text-neutral-500 mb-1">Stagnant (2+ years same)</p>
            <p className="text-[24px] font-bold text-warning-dark">1,487</p>
            <p className="text-[12px] text-neutral-500">13% of students</p>
          </div>
          <div className="p-4 bg-neutral-50 rounded-lg">
            <p className="text-[12px] text-neutral-500 mb-1">Regressed (dropped level)</p>
            <p className="text-[24px] font-bold text-error">874</p>
            <p className="text-[12px] text-neutral-500">7% of students</p>
          </div>
        </div>

        {/* Growth by domain chart */}
        <div className="mb-8">
          <h3 className="text-[14px] font-semibold text-neutral-900 mb-4">Growth by domain</h3>
          <div className="space-y-4">
            <HorizontalBar label="Listening" percentage={42} />
            <HorizontalBar label="Speaking" percentage={28} />
            <HorizontalBar label="Reading" percentage={38} />
            <HorizontalBar label="Writing" percentage={34} />
          </div>
          <p className="text-[12px] text-warning-dark mt-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Speaking remains the lowest-growth domain district-wide — consider targeted intervention
          </p>
        </div>

        {/* Growth by campus table */}
        <div className="mb-6">
          <h3 className="text-[14px] font-semibold text-neutral-900 mb-4">Growth by campus</h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-neutral-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Campus</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold text-neutral-700">Total EB</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold text-neutral-700">Growth %</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold text-neutral-700">Maintained %</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold text-neutral-700">Stagnant %</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold text-neutral-700">Regressed %</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold text-neutral-700">Avg change</th>
                </tr>
              </thead>
              <tbody>
                {campusGrowth.map((campus, idx) => (
                  <tr key={idx} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 text-[13px] font-medium text-neutral-900">{campus.name}</td>
                    <td className="px-4 py-3 text-[13px] text-neutral-700 text-right">{campus.total.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "text-[13px] font-semibold",
                        campus.growth >= 35 ? "text-teal-600" : campus.growth < 30 ? "text-warning-dark" : "text-neutral-700"
                      )}>
                        {campus.growth}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-neutral-700 text-right">{campus.maintained}%</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "text-[13px]",
                        campus.stagnant > 14 ? "text-warning-dark font-medium" : "text-neutral-700"
                      )}>
                        {campus.stagnant}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "text-[13px]",
                        campus.regressed > 10 ? "text-error font-medium" : "text-neutral-700"
                      )}>
                        {campus.regressed}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-teal-600 font-medium text-right">{campus.avgChange}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-primary-500 text-neutral-0 text-[13px] font-medium rounded-md hover:bg-primary-600 transition-colors">
            Generate full growth report
          </button>
          <button className="px-4 py-2 border border-neutral-200 text-neutral-700 text-[13px] font-medium rounded-md hover:bg-neutral-50 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export to spreadsheet
          </button>
        </div>
      </div>

      {/* Section 4: CCMR Readiness */}
      <div ref={ccmrRef} className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="w-5 h-5 text-neutral-500" />
          <h2 className="text-[18px] font-semibold text-neutral-900">CCMR Readiness</h2>
        </div>

        {/* Context banner */}
        <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg text-[12px] text-primary-700 mb-6 leading-relaxed">
          CCMR tracks whether graduating students meet at least 1 of 12 readiness indicators. EB students are a &quot;High Focus&quot; group in TEA&apos;s Domain 3 accountability calculations. Data reflects Class of 2025 (grades 9-12 as of October 2024 snapshot).
        </div>

        {/* Summary metric cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-neutral-50 rounded-lg">
            <p className="text-[12px] text-neutral-500 mb-1">EB students CCMR-met</p>
            <p className="text-[24px] font-bold text-warning-dark">58%</p>
            <p className="text-[12px] text-neutral-500">1,247 of 2,150</p>
          </div>
          <div className="p-4 bg-neutral-50 rounded-lg">
            <p className="text-[12px] text-neutral-500 mb-1">District overall CCMR</p>
            <p className="text-[24px] font-bold text-primary-500">72%</p>
            <p className="text-[12px] text-neutral-500">For comparison</p>
          </div>
          <div className="p-4 bg-neutral-50 rounded-lg">
            <p className="text-[12px] text-neutral-500 mb-1">Gap</p>
            <p className="text-[24px] font-bold text-error">14 pts</p>
            <p className="text-[12px] text-neutral-500">Percentage points</p>
          </div>
          <div className="p-4 bg-neutral-50 rounded-lg">
            <p className="text-[12px] text-neutral-500 mb-1">On track to meet (9-11)</p>
            <p className="text-[24px] font-bold text-teal-600">1,830</p>
            <p className="text-[12px] text-neutral-500">Current students</p>
          </div>
        </div>

        {/* CCMR by indicator breakdown */}
        <div className="mb-8">
          <h3 className="text-[14px] font-semibold text-neutral-900 mb-4">CCMR by indicator breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-neutral-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">CCMR Indicator</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold text-neutral-700">EB students met</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold text-neutral-700">EB rate</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold text-neutral-700">District rate</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold text-neutral-700">Gap</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { indicator: "Industry-based certification (IBC)", met: 487, ebRate: 23, districtRate: 28, gap: -5 },
                  { indicator: "TSI college ready (ELA + Math)", met: 312, ebRate: 15, districtRate: 22, gap: -7 },
                  { indicator: "Dual credit course completed", met: 289, ebRate: 13, districtRate: 19, gap: -6 },
                  { indicator: "AP/IB exam score of 3+", met: 156, ebRate: 7, districtRate: 15, gap: -8 },
                  { indicator: "SAT/ACT college ready score", met: 134, ebRate: 6, districtRate: 12, gap: -6 },
                  { indicator: "College prep course completed", met: 198, ebRate: 9, districtRate: 11, gap: -2 },
                  { indicator: "Military enlistment", met: 67, ebRate: 3, districtRate: 4, gap: -1 },
                  { indicator: "Associate degree", met: 23, ebRate: 1, districtRate: 2, gap: -1 },
                  { indicator: "Completed OnRamps course", met: 89, ebRate: 4, districtRate: 6, gap: -2 },
                  { indicator: "Level I/II certificate", met: 45, ebRate: 2, districtRate: 3, gap: -1 },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 text-[13px] text-neutral-900">{row.indicator}</td>
                    <td className="px-4 py-3 text-[13px] text-neutral-700 text-right">{row.met.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[13px] text-neutral-700 text-right">{row.ebRate}%</td>
                    <td className="px-4 py-3 text-[13px] text-neutral-700 text-right">{row.districtRate}%</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "text-[13px] font-semibold",
                        Math.abs(row.gap) >= 5 ? "text-error" : Math.abs(row.gap) <= 2 ? "text-teal-600" : "text-warning-dark"
                      )}>
                        {row.gap}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-neutral-500 mt-2">
            Students may meet multiple indicators. Total exceeds 100% because categories are not mutually exclusive.
          </p>
        </div>

        {/* CCMR by campus */}
        <div className="mb-8">
          <h3 className="text-[14px] font-semibold text-neutral-900 mb-4">CCMR by campus (grades 9-12 only)</h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-neutral-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Campus</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold text-neutral-700">EB seniors</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold text-neutral-700">CCMR met</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold text-neutral-700">CCMR rate</th>
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Top pathway</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold text-neutral-700">No indicator</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { campus: "Edinburg North H S", seniors: 342, met: 213, rate: 62, pathway: "IBC (34%)", noIndicator: 129 },
                  { campus: "Edinburg H S", seniors: 298, met: 164, rate: 55, pathway: "Dual credit (21%)", noIndicator: 134 },
                  { campus: "Economedes H S", seniors: 267, met: 178, rate: 67, pathway: "IBC (29%)", noIndicator: 89 },
                  { campus: "Vela H S", seniors: 245, met: 155, rate: 63, pathway: "TSI (19%)", noIndicator: 90 },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-3 text-[13px] font-medium text-neutral-900">{row.campus}</td>
                    <td className="px-4 py-3 text-[13px] text-neutral-700 text-right">{row.seniors}</td>
                    <td className="px-4 py-3 text-[13px] text-neutral-700 text-right">{row.met}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn(
                        "text-[13px] font-semibold",
                        row.rate >= 65 ? "text-primary-500" : row.rate < 58 ? "text-error" : "text-warning-dark"
                      )}>
                        {row.rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-neutral-700">{row.pathway}</td>
                    <td className="px-4 py-3 text-[13px] text-error font-medium text-right">{row.noIndicator}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* EB students at risk - action list */}
        <div className="p-5 bg-warning-light border border-warning/30 rounded-lg mb-8">
          <div className="flex items-start gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-warning-dark flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[14px] font-semibold text-warning-dark">
                223 EB seniors have not met any CCMR indicator
              </p>
              <p className="text-[13px] text-warning-dark/80">
                and are on track to graduate without one. Fastest paths to CCMR for these students:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-4">
              <h4 className="text-[13px] font-semibold text-neutral-900 mb-2">Industry-based certification</h4>
              <p className="text-[12px] text-neutral-600 mb-3">
                87 students are enrolled in CTE courses with IBC alignment. Ensure exam registration is complete before testing window closes.
              </p>
              <button className="text-[12px] font-medium text-primary-500 hover:text-primary-600">
                View IBC-eligible students →
              </button>
            </div>
            <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-4">
              <h4 className="text-[13px] font-semibold text-neutral-900 mb-2">College prep course</h4>
              <p className="text-[12px] text-neutral-600 mb-3">
                64 students are enrolled in or eligible for college prep courses that meet CCMR.
              </p>
              <button className="text-[12px] font-medium text-primary-500 hover:text-primary-600">
                View college prep eligible →
              </button>
            </div>
            <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-4">
              <h4 className="text-[13px] font-semibold text-neutral-900 mb-2">TSI assessment</h4>
              <p className="text-[12px] text-neutral-600 mb-3">
                72 students have not attempted TSIA. Scheduling a testing session could close the gap.
              </p>
              <button className="text-[12px] font-medium text-primary-500 hover:text-primary-600">
                View untested students →
              </button>
            </div>
          </div>
        </div>

        {/* CCMR trend (year over year) */}
        <div className="mb-8">
          <h3 className="text-[14px] font-semibold text-neutral-900 mb-4">CCMR trend (year over year)</h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-neutral-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-700">Year</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold text-neutral-700">EB CCMR rate</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold text-neutral-700">District rate</th>
                  <th className="px-4 py-3 text-right text-[12px] font-semibold text-neutral-700">Gap</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-100">
                  <td className="px-4 py-3 text-[13px] text-neutral-900">Class of 2023</td>
                  <td className="px-4 py-3 text-[13px] text-neutral-700 text-right">51%</td>
                  <td className="px-4 py-3 text-[13px] text-neutral-700 text-right">68%</td>
                  <td className="px-4 py-3 text-[13px] text-error font-medium text-right">17%</td>
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="px-4 py-3 text-[13px] text-neutral-900">Class of 2024</td>
                  <td className="px-4 py-3 text-[13px] text-neutral-700 text-right">55%</td>
                  <td className="px-4 py-3 text-[13px] text-neutral-700 text-right">70%</td>
                  <td className="px-4 py-3 text-[13px] text-error font-medium text-right">15%</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-[13px] font-medium text-neutral-900">Class of 2025</td>
                  <td className="px-4 py-3 text-[13px] font-medium text-neutral-900 text-right">58%</td>
                  <td className="px-4 py-3 text-[13px] text-neutral-700 text-right">72%</td>
                  <td className="px-4 py-3 text-[13px] text-warning-dark font-semibold text-right">14%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[12px] text-teal-600 mt-3 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            Gap narrowing by ~1.5 points per year. At current pace, parity in ~9 years.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button className="px-4 py-2 bg-primary-500 text-neutral-0 text-[13px] font-medium rounded-md hover:bg-primary-600 transition-colors">
            Generate full CCMR report
          </button>
          <button className="px-4 py-2 border border-neutral-200 text-neutral-700 text-[13px] font-medium rounded-md hover:bg-neutral-50 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export EB CCMR student list
          </button>
          <a
            href="https://tea.texas.gov/reports-and-data/school-performance/accountability-research/accountability-reports"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-medium text-primary-500 hover:text-primary-600 flex items-center gap-1"
          >
            View CCMR tracker on TEA
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Section 5: Data Exports */}
      <div ref={exportsRef} className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Download className="w-5 h-5 text-neutral-500" />
          <h2 className="text-[18px] font-semibold text-neutral-900">Data Exports</h2>
        </div>

        {/* Quick exports */}
        <div className="mb-8">
          <h3 className="text-[14px] font-semibold text-neutral-900 mb-4">Quick exports (pre-built)</h3>
          <div className="space-y-2">
            {quickExports.map((exportName, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-neutral-400" />
                  <span className="text-[13px] text-neutral-700">{exportName}</span>
                </div>
                <button className="flex items-center gap-1.5 text-[13px] font-medium text-primary-500 hover:text-primary-600">
                  Download CSV
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Custom export builder */}
        <div className="border border-neutral-200 rounded-lg p-5">
          <h3 className="text-[14px] font-semibold text-neutral-900 mb-1">Build a custom export</h3>
          <p className="text-[12px] text-neutral-500 mb-4">Select fields and apply filters to generate a custom spreadsheet</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mb-6">
            <div className="space-y-2">
              <Checkbox label="Student name" checked={exportFields.studentName} onChange={(v) => setExportFields({ ...exportFields, studentName: v })} />
              <Checkbox label="Student ID" checked={exportFields.studentId} onChange={(v) => setExportFields({ ...exportFields, studentId: v })} />
              <Checkbox label="School" checked={exportFields.school} onChange={(v) => setExportFields({ ...exportFields, school: v })} />
              <Checkbox label="Grade level" checked={exportFields.gradeLevel} onChange={(v) => setExportFields({ ...exportFields, gradeLevel: v })} />
              <Checkbox label="Home language" checked={exportFields.homeLanguage} onChange={(v) => setExportFields({ ...exportFields, homeLanguage: v })} />
              <Checkbox label="Native language" checked={exportFields.nativeLanguage} onChange={(v) => setExportFields({ ...exportFields, nativeLanguage: v })} />
              <Checkbox label="Date entered EL" checked={exportFields.dateEnteredEL} onChange={(v) => setExportFields({ ...exportFields, dateEnteredEL: v })} />
              <Checkbox label="Years in US schools" checked={exportFields.yearsInUS} onChange={(v) => setExportFields({ ...exportFields, yearsInUS: v })} />
            </div>
            <div className="space-y-2">
              <Checkbox label="TELPAS domains" checked={exportFields.telpasDomains} onChange={(v) => setExportFields({ ...exportFields, telpasDomains: v })} />
              <Checkbox label="Summit BOY scores" checked={exportFields.summitBOY} onChange={(v) => setExportFields({ ...exportFields, summitBOY: v })} />
              <Checkbox label="Summit MOY scores" checked={exportFields.summitMOY} onChange={(v) => setExportFields({ ...exportFields, summitMOY: v })} />
              <Checkbox label="Composite level" checked={exportFields.compositeLevel} onChange={(v) => setExportFields({ ...exportFields, compositeLevel: v })} />
              <Checkbox label="Program type" checked={exportFields.programType} onChange={(v) => setExportFields({ ...exportFields, programType: v })} />
              <Checkbox label="LPAC meeting status" checked={exportFields.lpacStatus} onChange={(v) => setExportFields({ ...exportFields, lpacStatus: v })} />
              <Checkbox label="TEDS codes" checked={exportFields.tedsCodes} onChange={(v) => setExportFields({ ...exportFields, tedsCodes: v })} />
              <Checkbox label="Reclassification status" checked={exportFields.reclassStatus} onChange={(v) => setExportFields({ ...exportFields, reclassStatus: v })} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Select
              value="all"
              onChange={() => {}}
              options={[
                { value: "all", label: "LEP Status: All" },
                { value: "lep", label: "LEP Only" },
                { value: "monitored", label: "Monitored" },
              ]}
              className="w-40"
            />
            <Select
              value="all"
              onChange={() => {}}
              options={[
                { value: "all", label: "School: All" },
                { value: "edinburg-north", label: "Edinburg North H S" },
              ]}
              className="w-40"
            />
            <Select
              value="all"
              onChange={() => {}}
              options={[
                { value: "all", label: "Grade: All" },
                { value: "k-5", label: "K-5" },
                { value: "6-8", label: "6-8" },
                { value: "9-12", label: "9-12" },
              ]}
              className="w-32"
            />
          </div>

          <p className="text-[13px] text-neutral-600 mb-4">
            Preview: <span className="font-medium">11,705 students</span> x <span className="font-medium">{selectedFieldCount} fields</span> selected
          </p>

          <button className="px-4 py-2 bg-primary-500 text-neutral-0 text-[13px] font-medium rounded-md hover:bg-primary-600 transition-colors">
            Generate export
          </button>
        </div>
      </div>
    </div>
  );
};
