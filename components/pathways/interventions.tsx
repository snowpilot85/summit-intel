"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Search,
  ChevronDown,
  ChevronLeft,
  Award,
  BookOpen,
  ClipboardList,
  Clock,
  CalendarClock,
} from "lucide-react";
import { markInterventionComplete } from "@/app/pathways/interventions/actions";
import type {
  CampusRow,
  CCMRReadiness,
  InterventionRow,
  InterventionStatus,
  StudentRow,
} from "@/types/database";

/* ============================================
   Interventions Page — Counselor Action List
   ============================================ */

// ============================================
// CONSTANTS
// ============================================

const PAGE_SIZE = 25;

// Pathway type classification helpers
const isIBC = (t: string | null) => t === "ibc";
const isCollegePrep = (t: string | null) => t === "college_prep_math" || t === "college_prep_ela" || t === "college_prep";
const isTSI = (t: string | null) => t === "tsi_reading" || t === "tsi_math" || t === "tsi";

const PATHWAY_LABEL: Record<string, string> = {
  ibc: "IBC",
  tsi_reading: "TSI Reading",
  tsi_math: "TSI Math",
  tsi: "TSI",
  college_prep_ela: "College Prep ELA",
  college_prep_math: "College Prep Math",
  college_prep: "College Prep",
};

// ============================================
// HELPERS
// ============================================

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

// ============================================
// TYPES
// ============================================

type ActiveStatus = "recommended" | "planned" | "in_progress";

type PathwayFilter = "all" | "ibc" | "college_prep" | "tsi";

interface Filters {
  campusId: string;
  pathway: PathwayFilter;
  status: ActiveStatus | "all";
  search: string;
}

// ============================================
// CCMR STATUS BADGE (small)
// ============================================

const READINESS_CONFIG: Record<CCMRReadiness, { label: string; className: string }> = {
  met: { label: "Met", className: "bg-teal-100 text-teal-700" },
  on_track: { label: "On track", className: "bg-primary-100 text-primary-700" },
  almost: { label: "Almost", className: "bg-warning-light text-warning-dark" },
  at_risk: { label: "At risk", className: "bg-error-light text-error-dark" },
  too_early: { label: "Too early", className: "bg-neutral-100 text-neutral-500" },
};

const CCMRBadge = ({ readiness }: { readiness: CCMRReadiness }) => {
  const { label, className } = READINESS_CONFIG[readiness] ?? READINESS_CONFIG.too_early;
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", className)}>
      {label}
    </span>
  );
};

// ============================================
// INTERVENTION STATUS BADGE
// ============================================

const INTERVENTION_STATUS_CONFIG: Record<
  InterventionStatus,
  { label: string; className: string }
> = {
  recommended: { label: "Recommended", className: "bg-primary-100 text-primary-700" },
  planned: { label: "Planned", className: "bg-amber-100 text-amber-700" },
  in_progress: { label: "In progress", className: "bg-teal-100 text-teal-700" },
  completed: { label: "Completed", className: "bg-neutral-100 text-neutral-500" },
  expired: { label: "Expired", className: "bg-neutral-100 text-neutral-500" },
  dismissed: { label: "Dismissed", className: "bg-neutral-100 text-neutral-500" },
};

const InterventionStatusBadge = ({ status }: { status: InterventionStatus }) => {
  const { label, className } =
    INTERVENTION_STATUS_CONFIG[status] ?? INTERVENTION_STATUS_CONFIG.recommended;
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", className)}>
      {label}
    </span>
  );
};

// ============================================
// SUMMARY CARDS
// ============================================

interface SummaryCardProps {
  icon: React.ElementType;
  title: string;
  count: number;
  seniorCount: number;
  subtitle: string;
  pathwayKey: PathwayFilter;
  activeFilter: PathwayFilter;
  onFilter: (p: PathwayFilter) => void;
  iconBg: string;
}

