"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Mail,
  FileText,
  Check,
  X,
  Clock,
  AlertTriangle,
  Users,
  GraduationCap,
  CalendarCheck,
  Activity,
} from "lucide-react";
import { DSMBadge, DSMCard, DSMButton, DSMTabs, DSMAlert, DSMProgressBar, H1, H2, H3, H4, P2, P3, P4 } from "./index";
import { type District, type School, type Teacher } from "@/lib/mock-data";

// ============================================
// STATUS BADGE
// ============================================

const StatusBadge = ({ status }: { status: District["status"] }) => {
  const config = {
    red: { label: "Red", variant: "error" as const },
    yellow: { label: "Yellow", variant: "warning" as const },
    green: { label: "Green", variant: "success" as const },
    blue: { label: "Complete", variant: "info" as const },
  };

  return (
    <DSMBadge variant="status" status={config[status].variant}>
      {config[status].label}
    </DSMBadge>
  );
};

// ============================================
// PHASE BADGE
// ============================================

const PhaseBadge = ({ phase }: { phase: number }) => {
  return (
    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-[13px] font-semibold">
      Phase {phase}
    </span>
  );
};

// ============================================
// RISK SCORE PILL
// ============================================

const RiskScorePill = ({ score, status }: { score: number; status: District["status"] }) => {
  const bgColor = {
    red: "bg-error-light text-error-dark",
    yellow: "bg-warning-light text-warning-dark",
    green: "bg-success-light text-success-dark",
    blue: "bg-info-light text-info-dark",
  };

  return (
    <span className={cn("inline-flex items-center px-3 py-1 rounded-lg text-[14px] font-semibold", bgColor[status])}>
      Risk Score: {score}
    </span>
  );
};

// ============================================
// HEADER SECTION
// ============================================

interface DrilldownHeaderProps {
  district: District;
}

const DrilldownHeader = ({ district }: DrilldownHeaderProps) => {
  return (
    <div className="space-y-4">
      {/* District Name & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <H1>{district.name}</H1>
            <PhaseBadge phase={district.phase} />
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <RiskScorePill score={district.riskScore} status={district.status} />
            <StatusBadge status={district.status} />
          </div>

          {/* Top Risk Drivers */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[14px]">
            <span className="text-neutral-500">Top Risk Drivers:</span>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded bg-error-light text-error-dark font-medium">
                {district.riskDriver1}
              </span>
              <span className="px-2 py-1 rounded bg-warning-light text-warning-dark font-medium">
                {district.riskDriver2}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <DSMButton variant="primary">
            <FileText className="w-4 h-4" />
            Create Action Plan
          </DSMButton>
          <DSMButton variant="secondary">
            <Mail className="w-4 h-4" />
            Email District Team
          </DSMButton>
        </div>
      </div>
    </div>
  );
};

// ============================================
// KPI CARD
// ============================================

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  status?: "normal" | "warning" | "danger" | "success";
  icon?: React.ReactNode;
  large?: boolean;
}

const KPICard = ({ title, value, subtitle, status = "normal", icon, large = false }: KPICardProps) => {
  const statusStyles = {
    normal: "text-neutral-900",
    warning: "text-warning",
    danger: "text-error",
    success: "text-success",
  };

  return (
    <DSMCard padding="md" className="flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] text-neutral-500">{title}</span>
        {icon && <span className="text-neutral-400">{icon}</span>}
      </div>
      <p className={cn(
        "font-semibold",
        large ? "text-[42px] leading-tight" : "text-[28px]",
        statusStyles[status]
      )}>
        {value}
      </p>
      {subtitle && (
        <p className="text-[12px] text-neutral-500 mt-1">{subtitle}</p>
      )}
    </DSMCard>
  );
};

// ============================================
// CHECKLIST ITEM (Phase 1)
// ============================================

interface ChecklistItemProps {
  label: string;
  completed: boolean;
}

