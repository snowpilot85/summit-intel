"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { 
  CheckCircle2, 
  ArrowRight,
  FileText,
  Clock,
  TrendingUp,
  Download,
  AlertCircle,
} from "lucide-react";
import {
  getProficiencyClasses,
  getFullLabel,
  getAbbreviatedLabel,
} from "@/lib/proficiency-utils";

/* ============================================
   Student Profile Components
   Summit Intel - EL Compliance Platform
   Detailed single-page view for LPAC coordinators
   ============================================ */

// ============================================
// TYPES
// ============================================

interface TELPASDomainScore {
  domain: "Listening" | "Speaking" | "Reading" | "Writing" | "Composite";
  level: number;
  levelName: string;
}

interface LifecycleStep {
  label: string;
  date?: string;
  status: "completed" | "current" | "future";
  note?: string;
}

interface AssessmentRecord {
  window: string;
  listening: { score: string; level: number };
  speaking: { score: string; level: number };
  reading: { score: string; level: number };
  writing: { score: string; level: number };
  composite: { score: string; level: number };
  plpLabel?: string;
  plpLink?: string;
}

interface LPACMeeting {
  type: string;
  date: string;
  grade: string;
  status: "finalized" | "scheduled" | "open";
  signatures: string;
  signatureComplete: boolean;
}

interface PEIMSCode {
  code: string;
  label: string;
  value: string;
}

interface Document {
  label: string;
  status: "complete" | "pending";
  date?: string;
}

interface StudentData {
  id: string;
  initials: string;
  fullName: string;
  studentNumber: string;
  school: string;
  grade: number;
  lepStatus: string;
  program: string;
  enteredEL: string;
  telpasScores: TELPASDomainScore[];
  telpasDate: string;
  lifecycleSteps: LifecycleStep[];
  assessmentHistory: AssessmentRecord[];
  lpacMeetings: LPACMeeting[];
  peimsCodes: {
    left: PEIMSCode[];
    right: PEIMSCode[];
  };
  lastValidated: string;
  documents: Document[];
}

// ============================================
// DOMAIN SCORE PILL (TELPAS scores in header)
// ============================================

interface DomainScorePillProps {
  domain: string;
  level: number;
}

const DomainScorePill = ({ domain, level }: DomainScorePillProps) => {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[11px] text-neutral-500 font-medium">{domain}</span>
      <span className={cn(
        "px-2.5 py-1 text-[12px] font-semibold rounded-full whitespace-nowrap",
        getProficiencyClasses(level)
      )}>
        {getFullLabel(level)}
      </span>
    </div>
  );
};

// ============================================
// STUDENT HEADER
// ============================================

interface StudentHeaderProps {
  student: StudentData;
}

