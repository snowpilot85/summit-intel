"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  CheckCircle2,
  X,
  Clock,
  AlertCircle,
  Minus,
  ChevronRight,
  GraduationCap,
  Calendar,
  AlertTriangle,
  User,
  BookOpen,
  Briefcase,
  Award,
  Layers,
  Building2,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getRuleForIndicatorType,
  buildStudentEvaluation,
  type CCMRRule,
} from "@/lib/ccmr-rules";
import type {
  CCMRReadiness,
  CcmrIndicatorResultRow,
  CcmrIndicatorResultStatus,
  CcmrIndicatorResultType,
  IndicatorCategory,
  IndicatorRow,
  IndicatorType,
  InterventionRow,
  InterventionStatus,
  StudentRow,
  WorkBasedLearningRow,
} from "@/types/database";
import type { EnrichedStudentRow } from "@/lib/db/students";
import { isTieredMethodology } from "@/lib/ccmr/methodology";
import { MethodologyBadge } from "@/components/pathways/students";
import type { CredentialProgressItem } from "@/app/pathways/students/[id]/page";

/* ============================================
   Summit Pathways — Student Profile
   ============================================ */

// ============================================
// INDICATOR METADATA
// ============================================

const INDICATOR_LABELS: Record<IndicatorType, string> = {
  tsi_reading: "TSI Reading",
  tsi_math: "TSI Math",
  sat_reading: "SAT Reading",
  sat_math: "SAT Math",
  act_reading: "ACT Reading",
  act_math: "ACT Math",
  college_prep_ela: "College Prep ELA",
  college_prep_math: "College Prep Math",
  dual_credit_ela: "Dual Credit ELA",
  dual_credit_math: "Dual Credit Math",
  dual_credit_any: "Dual Credit (9 hr)",
  ap_exam: "AP Exam",
  ib_exam: "IB Exam",
  ibc: "Industry-Based Certification",
  associate_degree: "Associate Degree",
  level_i_ii_certificate: "Level I/II Certificate",
  onramps: "OnRamps",
  military_enlistment: "Military Enlistment",
  iep_completion: "IEP Completion",
  sped_advanced_degree: "SpEd Advanced Degree",
};

// A display item is either a single DB indicator row or a combined row
// (SAT / ACT) whose status is derived from two subscores.
type IndicatorDisplayItem =
  | { kind: "single"; type: IndicatorType }
  | {
      kind: "combined";
      label: string;
      /** The two sub-indicator types that must BOTH be met */
      types: [IndicatorType, IndicatorType];
      /** Which type to use for the rule-modal lookup */
      clickType: IndicatorType;
      /** Human-readable labels for each subscore */
      subLabels: [string, string];
    };

const INDICATOR_CATEGORIES: {
  label: string;
  icon: React.ElementType;
  items: IndicatorDisplayItem[];
}[] = [
  {
    label: "College Readiness",
    icon: BookOpen,
    items: [
      { kind: "single", type: "tsi_reading" },
      { kind: "single", type: "tsi_math" },
      // SAT is ONE combined indicator — requires BOTH subscores
      {
        kind: "combined",
        label: "SAT College Ready",
        types: ["sat_reading", "sat_math"],
        clickType: "sat_reading",
        subLabels: ["EBRW (≥ 480)", "Math (≥ 530)"],
      },
      // ACT is ONE combined indicator — requires BOTH subscores
      {
        kind: "combined",
        label: "ACT College Ready",
        types: ["act_reading", "act_math"],
        clickType: "act_reading",
        subLabels: ["English (≥ 19)", "Math (≥ 19)"],
      },
    ],
  },
  {
    label: "College Prep Courses",
    icon: GraduationCap,
    items: [
      { kind: "single", type: "college_prep_ela" },
      { kind: "single", type: "college_prep_math" },
    ],
  },
  {
    label: "Dual Credit",
    icon: Award,
    items: [
      { kind: "single", type: "dual_credit_ela" },
      { kind: "single", type: "dual_credit_math" },
      { kind: "single", type: "dual_credit_any" },
    ],
  },
  {
    label: "AP / IB",
    icon: Award,
    items: [
      { kind: "single", type: "ap_exam" },
      { kind: "single", type: "ib_exam" },
    ],
  },
  {
    label: "Career",
    icon: Briefcase,
    items: [
      { kind: "single", type: "ibc" },
      { kind: "single", type: "associate_degree" },
      { kind: "single", type: "level_i_ii_certificate" },
    ],
  },
  {
    label: "Other",
    icon: User,
    items: [
      { kind: "single", type: "onramps" },
      { kind: "single", type: "military_enlistment" },
      { kind: "single", type: "iep_completion" },
      { kind: "single", type: "sped_advanced_degree" },
    ],
  },
];

// ============================================
// HELPERS
// ============================================

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86_400_000));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ============================================
// READINESS BADGE (large)
// ============================================

const READINESS_CONFIG: Record<CCMRReadiness, { label: string; className: string }> = {
  met: { label: "CCMR Met", className: "bg-teal-600 text-neutral-0" },
  on_track: { label: "On Track", className: "bg-primary-500 text-neutral-0" },
  almost: { label: "Almost", className: "bg-warning text-neutral-0" },
  at_risk: { label: "At Risk", className: "bg-error text-neutral-0" },
  too_early: { label: "Too Early", className: "bg-neutral-400 text-neutral-0" },
};

const ReadinessBadgeLarge = ({ status }: { status: CCMRReadiness }) => {
  const { label, className } = READINESS_CONFIG[status] ?? READINESS_CONFIG.too_early;
  return (
    <span
      className={cn(
        "px-4 py-2 rounded-lg text-[14px] font-bold uppercase tracking-wide",
        className
      )}
    >
      {label}
    </span>
  );
};

// ============================================
// TIERED CCMR — large badge + small per-indicator badge
//
// The visual color ramp matches the caseload TieredBadge but at
// header-card scale. Category is shown next to the level so the
// reader sees both "what tier" and "what drove it" at a glance.
// ============================================

type TieredOnlyStatus = "foundational" | "demonstrated" | "advanced" | "none";

