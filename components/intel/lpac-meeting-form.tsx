"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  FileText,
  Send,
  Save,
  Trash2,
  AlertTriangle,
  ChevronDown,
  Check,
  X,
  Copy,
} from "lucide-react";
import {
  getProficiencyClasses,
  getAbbreviatedLabel,
} from "@/lib/proficiency-utils";

/* ============================================
   LPAC Meeting Form
   Summit Intel - The core meeting experience
   ============================================ */

// ============================================
// TYPES
// ============================================

interface TELPASDomainScore {
  domain: string;
  level: number;
  levelName: string;
}

interface CommitteeMember {
  role: string;
  required: boolean;
  name: string;
  filled: boolean;
}

interface ReclassificationCriterion {
  id: string;
  label: string;
  requirement: string;
  result: string;
  status: "met" | "not-met" | "warning" | "pending";
}

interface TEDSCode {
  code: string;
  label: string;
  value: string;
}

interface SignatureRow {
  role: string;
  name: string;
  status: "pending" | "signed" | "requires-name";
  canSign?: boolean;
}

// ============================================
// STUDENT CONTEXT BAR (Sticky)
// ============================================

interface StudentContextBarProps {
  student: {
    initials: string;
    fullName: string;
    studentNumber: string;
    school: string;
    grade: number;
    lepStatus: string;
    program: string;
    telpasScores: TELPASDomainScore[];
  };
}