const StudentHeader = ({ student }: StudentHeaderProps) => {
  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <div className="flex flex-col xl:flex-row xl:items-start gap-6">
        {/* Left: Avatar + Name + Details */}
        <div className="flex-1">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-14 h-14 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-[20px] font-bold text-neutral-0">{student.initials}</span>
            </div>
            
            {/* Name + Student # */}
            <div>
              <h1 className="text-[22px] font-semibold text-neutral-900">{student.fullName}</h1>
              <p className="text-[13px] text-neutral-500">Student #{student.studentNumber}</p>
            </div>
          </div>
          
          {/* Detail pills row */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <span className="px-3 py-1.5 bg-neutral-100 rounded-md text-[13px] text-neutral-700">
              {student.school}
            </span>
            <span className="text-neutral-300">•</span>
            <span className="px-3 py-1.5 bg-neutral-100 rounded-md text-[13px] text-neutral-700">
              Grade {student.grade}
            </span>
            <span className="text-neutral-300">•</span>
            <span className="px-2.5 py-1 bg-primary-100 text-primary-700 rounded-md text-[12px] font-semibold">
              {student.lepStatus}
            </span>
            <span className="text-neutral-300">•</span>
            <span className="px-3 py-1.5 bg-neutral-100 rounded-md text-[13px] text-neutral-700">
              {student.program}
            </span>
            <span className="text-neutral-300">•</span>
            <span className="px-3 py-1.5 bg-neutral-100 rounded-md text-[13px] text-neutral-700">
              Entered EL: {student.enteredEL}
            </span>
          </div>
        </div>
        
        {/* Right: TELPAS domain scores */}
        <div className="flex-shrink-0">
          <div className="flex items-end gap-3">
            {student.telpasScores.map((score, idx) => (
              <DomainScorePill
                key={idx}
                domain={score.domain}
                level={score.level}
                levelName={score.levelName}
              />
            ))}
          </div>
          <p className="text-[11px] text-neutral-400 text-right mt-2">TELPAS {student.telpasDate}</p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SECTION 1: EB COMPLIANCE LIFECYCLE
// ============================================

interface LifecycleTimelineProps {
  steps: LifecycleStep[];
}

const LifecycleTimeline = ({ steps }: LifecycleTimelineProps) => {
  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <h2 className="text-[16px] font-semibold text-neutral-900 mb-6">EB Compliance Lifecycle</h2>
      
      <div className="overflow-x-auto">
        <div className="flex items-start min-w-max pb-4">
          {steps.map((step, idx) => {
            const isCompleted = step.status === "completed";
            const isCurrent = step.status === "current";
            const isLast = idx === steps.length - 1;
            
            return (
              <div key={idx} className="flex items-start">
                {/* Step */}
                <div className="flex flex-col items-center">
                  {/* Circle */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                    isCompleted ? "bg-teal-500 border-teal-500" :
                    isCurrent ? "bg-primary-500 border-primary-500 ring-4 ring-primary-100" :
                    "bg-neutral-100 border-neutral-300"
                  )}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-neutral-0" />
                    ) : isCurrent ? (
                      <ArrowRight className="w-4 h-4 text-neutral-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-neutral-300" />
                    )}
                  </div>
                  
                  {/* Label + Date */}
                  <div className="mt-3 text-center max-w-[100px]">
                    <p className={cn(
                      "text-[12px] font-medium leading-tight",
                      isCompleted || isCurrent ? "text-neutral-900" : "text-neutral-400"
                    )}>
                      {step.label}
                    </p>
                    {step.date && (
                      <p className="text-[10px] text-neutral-400 mt-1">{step.date}</p>
                    )}
                    {step.note && isCurrent && (
                      <p className="text-[10px] text-warning-dark bg-warning-light px-2 py-1 rounded mt-2 leading-tight">
                        {step.note}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Connector line */}
                {!isLast && (
                  <div className={cn(
                    "w-10 lg:w-14 h-0.5 mt-4 mx-1",
                    isCompleted ? "bg-teal-500" : "bg-neutral-200"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================
// SECTION 2: ASSESSMENT HISTORY & PLPs
// ============================================

interface AssessmentTableProps {
  records: AssessmentRecord[];
}

const AssessmentHistorySection = ({ records }: AssessmentTableProps) => {
  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <h2 className="text-[16px] font-semibold text-neutral-900 mb-4">Assessment History & PLPs</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">Window</th>
              <th className="px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-wide text-neutral-600">Listening</th>
              <th className="px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-wide text-neutral-600">Speaking</th>
              <th className="px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-wide text-neutral-600">Reading</th>
              <th className="px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-wide text-neutral-600">Writing</th>
              <th className="px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-wide text-neutral-600">Composite</th>
              <th className="px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-wide text-neutral-600">PLP</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, idx) => (
              <tr key={idx} className={cn(
                "border-b border-neutral-100",
                idx % 2 === 1 ? "bg-neutral-50/50" : ""
              )}>
                <td className="px-4 py-3 text-[14px] font-medium text-neutral-900">{record.window}</td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("px-2.5 py-1 text-[12px] font-medium rounded-full", getProficiencyClasses(record.listening.level))}>
                    {record.listening.score}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("px-2.5 py-1 text-[12px] font-medium rounded-full", getProficiencyClasses(record.speaking.level))}>
                    {record.speaking.score}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("px-2.5 py-1 text-[12px] font-medium rounded-full", getProficiencyClasses(record.reading.level))}>
                    {record.reading.score}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("px-2.5 py-1 text-[12px] font-medium rounded-full", getProficiencyClasses(record.writing.level))}>
                    {record.writing.score}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={cn("px-2.5 py-1 text-[12px] font-medium rounded-full", getProficiencyClasses(record.composite.level))}>
                    {record.composite.score}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {record.plpLink ? (
                    <Link
                      href={record.plpLink}
                      className="inline-flex items-center gap-1 text-[13px] font-medium text-teal-600 hover:text-teal-700"
                    >
                      {record.plpLabel}
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  ) : (
                    <span className="text-[13px] text-neutral-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Insight callout */}
      <div className="mt-4 flex items-start gap-3 p-4 bg-warning-light rounded-lg border border-warning/20">
        <TrendingUp className="w-5 h-5 text-warning-dark flex-shrink-0 mt-0.5" />
        <p className="text-[13px] text-warning-dark">
          Speaking improved from 1.2 to 1.5 (BOY to MOY). On track for Intermediate by TELPAS.
        </p>
      </div>
    </div>
  );
};

// ============================================
// SECTION 3: LPAC MEETING HISTORY
// ============================================

interface LPACMeetingsTableProps {
  meetings: LPACMeeting[];
}

const LPACMeetingHistorySection = ({ meetings }: LPACMeetingsTableProps) => {
  const statusStyles = {
    finalized: "bg-teal-100 text-teal-700",
    scheduled: "bg-warning-light text-warning-dark",
    open: "bg-primary-100 text-primary-700",
  };

  const statusIcons = {
    finalized: <CheckCircle2 className="w-3 h-3" />,
    scheduled: <Clock className="w-3 h-3" />,
    open: null,
  };

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <h2 className="text-[16px] font-semibold text-neutral-900 mb-4">LPAC Meeting History</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">LPAC Type</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">Date</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">Grade</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">Status</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">Signatures</th>
              <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {meetings.map((meeting, idx) => (
              <tr key={idx} className="border-b border-neutral-100 hover:bg-neutral-50">
                <td className="px-4 py-3 text-[14px] font-medium text-neutral-900">{meeting.type}</td>
                <td className="px-4 py-3 text-[14px] text-neutral-700">{meeting.date}</td>
                <td className="px-4 py-3 text-[14px] text-neutral-700">{meeting.grade}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 text-[12px] font-medium rounded",
                    statusStyles[meeting.status]
                  )}>
                    {statusIcons[meeting.status]}
                    {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "text-[14px]",
                    meeting.signatureComplete ? "text-teal-600" : "text-neutral-500"
                  )}>
                    {meeting.signatures} {meeting.signatureComplete && <CheckCircle2 className="inline w-3 h-3" />}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href="#" className="text-[13px] font-medium text-teal-600 hover:text-teal-700">
                      {meeting.status === "scheduled" ? "Open" : "View"}
                    </Link>
                    <span className="text-neutral-300">·</span>
                    <Link href="#" className="text-[13px] font-medium text-teal-600 hover:text-teal-700">
                      {meeting.status === "scheduled" ? "Cancel" : "Report"}
                    </Link>
                  </div>
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
// SECTION 4: PEIMS / TEDS CODES
// ============================================

interface PEIMSCodesProps {
  left: PEIMSCode[];
  right: PEIMSCode[];
  lastValidated: string;
}

const PEIMSCodesSection = ({ left, right, lastValidated }: PEIMSCodesProps) => {
  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <h2 className="text-[16px] font-semibold text-neutral-900 mb-4">PEIMS / TEDS Codes</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-3">
          {left.map((code, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="text-[12px] font-mono font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded flex-shrink-0">
                {code.code}
              </span>
              <div className="flex-1">
                <p className="text-[13px] text-neutral-500">{code.label}</p>
                <p className="text-[14px] font-medium text-neutral-900">{code.value}</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Right column */}
        <div className="space-y-3">
          {right.map((code, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="text-[12px] font-mono font-semibold text-primary-600 bg-primary-50 px-2 py-0.5 rounded flex-shrink-0">
                {code.code}
              </span>
              <div className="flex-1">
                <p className="text-[13px] text-neutral-500">{code.label}</p>
                <p className="text-[14px] font-medium text-neutral-900">{code.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer with validation */}
      <div className="mt-6 pt-4 border-t border-neutral-200 flex flex-wrap items-center gap-4">
        <p className="text-[13px] text-neutral-500">Last validated: {lastValidated}</p>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-neutral-0 text-[14px] font-medium rounded-md hover:bg-primary-600 transition-colors">
            Validate for PEIMS
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 border border-neutral-300 text-neutral-700 text-[14px] font-medium rounded-md hover:bg-neutral-50 transition-colors">
            <Download className="w-4 h-4" />
            Export Student Report
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// SECTION 5: DOCUMENTS & NOTIFICATIONS
// ============================================

interface DocumentsSectionProps {
  documents: Document[];
}

const DocumentsSection = ({ documents }: DocumentsSectionProps) => {
  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <h2 className="text-[16px] font-semibold text-neutral-900 mb-4">Documents & Notifications</h2>
      
      <div className="space-y-3">
        {documents.map((doc, idx) => (
          <div key={idx} className="flex items-center gap-3">
            {doc.status === "complete" ? (
              <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0" />
            ) : (
              <Clock className="w-5 h-5 text-warning flex-shrink-0" />
            )}
            <div className="flex-1">
              <span className={cn(
                "text-[14px]",
                doc.status === "complete" ? "text-neutral-900" : "text-neutral-600"
              )}>
                {doc.label}
              </span>
              {doc.date && (
                <span className="text-[13px] text-neutral-400 ml-2">({doc.date})</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-neutral-200">
        <Link
          href="#"
          className="inline-flex items-center gap-1 text-[14px] font-medium text-teal-600 hover:text-teal-700"
        >
          Generate notification
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

// ============================================
// MAIN STUDENT PROFILE
// ============================================

interface StudentProfileProps {
  student: StudentData;
}

export const StudentProfile = ({ student }: StudentProfileProps) => {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <StudentHeader student={student} />
      
      {/* Section 1: EB Compliance Lifecycle */}
      <LifecycleTimeline steps={student.lifecycleSteps} />
      
      {/* Section 2: Assessment History & PLPs */}
      <AssessmentHistorySection records={student.assessmentHistory} />
      
      {/* Section 3: LPAC Meeting History */}
      <LPACMeetingHistorySection meetings={student.lpacMeetings} />
      
      {/* Section 4: PEIMS / TEDS Codes */}
      <PEIMSCodesSection
        left={student.peimsCodes.left}
        right={student.peimsCodes.right}
        lastValidated={student.lastValidated}
      />
      
      {/* Section 5: Documents & Notifications */}
      <DocumentsSection documents={student.documents} />
    </div>
  );
};

// ============================================
// MOCK STUDENT DATA - Mia Carmen Ramirez
// ============================================

export const mockStudent: StudentData = {
  id: "stu-155196",
  initials: "MC",
  fullName: "Mia Carmen Ramirez",
  studentNumber: "155196",
  school: "Edinburg North H S",
  grade: 10,
  lepStatus: "EB",
  program: "ESL Program",
  enteredEL: "9/16/2020",
  telpasScores: [
    { domain: "Listening", level: 3, levelName: "Advanced" },
    { domain: "Speaking", level: 1, levelName: "Beginning" },
    { domain: "Reading", level: 3, levelName: "Advanced" },
    { domain: "Writing", level: 3, levelName: "Advanced" },
    { domain: "Composite", level: 2, levelName: "Intermediate" },
  ],
  telpasDate: "03/01/2024",
  lifecycleSteps: [
    { label: "HLS Administered", date: "9/16/2020", status: "completed" },
    { label: "Identified as EB", date: "9/28/2020", status: "completed" },
    { label: "Program Placement Approved", date: "10/02/2020", status: "completed" },
    { label: "Annual Review 2024-25", date: "Completed", status: "completed" },
    { label: "Reclassification Review", status: "current", note: "Not yet eligible: Speaking domain below threshold" },
    { label: "Monitoring Year 1", status: "future" },
    { label: "Monitoring Year 2", status: "future" },
    { label: "Exited", status: "future" },
  ],
  assessmentHistory: [
    {
      window: "TELPAS 2024",
      listening: { score: "3-Adv", level: 3 },
      speaking: { score: "1-Beg", level: 1 },
      reading: { score: "3-Adv", level: 3 },
      writing: { score: "3-Adv", level: 3 },
      composite: { score: "2-Int", level: 2 },
    },
    {
      window: "Summit BOY 24-25",
      listening: { score: "2.8", level: 2.8 },
      speaking: { score: "1.2", level: 1.2 },
      reading: { score: "3.1", level: 3.1 },
      writing: { score: "2.9", level: 2.9 },
      composite: { score: "2.5", level: 2.5 },
      plpLabel: "View PLP #1",
      plpLink: "#plp-1",
    },
    {
      window: "Summit MOY 24-25",
      listening: { score: "3.0", level: 3.0 },
      speaking: { score: "1.5", level: 1.5 },
      reading: { score: "3.2", level: 3.2 },
      writing: { score: "3.1", level: 3.1 },
      composite: { score: "2.7", level: 2.7 },
      plpLabel: "View PLP #2",
      plpLink: "#plp-2",
    },
  ],
  lpacMeetings: [
    {
      type: "EOY LPAC 23-24",
      date: "05/28/2024",
      grade: "Grade 9",
      status: "finalized",
      signatures: "4/4",
      signatureComplete: true,
    },
    {
      type: "BOY LPAC 24-25",
      date: "08/15/2024",
      grade: "Grade 10",
      status: "finalized",
      signatures: "4/4",
      signatureComplete: true,
    },
    {
      type: "EOY LPAC 24-25",
      date: "—",
      grade: "Grade 10",
      status: "scheduled",
      signatures: "0/4",
      signatureComplete: false,
    },
  ],
  peimsCodes: {
    left: [
      { code: "C061", label: "EB Indicator", value: "1 — Identified as EB" },
      { code: "C092", label: "Language Code", value: "Spanish" },
      { code: "C093", label: "Parental Permission", value: "1 — Approved" },
    ],
    right: [
      { code: "C175", label: "Bilingual Program Type", value: "—" },
      { code: "C176", label: "ESL Program Type", value: "2 — ESL/Content-Based" },
      { code: "C225", label: "Funding Code", value: "1" },
    ],
  },
  lastValidated: "10/12/2025",
  documents: [
    { label: "Home Language Survey — on file", status: "complete", date: "uploaded 9/16/2020" },
    { label: "Parent notification of identification — signed", status: "complete", date: "10/02/2020" },
    { label: "Parental approval of program placement — signed", status: "complete", date: "10/02/2020" },
    { label: "EOY parent notification 24-25 — pending", status: "pending" },
  ],
};