const TIERED_CONFIG_LARGE: Record<TieredOnlyStatus, { label: string; className: string }> = {
  none: { label: "None", className: "bg-neutral-400 text-neutral-0" },
  foundational: { label: "Foundational", className: "bg-success-light text-success-dark" },
  demonstrated: { label: "Demonstrated", className: "bg-success text-neutral-0" },
  advanced: { label: "Advanced", className: "bg-success-dark text-neutral-0" },
};

function categoryLabel(category: IndicatorCategory): string {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function asTieredStatus(s: CcmrIndicatorResultStatus | null): TieredOnlyStatus {
  if (s === "foundational" || s === "demonstrated" || s === "advanced") return s;
  return "none";
}

const TieredBadgeLarge = ({
  level,
  category,
}: {
  level: CcmrIndicatorResultStatus | null;
  category: IndicatorCategory | null;
}) => {
  const tier = asTieredStatus(level);
  const { label, className } = TIERED_CONFIG_LARGE[tier];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] font-bold uppercase tracking-wide",
        className
      )}
    >
      {label}
      {category && tier !== "none" && (
        <span className="text-[11px] font-semibold opacity-90 normal-case tracking-normal">
          ({categoryLabel(category)})
        </span>
      )}
    </span>
  );
};

// Compact tier pill used inside the indicator grid row.
const TIERED_CONFIG_PILL: Record<TieredOnlyStatus, string> = {
  none: "bg-neutral-100 text-neutral-500",
  foundational: "bg-success-light text-success-dark",
  demonstrated: "bg-success text-neutral-0",
  advanced: "bg-success-dark text-neutral-0",
};

const TierPill = ({ status }: { status: CcmrIndicatorResultStatus | null }) => {
  const tier = asTieredStatus(status);
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium",
        TIERED_CONFIG_PILL[tier]
      )}
    >
      {TIERED_CONFIG_LARGE[tier].label}
    </span>
  );
};

// ============================================
// INDICATOR STATUS ICON
// ============================================

const IndicatorIcon = ({ status }: { status: IndicatorRow["status"] | "not_attempted" }) => {
  switch (status) {
    case "met":
      return <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0" />;
    case "in_progress":
      return <Clock className="w-4 h-4 text-warning-dark flex-shrink-0" />;
    case "not_met":
      return <X className="w-4 h-4 text-error flex-shrink-0" />;
    default:
      return <Minus className="w-4 h-4 text-neutral-300 flex-shrink-0" />;
  }
};

const INDICATOR_STATUS_LABEL: Record<string, string> = {
  met: "Met",
  in_progress: "In progress",
  not_met: "Not met",
  not_attempted: "Not attempted",
};

const INDICATOR_STATUS_COLOR: Record<string, string> = {
  met: "text-teal-600",
  in_progress: "text-warning-dark",
  not_met: "text-error",
  not_attempted: "text-neutral-400",
};

// ============================================
// STUDENT HEADER
// ============================================

interface StudentHeaderProps {
  student: EnrichedStudentRow;
  campusName: string;
  graduationDate: string | null;
  hasCCMR: boolean;
  pathway: StudentPathwayData;
}