const ChecklistItem = ({ label, completed }: ChecklistItemProps) => (
  <div className="flex items-center gap-3 py-3 border-b border-neutral-100 last:border-0">
    <div className={cn(
      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
      completed ? "bg-success text-neutral-0" : "bg-neutral-200 text-neutral-500"
    )}>
      {completed ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
    </div>
    <span className={cn(
      "text-[14px]",
      completed ? "text-neutral-700" : "text-neutral-500"
    )}>
      {label}
    </span>
    <DSMBadge variant="status" status={completed ? "success" : "warning"} className="ml-auto">
      {completed ? "Complete" : "Pending"}
    </DSMBadge>
  </div>
);

// ============================================
// SCHOOL TABLE ROW (Expandable)
// ============================================

interface SchoolRowProps {
  school: School;
  isExpanded: boolean;
  onToggle: () => void;
}

const SchoolRow = ({ school, isExpanded, onToggle }: SchoolRowProps) => {
  const statusBg = {
    red: "bg-error-light",
    yellow: "bg-warning-light",
    green: "bg-success-light",
    blue: "bg-info-light",
  };

  return (
    <>
      <tr 
        className={cn(
          "border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer transition-colors",
          isExpanded && "bg-neutral-50"
        )}
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <button className="flex items-center gap-2 text-left">
            <ChevronRight className={cn(
              "w-4 h-4 text-neutral-400 transition-transform",
              isExpanded && "rotate-90"
            )} />
            <span className="text-[14px] font-medium text-neutral-900">{school.name}</span>
          </button>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", statusBg[school.status])} />
            <span className={cn(
              "text-[14px] font-semibold",
              school.completionPercent < 50 ? "text-error" :
              school.completionPercent < 70 ? "text-warning" :
              school.completionPercent < 100 ? "text-success" : "text-info"
            )}>
              {school.completionPercent}%
            </span>
          </div>
        </td>
        <td className="px-4 py-3">
          <span className="text-[14px] text-neutral-700">
            {school.studentsTested} / {school.totalStudents}
          </span>
        </td>
        <td className="px-4 py-3">
          {school.daysLeft !== null ? (
            <span className={cn(
              "text-[14px] font-semibold",
              school.daysLeft <= 3 ? "text-error" :
              school.daysLeft <= 7 ? "text-warning" : "text-neutral-700"
            )}>
              {school.daysLeft} days
            </span>
          ) : (
            <span className="text-[13px] text-neutral-400">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          <StatusBadge status={school.status} />
        </td>
      </tr>

      {/* Expanded Teacher Rows */}
      {isExpanded && school.teachers.length > 0 && (
        <>
          {school.teachers.map((teacher) => (
            <tr key={teacher.id} className="bg-neutral-50 border-b border-neutral-100">
              <td className="px-4 py-2 pl-12">
                <span className="text-[13px] text-neutral-600">{teacher.name}</span>
              </td>
              <td className="px-4 py-2">
                <span className={cn(
                  "text-[13px] font-medium",
                  teacher.completionPercent < 50 ? "text-error" :
                  teacher.completionPercent < 70 ? "text-warning" : "text-success"
                )}>
                  {teacher.completionPercent}%
                </span>
              </td>
              <td className="px-4 py-2">
                <span className="text-[13px] text-neutral-600">
                  {teacher.studentsTested} / {teacher.totalStudents}
                </span>
              </td>
              <td className="px-4 py-2" colSpan={2}></td>
            </tr>
          ))}
        </>
      )}
    </>
  );
};

// ============================================
// SCHOOL TABLE
// ============================================

interface SchoolTableProps {
  schools: School[];
  showDaysLeft?: boolean;
}

const SchoolTable = ({ schools, showDaysLeft = true }: SchoolTableProps) => {
  const [expandedSchools, setExpandedSchools] = React.useState<Set<string>>(new Set());

  const toggleSchool = (schoolId: string) => {
    const newExpanded = new Set(expandedSchools);
    if (newExpanded.has(schoolId)) {
      newExpanded.delete(schoolId);
    } else {
      newExpanded.add(schoolId);
    }
    setExpandedSchools(newExpanded);
  };

  // Sort schools by lowest completion first
  const sortedSchools = [...schools].sort((a, b) => a.completionPercent - b.completionPercent);

  if (sortedSchools.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        <P3>No school data available for this district.</P3>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-neutral-200 rounded-lg">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-neutral-50 border-b border-neutral-200">
            <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
              School
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
              Completion %
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
              Tested / Total
            </th>
            {showDaysLeft && (
              <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
                Days Left
              </th>
            )}
            <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedSchools.map((school) => (
            <SchoolRow
              key={school.id}
              school={school}
              isExpanded={expandedSchools.has(school.id)}
              onToggle={() => toggleSchool(school.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================
// PHASE 1 - ONBOARDING
// ============================================

const Phase1Content = ({ district }: { district: District }) => {
  const { metrics } = district;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <H3>Onboarding Checklist</H3>
        <P4 className="text-neutral-500">Binary checklist — all items must be complete</P4>
      </div>

      <DSMCard padding="md">
        <ChecklistItem label="Rostering Approved" completed={metrics.rosteringApproved ?? false} />
        <ChecklistItem label="Tech Setup Call Complete" completed={metrics.techSetupComplete ?? false} />
        <ChecklistItem label="BOY Window Scheduled" completed={metrics.boyWindowScheduled ?? false} />
        <ChecklistItem 
          label={`Teacher Login % > 80% (Currently: ${metrics.teacherLoginPercent ?? 0}%)`} 
          completed={(metrics.teacherLoginPercent ?? 0) >= 80} 
        />
      </DSMCard>

      {/* Progress Summary */}
      <DSMCard padding="md">
        <H4 className="mb-4">Overall Progress</H4>
        <div className="flex items-center gap-4">
          <DSMProgressBar 
            value={
              [metrics.rosteringApproved, metrics.techSetupComplete, metrics.boyWindowScheduled, (metrics.teacherLoginPercent ?? 0) >= 80]
                .filter(Boolean).length
            } 
            max={4} 
            showLabel 
            className="flex-1"
          />
          <span className="text-[14px] text-neutral-500">
            {[metrics.rosteringApproved, metrics.techSetupComplete, metrics.boyWindowScheduled, (metrics.teacherLoginPercent ?? 0) >= 80].filter(Boolean).length} of 4 complete
          </span>
        </div>
      </DSMCard>
    </div>
  );
};

// ============================================
// PHASE 2 - BOY → PLP-1 CYCLE
// ============================================

const Phase2Content = ({ district }: { district: District }) => {
  const { metrics } = district;

  const getStatus = (value: number) => {
    if (value < 50) return "danger";
    if (value < 80) return "warning";
    if (value < 100) return "success";
    return "success";
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="BOY Completion"
          value={`${metrics.boyCompletionPercent ?? 0}%`}
          status={getStatus(metrics.boyCompletionPercent ?? 0)}
          icon={<GraduationCap className="w-5 h-5" />}
        />
        <KPICard
          title="PLP-1 Generation"
          value={`${metrics.plp1GenerationPercent ?? 0}%`}
          status={getStatus(metrics.plp1GenerationPercent ?? 0)}
          icon={<FileText className="w-5 h-5" />}
        />
        <KPICard
          title="PLP-1 vs Norm"
          value={`${(metrics.plp1DistrictAvgNorm ?? 0) >= 0 ? "+" : ""}${metrics.plp1DistrictAvgNorm ?? 0}%`}
          status={(metrics.plp1DistrictAvgNorm ?? 0) < -10 ? "danger" : (metrics.plp1DistrictAvgNorm ?? 0) < 0 ? "warning" : "success"}
          icon={<Activity className="w-5 h-5" />}
        />
        <KPICard
          title="PD Scheduled"
          value={`${metrics.pdScheduledPercent ?? 0}%`}
          subtitle="of PD Purchased"
          status={getStatus(metrics.pdScheduledPercent ?? 0)}
          icon={<CalendarCheck className="w-5 h-5" />}
        />
      </div>

      {/* Status Legend */}
      <div className="flex items-center gap-4 text-[12px]">
        <span className="text-neutral-500">Thresholds:</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-error" />
          <span className="text-neutral-600">{"<50% Red"}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-warning" />
          <span className="text-neutral-600">50-79% Yellow</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="text-neutral-600">80-99% Green</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-info" />
          <span className="text-neutral-600">100% Complete</span>
        </span>
      </div>

      {/* School Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <H3>Schools — Sorted by Lowest Completion</H3>
          <P4 className="text-neutral-400">Real-time updated</P4>
        </div>
        <SchoolTable schools={district.schools} showDaysLeft={district.daysLeft !== null} />
      </div>
    </div>
  );
};

// ============================================
// PHASE 3 - MOY COMPLETION (HIGH PRIORITY)
// ============================================

const Phase3Content = ({ district }: { district: District }) => {
  const { metrics, daysLeft } = district;
  const completion = metrics.moyCompletionPercent ?? 0;

  // Escalation conditions
  const isHighUrgency = completion < 70 && daysLeft !== null && daysLeft <= 7;
  const isUrgent = completion < 50;
  const isCountdown = daysLeft !== null && daysLeft <= 3;

  const getStatus = (value: number) => {
    if (value < 50) return "danger";
    if (value < 70) return "warning";
    if (value < 100) return "success";
    return "success";
  };

  return (
    <div className="space-y-6">
      {/* Escalation Banners */}
      {isCountdown && (
        <DSMAlert variant="urgent" title="Critical: Test Window Closing">
          Only {daysLeft} days left! Immediate action required to complete MOY testing.
        </DSMAlert>
      )}
      {isUrgent && !isCountdown && (
        <DSMAlert variant="urgent" title="Urgent: Completion Below 50%">
          District MOY completion is critically low at {completion}%. Escalation recommended.
        </DSMAlert>
      )}
      {isHighUrgency && !isUrgent && (
        <DSMAlert variant="warning" title="High Urgency: Below 70% with Limited Time">
          {completion}% completion with only {daysLeft} days remaining. Prioritize intervention.
        </DSMAlert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title="District MOY Completion"
          value={`${completion}%`}
          subtitle={`${metrics.studentsTested?.toLocaleString() ?? 0} / ${metrics.totalStudents?.toLocaleString() ?? 0}`}
          status={getStatus(completion)}
          icon={<Users className="w-5 h-5" />}
        />
        <KPICard
          title="Days Left"
          value={daysLeft ?? "—"}
          status={daysLeft !== null && daysLeft <= 3 ? "danger" : daysLeft !== null && daysLeft <= 7 ? "warning" : "normal"}
          icon={<Clock className="w-5 h-5" />}
          large
        />
        <KPICard
          title="Schools Below 70%"
          value={metrics.schoolsBelow70 ?? 0}
          status={(metrics.schoolsBelow70 ?? 0) > 5 ? "danger" : (metrics.schoolsBelow70 ?? 0) > 0 ? "warning" : "success"}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
      </div>

      {/* Status Legend */}
      <div className="flex items-center gap-4 text-[12px]">
        <span className="text-neutral-500">Thresholds:</span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-error" />
          <span className="text-neutral-600">{"<50% or ≤3 days"}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-warning" />
          <span className="text-neutral-600">{"<70% and <7 days"}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-success" />
          <span className="text-neutral-600">70%+ On Track</span>
        </span>
      </div>

      {/* School Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <H3>Schools — Sorted by Lowest Completion</H3>
          <P4 className="text-neutral-400">Real-time updated</P4>
        </div>
        <SchoolTable schools={district.schools} showDaysLeft />
      </div>
    </div>
  );
};

// ============================================
// PHASE 4 - PLP-2 + A2L
// ============================================

const Phase4Content = ({ district }: { district: District }) => {
  const { metrics } = district;

  const getStatus = (value: number) => {
    if (value < 50) return "danger";
    if (value < 70) return "warning";
    if (value < 100) return "success";
    return "success";
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title="PLP-2 Completion"
          value={`${metrics.plp2CompletionPercent ?? 0}%`}
          status={getStatus(metrics.plp2CompletionPercent ?? 0)}
          icon={<FileText className="w-5 h-5" />}
        />
        <KPICard
          title="Bonus Trek"
          value={`${metrics.bonusTrekPercent ?? 0}%`}
          subtitle="(if enabled)"
          status={(metrics.bonusTrekPercent ?? 0) < 30 ? "warning" : "success"}
          icon={<Activity className="w-5 h-5" />}
        />
        <KPICard
          title="A2L Participation"
          value={`${metrics.a2lParticipationPercent ?? 0}%`}
          status={getStatus(metrics.a2lParticipationPercent ?? 0)}
          icon={<Users className="w-5 h-5" />}
        />
      </div>

      {/* School Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <H3>Schools — Sorted by Lowest Completion</H3>
          <P4 className="text-neutral-400">Real-time updated</P4>
        </div>
        <SchoolTable schools={district.schools} showDaysLeft={false} />
      </div>
    </div>
  );
};

// ============================================
// PHASE 5 - A2L-PLP / PLP-3
// ============================================

const Phase5Content = ({ district }: { district: District }) => {
  const { metrics } = district;

  const getStatus = (value: number) => {
    if (value < 50) return "danger";
    if (value < 70) return "warning";
    if (value < 100) return "success";
    return "success";
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 max-w-xl">
        <KPICard
          title="Final PLP Completion"
          value={`${metrics.finalPlpCompletionPercent ?? 0}%`}
          status={getStatus(metrics.finalPlpCompletionPercent ?? 0)}
          icon={<FileText className="w-5 h-5" />}
        />
        <KPICard
          title="A2L-PLP Completion"
          value={`${metrics.a2lPlpCompletionPercent ?? 0}%`}
          status={getStatus(metrics.a2lPlpCompletionPercent ?? 0)}
          icon={<GraduationCap className="w-5 h-5" />}
        />
      </div>

      {/* Completion Focused Message */}
      {(metrics.finalPlpCompletionPercent ?? 0) >= 90 && (metrics.a2lPlpCompletionPercent ?? 0) >= 90 && (
        <DSMCard padding="md" className="bg-success-light border-success">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center">
              <Check className="w-5 h-5 text-neutral-0" />
            </div>
            <div>
              <H4 className="text-success-dark">Excellent Progress!</H4>
              <P3 className="text-success-dark">This district is on track to complete Phase 5 successfully.</P3>
            </div>
          </div>
        </DSMCard>
      )}

      {/* School Table */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <H3>Schools — Sorted by Lowest Completion</H3>
          <P4 className="text-neutral-400">Real-time updated</P4>
        </div>
        <SchoolTable schools={district.schools} showDaysLeft={false} />
      </div>
    </div>
  );
};

// ============================================
// MAIN DRILLDOWN COMPONENT
// ============================================

interface DistrictDrilldownProps {
  district: District;
}

export const DistrictDrilldown = ({ district }: DistrictDrilldownProps) => {
  const [activePhase, setActivePhase] = React.useState(String(district.phase));

  const phaseTabs = [
    { id: "1", label: "Phase 1" },
    { id: "2", label: "Phase 2" },
    { id: "3", label: "Phase 3" },
    { id: "4", label: "Phase 4" },
    { id: "5", label: "Phase 5" },
  ];

  const renderPhaseContent = () => {
    switch (activePhase) {
      case "1":
        return <Phase1Content district={district} />;
      case "2":
        return <Phase2Content district={district} />;
      case "3":
        return <Phase3Content district={district} />;
      case "4":
        return <Phase4Content district={district} />;
      case "5":
        return <Phase5Content district={district} />;
      default:
        return <Phase3Content district={district} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <DrilldownHeader district={district} />

      {/* Phase Tabs */}
      <DSMTabs
        tabs={phaseTabs}
        activeTab={activePhase}
        onTabChange={setActivePhase}
      />

      {/* Phase Content */}
      <div role="tabpanel" id={`panel-${activePhase}`} aria-labelledby={`tab-${activePhase}`}>
        {renderPhaseContent()}
      </div>
    </div>
  );
};