const SummaryCard = ({
  icon: Icon,
  title,
  count,
  seniorCount,
  subtitle,
  pathwayKey,
  activeFilter,
  onFilter,
  iconBg,
}: SummaryCardProps) => {
  const isActive = activeFilter === pathwayKey;
  const impactPct =
    seniorCount > 0 ? Math.round((count / seniorCount) * 100) : 0;

  return (
    <div
      className={cn(
        "bg-neutral-0 border rounded-lg p-5 flex flex-col gap-3 cursor-pointer transition-all",
        isActive
          ? "border-teal-400 ring-2 ring-teal-200 shadow-sm"
          : "border-neutral-200 hover:border-neutral-300"
      )}
      onClick={() => onFilter(isActive ? "all" : pathwayKey)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", iconBg)}>
          <Icon className="w-4.5 h-4.5 text-neutral-0 w-5 h-5" />
        </div>
        <span className="px-2.5 py-1 bg-teal-50 text-teal-700 text-[11px] font-semibold rounded-full border border-teal-200">
          +{impactPct}% CCMR if all pass
        </span>
      </div>

      <div>
        <h3 className="text-[15px] font-semibold text-neutral-900">{title}</h3>
        <p className="text-[12px] text-neutral-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-neutral-100">
        <span className="text-[22px] font-bold text-neutral-900">
          {count}{" "}
          <span className="text-[13px] font-normal text-neutral-500">students</span>
        </span>
        <button
          className={cn(
            "flex items-center gap-1 text-[12px] font-medium transition-colors",
            isActive ? "text-teal-600" : "text-primary-500 hover:text-primary-600"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onFilter(isActive ? "all" : pathwayKey);
          }}
        >
          {isActive ? "Clear filter" : `View ${count} students`}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

// ============================================
// FILTER BAR
// ============================================

interface FilterBarProps {
  filters: Filters;
  campuses: CampusRow[];
  onChange: (f: Filters) => void;
}

const FilterBar = ({ filters, campuses, onChange }: FilterBarProps) => {
  const [searchDraft, setSearchDraft] = React.useState(filters.search);

  React.useEffect(() => {
    const t = setTimeout(() => {
      if (searchDraft !== filters.search) {
        onChange({ ...filters, search: searchDraft });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchDraft]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (partial: Partial<Filters>) => onChange({ ...filters, ...partial });

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* Campus */}
        <div className="relative">
          <select
            value={filters.campusId}
            onChange={(e) => set({ campusId: e.target.value })}
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

        {/* Pathway type */}
        <div className="relative">
          <select
            value={filters.pathway}
            onChange={(e) => set({ pathway: e.target.value as PathwayFilter })}
            className="appearance-none bg-neutral-0 border border-neutral-200 rounded-md px-3 py-2 pr-8 text-[13px] font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All pathways</option>
            <option value="ibc">IBC</option>
            <option value="college_prep">College prep</option>
            <option value="tsi">TSI</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>

        {/* Status */}
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) =>
              set({ status: e.target.value as ActiveStatus | "all" })
            }
            className="appearance-none bg-neutral-0 border border-neutral-200 rounded-md px-3 py-2 pr-8 text-[13px] font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All statuses</option>
            <option value="recommended">Recommended</option>
            <option value="planned">Planned</option>
            <option value="in_progress">In progress</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search by student name..."
            className="w-full bg-neutral-0 border border-neutral-200 rounded-md pl-9 pr-3 py-2 text-[13px] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>
    </div>
  );
};

// ============================================
// INTERVENTIONS TABLE
// ============================================

interface TableRow {
  intervention: InterventionRow;
  student: StudentRow;
  campusName: string;
}

interface InterventionsTableProps {
  rows: TableRow[];
  onMarkComplete: (id: string) => void;
}

const InterventionsTable = ({ rows, onMarkComplete }: InterventionsTableProps) => {
  const [page, setPage] = React.useState(1);

  // Reset page when rows change
  React.useEffect(() => setPage(1), [rows.length]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (rows.length === 0) {
    return (
      <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-12 text-center">
        <ClipboardList className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
        <p className="text-[14px] font-medium text-neutral-600">No interventions match the current filters.</p>
        <p className="text-[13px] text-neutral-400 mt-1">Try adjusting campus, pathway, or status filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="text-left text-[12px] font-semibold text-neutral-700 px-4 py-3">Student</th>
              <th className="text-left text-[12px] font-semibold text-neutral-700 px-4 py-3">Campus</th>
              <th className="text-left text-[12px] font-semibold text-neutral-700 px-4 py-3">CCMR</th>
              <th className="text-left text-[12px] font-semibold text-neutral-700 px-4 py-3">Intervention</th>
              <th className="text-left text-[12px] font-semibold text-neutral-700 px-4 py-3">Pathway</th>
              <th className="text-left text-[12px] font-semibold text-neutral-700 px-4 py-3">Status</th>
              <th className="text-left text-[12px] font-semibold text-neutral-700 px-4 py-3">Due date</th>
              <th className="text-left text-[12px] font-semibold text-neutral-700 px-4 py-3">Assigned to</th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map(({ intervention, student, campusName }) => {
              const days = intervention.due_date ? daysUntil(intervention.due_date) : null;
              const isUrgent = days !== null && days <= 14;
              const isOverdue = days !== null && days < 0;
              const initials = (student.last_name[0] ?? "") + (student.first_name[0] ?? "");

              return (
                <tr
                  key={intervention.id}
                  className={cn(
                    "border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors",
                    isOverdue && "border-l-4 border-l-error"
                  )}
                >
                  {/* Student */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/pathways/students/${student.id}`}
                      className="flex items-center gap-2.5 group"
                    >
                      <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-[11px] font-semibold text-teal-700 uppercase">{initials}</span>
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-neutral-900 group-hover:text-teal-700">
                          {student.last_name}, {student.first_name}
                        </p>
                        <p className="text-[11px] text-neutral-500">#{student.tsds_id}</p>
                      </div>
                    </Link>
                  </td>

                  {/* Campus */}
                  <td className="px-4 py-3 text-[13px] text-neutral-700">{campusName}</td>

                  {/* CCMR status */}
                  <td className="px-4 py-3">
                    <CCMRBadge readiness={student.ccmr_readiness} />
                  </td>

                  {/* Intervention title */}
                  <td className="px-4 py-3">
                    <p className="text-[13px] font-medium text-neutral-900">{intervention.title}</p>
                    {intervention.description && (
                      <p className="text-[11px] text-neutral-500 mt-0.5 max-w-[200px] truncate">
                        {intervention.description}
                      </p>
                    )}
                  </td>

                  {/* Pathway type */}
                  <td className="px-4 py-3">
                    <span className="text-[12px] font-medium text-neutral-700">
                      {intervention.pathway_type
                        ? (PATHWAY_LABEL[intervention.pathway_type] ?? intervention.pathway_type)
                        : "—"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <InterventionStatusBadge status={intervention.status} />
                  </td>

                  {/* Due date */}
                  <td className="px-4 py-3">
                    {intervention.due_date ? (
                      <div className="flex items-center gap-1.5">
                        {isUrgent && (
                          <CalendarClock
                            className={cn(
                              "w-3.5 h-3.5 flex-shrink-0",
                              isOverdue ? "text-error" : "text-warning-dark"
                            )}
                          />
                        )}
                        <span
                          className={cn(
                            "text-[13px] font-medium",
                            isOverdue
                              ? "text-error"
                              : isUrgent
                              ? "text-warning-dark"
                              : "text-neutral-700"
                          )}
                        >
                          {isOverdue
                            ? `${Math.abs(days!)}d overdue`
                            : formatDate(intervention.due_date)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>

                  {/* Assigned to */}
                  <td className="px-4 py-3 text-[13px] text-neutral-600">
                    {intervention.assigned_to ?? <span className="text-neutral-400">—</span>}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/pathways/students/${student.id}`}
                        className="text-[13px] font-medium text-primary-500 hover:text-primary-600"
                      >
                        View
                      </Link>
                      <span className="text-neutral-300">·</span>
                      <button
                        onClick={() => onMarkComplete(intervention.id)}
                        className="text-[13px] font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Done
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-4 py-3 border-t border-neutral-200 flex items-center justify-between bg-neutral-50">
        <p className="text-[13px] text-neutral-600">
          Showing{" "}
          <span className="font-medium">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)}
          </span>{" "}
          of <span className="font-medium">{rows.length}</span> interventions
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1.5 rounded border border-neutral-200 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[13px] text-neutral-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1.5 rounded border border-neutral-200 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
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

export interface InterventionsPageProps {
  interventions: InterventionRow[];
  students: StudentRow[];
  campuses: CampusRow[];
  seniorCount: number;
}

export const InterventionsPage = ({
  interventions: initialInterventions,
  students,
  campuses,
  seniorCount,
}: InterventionsPageProps) => {
  const [interventions, setInterventions] = React.useState(initialInterventions);
  const [pathwayFilter, setPathwayFilter] = React.useState<PathwayFilter>("all");
  const [filters, setFilters] = React.useState<Filters>({
    campusId: "",
    pathway: "all",
    status: "all",
    search: "",
  });
  const [isPending, startTransition] = React.useTransition();

  // Keep pathwayFilter in sync with filters.pathway (cards update the filter bar too)
  const handlePathwayCard = (p: PathwayFilter) => {
    setPathwayFilter(p);
    setFilters((f) => ({ ...f, pathway: p }));
  };

  const handleFilterChange = (f: Filters) => {
    setFilters(f);
    setPathwayFilter(f.pathway);
  };

  // Build lookup maps
  const studentById = React.useMemo(
    () => new Map(students.map((s) => [s.id, s])),
    [students]
  );
  const campusById = React.useMemo(
    () => new Map(campuses.map((c) => [c.id, c.name])),
    [campuses]
  );

  // Summary counts
  const ibcCount = interventions.filter((i) => isIBC(i.pathway_type)).length;
  const collegePrepCount = interventions.filter((i) => isCollegePrep(i.pathway_type)).length;
  const tsiCount = interventions.filter((i) => isTSI(i.pathway_type)).length;
  const atRiskCount = [...new Set(
    interventions
      .filter((i) => {
        const s = studentById.get(i.student_id);
        return s?.ccmr_readiness === "at_risk";
      })
      .map((i) => i.student_id)
  )].length;

  // Apply all filters and sort
  const filteredRows = React.useMemo<TableRow[]>(() => {
    const searchLower = filters.search.toLowerCase();

    return interventions
      .filter((intervention) => {
        const student = studentById.get(intervention.student_id);
        if (!student) return false;

        if (filters.campusId && student.campus_id !== filters.campusId) return false;
        if (filters.status !== "all" && intervention.status !== filters.status) return false;

        if (filters.pathway !== "all") {
          const pt = intervention.pathway_type;
          if (filters.pathway === "ibc" && !isIBC(pt)) return false;
          if (filters.pathway === "college_prep" && !isCollegePrep(pt)) return false;
          if (filters.pathway === "tsi" && !isTSI(pt)) return false;
        }

        if (searchLower) {
          const name = `${student.first_name} ${student.last_name}`.toLowerCase();
          if (!name.includes(searchLower)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Priority ascending (1 = highest), null last
        const pa = a.priority ?? 99;
        const pb = b.priority ?? 99;
        if (pa !== pb) return pa - pb;
        // Then due_date ascending, null last
        const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return da - db;
      })
      .map((intervention) => {
        const student = studentById.get(intervention.student_id)!;
        const campusName = campusById.get(student.campus_id) ?? "—";
        return { intervention, student, campusName };
      });
  }, [interventions, filters, studentById, campusById]);

  const handleMarkComplete = (id: string) => {
    // Optimistic removal
    setInterventions((prev) => prev.filter((i) => i.id !== id));
    startTransition(async () => {
      try {
        await markInterventionComplete(id);
      } catch {
        // Re-add on failure
        setInterventions(initialInterventions);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-[24px] font-semibold text-neutral-900">Interventions</h1>
        <p className="text-[14px] text-neutral-600 mt-1">
          Counselor action list — at-risk students grouped by CCMR pathway
        </p>
      </div>

      {/* Alert banner */}
      {atRiskCount > 0 && (
        <div className="p-4 bg-warning-light border border-warning/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-warning-dark flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[14px] font-semibold text-warning-dark">
              {atRiskCount} at-risk senior{atRiskCount !== 1 ? "s" : ""} with open interventions
            </p>
            <p className="text-[13px] text-warning-dark/80 mt-0.5">
              These students have no CCMR indicator met yet. Click a pathway card to filter.
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          icon={Award}
          title="Industry-based certification"
          count={ibcCount}
          seniorCount={seniorCount}
          subtitle="Students with IBC-aligned CTE enrollment"
          pathwayKey="ibc"
          activeFilter={pathwayFilter}
          onFilter={handlePathwayCard}
          iconBg="bg-teal-600"
        />
        <SummaryCard
          icon={BookOpen}
          title="College prep course completion"
          count={collegePrepCount}
          seniorCount={seniorCount}
          subtitle="Enrolled in college prep ELA or Math"
          pathwayKey="college_prep"
          activeFilter={pathwayFilter}
          onFilter={handlePathwayCard}
          iconBg="bg-primary-500"
        />
        <SummaryCard
          icon={Clock}
          title="TSI assessment"
          count={tsiCount}
          seniorCount={seniorCount}
          subtitle="Seniors who haven't attempted the TSIA"
          pathwayKey="tsi"
          activeFilter={pathwayFilter}
          onFilter={handlePathwayCard}
          iconBg="bg-warning-dark"
        />
      </div>

      {/* Filter bar */}
      <FilterBar campuses={campuses} filters={filters} onChange={handleFilterChange} />

      {/* Table */}
      <div className={cn("transition-opacity duration-150", isPending && "opacity-50")}>
        <InterventionsTable rows={filteredRows} onMarkComplete={handleMarkComplete} />
      </div>
    </div>
  );
};

export default InterventionsPage;