const StudentHeader = ({ student, campusName, graduationDate, hasCCMR, pathway }: StudentHeaderProps) => {
  const initials = (student.last_name[0] ?? "") + (student.first_name[0] ?? "");
  const isAtRisk = student.ccmr_readiness === "at_risk";
  const isSenior = student.grade_level === 12;
  const daysLeft = graduationDate ? daysUntil(graduationDate) : null;
  const meta = student.metadata as Record<string, unknown>;

  // Non-CCMR credential status derived from pathway
  const credentialBadge = pathway?.credentialEarned
    ? { label: "Credential Earned", className: "bg-teal-600 text-neutral-0" }
    : pathway?.enrollmentStatus === "enrolled"
    ? { label: "Pathway Enrolled", className: "bg-primary-500 text-neutral-0" }
    : pathway?.enrollmentStatus === "completed"
    ? { label: "Completed", className: "bg-teal-600 text-neutral-0" }
    : pathway
    ? { label: pathway.enrollmentStatus, className: "bg-neutral-400 text-neutral-0" }
    : { label: "No Pathway", className: "bg-neutral-300 text-neutral-600" };

  return (
    <div className="space-y-3">
      {/* Alert banner for at-risk seniors — CCMR districts only */}
      {hasCCMR && isAtRisk && isSenior && daysLeft !== null && (
        <div className="flex items-center gap-3 px-4 py-3 bg-error-light border border-error rounded-lg">
          <AlertTriangle className="w-5 h-5 text-error flex-shrink-0" />
          <p className="text-[13px] font-medium text-error-dark">
            This student has not met any CCMR indicator and graduates in{" "}
            <span className="font-bold">{daysLeft} days</span>. Immediate intervention recommended.
          </p>
        </div>
      )}

      <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-4 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          {/* Left: Avatar + info */}
          <div className="flex items-start gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-[18px] sm:text-[22px] font-bold text-teal-700 uppercase">{initials}</span>
            </div>
            <div className="min-w-0">
              <h1 className="text-[20px] sm:text-[24px] font-semibold text-neutral-900 break-words">
                {student.first_name} {student.last_name}
              </h1>
              <p className="text-[13px] text-neutral-500 mt-0.5">TSDS #{student.tsds_id}</p>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-[12px] font-medium rounded-full">
                  {campusName}
                </span>
                <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-[12px] font-medium rounded-full flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Grade {student.grade_level}
                </span>
                <span className="px-3 py-1 bg-neutral-100 text-neutral-700 text-[12px] font-medium rounded-full flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Class of {student.graduation_year}
                </span>
                {student.is_eb && (
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 text-[12px] font-medium rounded-full">
                    English Learner (EB)
                  </span>
                )}
                {student.is_econ_disadvantaged && (
                  <span className="px-3 py-1 bg-warning-light text-warning-dark text-[12px] font-medium rounded-full">
                    Econ Disadvantaged
                  </span>
                )}
                {student.is_special_ed && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-[12px] font-medium rounded-full">
                    Special Education
                  </span>
                )}
                {student.is_504 && (
                  <span className="px-3 py-1 bg-neutral-100 text-neutral-600 text-[12px] font-medium rounded-full">
                    504
                  </span>
                )}
                {!!meta.cte_pathway && (
                  <span className="px-3 py-1 bg-teal-100 text-teal-700 text-[12px] font-medium rounded-full">
                    CTE: {String(meta.cte_pathway)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: status badge — CCMR readiness for TX districts, credential status otherwise */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            {hasCCMR ? (
              <>
                {isTieredMethodology(student.methodology_key) ? (
                  <>
                    <TieredBadgeLarge
                      level={student.highest_level}
                      category={student.highest_level_category}
                    />
                    <div className="flex items-center gap-2">
                      <MethodologyBadge methodologyKey={student.methodology_key} />
                      {student.is_fallback_status && (
                        <span className="text-[11px] text-warning-dark" title="No student_ccmr_status row yet — value derived from binary readiness">
                          (pending recompute)
                        </span>
                      )}
                    </div>
                    {student.cohort_year != null && (
                      <p className="text-[12px] text-neutral-500 text-right max-w-[280px]">
                        Class of {student.cohort_year} — assessed under TEA&apos;s tiered CCMR methodology (Foundational / Demonstrated / Advanced).
                      </p>
                    )}
                    <Link
                      href="/pathways/ccmr-rules"
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-primary-600 transition-colors"
                    >
                      How CCMR is calculated
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </>
                ) : (
                  <>
                    <ReadinessBadgeLarge status={student.ccmr_readiness} />
                    <p className="text-[12px] text-neutral-500">
                      {student.indicators_met_count} indicator{student.indicators_met_count !== 1 ? "s" : ""} met
                    </p>
                    <Link
                      href="/pathways/ccmr-rules"
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-primary-600 transition-colors"
                    >
                      How CCMR is calculated
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <span className={cn("px-4 py-2 rounded-lg text-[14px] font-bold uppercase tracking-wide", credentialBadge.className)}>
                  {credentialBadge.label}
                </span>
                {pathway && (
                  <p className="text-[12px] text-neutral-500 text-right max-w-[200px] truncate" title={pathway.programName}>
                    {pathway.programName}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CCMR INDICATOR GRID
// ============================================

function buildIndicatorDetail(row: IndicatorRow): string {
  const parts: string[] = [];

  if (row.status === "met" && row.met_date) {
    parts.push(`Met ${formatDate(row.met_date)}`);
  }
  if (row.score !== null && row.threshold !== null) {
    parts.push(`Score: ${row.score} / threshold: ${row.threshold}`);
  } else if (row.score !== null) {
    parts.push(`Score: ${row.score}`);
  }
  if (row.course_grade) parts.push(`Grade: ${row.course_grade}`);
  if (row.exam_date) parts.push(`Exam: ${formatDate(row.exam_date)}`);
  if (row.notes) parts.push(row.notes);

  return parts.join(" · ") || "—";
}

// ─────────────────────────────────────────────
// INDICATOR DETAIL MODAL
// ─────────────────────────────────────────────

const IndicatorDetailModal = ({
  rule,
  byType,
  onClose,
}: {
  rule: CCMRRule;
  byType: Map<IndicatorType, IndicatorRow>;
  onClose: () => void;
}) => {
  const evalLines = buildStudentEvaluation(rule, byType);
  const hasAnyData = evalLines.some((l) => l.value !== null || l.met !== null);
  // SAT and ACT require ALL subscores; other multi-type rules require ANY
  const requiresAll = rule.id === "sat" || rule.id === "act";
  const isMet = requiresAll
    ? rule.indicatorTypes.every((t) => byType.get(t)?.status === "met")
    : rule.indicatorTypes.some((t) => byType.get(t)?.status === "met");
  const isPartial =
    !isMet &&
    requiresAll &&
    rule.indicatorTypes.some((t) => byType.get(t)?.status === "met");

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[16px]">{rule.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Rule details */}
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide mb-1">
                What qualifies
              </p>
              <p className="text-[13px] text-neutral-700">{rule.qualifies}</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide mb-1">
                  Data source
                </p>
                <p className="text-[12px] text-neutral-600">{rule.dataSource}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide mb-1">
                  TEA citation
                </p>
                <p className="text-[12px] text-neutral-500 font-mono">{rule.citation}</p>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-neutral-100" />

          {/* Student evaluation */}
          <div>
            <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide mb-2">
              This student
            </p>
            {!hasAnyData ? (
              <p className="text-[13px] text-neutral-500 italic">
                No data provided from {rule.dataSource.split(" (")[0].toLowerCase()}.
              </p>
            ) : (
              <div className="space-y-2">
                {evalLines.map((line, i) => (
                  <div key={i} className="flex items-center gap-3 text-[13px]">
                    <span className="text-neutral-600 w-[120px] flex-shrink-0">{line.label}</span>
                    {line.value !== null ? (
                      <>
                        <span className="font-semibold text-neutral-900">{line.value}</span>
                        {line.threshold && (
                          <span className="text-neutral-400">
                            (threshold: {line.threshold})
                          </span>
                        )}
                        {line.met !== null && (
                          <span
                            className={cn(
                              "ml-auto font-medium",
                              line.met ? "text-teal-700" : "text-error-dark"
                            )}
                          >
                            {line.met ? "✓ Met" : "✗ Not met"}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-neutral-400 italic">No data</span>
                    )}
                  </div>
                ))}
                <div className={cn(
                  "mt-3 px-3 py-2 rounded-lg text-[13px] font-medium",
                  isMet
                    ? "bg-teal-50 text-teal-800"
                    : isPartial
                    ? "bg-warning-light text-warning-dark"
                    : "bg-neutral-50 text-neutral-600"
                )}>
                  {isMet
                    ? "✓ Indicator met — counts toward CCMR"
                    : isPartial
                    ? "⟳ In progress — both subscores required to satisfy this indicator"
                    : "✗ Indicator not yet met"}
                </div>
              </div>
            )}
          </div>

          {/* Rules page link */}
          <Link
            href="/pathways/ccmr-rules"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-[12px] text-neutral-400 hover:text-primary-600 transition-colors"
          >
            View all CCMR rules
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────
// CCMR INDICATOR GRID (with clickable rows)
// ─────────────────────────────────────────────

const CCMRIndicatorGrid = ({ indicators }: { indicators: IndicatorRow[] }) => {
  const byType = new Map<IndicatorType, IndicatorRow>(
    indicators.map((r) => [r.indicator_type, r])
  );
  const [selectedType, setSelectedType] = React.useState<IndicatorType | null>(null);
  const selectedRule = selectedType ? getRuleForIndicatorType(selectedType) : null;

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[18px] font-semibold text-neutral-900">CCMR indicators</h2>
        <span className="text-[12px] text-neutral-400">Click any row to see rules</span>
      </div>

      <div className="space-y-6">
        {INDICATOR_CATEGORIES.map(({ label, icon: Icon, items }) => (
          <div key={label}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4 text-neutral-400" />
              <h3 className="text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">
                {label}
              </h3>
            </div>
            <div className="border border-neutral-200 rounded-lg overflow-x-auto">
              <table className="w-full min-w-[480px]">
                <tbody>
                  {items.map((item, idx) => {
                    if (item.kind === "single") {
                      const row = byType.get(item.type);
                      const status = row?.status ?? "not_attempted";
                      const detail = row ? buildIndicatorDetail(row) : "—";
                      return (
                        <tr
                          key={item.type}
                          onClick={() => setSelectedType(item.type)}
                          className={cn(
                            "border-b border-neutral-100 last:border-0 cursor-pointer transition-colors",
                            status === "met" && "bg-teal-50/40 hover:bg-teal-50/70",
                            status === "in_progress" && "bg-warning-light/20 hover:bg-warning-light/40",
                            (status === "not_attempted" || status === "not_met") && idx % 2 === 1
                              ? "bg-neutral-50/50 hover:bg-neutral-100/60"
                              : (status === "not_attempted" || status === "not_met") ? "hover:bg-neutral-50" : ""
                          )}
                        >
                          <td className="px-4 py-3 text-[13px] text-neutral-900 w-[200px]">
                            {INDICATOR_LABELS[item.type]}
                          </td>
                          <td className="px-4 py-3 w-[130px]">
                            <div className="flex items-center gap-2">
                              <IndicatorIcon status={status} />
                              <span className={cn("text-[12px] font-medium", INDICATOR_STATUS_COLOR[status] ?? "text-neutral-400")}>
                                {INDICATOR_STATUS_LABEL[status] ?? status}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[12px] text-neutral-500">
                            {detail === "—" ? <span className="text-neutral-300">—</span> : detail}
                          </td>
                          <td className="px-3 py-3 w-8 text-neutral-300">
                            <ChevronRight className="w-3.5 h-3.5" />
                          </td>
                        </tr>
                      );
                    }

                    // Combined row (SAT / ACT): both subscores must be met
                    const [typeA, typeB] = item.types;
                    const rowA = byType.get(typeA);
                    const rowB = byType.get(typeB);
                    const aIsMet = rowA?.status === "met";
                    const bIsMet = rowB?.status === "met";
                    const combinedStatus: IndicatorRow["status"] | "not_attempted" =
                      aIsMet && bIsMet ? "met"
                      : aIsMet || bIsMet ? "in_progress"
                      : "not_attempted";

                    // Detail line: show scores when available
                    const detailParts: string[] = [];
                    if (rowA?.score != null) detailParts.push(`${item.subLabels[0]}: ${rowA.score}`);
                    else if (aIsMet) detailParts.push(`${item.subLabels[0]}: met`);
                    if (rowB?.score != null) detailParts.push(`${item.subLabels[1]}: ${rowB.score}`);
                    else if (bIsMet) detailParts.push(`${item.subLabels[1]}: met`);
                    const combinedDetail = detailParts.length > 0 ? detailParts.join(" · ") : "—";

                    // "In progress" annotation when only one subscore is met
                    const missingLabel = aIsMet && !bIsMet
                      ? item.subLabels[1]
                      : !aIsMet && bIsMet
                      ? item.subLabels[0]
                      : null;

                    return (
                      <tr
                        key={item.clickType}
                        onClick={() => setSelectedType(item.clickType)}
                        className={cn(
                          "border-b border-neutral-100 last:border-0 cursor-pointer transition-colors",
                          combinedStatus === "met" && "bg-teal-50/40 hover:bg-teal-50/70",
                          combinedStatus === "in_progress" && "bg-warning-light/20 hover:bg-warning-light/40",
                          combinedStatus === "not_attempted" && idx % 2 === 1
                            ? "bg-neutral-50/50 hover:bg-neutral-100/60"
                            : combinedStatus === "not_attempted" ? "hover:bg-neutral-50" : ""
                        )}
                      >
                        <td className="px-4 py-3 text-[13px] text-neutral-900 w-[200px]">
                          {item.label}
                          {combinedStatus === "in_progress" && missingLabel && (
                            <span className="block text-[11px] text-warning-dark mt-0.5">
                              {missingLabel} needed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 w-[130px]">
                          <div className="flex items-center gap-2">
                            <IndicatorIcon status={combinedStatus} />
                            <span className={cn("text-[12px] font-medium", INDICATOR_STATUS_COLOR[combinedStatus] ?? "text-neutral-400")}>
                              {INDICATOR_STATUS_LABEL[combinedStatus] ?? combinedStatus}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-neutral-500">
                          {combinedDetail === "—" ? <span className="text-neutral-300">—</span> : combinedDetail}
                        </td>
                        <td className="px-3 py-3 w-8 text-neutral-300">
                          <ChevronRight className="w-3.5 h-3.5" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Indicator detail modal */}
      {selectedRule && (
        <IndicatorDetailModal
          rule={selectedRule}
          byType={byType}
          onClose={() => setSelectedType(null)}
        />
      )}
    </div>
  );
};

// ============================================
// TIERED INDICATOR GRID (cohort 2030+)
//
// Renders one row per ccmr_indicator_results record. The row whose
// id matches student.highest_level_source_indicator_id is flagged
// with an "Highest level" marker — the score-driving indicator
// that wins the highest-tier resolution. Empty data set → empty
// state explaining that recompute hasn't run yet.
// ============================================

const TIERED_INDICATOR_LABELS: Record<CcmrIndicatorResultType, string> = {
  tsi: "TSI (Math + RLA)",
  ibc: "Industry-Based Certification",
  level_1_certificate: "Level I Certificate",
  level_2_certificate: "Level II Certificate",
  dual_credit: "Dual Credit",
  ap: "AP Exam",
  ib: "IB Exam",
  onramps: "OnRamps",
  associate_degree: "Associate Degree",
  jrotc: "JROTC + AFQT",
  military_enlistment: "Military Enlistment",
  sped_advanced_diploma: "SpEd Advanced Diploma",
  workforce_ready_iep: "Workforce Ready IEP Diploma",
};

const CATEGORY_LABEL: Record<IndicatorCategory, string> = {
  college: "College",
  career: "Career",
  military: "Military",
};

function summarizeSource(row: CcmrIndicatorResultRow): string {
  const sd = row.source_data ?? {};
  const parts: string[] = [];
  if (typeof sd.tsi_pathway_source === "string") {
    parts.push(`Pathway: ${String(sd.tsi_pathway_source).toUpperCase()}`);
  }
  if (typeof sd.ibc_tier === "number") parts.push(`Tier ${sd.ibc_tier}`);
  if (typeof sd.certificate_program === "string") parts.push(String(sd.certificate_program));
  if (typeof sd.afqt_score === "number") parts.push(`AFQT ${sd.afqt_score}`);
  return parts.join(" · ") || "—";
}

const TieredIndicatorGrid = ({
  results,
  highestSourceIndicatorId,
}: {
  results: CcmrIndicatorResultRow[];
  highestSourceIndicatorId: string | null;
}) => {
  if (results.length === 0) {
    return (
      <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
        <h2 className="text-[18px] font-semibold text-neutral-900 mb-2">CCMR indicators</h2>
        <p className="text-[13px] text-neutral-500">
          Per-indicator tier results have not been computed yet for this student.
          Run <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-[12px] font-mono">recomputeDistrict</code> to populate.
        </p>
      </div>
    );
  }

  // Group by category for parity with the binary grid layout.
  const byCategory: Record<IndicatorCategory, CcmrIndicatorResultRow[]> = {
    college: [],
    career: [],
    military: [],
  };
  for (const r of results) {
    byCategory[r.indicator_category].push(r);
  }
  const categoryOrder: IndicatorCategory[] = ["college", "career", "military"];

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[18px] font-semibold text-neutral-900">CCMR indicators</h2>
        <span className="text-[12px] text-neutral-400">
          Tiered methodology — highest level wins
        </span>
      </div>

      <div className="space-y-6">
        {categoryOrder.map((category) => {
          const rows = byCategory[category];
          if (rows.length === 0) return null;
          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-neutral-400" />
                <h3 className="text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">
                  {CATEGORY_LABEL[category]}
                </h3>
              </div>
              <div className="border border-neutral-200 rounded-lg overflow-x-auto">
                <table className="w-full min-w-[480px]">
                  <tbody>
                    {rows.map((row, idx) => {
                      const isHighest = row.id === highestSourceIndicatorId;
                      return (
                        <tr
                          key={row.id}
                          className={cn(
                            "border-b border-neutral-100 last:border-0 transition-colors",
                            isHighest
                              ? "bg-success-light/30"
                              : idx % 2 === 1
                                ? "bg-neutral-50/40"
                                : ""
                          )}
                        >
                          <td className="px-4 py-3 text-[13px] text-neutral-900 w-[220px]">
                            <div className="flex items-center gap-2">
                              {TIERED_INDICATOR_LABELS[row.indicator_type] ?? row.indicator_type}
                              {isHighest && (
                                <span
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-success-dark text-neutral-0 text-[10px] font-semibold uppercase tracking-wide"
                                  title="This indicator drives the student's highest level"
                                >
                                  <Award className="w-3 h-3" />
                                  Highest level
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 w-[140px]">
                            <TierPill status={row.status} />
                          </td>
                          <td className="px-4 py-3 text-[12px] text-neutral-500">
                            {summarizeSource(row)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// NEAREST PATHWAY SUMMARY
// ============================================

interface PathwaySuggestion {
  label: string;
  detail: string;
  priority: "high" | "medium" | "low";
}

function deriveNearestPaths(student: StudentRow, indicators: IndicatorRow[]): PathwaySuggestion[] {
  const meta = student.metadata as Record<string, unknown>;
  const paths: PathwaySuggestion[] = [];
  const inProgress = indicators.filter((i) => i.status === "in_progress");
  const ibcInProgress = inProgress.find((i) => i.indicator_type === "ibc");

  // 1. CTE/IBC path from metadata (highest specificity)
  if (meta.cte_certification && meta.cte_exam_date) {
    const examLabel = `Exam: ${formatDate(String(meta.cte_exam_date))}`;
    paths.push({
      label: `IBC — ${meta.cte_certification}`,
      detail: ibcInProgress?.notes
        ? `${ibcInProgress.notes} · ${examLabel}`
        : `${meta.cte_pathway ? `Enrolled in ${meta.cte_pathway}. ` : ""}${examLabel}. If passed, CCMR is met immediately.`,
      priority: "high",
    });
  } else if (ibcInProgress) {
    paths.push({
      label: "Industry-Based Certification (IBC)",
      detail: ibcInProgress.notes ?? (ibcInProgress.exam_date ? `Exam: ${formatDate(ibcInProgress.exam_date)}` : "In progress"),
      priority: "high",
    });
  }

  // 2. Other in-progress indicators (skip IBC since handled above)
  for (const ind of inProgress) {
    if (ind.indicator_type === "ibc") continue;
    if (paths.length >= 3) break;
    const detail = [
      ind.course_grade ? `Current grade: ${ind.course_grade}` : null,
      ind.exam_date ? `Exam: ${formatDate(ind.exam_date)}` : null,
      ind.notes,
    ]
      .filter(Boolean)
      .join(" · ") || "In progress";
    paths.push({
      label: INDICATOR_LABELS[ind.indicator_type],
      detail,
      priority: "medium",
    });
  }

  // 3. Suggest TSI if not attempted and slots remain
  if (paths.length < 3) {
    const tsiAttempted = indicators.some(
      (i) => i.indicator_type === "tsi_reading" || i.indicator_type === "tsi_math"
    );
    if (!tsiAttempted) {
      paths.push({
        label: "TSI Assessment",
        detail: "Not yet attempted — schedule for the next testing window as a quick backup pathway.",
        priority: paths.length === 0 ? "medium" : "low",
      });
    }
  }

  // 4. If still empty, generic guidance
  if (paths.length === 0) {
    paths.push({
      label: "No active pathway identified",
      detail: "Review available indicators and enroll the student in a pathway course or test.",
      priority: "low",
    });
  }

  return paths.slice(0, 3);
}

const PRIORITY_STYLES: Record<PathwaySuggestion["priority"], { bg: string; icon: string; title: string; text: string }> = {
  high: { bg: "bg-teal-50 border-teal-200", icon: "bg-teal-600", title: "text-teal-800", text: "text-teal-700" },
  medium: { bg: "bg-neutral-50 border-neutral-200", icon: "bg-primary-400", title: "text-neutral-800", text: "text-neutral-600" },
  low: { bg: "bg-neutral-50 border-neutral-200", icon: "bg-neutral-300", title: "text-neutral-700", text: "text-neutral-500" },
};

const NearestPathwaySummary = ({
  student,
  indicators,
}: {
  student: StudentRow;
  indicators: IndicatorRow[];
}) => {
  if (student.ccmr_readiness === "met") return null;

  const paths = deriveNearestPaths(student, indicators);

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <h2 className="text-[18px] font-semibold text-neutral-900 mb-4">Nearest paths to CCMR</h2>
      <div className="space-y-3">
        {paths.map((path, idx) => {
          const styles = PRIORITY_STYLES[path.priority];
          return (
            <div key={idx} className={cn("p-4 border rounded-lg", styles.bg)}>
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                    styles.icon
                  )}
                >
                  <GraduationCap className="w-3.5 h-3.5 text-neutral-0" />
                </div>
                <div>
                  <p className={cn("text-[13px] font-semibold", styles.title)}>{path.label}</p>
                  <p className={cn("text-[12px] mt-1 leading-relaxed", styles.text)}>{path.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// NEAREST CREDENTIAL PATHS (non-CCMR districts)
// ============================================

const NearestCredentialPaths = ({ credentialProgress }: { credentialProgress: CredentialProgressItem[] }) => {
  if (credentialProgress.length === 0) {
    return (
      <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
        <h2 className="text-[18px] font-semibold text-neutral-900 mb-3">Nearest credential paths</h2>
        <p className="text-[13px] text-neutral-400">No credentials linked to this student&rsquo;s program yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <h2 className="text-[18px] font-semibold text-neutral-900 mb-4">Nearest credential paths</h2>
      <div className="space-y-3">
        {credentialProgress.slice(0, 3).map((item) => {
          const isEarned = item.status === "earned";
          const isInProgress = item.status === "in_progress";
          const bgClass = isEarned
            ? "bg-teal-50 border-teal-200"
            : isInProgress
            ? "bg-primary-50 border-primary-200"
            : "bg-neutral-50 border-neutral-200";
          const iconClass = isEarned ? "bg-teal-600" : isInProgress ? "bg-primary-500" : "bg-neutral-300";
          const titleClass = isEarned ? "text-teal-800" : isInProgress ? "text-primary-800" : "text-neutral-700";
          const textClass = isEarned ? "text-teal-700" : isInProgress ? "text-primary-600" : "text-neutral-500";
          const statusLabel = isEarned ? "Earned" : isInProgress ? "In progress" : "Not yet started";
          return (
            <div key={item.credentialId} className={cn("p-4 border rounded-lg", bgClass)}>
              <div className="flex items-start gap-3">
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5", iconClass)}>
                  {isEarned
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-neutral-0" />
                    : isInProgress
                    ? <Clock className="w-3.5 h-3.5 text-neutral-0" />
                    : <GraduationCap className="w-3.5 h-3.5 text-neutral-0" />}
                </div>
                <div>
                  <p className={cn("text-[13px] font-semibold", titleClass)}>
                    {item.name}
                    {item.isCapstone && (
                      <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded uppercase tracking-wide">
                        Capstone
                      </span>
                    )}
                  </p>
                  <p className={cn("text-[12px] mt-0.5", textClass)}>
                    {statusLabel}
                    {item.typicalGrade ? ` · Grade ${item.typicalGrade}` : ""}
                    {item.passingScore ? ` · Pass: ${item.passingScore}` : ""}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// ACTIVE INTERVENTIONS
// ============================================

const INTERVENTION_STATUS_CONFIG: Record<
  InterventionStatus,
  { label: string; className: string }
> = {
  recommended: { label: "Recommended", className: "bg-primary-100 text-primary-700" },
  planned: { label: "Planned", className: "bg-primary-100 text-primary-700" },
  in_progress: { label: "In progress", className: "bg-teal-100 text-teal-700" },
  completed: { label: "Completed", className: "bg-teal-100 text-teal-700" },
  expired: { label: "Expired", className: "bg-neutral-100 text-neutral-500" },
  dismissed: { label: "Dismissed", className: "bg-neutral-100 text-neutral-500" },
};

const ActiveInterventions = ({ interventions }: { interventions: InterventionRow[] }) => {
  const active = interventions.filter(
    (i) => i.status !== "dismissed" && i.status !== "expired" && i.status !== "completed"
  );

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <h2 className="text-[18px] font-semibold text-neutral-900 mb-4">
        Active interventions
        {active.length > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-teal-100 text-teal-700 text-[12px] font-medium rounded-full">
            {active.length}
          </span>
        )}
      </h2>

      {interventions.length === 0 ? (
        <p className="text-[13px] text-neutral-500">No interventions recorded for this student.</p>
      ) : (
        <div className="space-y-3">
          {interventions.map((intervention) => {
            const statusConfig =
              INTERVENTION_STATUS_CONFIG[intervention.status] ??
              INTERVENTION_STATUS_CONFIG.recommended;
            return (
              <div
                key={intervention.id}
                className="border border-neutral-200 rounded-lg p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-semibold text-neutral-900">{intervention.title}</p>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[11px] font-medium flex-shrink-0",
                      statusConfig.className
                    )}
                  >
                    {statusConfig.label}
                  </span>
                </div>
                {intervention.description && (
                  <p className="text-[12px] text-neutral-600 leading-relaxed">
                    {intervention.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {intervention.pathway_type && (
                    <span className="text-[11px] text-neutral-500">
                      Pathway:{" "}
                      <span className="font-medium text-neutral-700">
                        {intervention.pathway_type.toUpperCase()}
                      </span>
                    </span>
                  )}
                  {intervention.due_date && (
                    <span className="text-[11px] text-neutral-500">
                      Due:{" "}
                      <span className="font-medium text-neutral-700">
                        {formatDate(intervention.due_date)}
                      </span>
                    </span>
                  )}
                  {intervention.assigned_to && (
                    <span className="text-[11px] text-neutral-500">
                      Assigned to:{" "}
                      <span className="font-medium text-neutral-700">
                        {intervention.assigned_to}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================
// STUDENT METADATA SIDEBAR
// ============================================

const MetadataItem = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[11px] text-neutral-500 uppercase tracking-wide font-medium mb-0.5">{label}</p>
    <p className="text-[13px] text-neutral-900 font-medium">{value}</p>
  </div>
);

const StudentMetadata = ({
  student,
  campusName,
  graduationDate,
}: {
  student: StudentRow;
  campusName: string;
  graduationDate: string | null;
}) => {
  const meta = student.metadata as Record<string, unknown>;

  const items: { label: string; value: string }[] = [
    { label: "Campus", value: campusName },
    { label: "Grade", value: String(student.grade_level) },
    { label: "Graduation year", value: String(student.graduation_year) },
  ];

  if (graduationDate) {
    items.push({ label: "Graduation date", value: formatDate(graduationDate) });
    if (student.grade_level === 12) {
      items.push({ label: "Days until graduation", value: `${daysUntil(graduationDate)} days` });
    }
  }
  if (meta.gpa !== undefined) {
    items.push({ label: "GPA", value: Number(meta.gpa).toFixed(2) });
  }
  if (meta.cte_pathway) {
    items.push({ label: "CTE pathway", value: String(meta.cte_pathway) });
  }
  if (meta.cte_certification) {
    items.push({ label: "CTE certification", value: String(meta.cte_certification) });
  }
  if (meta.cte_exam_date) {
    items.push({ label: "CTE exam date", value: formatDate(String(meta.cte_exam_date)) });
  }
  if (student.ccmr_met_date) {
    items.push({ label: "CCMR met date", value: formatDate(student.ccmr_met_date) });
  }
  if (student.ed_form_collected) {
    items.push({
      label: "Ed form",
      value: student.ed_form_date ? `Collected ${formatDate(student.ed_form_date)}` : "Collected",
    });
  }

  // Render any extra unknown metadata keys
  const knownKeys = new Set(["cte_pathway", "cte_certification", "cte_exam_date", "gpa", "nearest_pathway"]);
  const extraKeys = Object.keys(meta).filter((k) => !knownKeys.has(k));

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <h2 className="text-[16px] font-semibold text-neutral-900 mb-4">Student info</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <MetadataItem key={item.label} label={item.label} value={item.value} />
        ))}
        {extraKeys.map((key) => (
          <MetadataItem
            key={key}
            label={key.replace(/_/g, " ")}
            value={String(meta[key])}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================
// CAREER PATHWAY SECTION
// ============================================

export type StudentPathwayData = {
  clusterName: string;
  clusterCode: string;
  programName: string;
  enrollmentStatus: string;
  credentialEarned: boolean;
} | null;

const ENROLLMENT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  enrolled:    { label: "Enrolled",    className: "bg-primary-100 text-primary-700" },
  completed:   { label: "Completed",   className: "bg-teal-100 text-teal-700" },
  withdrawn:   { label: "Withdrawn",   className: "bg-neutral-100 text-neutral-500" },
  transferred: { label: "Transferred", className: "bg-neutral-100 text-neutral-500" },
};

const CareerPathwaySection = ({ pathway }: { pathway: StudentPathwayData }) => {
  if (!pathway) return null;

  const statusConfig =
    ENROLLMENT_STATUS_CONFIG[pathway.enrollmentStatus] ?? ENROLLMENT_STATUS_CONFIG.enrolled;

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-4 h-4 text-neutral-400" />
        <h2 className="text-[18px] font-semibold text-neutral-900">Career Pathway</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[11px] text-neutral-500 uppercase tracking-wide font-medium mb-1">
            Career Cluster
          </p>
          <p className="text-[14px] font-semibold text-neutral-900">{pathway.clusterName}</p>
          <p className="text-[12px] text-neutral-500 mt-0.5">{pathway.clusterCode}</p>
        </div>

        <div>
          <p className="text-[11px] text-neutral-500 uppercase tracking-wide font-medium mb-1">
            Program of Study
          </p>
          <p className="text-[14px] font-medium text-neutral-900">{pathway.programName}</p>
        </div>

        <div>
          <p className="text-[11px] text-neutral-500 uppercase tracking-wide font-medium mb-1">
            Enrollment Status
          </p>
          <span
            className={cn(
              "inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium",
              statusConfig.className
            )}
          >
            {statusConfig.label}
          </span>
        </div>

        <div>
          <p className="text-[11px] text-neutral-500 uppercase tracking-wide font-medium mb-1">
            Credential Earned
          </p>
          {pathway.credentialEarned ? (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span className="text-[13px] font-medium text-teal-700">Yes — IBC met</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-neutral-400" />
              <span className="text-[13px] text-neutral-500">Not yet earned</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// CREDENTIAL PROGRESS SECTION
// ============================================

const CREDENTIAL_STATUS_CONFIG = {
  earned:      { label: "Earned",      icon: CheckCircle2, className: "bg-teal-50 text-teal-800" },
  in_progress: { label: "In Progress", icon: Clock,        className: "bg-primary-100 text-primary-700" },
  not_started: { label: "Not Started", icon: Minus,        className: "bg-neutral-100 text-neutral-500" },
} as const;

const CredentialProgressSection = ({
  items,
}: {
  items: CredentialProgressItem[];
}) => {
  if (items.length === 0) return null;

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-4 h-4 text-neutral-400" />
        <h2 className="text-[18px] font-semibold text-neutral-900">Credential Progress</h2>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const cfg = CREDENTIAL_STATUS_CONFIG[item.status];
          const Icon = cfg.icon;
          return (
            <div
              key={item.credentialId}
              className="border border-neutral-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[13px] font-semibold text-neutral-900">{item.name}</p>
                    {item.isCapstone && (
                      <span className="px-1.5 py-0.5 bg-teal-100 text-teal-700 text-[10px] font-semibold rounded uppercase tracking-wide">
                        Capstone
                      </span>
                    )}
                    {item.isCcmrEligible && (
                      <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded uppercase tracking-wide">
                        CCMR IBC
                      </span>
                    )}
                  </div>
                  {item.issuingBody && (
                    <p className="text-[12px] text-neutral-500 mt-0.5">{item.issuingBody}</p>
                  )}
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium flex-shrink-0",
                    cfg.className
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cfg.label}
                </span>
              </div>

              {/* Detail row */}
              <div className="flex flex-wrap items-center gap-4 mt-3">
                {item.typicalGrade && (
                  <div>
                    <span className="text-[11px] text-neutral-400 uppercase tracking-wide">Typical grade </span>
                    <span className="text-[12px] font-medium text-neutral-700">{item.typicalGrade}</span>
                  </div>
                )}
                {item.passingScore && (
                  <div>
                    <span className="text-[11px] text-neutral-400 uppercase tracking-wide">Passing score </span>
                    <span className="text-[12px] font-medium text-neutral-700">{item.passingScore}</span>
                  </div>
                )}
                {item.examWindowNotes && (
                  <div>
                    <span className="text-[11px] text-neutral-400 uppercase tracking-wide">Exam window </span>
                    <span className="text-[12px] text-neutral-600">{item.examWindowNotes}</span>
                  </div>
                )}
                {item.notes && (
                  <div>
                    <span className="text-[12px] text-neutral-500 italic">{item.notes}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// WORK-BASED LEARNING SECTION
// ============================================

const WBL_ACTIVITY_LABELS: Record<string, string> = {
  internship:           "Internship",
  job_shadow:           "Job Shadow",
  apprenticeship:       "Apprenticeship",
  clinical:             "Clinical Rotation",
  cooperative_education:"Co-op Education",
  other:                "Work Experience",
};

const WBL_ACTIVITY_COLORS: Record<string, string> = {
  internship:           "bg-teal-50 text-teal-700",
  job_shadow:           "bg-primary-50 text-primary-700",
  apprenticeship:       "bg-amber-50 text-amber-700",
  clinical:             "bg-purple-50 text-purple-700",
  cooperative_education:"bg-orange-50 text-orange-700",
  other:                "bg-neutral-100 text-neutral-600",
};

const WorkBasedLearningSection = ({
  records,
}: {
  records: WorkBasedLearningRow[];
}) => {
  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="w-4 h-4 text-neutral-400" />
        <h2 className="text-[18px] font-semibold text-neutral-900">Work-Based Learning</h2>
      </div>

      {records.length === 0 ? (
        <p className="text-[13px] text-neutral-500">No work-based learning recorded yet.</p>
      ) : (
        <div className="space-y-3">
          {records.map((rec) => {
            const activityLabel = WBL_ACTIVITY_LABELS[rec.activity_type] ?? rec.activity_type;
            const activityColor = WBL_ACTIVITY_COLORS[rec.activity_type] ?? "bg-neutral-100 text-neutral-600";
            const dateRange = rec.end_date
              ? `${formatDate(rec.start_date)} – ${formatDate(rec.end_date)}`
              : `${formatDate(rec.start_date)} – present`;

            return (
              <div key={rec.id} className="border border-neutral-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-neutral-900">{rec.employer_name}</p>
                    {rec.supervisor_name && (
                      <p className="text-[12px] text-neutral-500 mt-0.5">
                        Supervisor: {rec.supervisor_name}
                      </p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium flex-shrink-0",
                      activityColor
                    )}
                  >
                    {activityLabel}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <div>
                    <span className="text-[11px] text-neutral-400 uppercase tracking-wide">Dates </span>
                    <span className="text-[12px] font-medium text-neutral-700">{dateRange}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-neutral-400 uppercase tracking-wide">Hours </span>
                    <span className="text-[12px] font-medium text-neutral-700">
                      {rec.hours_completed.toLocaleString()}
                    </span>
                  </div>
                  {rec.is_paid && (
                    <span className="text-[12px] font-medium text-teal-700">Paid</span>
                  )}
                </div>

                {rec.notes && (
                  <p className="text-[12px] text-neutral-500 mt-2 leading-relaxed">{rec.notes}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export interface StudentProfileProps {
  student: EnrichedStudentRow;
  indicators: IndicatorRow[];
  /** Per-indicator tier results — populated for tiered cohorts after recompute runs. */
  tieredIndicatorResults?: CcmrIndicatorResultRow[];
  interventions: InterventionRow[];
  campusName: string;
  graduationDate: string | null;
  pathway?: StudentPathwayData;
  credentialProgress: CredentialProgressItem[];
  wblRecords: WorkBasedLearningRow[];
  from?: string;
  hasCCMR: boolean;
}

export const PathwaysStudentProfile = ({
  student,
  indicators,
  tieredIndicatorResults = [],
  interventions,
  campusName,
  graduationDate,
  pathway,
  credentialProgress,
  wblRecords,
  from,
  hasCCMR,
}: StudentProfileProps) => {
  const backHref =
    from === "interventions" ? "/pathways/interventions" : "/pathways/students";
  const backLabel =
    from === "interventions" ? "Back to Interventions" : "Back to Students";

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1 text-[13px] font-medium text-primary-500 hover:text-primary-600"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        {backLabel}
      </Link>

      {/* Header */}
      <StudentHeader
        student={student}
        campusName={campusName}
        graduationDate={graduationDate}
        hasCCMR={hasCCMR}
        pathway={pathway ?? null}
      />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pathway + Credential Progress + WBL + CCMR Indicators (TX only) */}
        <div className="lg:col-span-2 space-y-6">
          <CareerPathwaySection pathway={pathway ?? null} />
          <CredentialProgressSection items={credentialProgress} />
          <WorkBasedLearningSection records={wblRecords} />
          {hasCCMR &&
            (isTieredMethodology(student.methodology_key) ? (
              <TieredIndicatorGrid
                results={tieredIndicatorResults}
                highestSourceIndicatorId={student.highest_level_source_indicator_id}
              />
            ) : (
              <CCMRIndicatorGrid indicators={indicators} />
            ))}
        </div>

        {/* Right: Nearest paths + interventions + metadata */}
        <div className="space-y-6">
          {hasCCMR
            ? <NearestPathwaySummary student={student} indicators={indicators} />
            : <NearestCredentialPaths credentialProgress={credentialProgress} />}
          <ActiveInterventions interventions={interventions} />
          <StudentMetadata
            student={student}
            campusName={campusName}
            graduationDate={graduationDate}
          />
        </div>
      </div>
    </div>
  );
};
