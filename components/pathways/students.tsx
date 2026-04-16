"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Minus,
  CheckCircle2,
  AlertCircle,
  Award,
} from "lucide-react";
import { fetchStudentPage, type StudentFilters, type StudentPathwayEntry } from "@/app/pathways/students/actions";
import type { CampusRow, CCMRReadiness, IndicatorRow, IndicatorType, StudentRow } from "@/types/database";
import type { CareerClusterOption } from "@/app/pathways/students/page";

/* ============================================
   Summit Pathways Students Page
   ============================================ */

const PAGE_SIZE = 50;

// ============================================
// INDICATOR LABEL MAP
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
  ap_exam: "AP Exam",
  ib_exam: "IB Exam",
  dual_credit_ela: "Dual Credit ELA",
  dual_credit_math: "Dual Credit Math",
  dual_credit_any: "Dual Credit",
  onramps: "OnRamps",
  ibc: "IBC",
  associate_degree: "Assoc. Degree",
  level_i_ii_certificate: "Certificate",
  military_enlistment: "Military",
  iep_completion: "IEP Completion",
  sped_advanced_degree: "SpEd Degree",
};

function indicatorLabel(type: IndicatorType): string {
  return INDICATOR_LABELS[type] ?? type;
}

// ============================================
// DAYS LEFT
// ============================================

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86_400_000));
}

// ============================================
// STATUS BADGE
// ============================================

const STATUS_CONFIG: Record<CCMRReadiness, { label: string; icon: React.ElementType; className: string }> = {
  met: { label: "Met", icon: CheckCircle2, className: "bg-teal-100 text-teal-700" },
  on_track: { label: "On track", icon: Clock, className: "bg-primary-100 text-primary-700" },
  almost: { label: "Almost", icon: AlertCircle, className: "bg-warning-light text-warning-dark" },
  at_risk: { label: "At risk", icon: X, className: "bg-error-light text-error-dark" },
  too_early: { label: "Too early", icon: Minus, className: "bg-neutral-100 text-neutral-500" },
};

const StatusBadge = ({ status }: { status: CCMRReadiness }) => {
  const { label, icon: Icon, className } = STATUS_CONFIG[status] ?? STATUS_CONFIG.too_early;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium", className)}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
};

// ============================================
// CREDENTIAL STATUS BADGE
// ============================================

type CredentialStatusValue = "earned" | "in_progress" | "not_started";

const CREDENTIAL_STATUS_CONFIG: Record<
  CredentialStatusValue,
  { label: string; icon: React.ElementType; className: string }
> = {
  earned: { label: "Earned", icon: Award, className: "bg-teal-50 text-teal-800" },
  in_progress: { label: "In Progress", icon: Clock, className: "bg-primary-100 text-primary-700" },
  not_started: { label: "Not Started", icon: Minus, className: "bg-neutral-100 text-neutral-500" },
};

function deriveCredentialStatus(entry: StudentPathwayEntry | undefined): CredentialStatusValue {
  if (!entry) return "not_started";
  if (entry.credential_earned) return "earned";
  if (entry.enrollment_status === "enrolled") return "in_progress";
  return "not_started";
}

const CredentialStatusBadge = ({ entry }: { entry: StudentPathwayEntry | undefined }) => {
  const status = deriveCredentialStatus(entry);
  const { label, icon: Icon, className } = CREDENTIAL_STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium", className)}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
};

// ============================================
// INDICATOR PILL
// ============================================

const IndicatorPill = ({ label, inProgress }: { label: string; inProgress?: boolean }) => (
  <span
    className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium",
      inProgress
        ? "bg-primary-50 text-primary-600 border border-primary-200"
        : "bg-teal-50 text-teal-700"
    )}
  >
    {label}
    {inProgress && <span className="text-[10px] ml-1">(in prog)</span>}
  </span>
);

// ============================================
// SUBGROUP TOGGLE
// ============================================

const SubgroupToggle = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "px-3 py-2 rounded-md text-[13px] font-medium border transition-colors",
      active
        ? "bg-teal-600 text-neutral-0 border-teal-600"
        : "bg-neutral-0 text-neutral-700 border-neutral-200 hover:bg-neutral-50"
    )}
  >
    {label}
  </button>
);

// ============================================
// FILTER BAR
// ============================================