const StudentContextBar = ({ student }: StudentContextBarProps) => {
  return (
    <div className="sticky top-0 z-40 bg-neutral-0 border border-neutral-200 rounded-lg p-4 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Left: Avatar + Name */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-11 h-11 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-[16px] font-bold text-neutral-0">{student.initials}</span>
          </div>
          <div>
            <p className="text-[16px] font-semibold text-neutral-900">{student.fullName}</p>
            <p className="text-[12px] text-neutral-500">Student #{student.studentNumber}</p>
          </div>
        </div>

        {/* Center: Detail pills */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <span className="px-2.5 py-1 bg-neutral-100 rounded-md text-[12px] text-neutral-700">
            {student.school}
          </span>
          <span className="text-neutral-300">•</span>
          <span className="px-2.5 py-1 bg-neutral-100 rounded-md text-[12px] text-neutral-700">
            Grade {student.grade}
          </span>
          <span className="text-neutral-300">•</span>
          <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-md text-[11px] font-semibold">
            {student.lepStatus}
          </span>
          <span className="text-neutral-300">•</span>
          <span className="px-2.5 py-1 bg-neutral-100 rounded-md text-[12px] text-neutral-700">
            {student.program}
          </span>
        </div>

        {/* Right: TELPAS scores */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {student.telpasScores.map((score, idx) => (
            <div key={idx} className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-neutral-400 font-medium">{score.domain.slice(0, 4)}</span>
              <span className={cn(
                "px-1.5 py-0.5 text-[10px] font-semibold rounded-full",
                getProficiencyClasses(score.level)
              )}>
                {getAbbreviatedLabel(score.level)}
              </span>
            </div>
          ))}
          <Link
            href="/intel/students/mia-ramirez"
            className="ml-2 text-[12px] text-primary-500 hover:text-primary-600 font-medium whitespace-nowrap"
          >
            View profile →
          </Link>
        </div>
      </div>
    </div>
  );
};

// ============================================
// FORM CARD WRAPPER
// ============================================

interface FormCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

const FormCard = ({ title, children, className }: FormCardProps) => {
  return (
    <div className={cn("bg-neutral-0 border border-neutral-200 rounded-lg p-6", className)}>
      <h2 className="text-[16px] font-semibold text-neutral-900 mb-5">{title}</h2>
      {children}
    </div>
  );
};

// ============================================
// SECTION 1: MEETING DETAILS
// ============================================

interface MeetingDetailsProps {
  meetingType: string;
  onMeetingTypeChange: (type: string) => void;
  meetingDate: string;
  onMeetingDateChange: (date: string) => void;
  schoolYear: string;
  campus: string;
}

const meetingTypes = [
  "Initial LPAC",
  "Annual Review/EOY LPAC",
  "Reclassification Review",
  "Monitoring Review",
  "Addendum",
  "Assessment LPAC",
];

const MeetingDetails = ({
  meetingType,
  onMeetingTypeChange,
  meetingDate,
  onMeetingDateChange,
  schoolYear,
  campus,
}: MeetingDetailsProps) => {
  return (
    <FormCard title="Meeting Details">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Meeting Type */}
        <div>
          <label className="block text-[13px] font-medium text-neutral-700 mb-2">
            Meeting Type
          </label>
          <div className="relative">
            <select
              value={meetingType}
              onChange={(e) => onMeetingTypeChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-neutral-300 rounded-md text-[14px] text-neutral-900 bg-neutral-0 appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {meetingTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          </div>
        </div>

        {/* Meeting Date */}
        <div>
          <label className="block text-[13px] font-medium text-neutral-700 mb-2">
            Meeting Date
          </label>
          <input
            type="date"
            value={meetingDate}
            onChange={(e) => onMeetingDateChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-neutral-300 rounded-md text-[14px] text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* School Year (read-only) */}
        <div>
          <label className="block text-[13px] font-medium text-neutral-700 mb-2">
            School Year
          </label>
          <input
            type="text"
            value={schoolYear}
            readOnly
            className="w-full px-4 py-2.5 border border-neutral-200 rounded-md text-[14px] text-neutral-600 bg-neutral-50 cursor-not-allowed"
          />
        </div>

        {/* Campus (read-only) */}
        <div>
          <label className="block text-[13px] font-medium text-neutral-700 mb-2">
            Campus
          </label>
          <input
            type="text"
            value={campus}
            readOnly
            className="w-full px-4 py-2.5 border border-neutral-200 rounded-md text-[14px] text-neutral-600 bg-neutral-50 cursor-not-allowed"
          />
        </div>
      </div>
    </FormCard>
  );
};

// ============================================
// SECTION 2: COMMITTEE MEMBERS
// ============================================

interface CommitteeMembersProps {
  members: CommitteeMember[];
  onMemberChange: (index: number, name: string) => void;
}

const CommitteeMembers = ({ members, onMemberChange }: CommitteeMembersProps) => {
  const parentMember = members.find((m) => m.role.includes("Parent"));
  const showWarning = parentMember && !parentMember.filled;

  return (
    <FormCard title="Committee Members Present">
      <div className="space-y-4">
        {members.map((member, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className={cn(
              "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
              member.filled ? "bg-teal-500 border-teal-500" : "border-neutral-300"
            )}>
              {member.filled && <Check className="w-3 h-3 text-neutral-0" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[14px] font-medium text-neutral-900">{member.role}</span>
                {member.required && (
                  <span className="text-[11px] text-neutral-500">(required)</span>
                )}
              </div>
              <input
                type="text"
                value={member.name}
                onChange={(e) => onMemberChange(idx, e.target.value)}
                placeholder={member.required ? "Enter name..." : "Optional"}
                className={cn(
                  "w-full max-w-md px-3 py-2 border rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                  !member.filled && member.required
                    ? "border-warning bg-warning-light/30"
                    : member.filled ? "border-teal-300 bg-teal-50/30" : "border-neutral-300"
                )}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Info note */}
      <p className="text-[12px] text-neutral-500 mt-5 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        All three required members must be present per TAC §89.1220. Parent may attend virtually.
      </p>

      {/* Warning */}
      {showWarning && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-warning-light rounded-md border border-warning/30">
          <AlertTriangle className="w-4 h-4 text-warning-dark flex-shrink-0" />
          <p className="text-[13px] text-warning-dark font-medium">
            Parent name required before meeting can be finalized
          </p>
        </div>
      )}
    </FormCard>
  );
};

// ============================================
// SECTION 3: STUDENT DATA REVIEW
// ============================================

const StudentDataReview = () => {
  return (
    <FormCard title="Student Data Review">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Proficiency */}
        <div>
          <h3 className="text-[14px] font-semibold text-neutral-800 mb-3">Language Proficiency (Current)</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-2 py-2 text-left font-semibold text-neutral-600">Assessment</th>
                  <th className="px-2 py-2 text-center font-semibold text-neutral-600">L</th>
                  <th className="px-2 py-2 text-center font-semibold text-neutral-600">S</th>
                  <th className="px-2 py-2 text-center font-semibold text-neutral-600">R</th>
                  <th className="px-2 py-2 text-center font-semibold text-neutral-600">W</th>
                  <th className="px-2 py-2 text-center font-semibold text-neutral-600">Comp</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-neutral-100">
                  <td className="px-2 py-2 font-medium text-neutral-900">TELPAS 24</td>
                  <td className="px-2 py-2 text-center"><span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", getProficiencyClasses(3))}>3-Adv</span></td>
                  <td className="px-2 py-2 text-center"><span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", getProficiencyClasses(1))}>1-Beg</span></td>
                  <td className="px-2 py-2 text-center"><span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", getProficiencyClasses(3))}>3-Adv</span></td>
                  <td className="px-2 py-2 text-center"><span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", getProficiencyClasses(3))}>3-Adv</span></td>
                  <td className="px-2 py-2 text-center"><span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", getProficiencyClasses(2))}>2-Int</span></td>
                </tr>
                <tr className="border-b border-neutral-100">
                  <td className="px-2 py-2 font-medium text-neutral-900">Summit BOY</td>
                  <td className="px-2 py-2 text-center"><span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", getProficiencyClasses(3.2))}>3.2</span></td>
                  <td className="px-2 py-2 text-center"><span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", getProficiencyClasses(1.2))}>1.2</span></td>
                  <td className="px-2 py-2 text-center"><span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", getProficiencyClasses(3.0))}>3.0</span></td>
                  <td className="px-2 py-2 text-center"><span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", getProficiencyClasses(2.8))}>2.8</span></td>
                  <td className="px-2 py-2 text-center"><span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", getProficiencyClasses(2.5))}>2.5</span></td>
                </tr>
                <tr>
                  <td className="px-2 py-2 font-medium text-neutral-900">Summit MOY</td>
                  <td className="px-2 py-2 text-center"><span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", getProficiencyClasses(3.4))}>3.4</span></td>
                  <td className="px-2 py-2 text-center"><span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", getProficiencyClasses(1.5))}>1.5</span></td>
                  <td className="px-2 py-2 text-center"><span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", getProficiencyClasses(3.2))}>3.2</span></td>
                  <td className="px-2 py-2 text-center"><span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", getProficiencyClasses(3.0))}>3.0</span></td>
                  <td className="px-2 py-2 text-center"><span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", getProficiencyClasses(2.8))}>2.8</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Academic Performance */}
        <div>
          <h3 className="text-[14px] font-semibold text-neutral-800 mb-3">Academic Performance</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <span className="text-[13px] text-neutral-600">STAAR Reading</span>
              <span className="text-[13px] font-medium text-neutral-900">Approaches (2024)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <span className="text-[13px] text-neutral-600">STAAR Math</span>
              <span className="text-[13px] font-medium text-neutral-900">Meets (2024)</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <span className="text-[13px] text-neutral-600">Course Grades</span>
              <span className="text-[13px] font-medium text-neutral-900">3.2 GPA</span>
            </div>
          </div>
        </div>

        {/* Program History */}
        <div>
          <h3 className="text-[14px] font-semibold text-neutral-800 mb-3">Program History</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <span className="text-[13px] text-neutral-600">Current Program</span>
              <span className="text-[13px] font-medium text-neutral-900">ESL / Content-Based</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <span className="text-[13px] text-neutral-600">Years in Program</span>
              <span className="text-[13px] font-medium text-neutral-900">5</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <span className="text-[13px] text-neutral-600">Years in US Schools</span>
              <span className="text-[13px] font-medium text-neutral-900">5</span>
            </div>
          </div>
        </div>

        {/* Attendance */}
        <div>
          <h3 className="text-[14px] font-semibold text-neutral-800 mb-3">Attendance</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <span className="text-[13px] text-neutral-600">Current Year</span>
              <span className="text-[13px] font-medium text-neutral-900">94.2%</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-100">
              <span className="text-[13px] text-neutral-600">Prior Year</span>
              <span className="text-[13px] font-medium text-neutral-900">91.8%</span>
            </div>
          </div>
        </div>
      </div>
    </FormCard>
  );
};

// ============================================
// SECTION 4: LPAC DECISIONS
// ============================================

interface LPACDecisionsProps {
  meetingType: string;
  programPlacement: string;
  onProgramPlacementChange: (value: string) => void;
  newProgram: string;
  onNewProgramChange: (value: string) => void;
  reclassificationCriteria: ReclassificationCriterion[];
  assessmentAccommodations: Record<string, boolean>;
  onAssessmentAccommodationChange: (key: string, value: boolean) => void;
  instructionalAccommodations: Record<string, boolean>;
  onInstructionalAccommodationChange: (key: string, value: boolean) => void;
  otherAssessment: string;
  onOtherAssessmentChange: (value: string) => void;
  otherInstructional: string;
  onOtherInstructionalChange: (value: string) => void;
  teacherEvaluation: string;
  onTeacherEvaluationChange: (value: string) => void;
  onCopyAccommodations: (type: "assessment" | "instructional") => void;
  copiedMessage: string | null;
}

const programOptions = [
  { value: "bilingual-early", label: "Transitional Bilingual / Early Exit", type: "bilingual", code: "1" },
  { value: "bilingual-late", label: "Transitional Bilingual / Late Exit", type: "bilingual", code: "2" },
  { value: "dual-one", label: "Dual Language Immersion / One-Way", type: "bilingual", code: "3" },
  { value: "dual-two", label: "Dual Language Immersion / Two-Way", type: "bilingual", code: "4" },
  { value: "esl-content", label: "ESL / Content-Based", type: "esl", code: "2" },
  { value: "esl-pullout", label: "ESL / Pull-Out", type: "esl", code: "1" },
];

const LPACDecisions = ({
  meetingType,
  programPlacement,
  onProgramPlacementChange,
  newProgram,
  onNewProgramChange,
  reclassificationCriteria,
  assessmentAccommodations,
  onAssessmentAccommodationChange,
  instructionalAccommodations,
  onInstructionalAccommodationChange,
  otherAssessment,
  onOtherAssessmentChange,
  otherInstructional,
  onOtherInstructionalChange,
  teacherEvaluation,
  onTeacherEvaluationChange,
  onCopyAccommodations,
  copiedMessage,
}: LPACDecisionsProps) => {
  const [showCriteriaExpanded, setShowCriteriaExpanded] = React.useState(false);
  const [reclassTooltip, setReclassTooltip] = React.useState(false);
  
  const criteriaNotMet = reclassificationCriteria.filter((c) => c.status === "not-met").length;
  const criteriaWarning = reclassificationCriteria.filter((c) => c.status === "warning").length;
  const criteriaPending = reclassificationCriteria.filter((c) => c.status === "pending").length;
  const allCriteriaMet = criteriaNotMet === 0 && criteriaPending === 0;
  
  const showReclassificationSection = meetingType === "Reclassification Review" || showCriteriaExpanded;

  return (
    <FormCard title="LPAC Decisions">
      {/* 4a: Program Placement */}
      <div className="mb-8">
        <h3 className="text-[14px] font-semibold text-neutral-800 mb-4">4a. Program Placement Recommendation</h3>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="programPlacement"
              value="continue"
              checked={programPlacement === "continue"}
              onChange={(e) => onProgramPlacementChange(e.target.value)}
              className="mt-1 w-4 h-4 text-primary-500 border-neutral-300 focus:ring-primary-500"
            />
            <span className="text-[14px] text-neutral-700">Continue in current program (ESL / Content-Based)</span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="programPlacement"
              value="change"
              checked={programPlacement === "change"}
              onChange={(e) => onProgramPlacementChange(e.target.value)}
              className="mt-1 w-4 h-4 text-primary-500 border-neutral-300 focus:ring-primary-500"
            />
            <div className="flex-1">
              <span className="text-[14px] text-neutral-700">Change program to:</span>
              {programPlacement === "change" && (
                <div className="relative mt-2">
                  <select
                    value={newProgram}
                    onChange={(e) => onNewProgramChange(e.target.value)}
                    className="w-full max-w-md px-3 py-2 border border-neutral-300 rounded-md text-[14px] appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select program...</option>
                    {programOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                </div>
              )}
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="programPlacement"
              value="denial"
              checked={programPlacement === "denial"}
              onChange={(e) => onProgramPlacementChange(e.target.value)}
              className="mt-1 w-4 h-4 text-primary-500 border-neutral-300 focus:ring-primary-500"
            />
            <span className="text-[14px] text-neutral-700">Parent denial of services (student remains identified as EB but does not participate in program)</span>
          </label>

          {/* Reclassification option with conditional state */}
          <div className="relative">
            <label 
              className={cn(
                "flex items-start gap-3",
                allCriteriaMet ? "cursor-pointer" : "cursor-not-allowed"
              )}
              onMouseEnter={() => !allCriteriaMet && setReclassTooltip(true)}
              onMouseLeave={() => setReclassTooltip(false)}
            >
              <input
                type="radio"
                name="programPlacement"
                value="reclassification"
                checked={programPlacement === "reclassification"}
                onChange={(e) => allCriteriaMet && onProgramPlacementChange(e.target.value)}
                className="mt-1 w-4 h-4 text-primary-500 border-neutral-300 focus:ring-primary-500"
                disabled={!allCriteriaMet}
              />
              <div>
                <span className={cn(
                  "text-[14px]",
                  !allCriteriaMet ? "text-neutral-400" : "text-neutral-700"
                )}>
                  Recommend reclassification
                </span>
                {!allCriteriaMet && meetingType !== "Reclassification Review" && (
                  <button
                    type="button"
                    onClick={() => setShowCriteriaExpanded(!showCriteriaExpanded)}
                    className="ml-2 text-[13px] text-primary-500 hover:text-primary-600 underline"
                  >
                    {criteriaNotMet} of 6 criteria not met — view details
                  </button>
                )}
              </div>
            </label>
            
            {/* Tooltip for disabled reclassification */}
            {reclassTooltip && !allCriteriaMet && (
              <div className="absolute left-8 top-full mt-1 z-10 w-64 p-2 bg-neutral-800 text-neutral-0 text-[12px] rounded-lg shadow-lg">
                Cannot recommend — Speaking domain below threshold
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4b: Reclassification Criteria (conditionally visible) */}
      {showReclassificationSection && (
        <div className="mb-8 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
          <h3 className="text-[14px] font-semibold text-neutral-800 mb-4">4b. Reclassification Criteria</h3>
          <p className="text-[13px] text-neutral-600 mb-4">Reclassification criteria for Mia Carmen Ramirez:</p>
          
          {/* Criteria table */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="px-3 py-2 text-left font-semibold text-neutral-600">Criterion</th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-600">Result</th>
                  <th className="px-3 py-2 text-left font-semibold text-neutral-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {reclassificationCriteria.map((criterion) => (
                  <tr key={criterion.id} className="border-b border-neutral-100">
                    <td className="px-3 py-3 text-neutral-700">{criterion.label}</td>
                    <td className="px-3 py-3 text-neutral-900">{criterion.result}</td>
                    <td className="px-3 py-3">
                      {criterion.status === "met" ? (
                        <span className="inline-flex items-center gap-1.5 text-teal-600 font-medium">
                          <CheckCircle2 className="w-4 h-4" />
                          Meets
                        </span>
                      ) : criterion.status === "not-met" ? (
                        <span className="inline-flex items-center gap-1.5 text-error font-semibold">
                          <XCircle className="w-4 h-4" />
                          Does NOT meet
                        </span>
                      ) : criterion.status === "warning" ? (
                        <span className="inline-flex items-center gap-1.5 text-warning-dark font-medium">
                          <AlertTriangle className="w-4 h-4" />
                          Meets minimum
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-neutral-500">
                          <div className="w-4 h-4 border-2 border-neutral-300 rounded" />
                          Not yet submitted
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {/* Teacher evaluation row */}
                <tr className="border-b border-neutral-100">
                  <td className="px-3 py-3 text-neutral-700">Subjective teacher evaluation</td>
                  <td className="px-3 py-3">
                    <div className="relative inline-block">
                      <select
                        value={teacherEvaluation}
                        onChange={(e) => onTeacherEvaluationChange(e.target.value)}
                        className="px-3 py-1.5 border border-neutral-300 rounded-md text-[13px] appearance-none focus:outline-none focus:ring-2 focus:ring-primary-500 pr-8"
                      >
                        <option value="">Select...</option>
                        <option value="meets">Meets expectations</option>
                        <option value="does-not-meet">Does not meet expectations</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {teacherEvaluation === "meets" ? (
                      <span className="inline-flex items-center gap-1.5 text-teal-600 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Meets
                      </span>
                    ) : teacherEvaluation === "does-not-meet" ? (
                      <span className="inline-flex items-center gap-1.5 text-error font-semibold">
                        <XCircle className="w-4 h-4" />
                        Does NOT meet
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-neutral-500">
                        <div className="w-4 h-4 border-2 border-neutral-300 rounded" />
                        Not yet submitted
                      </span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Summary callout */}
          <div className={cn(
            "p-3 rounded-md border",
            criteriaNotMet > 0 ? "bg-error-light border-error/30" : "bg-teal-100 border-teal-500/30"
          )}>
            {criteriaNotMet > 0 ? (
              <p className="text-[13px] text-error-dark">
                <span className="font-semibold">Not eligible for reclassification.</span> Speaking domain does not meet the Advanced threshold required for exit. Student should continue in current program.
              </p>
            ) : (
              <p className="text-[13px] text-teal-700">
                <span className="font-semibold">Eligible for reclassification.</span> All criteria met. LPAC may recommend reclassification and program exit.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 4c: Assessment Accommodations */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold text-neutral-800">4c. Assessment Accommodations</h3>
          <button
            type="button"
            onClick={() => onCopyAccommodations("assessment")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-teal-300 text-teal-600 text-[12px] font-medium rounded-md hover:bg-teal-50 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy from BOY LPAC 24-25 →
          </button>
        </div>
        {copiedMessage && copiedMessage.includes("assessment") && (
          <div className="mb-3 p-2 bg-teal-50 border border-teal-200 rounded-md text-[12px] text-teal-700">
            Copied 2 accommodations from BOY LPAC 24-25
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: "oral", label: "Oral administration of STAAR" },
            { key: "dictionary", label: "Bilingual dictionary for STAAR" },
            { key: "extraTime", label: "Extra time" },
            { key: "linguistic", label: "Linguistic simplification" },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={assessmentAccommodations[item.key] || false}
                onChange={(e) => onAssessmentAccommodationChange(item.key, e.target.checked)}
                className="w-4 h-4 text-primary-500 border-neutral-300 rounded focus:ring-primary-500"
              />
              <span className="text-[14px] text-neutral-700">{item.label}</span>
            </label>
          ))}
          <label className="flex items-center gap-3 cursor-pointer sm:col-span-2">
            <input
              type="checkbox"
              checked={assessmentAccommodations["other"] || false}
              onChange={(e) => onAssessmentAccommodationChange("other", e.target.checked)}
              className="w-4 h-4 text-primary-500 border-neutral-300 rounded focus:ring-primary-500"
            />
            <span className="text-[14px] text-neutral-700">Other:</span>
            <input
              type="text"
              value={otherAssessment}
              onChange={(e) => onOtherAssessmentChange(e.target.value)}
              placeholder="Specify..."
              className="flex-1 max-w-xs px-3 py-1.5 border border-neutral-300 rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </label>
        </div>
      </div>

      {/* 4d: Instructional Accommodations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold text-neutral-800">4d. Instructional Accommodations</h3>
          <button
            type="button"
            onClick={() => onCopyAccommodations("instructional")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-teal-300 text-teal-600 text-[12px] font-medium rounded-md hover:bg-teal-50 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy from BOY LPAC 24-25 →
          </button>
        </div>
        {copiedMessage && copiedMessage.includes("instructional") && (
          <div className="mb-3 p-2 bg-teal-50 border border-teal-200 rounded-md text-[12px] text-teal-700">
            Copied 2 accommodations from BOY LPAC 24-25
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { key: "sheltered", label: "Sheltered instruction" },
            { key: "visual", label: "Visual aids and graphic organizers" },
            { key: "modified", label: "Simplified/modified assignments" },
            { key: "peer", label: "Peer tutoring / bilingual buddy" },
            { key: "extendedTime", label: "Extended time on assignments" },
          ].map((item) => (
            <label key={item.key} className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={instructionalAccommodations[item.key] || false}
                onChange={(e) => onInstructionalAccommodationChange(item.key, e.target.checked)}
                className="w-4 h-4 text-primary-500 border-neutral-300 rounded focus:ring-primary-500"
              />
              <span className="text-[14px] text-neutral-700">{item.label}</span>
            </label>
          ))}
          <label className="flex items-center gap-3 cursor-pointer sm:col-span-2">
            <input
              type="checkbox"
              checked={instructionalAccommodations["other"] || false}
              onChange={(e) => onInstructionalAccommodationChange("other", e.target.checked)}
              className="w-4 h-4 text-primary-500 border-neutral-300 rounded focus:ring-primary-500"
            />
            <span className="text-[14px] text-neutral-700">Other:</span>
            <input
              type="text"
              value={otherInstructional}
              onChange={(e) => onOtherInstructionalChange(e.target.value)}
              placeholder="Specify..."
              className="flex-1 max-w-xs px-3 py-1.5 border border-neutral-300 rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </label>
        </div>
      </div>
    </FormCard>
  );
};

// ============================================
// SECTION 5: NOTES AND RATIONALE
// ============================================

interface NotesProps {
  notes: string;
  onNotesChange: (value: string) => void;
}

const NotesSection = ({ notes, onNotesChange }: NotesProps) => {
  return (
    <FormCard title="Notes and Rationale">
      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Document the committee's rationale for program placement and any accommodations recommended. Include discussion of student's academic progress, language development, and any parent concerns raised during the meeting."
        rows={6}
        className="w-full px-4 py-3 border border-neutral-300 rounded-md text-[14px] text-neutral-900 placeholder:text-neutral-400 resize-y focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
      />
    </FormCard>
  );
};

// ============================================
// SECTION 6: TEDS CODE PREVIEW
// ============================================

interface TEDSPreviewProps {
  codes: TEDSCode[];
  programPlacement: string;
  newProgram: string;
}

const TEDSCodePreview = ({ codes, programPlacement, newProgram }: TEDSPreviewProps) => {
  // Get program option details
  const selectedProgram = programOptions.find(p => p.value === newProgram);
  
  // Dynamic codes based on decisions
  const dynamicCodes = codes.map((code) => {
    // Handle denial
    if (code.code === "C093" && programPlacement === "denial") {
      return { ...code, value: "0 — Denied" };
    }
    // Handle program change to bilingual
    if (code.code === "C175" && programPlacement === "change" && selectedProgram?.type === "bilingual") {
      return { ...code, value: `${selectedProgram.code} — ${selectedProgram.label}` };
    }
    // Handle program change to ESL
    if (code.code === "C176" && programPlacement === "change" && selectedProgram?.type === "esl") {
      return { ...code, value: `${selectedProgram.code} — ${selectedProgram.label}` };
    }
    // Clear bilingual if switching to ESL
    if (code.code === "C175" && programPlacement === "change" && selectedProgram?.type === "esl") {
      return { ...code, value: "— (N/A)" };
    }
    // Clear ESL if switching to bilingual
    if (code.code === "C176" && programPlacement === "change" && selectedProgram?.type === "bilingual") {
      return { ...code, value: "— (N/A)" };
    }
    return code;
  });

  const hasChanges = programPlacement === "change" && newProgram;

  return (
    <FormCard title="TEDS Code Preview">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dynamicCodes.map((code, idx) => {
          const isUpdated = hasChanges && (code.code === "C175" || code.code === "C176");
          return (
            <div key={idx} className={cn(
              "flex items-start gap-3 py-2 px-2 rounded-md transition-colors",
              isUpdated && "bg-teal-50 border border-teal-200"
            )}>
              <span className="text-[12px] font-mono font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded flex-shrink-0">
                {code.code}
              </span>
              <div>
                <p className="text-[13px] text-neutral-500">{code.label}</p>
                <p className={cn(
                  "text-[14px] font-medium",
                  isUpdated ? "text-teal-700" : "text-neutral-900"
                )}>
                  {code.value}
                  {isUpdated && <span className="ml-2 text-[11px] text-teal-600">(Updated)</span>}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[12px] text-neutral-500 mt-4 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        These codes will auto-update based on your decisions above. Codes are finalized when the meeting is finalized.
      </p>
    </FormCard>
  );
};

// ============================================
// SECTION 7: SIGNATURES
// ============================================

interface SignaturesProps {
  signatures: SignatureRow[];
  onRequestSignature: (role: string) => void;
  onSignNow: () => void;
}

const SignaturesSection = ({ signatures, onRequestSignature, onSignNow }: SignaturesProps) => {
  const signedCount = signatures.filter((s) => s.status === "signed").length;
  const totalRequired = signatures.length;
  const allSigned = signedCount === totalRequired;

  return (
    <FormCard title="Signatures">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">Role</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">Name</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">Status</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {signatures.map((sig, idx) => (
              <tr key={idx} className="border-b border-neutral-100">
                <td className="px-4 py-3 text-[14px] font-medium text-neutral-900">{sig.role}</td>
                <td className="px-4 py-3 text-[14px] text-neutral-700">{sig.name || "—"}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1 text-[12px] font-medium rounded",
                    sig.status === "signed" ? "bg-teal-100 text-teal-700" :
                    sig.status === "pending" ? "bg-neutral-100 text-neutral-600" :
                    "bg-warning-light text-warning-dark"
                  )}>
                    {sig.status === "signed" ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : sig.status === "pending" ? (
                      <Clock className="w-3 h-3" />
                    ) : (
                      <AlertTriangle className="w-3 h-3" />
                    )}
                    {sig.status === "signed" ? "Signed" : sig.status === "pending" ? "Pending" : "Name required"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {sig.canSign ? (
                    <button
                      onClick={onSignNow}
                      className="px-3 py-1.5 bg-primary-500 text-neutral-0 text-[13px] font-medium rounded-md hover:bg-primary-600 transition-colors"
                    >
                      Sign now
                    </button>
                  ) : sig.status === "pending" ? (
                    <button
                      onClick={() => onRequestSignature(sig.role)}
                      className="text-[13px] font-medium text-primary-500 hover:text-primary-600"
                    >
                      Request signature
                    </button>
                  ) : (
                    <span className="text-[13px] text-neutral-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={cn(
        "text-[13px] mt-4",
        allSigned ? "text-teal-600 font-medium" : "text-neutral-500"
      )}>
        {signedCount} of {totalRequired} signatures collected
      </p>
    </FormCard>
  );
};

// ============================================
// SUCCESS STATE OVERLAY
// ============================================

interface SuccessStateProps {
  onGenerateNotification: () => void;
  onViewReport: () => void;
  onReturnToMeetings: () => void;
  onStartNextMeeting: () => void;
}

const SuccessState = ({ onGenerateNotification, onViewReport, onReturnToMeetings, onStartNextMeeting }: SuccessStateProps) => {
  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/50 flex items-center justify-center p-4">
      <div className="bg-neutral-0 rounded-xl shadow-2xl max-w-lg w-full p-8 text-center">
        {/* Large checkmark */}
        <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-teal-600" />
        </div>
        
        {/* Heading */}
        <h2 className="text-[24px] font-bold text-neutral-900 mb-2">LPAC meeting finalized</h2>
        <p className="text-[16px] text-neutral-600 mb-6">EOY LPAC 24-25 — Mia Carmen Ramirez</p>
        
        {/* Summary */}
        <div className="bg-neutral-50 rounded-lg p-4 mb-6 text-left space-y-2">
          <div className="flex justify-between text-[14px]">
            <span className="text-neutral-600">Decision:</span>
            <span className="font-medium text-neutral-900">Continue in ESL / Content-Based program</span>
          </div>
          <div className="flex justify-between text-[14px]">
            <span className="text-neutral-600">Accommodations:</span>
            <span className="font-medium text-neutral-900">2 assessment, 2 instructional</span>
          </div>
          <div className="flex justify-between text-[14px]">
            <span className="text-neutral-600">TEDS codes:</span>
            <span className="font-medium text-neutral-900">Updated (C061: 1, C176: 2, C093: 1)</span>
          </div>
          <div className="flex justify-between text-[14px]">
            <span className="text-neutral-600">Signatures:</span>
            <span className="font-medium text-neutral-900">4/4 collected</span>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="space-y-3 mb-6">
          <button
            onClick={onGenerateNotification}
            className="w-full py-3 bg-primary-500 text-neutral-0 text-[14px] font-medium rounded-md hover:bg-primary-600 transition-colors"
          >
            Generate parent notification
          </button>
          <button
            onClick={onViewReport}
            className="w-full py-3 border border-neutral-300 text-neutral-700 text-[14px] font-medium rounded-md hover:bg-neutral-50 transition-colors"
          >
            View meeting report
          </button>
          <button
            onClick={onReturnToMeetings}
            className="text-[14px] text-primary-500 hover:text-primary-600 font-medium"
          >
            Return to LPAC meetings
          </button>
        </div>
        
        {/* Next student prompt */}
        <div className="pt-4 border-t border-neutral-200">
          <p className="text-[13px] text-neutral-500 mb-2">
            Next student: Pedro Alvarez #155301 — Initial LPAC <span className="text-error font-medium">(OVERDUE)</span>
          </p>
          <button
            onClick={onStartNextMeeting}
            className="text-[14px] text-teal-600 hover:text-teal-700 font-medium"
          >
            Start next meeting →
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ACTION BAR (Sticky Bottom)
// ============================================

interface ActionBarProps {
  canFinalize: boolean;
  missingItems: string[];
  onSaveDraft: () => void;
  onDelete: () => void;
  onFinalize: () => void;
  onGenerateNotification: () => void;
  signatureCount: number;
  totalSignatures: number;
}

const ActionBar = ({
  canFinalize,
  missingItems,
  onSaveDraft,
  onDelete,
  onFinalize,
  onGenerateNotification,
  signatureCount,
  totalSignatures,
}: ActionBarProps) => {
  const [showTooltip, setShowTooltip] = React.useState(false);
  const allSigned = signatureCount === totalSignatures;

  return (
    <div className="sticky bottom-0 z-40 bg-neutral-0 border-t border-neutral-200 px-6 py-4 -mx-6 mt-6">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={onSaveDraft}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-neutral-300 text-neutral-700 text-[14px] font-medium rounded-md hover:bg-neutral-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save draft
          </button>
          <button
            onClick={onDelete}
            className="text-[14px] font-medium text-error hover:text-error-dark transition-colors"
          >
            Delete meeting
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onGenerateNotification}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-neutral-300 text-neutral-700 text-[14px] font-medium rounded-md hover:bg-neutral-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Generate parent notification
          </button>

          <div className="relative">
            <button
              onClick={canFinalize ? onFinalize : undefined}
              onMouseEnter={() => !canFinalize && setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              disabled={!canFinalize}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 text-[14px] font-medium rounded-md transition-colors",
                canFinalize
                  ? "bg-primary-500 text-neutral-0 hover:bg-primary-600"
                  : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
              )}
            >
              <Send className="w-4 h-4" />
              Finalize meeting
            </button>

            {/* Tooltip */}
            {showTooltip && !canFinalize && (
              <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-neutral-800 text-neutral-0 text-[12px] rounded-lg shadow-lg">
                <p className="font-medium mb-1">Cannot finalize:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {missingItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const LPACMeetingForm = () => {
  // Student data
  const student = {
    initials: "MC",
    fullName: "Mia Carmen Ramirez",
    studentNumber: "155196",
    school: "Edinburg North H S",
    grade: 10,
    lepStatus: "EB",
    program: "ESL Program",
    telpasScores: [
      { domain: "Listening", level: 3, levelName: "Adv" },
      { domain: "Speaking", level: 1, levelName: "Beg" },
      { domain: "Reading", level: 3, levelName: "Adv" },
      { domain: "Writing", level: 3, levelName: "Adv" },
      { domain: "Composite", level: 2, levelName: "Int" },
    ],
  };

  // Form state
  const [meetingType, setMeetingType] = React.useState("Annual Review/EOY LPAC");
  const [meetingDate, setMeetingDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [members, setMembers] = React.useState<CommitteeMember[]>([
    { role: "Bilingual/ESL educator", required: true, name: "Ms. Torres-Williams", filled: true },
    { role: "Campus administrator", required: true, name: "Dr. Rodriguez", filled: true },
    { role: "Parent Representative", required: true, name: "", filled: false },
    { role: "Additional member", required: false, name: "", filled: false },
  ]);
  const [programPlacement, setProgramPlacement] = React.useState("continue");
  const [newProgram, setNewProgram] = React.useState("");
  const [assessmentAccommodations, setAssessmentAccommodations] = React.useState<Record<string, boolean>>({});
  const [instructionalAccommodations, setInstructionalAccommodations] = React.useState<Record<string, boolean>>({});
  const [otherAssessment, setOtherAssessment] = React.useState("");
  const [otherInstructional, setOtherInstructional] = React.useState("");
  const [teacherEvaluation, setTeacherEvaluation] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [copiedMessage, setCopiedMessage] = React.useState<string | null>(null);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [signatures, setSignatures] = React.useState<SignatureRow[]>([
    { role: "Bilingual/ESL educator", name: "Ms. Torres-Williams", status: "pending" },
    { role: "Campus administrator", name: "Dr. Rodriguez", status: "pending" },
    { role: "Parent", name: "", status: "requires-name" },
    { role: "LPAC Coordinator", name: "Carmen Martinez", status: "pending", canSign: true },
  ]);

  const reclassificationCriteria: ReclassificationCriterion[] = [
    { id: "listening", label: "TELPAS Listening: Advanced High or Advanced", requirement: "Advanced (3+)", result: "Advanced (3)", status: "met" },
    { id: "speaking", label: "TELPAS Speaking: Advanced High or Advanced", requirement: "Advanced (3+)", result: "Beginning (1)", status: "not-met" },
    { id: "reading", label: "TELPAS Reading: Advanced High or Advanced", requirement: "Advanced (3+)", result: "Advanced (3)", status: "met" },
    { id: "writing", label: "TELPAS Writing: Advanced High or Advanced", requirement: "Advanced (3+)", result: "Advanced (3)", status: "met" },
    { id: "staar", label: "STAAR Reading: Approaches or above", requirement: "Approaches+", result: "Approaches (2024)", status: "warning" },
  ];

  const tedsCodes: TEDSCode[] = [
    { code: "C061", label: "EB Indicator", value: "1 — Identified as EB" },
    { code: "C092", label: "Language Code", value: "Spanish" },
    { code: "C093", label: "Parental Permission", value: "1 — Approved" },
    { code: "C175", label: "Bilingual Program Type", value: "— (N/A)" },
    { code: "C176", label: "ESL Program Type", value: "2 — ESL/Content-Based" },
    { code: "C225", label: "Funding Code", value: "1" },
  ];

  const handleMemberChange = (index: number, name: string) => {
    setMembers((prev) => prev.map((m, i) =>
      i === index ? { ...m, name, filled: name.trim().length > 0 } : m
    ));
    // Update parent signature row when parent name is filled
    if (index === 2) {
      setSignatures((prev) => prev.map((s) =>
        s.role === "Parent" ? { ...s, name, status: name.trim() ? "pending" : "requires-name" } : s
      ));
    }
  };

  const handleCopyAccommodations = (type: "assessment" | "instructional") => {
    if (type === "assessment") {
      setAssessmentAccommodations(prev => ({
        ...prev,
        dictionary: true,
        extraTime: true,
      }));
      setCopiedMessage("assessment");
    } else {
      setInstructionalAccommodations(prev => ({
        ...prev,
        visual: true,
        extendedTime: true,
      }));
      setCopiedMessage("instructional");
    }
    // Clear message after 3 seconds
    setTimeout(() => setCopiedMessage(null), 3000);
  };

  // Validation
  const parentFilled = members.find((m) => m.role.includes("Parent"))?.filled ?? false;
  const signedCount = signatures.filter((s) => s.status === "signed").length;
  const canFinalize = parentFilled && signedCount === signatures.length;
  const missingItems: string[] = [];
  if (!parentFilled) missingItems.push("Missing parent name");
  if (signedCount < signatures.length) missingItems.push(`${signedCount}/${signatures.length} signatures collected`);

  // For demo: allow finalize when parent is filled (even without all signatures)
  const demoCanFinalize = parentFilled;

  if (showSuccess) {
    return (
      <SuccessState
        onGenerateNotification={() => alert("Generating parent notification...")}
        onViewReport={() => alert("Opening meeting report...")}
        onReturnToMeetings={() => setShowSuccess(false)}
        onStartNextMeeting={() => alert("Starting next meeting...")}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Student Context Bar */}
      <StudentContextBar student={student} />

      {/* Section 1: Meeting Details */}
      <MeetingDetails
        meetingType={meetingType}
        onMeetingTypeChange={setMeetingType}
        meetingDate={meetingDate}
        onMeetingDateChange={setMeetingDate}
        schoolYear="2024-25"
        campus="Edinburg North H S"
      />

      {/* Section 2: Committee Members */}
      <CommitteeMembers
        members={members}
        onMemberChange={handleMemberChange}
      />

      {/* Section 3: Student Data Review */}
      <StudentDataReview />

      {/* Section 4: LPAC Decisions */}
      <LPACDecisions
        meetingType={meetingType}
        programPlacement={programPlacement}
        onProgramPlacementChange={setProgramPlacement}
        newProgram={newProgram}
        onNewProgramChange={setNewProgram}
        reclassificationCriteria={reclassificationCriteria}
        assessmentAccommodations={assessmentAccommodations}
        onAssessmentAccommodationChange={(key, value) =>
          setAssessmentAccommodations((prev) => ({ ...prev, [key]: value }))
        }
        instructionalAccommodations={instructionalAccommodations}
        onInstructionalAccommodationChange={(key, value) =>
          setInstructionalAccommodations((prev) => ({ ...prev, [key]: value }))
        }
        otherAssessment={otherAssessment}
        onOtherAssessmentChange={setOtherAssessment}
        otherInstructional={otherInstructional}
        onOtherInstructionalChange={setOtherInstructional}
        teacherEvaluation={teacherEvaluation}
        onTeacherEvaluationChange={setTeacherEvaluation}
        onCopyAccommodations={handleCopyAccommodations}
        copiedMessage={copiedMessage}
      />

      {/* Section 5: Notes */}
      <NotesSection notes={notes} onNotesChange={setNotes} />

      {/* Section 6: TEDS Code Preview */}
      <TEDSCodePreview codes={tedsCodes} programPlacement={programPlacement} newProgram={newProgram} />

      {/* Section 7: Signatures */}
      <SignaturesSection
        signatures={signatures}
        onRequestSignature={(role) => {
          // Simulate requesting signature
          alert(`Request signature sent to ${role}`);
        }}
        onSignNow={() => {
          // For demo: sign all signatures when coordinator signs
          setSignatures((prev) =>
            prev.map((s) => ({ ...s, status: "signed" as const }))
          );
        }}
      />

      {/* Action Bar */}
      <ActionBar
        canFinalize={demoCanFinalize}
        missingItems={missingItems}
        signatureCount={signedCount}
        totalSignatures={signatures.length}
        onSaveDraft={() => alert("Draft saved")}
        onDelete={() => alert("Meeting deleted")}
        onFinalize={() => setShowSuccess(true)}
        onGenerateNotification={() => alert("Parent notification generated")}
      />
    </div>
  );
};

export default LPACMeetingForm;
