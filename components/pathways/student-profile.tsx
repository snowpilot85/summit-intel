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
} from "lucide-react";
import type {
  CCMRReadiness,
  IndicatorRow,
  IndicatorType,
  InterventionRow,
  InterventionStatus,
  StudentRow,
  WorkBasedLearningRow,
} from "@/types/database";
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

const INDICATOR_CATEGORIES: { label: string; icon: React.ElementType; types: IndicatorType[] }[] = [
  {
    label: "College Readiness",
    icon: BookOpen,
    types: ["tsi_reading", "tsi_math", "sat_reading", "sat_math", "act_reading", "act_math"],
  },
  {
    label: "College Prep Courses",
    icon: GraduationCap,
    types: ["college_prep_ela", "college_prep_math"],
  },
  {
    label: "Dual Credit",
    icon: Award,
    types: ["dual_credit_ela", "dual_credit_math", "dual_credit_any"],
  },
  {
    label: "AP / IB",
    icon: Award,
    types: ["ap_exam", "ib_exam"],
  },
  {
    label: "Career",
    icon: Briefcase,
    types: ["ibc", "associate_degree", "level_i_ii_certificate"],
  },
  {
    label: "Other",
    icon: User,
    types: ["onramps", "military_enlistment", "iep_completion", "sped_advanced_degree"],
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
  student: StudentRow;
  campusName: string;
  graduationDate: string | null;
}

const StudentHeader = ({ student, campusName, graduationDate }: StudentHeaderProps) => {
  const initials = (student.last_name[0] ?? "") + (student.first_name[0] ?? "");
  const isAtRisk = student.ccmr_readiness === "at_risk";
  const isSenior = student.grade_level === 12;
  const daysLeft = graduationDate ? daysUntil(graduationDate) : null;
  const meta = student.metadata as Record<string, unknown>;

  return (
    <div className="space-y-3">
      {/* Alert banner for at-risk seniors */}
      {isAtRisk && isSenior && daysLeft !== null && (
        <div className="flex items-center gap-3 px-4 py-3 bg-error-light border border-error rounded-lg">
          <AlertTriangle className="w-5 h-5 text-error flex-shrink-0" />
          <p className="text-[13px] font-medium text-error-dark">
            This student has not met any CCMR indicator and graduates in{" "}
            <span className="font-bold">{daysLeft} days</span>. Immediate intervention recommended.
          </p>
        </div>
      )}

      <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          {/* Left: Avatar + info */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-[22px] font-bold text-teal-700 uppercase">{initials}</span>
            </div>
            <div>
              <h1 className="text-[24px] font-semibold text-neutral-900">
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

          {/* Right: Readiness badge */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            <ReadinessBadgeLarge status={student.ccmr_readiness} />
            <p className="text-[12px] text-neutral-500">
              {student.indicators_met_count} indicator{student.indicators_met_count !== 1 ? "s" : ""} met
            </p>
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

const CCMRIndicatorGrid = ({ indicators }: { indicators: IndicatorRow[] }) => {
  const byType = new Map<IndicatorType, IndicatorRow>(
    indicators.map((r) => [r.indicator_type, r])
  );

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <h2 className="text-[18px] font-semibold text-neutral-900 mb-5">CCMR indicators</h2>

      <div className="space-y-6">
        {INDICATOR_CATEGORIES.map(({ label, icon: Icon, types }) => (
          <div key={label}>
            <div className="flex items-center gap-2 mb-3">
              <Icon className="w-4 h-4 text-neutral-400" />
              <h3 className="text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">
                {label}
              </h3>
            </div>
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <tbody>
                  {types.map((type, idx) => {
                    const row = byType.get(type);
                    const status = row?.status ?? "not_attempted";
                    const detail = row ? buildIndicatorDetail(row) : "—";

                    return (
                      <tr
                        key={type}
                        className={cn(
                          "border-b border-neutral-100 last:border-0",
                          status === "met" && "bg-teal-50/40",
                          status === "in_progress" && "bg-warning-light/20",
                          idx % 2 === 1 && status === "not_attempted" && "bg-neutral-50/50"
                        )}
                      >
                        <td className="px-4 py-3 text-[13px] text-neutral-900 w-[200px]">
                          {INDICATOR_LABELS[type]}
                        </td>
                        <td className="px-4 py-3 w-[130px]">
                          <div className="flex items-center gap-2">
                            <IndicatorIcon status={status} />
                            <span
                              className={cn(
                                "text-[12px] font-medium",
                                INDICATOR_STATUS_COLOR[status] ?? "text-neutral-400"
                              )}
                            >
                              {INDICATOR_STATUS_LABEL[status] ?? status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[12px] text-neutral-500">
                          {detail === "—" ? (
                            <span className="text-neutral-300">—</span>
                          ) : (
                            detail
                          )}
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
  student: StudentRow;
  indicators: IndicatorRow[];
  interventions: InterventionRow[];
  campusName: string;
  graduationDate: string | null;
  pathway?: StudentPathwayData;
  credentialProgress: CredentialProgressItem[];
  wblRecords: WorkBasedLearningRow[];
  from?: string;
}

export const PathwaysStudentProfile = ({
  student,
  indicators,
  interventions,
  campusName,
  graduationDate,
  pathway,
  credentialProgress,
  wblRecords,
  from,
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

      {/* Header (includes alert banner) */}
      <StudentHeader
        student={student}
        campusName={campusName}
        graduationDate={graduationDate}
      />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pathway + Credential Progress + WBL + Indicator grid (wide) */}
        <div className="lg:col-span-2 space-y-6">
          <CareerPathwaySection pathway={pathway ?? null} />
          <CredentialProgressSection items={credentialProgress} />
          <WorkBasedLearningSection records={wblRecords} />
          <CCMRIndicatorGrid indicators={indicators} />
        </div>

        {/* Right: Nearest pathway + interventions + metadata */}
        <div className="space-y-6">
          <NearestPathwaySummary student={student} indicators={indicators} />
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