interface FilterBarProps {
  campuses: CampusRow[];
  careerClusters: CareerClusterOption[];
  filters: StudentFilters;
  onChange: (f: StudentFilters) => void;
}

const FilterBar = ({ campuses, careerClusters, filters, onChange }: FilterBarProps) => {
  const [searchDraft, setSearchDraft] = React.useState(filters.search ?? "");

  // Debounce search
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (searchDraft !== (filters.search ?? "")) {
        onChange({ ...filters, search: searchDraft || undefined, page: 1 });
      }
    }, 350);
    return () => clearTimeout(t);
  }, [searchDraft]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (partial: Partial<StudentFilters>) =>
    onChange({ ...filters, ...partial, page: 1 });

  const toggleSubgroup = (key: keyof Pick<StudentFilters, "isEb" | "isEconDisadvantaged" | "isSpecialEd" | "is504">) =>
    set({ [key]: filters[key] ? undefined : true });

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-4 space-y-3">
      {/* Row 1: Campus, Grade, CCMR Status, Search */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Campus */}
        <div className="relative">
          <select
            value={filters.campusId ?? ""}
            onChange={(e) => set({ campusId: e.target.value || undefined })}
            className="appearance-none bg-neutral-0 border border-neutral-200 rounded-md px-3 py-2 pr-8 text-[13px] font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All campuses</option>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>

        {/* Grade */}
        <div className="relative">
          <select
            value={filters.gradeLevel ?? ""}
            onChange={(e) => set({ gradeLevel: e.target.value ? Number(e.target.value) : undefined })}
            className="appearance-none bg-neutral-0 border border-neutral-200 rounded-md px-3 py-2 pr-8 text-[13px] font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All grades</option>
            <option value="9">Grade 9</option>
            <option value="10">Grade 10</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>

        {/* CCMR Status */}
        <div className="relative">
          <select
            value={filters.readiness ?? ""}
            onChange={(e) => set({ readiness: (e.target.value as CCMRReadiness) || undefined })}
            className="appearance-none bg-neutral-0 border border-neutral-200 rounded-md px-3 py-2 pr-8 text-[13px] font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All statuses</option>
            <option value="met">Met</option>
            <option value="on_track">On track</option>
            <option value="almost">Almost</option>
            <option value="at_risk">At risk</option>
            <option value="too_early">Too early</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search by name or TSDS ID..."
            className="w-full bg-neutral-0 border border-neutral-200 rounded-md pl-9 pr-3 py-2 text-[13px] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Row 2: CTE pathway filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Career Cluster */}
        <div className="relative">
          <select
            value={filters.clusterCode ?? ""}
            onChange={(e) => set({ clusterCode: e.target.value || undefined })}
            className="appearance-none bg-neutral-0 border border-neutral-200 rounded-md px-3 py-2 pr-8 text-[13px] font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All clusters</option>
            {careerClusters.map((cl) => (
              <option key={cl.id} value={cl.code}>
                {cl.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>

        {/* Credential Status */}
        <div className="relative">
          <select
            value={filters.credentialStatus ?? ""}
            onChange={(e) =>
              set({
                credentialStatus: (e.target.value as StudentFilters["credentialStatus"]) || undefined,
              })
            }
            className="appearance-none bg-neutral-0 border border-neutral-200 rounded-md px-3 py-2 pr-8 text-[13px] font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All credential statuses</option>
            <option value="earned">Earned</option>
            <option value="in_progress">In Progress</option>
            <option value="not_started">Not Started</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {/* Row 3: Subgroup toggles */}
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-neutral-500 font-medium mr-1">Subgroups:</span>
        <SubgroupToggle label="EB" active={!!filters.isEb} onClick={() => toggleSubgroup("isEb")} />
        <SubgroupToggle label="Econ Disadv" active={!!filters.isEconDisadvantaged} onClick={() => toggleSubgroup("isEconDisadvantaged")} />
        <SubgroupToggle label="Special Ed" active={!!filters.isSpecialEd} onClick={() => toggleSubgroup("isSpecialEd")} />
        <SubgroupToggle label="504" active={!!filters.is504} onClick={() => toggleSubgroup("is504")} />
      </div>
    </div>
  );
};

// ============================================
// STUDENT TABLE
// ============================================

interface StudentTableProps {
  students: StudentRow[];
  count: number;
  indicators: IndicatorRow[];
  pathways: StudentPathwayEntry[];
  campuses: CampusRow[];
  page: number;
  graduationDate: string | null;
  onPageChange: (p: number) => void;
}

const StudentTable = ({
  students,
  count,
  indicators,
  pathways,
  campuses,
  page,
  graduationDate,
  onPageChange,
}: StudentTableProps) => {
  const campusById = React.useMemo(
    () => new Map(campuses.map((c) => [c.id, c.name])),
    [campuses]
  );
  // Group indicators by student_id for O(1) lookup
  const indicatorsByStudent = React.useMemo(() => {
    const map = new Map<string, IndicatorRow[]>();
    for (const row of indicators) {
      const list = map.get(row.student_id) ?? [];
      list.push(row);
      map.set(row.student_id, list);
    }
    return map;
  }, [indicators]);
  // First pathway entry by student_id
  const pathwayByStudent = React.useMemo(
    () => new Map(pathways.map((p) => [p.student_id, p])),
    [pathways]
  );

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const showing = students.length;
  const offset = (page - 1) * PAGE_SIZE;

  const daysLeft = graduationDate ? daysUntil(graduationDate) : null;

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="text-left text-[12px] font-semibold text-neutral-700 px-4 py-3">Student</th>
              <th className="text-left text-[12px] font-semibold text-neutral-700 px-4 py-3">Campus</th>
              <th className="text-center text-[12px] font-semibold text-neutral-700 px-4 py-3">Grade</th>
              <th className="text-left text-[12px] font-semibold text-neutral-700 px-4 py-3">CCMR status</th>
              <th className="text-left text-[12px] font-semibold text-neutral-700 px-4 py-3">Indicators met</th>
              <th className="text-left text-[12px] font-semibold text-neutral-700 px-4 py-3">Career cluster</th>
              <th className="text-left text-[12px] font-semibold text-neutral-700 px-4 py-3">Credential status</th>
              <th className="text-left text-[12px] font-semibold text-neutral-700 px-4 py-3">Next credential</th>
              <th className="text-center text-[12px] font-semibold text-neutral-700 px-4 py-3">Days left</th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-[13px] text-neutral-500">
                  No students match the current filters.
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const studentIndicators = indicatorsByStudent.get(student.id) ?? [];
                const metIndicators = studentIndicators.filter((i) => i.status === "met");
                const inProgressIndicators = studentIndicators.filter((i) => i.status === "in_progress");

                const pathwayEntry = pathwayByStudent.get(student.id);

                // Next credential: metadata field first, then first in_progress indicator label
                const nextCredential =
                  (student.metadata?.nearest_pathway as string | undefined) ??
                  (inProgressIndicators[0] ? indicatorLabel(inProgressIndicators[0].indicator_type) : null);

                const isSenior = student.grade_level === 12;

                const initials =
                  (student.last_name[0] ?? "") + (student.first_name[0] ?? "");

                return (
                  <tr
                    key={student.id}
                    className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-[13px] font-semibold text-teal-700 uppercase">
                            {initials}
                          </span>
                        </div>
                        <div>
                          <Link
                            href={`/pathways/students/${student.id}`}
                            className="text-[13px] font-medium text-neutral-900 hover:text-teal-700"
                          >
                            {student.last_name}, {student.first_name}
                          </Link>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] text-neutral-500">#{student.tsds_id}</span>
                            {student.is_eb && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary-100 text-primary-700 rounded">EB</span>
                            )}
                            {student.is_econ_disadvantaged && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-warning-light text-warning-dark rounded">Econ</span>
                            )}
                            {student.is_special_ed && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 rounded">SpEd</span>
                            )}
                            {student.is_504 && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-neutral-100 text-neutral-600 rounded">504</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-[13px] text-neutral-700">
                      {campusById.get(student.campus_id) ?? "—"}
                    </td>

                    <td className="px-4 py-4 text-center text-[13px] font-medium text-neutral-900">
                      {student.grade_level}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={student.ccmr_readiness} />
                    </td>

                    <td className="px-4 py-4">
                      {metIndicators.length > 0 || inProgressIndicators.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {metIndicators.map((ind) => (
                            <IndicatorPill key={ind.id} label={indicatorLabel(ind.indicator_type)} />
                          ))}
                          {inProgressIndicators.map((ind) => (
                            <IndicatorPill key={ind.id} label={indicatorLabel(ind.indicator_type)} inProgress />
                          ))}
                        </div>
                      ) : (
                        <span className="text-[12px] text-neutral-400">None</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-[13px] text-neutral-700">
                      {pathwayEntry?.cluster_name ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-teal-50 text-teal-700">
                          {pathwayEntry.cluster_name}
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <CredentialStatusBadge entry={pathwayEntry} />
                    </td>

                    <td className="px-4 py-4 text-[13px] text-neutral-700">
                      {nextCredential ?? <span className="text-neutral-400">—</span>}
                    </td>

                    <td className="px-4 py-4 text-center">
                      {isSenior && daysLeft !== null ? (
                        <span
                          className={cn(
                            "text-[13px] font-medium",
                            daysLeft <= 60 ? "text-error" : "text-neutral-700"
                          )}
                        >
                          {daysLeft}
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/pathways/students/${student.id}`}
                          className="text-[13px] font-medium text-primary-500 hover:text-primary-600"
                        >
                          View
                        </Link>
                        {student.ccmr_readiness === "at_risk" && (
                          <>
                            <span className="text-neutral-300">·</span>
                            <Link
                              href={`/pathways/students/${student.id}?tab=interventions`}
                              className="text-[13px] font-medium text-error hover:text-error-dark"
                            >
                              Intervene
                            </Link>
                          </>
                        )}
                        {student.ccmr_readiness === "almost" && (
                          <>
                            <span className="text-neutral-300">·</span>
                            <Link
                              href={`/pathways/students/${student.id}?tab=track`}
                              className="text-[13px] font-medium text-warning-dark hover:text-warning"
                            >
                              Track
                            </Link>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="px-4 py-3 border-t border-neutral-200 flex items-center justify-between">
        <p className="text-[13px] text-neutral-600">
          Showing{" "}
          <span className="font-medium">{offset + 1}–{offset + showing}</span>{" "}
          of{" "}
          <span className="font-medium">{count.toLocaleString()}</span> students
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="p-1.5 text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[13px] text-neutral-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

interface PathwaysStudentsProps {
  districtId: string;
  initialStudents: StudentRow[];
  initialCount: number;
  initialIndicators: IndicatorRow[];
  initialPathways: StudentPathwayEntry[];
  campuses: CampusRow[];
  careerClusters: CareerClusterOption[];
  graduationDate: string | null;
}

export const PathwaysStudents = ({
  initialStudents,
  initialCount,
  initialIndicators,
  initialPathways,
  campuses,
  careerClusters,
  graduationDate,
}: PathwaysStudentsProps) => {
  const [filters, setFilters] = React.useState<StudentFilters>({ page: 1 });
  const [students, setStudents] = React.useState(initialStudents);
  const [count, setCount] = React.useState(initialCount);
  const [indicators, setIndicators] = React.useState(initialIndicators);
  const [pathways, setPathways] = React.useState(initialPathways);
  const [isPending, startTransition] = React.useTransition();

  const applyFilters = React.useCallback((newFilters: StudentFilters) => {
    setFilters(newFilters);
    startTransition(async () => {
      try {
        const result = await fetchStudentPage(newFilters);
        setStudents(result.students);
        setCount(result.count);
        setIndicators(result.indicators);
        setPathways(result.pathwaysByStudent);
      } catch (err) {
        console.error("Failed to fetch students:", err);
      }
    });
  }, []);

  const currentPage = filters.page ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold text-neutral-900">Students</h1>
        <p className="text-[14px] text-neutral-600 mt-1">
          Full student-level CCMR tracker for grades 9–12
        </p>
      </div>

      <FilterBar
        campuses={campuses}
        careerClusters={careerClusters}
        filters={filters}
        onChange={applyFilters}
      />

      <div className={cn("transition-opacity duration-150", isPending && "opacity-50")}>
        <StudentTable
          students={students}
          count={count}
          indicators={indicators}
          pathways={pathways}
          campuses={campuses}
          page={currentPage}
          graduationDate={graduationDate}
          onPageChange={(p) => applyFilters({ ...filters, page: p })}
        />
      </div>
    </div>
  );
};
