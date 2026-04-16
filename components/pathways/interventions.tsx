"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  AlertCircle,
  Award,
  BookOpen,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  EyeOff,
  Eye,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  updateInterventionStatus,
  updateInterventionNotes,
  refreshRecommendations,
} from "@/app/pathways/interventions/actions";
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

const PAGE_SIZE = 20;

const isIBC = (t: string | null) => t === "ibc";
const isCollegePrep = (t: string | null) =>
  t === "college_prep_math" || t === "college_prep_ela" || t === "college_prep";
const isTSI = (t: string | null) =>
  t === "tsi_reading" || t === "tsi_math" || t === "tsi";

const PATHWAY_LABEL: Record<string, string> = {
  ibc: "IBC",
  tsi_reading: "TSI Reading",
  tsi_math: "TSI Math",
  tsi: "TSI",
  college_prep_ela: "College Prep ELA",
  college_prep_math: "College Prep Math",
  college_prep: "College Prep",
  dual_credit: "Dual Credit",
  dual_credit_ela: "Dual Credit ELA",
  dual_credit_math: "Dual Credit Math",
};

// ============================================
// HELPERS
// ============================================

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ============================================
// TYPES
// ============================================

type PathwayFilter = "all" | "ibc" | "college_prep" | "tsi";

interface Filters {
  campusId: string;
  pathway: PathwayFilter;
  status: InterventionStatus | "all";
  search: string;
}

// ============================================
// CCMR STATUS BADGE
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
  const impactPct = seniorCount > 0 ? Math.round((count / seniorCount) * 100) : 0;

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
          <Icon className="w-5 h-5 text-neutral-0" />
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
  showDismissed: boolean;
  onChange: (f: Filters) => void;
  onToggleDismissed: () => void;
}

const FilterBar = ({
  filters,
  campuses,
  showDismissed,
  onChange,
  onToggleDismissed,
}: FilterBarProps) => {
  const [searchDraft, setSearchDraft] = React.useState(filters.search);

  React.useEffect(() => {
    const t = setTimeout(() => {
      if (searchDraft !== filters.search) onChange({ ...filters, search: searchDraft });
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
              <option key={c.id} value={c.id}>{c.name}</option>
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
            onChange={(e) => set({ status: e.target.value as InterventionStatus | "all" })}
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
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search by student name..."
            className="w-full bg-neutral-0 border border-neutral-200 rounded-md pl-9 pr-3 py-2 text-[13px] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Show dismissed toggle */}
        <button
          onClick={onToggleDismissed}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-md border text-[13px] font-medium transition-colors",
            showDismissed
              ? "bg-neutral-100 border-neutral-300 text-neutral-700"
              : "border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
          )}
        >
          {showDismissed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {showDismissed ? "Hiding dismissed" : "Show dismissed"}
        </button>
      </div>
    </div>
  );
};

// ============================================
// NOTES EDITOR
// ============================================

interface NotesEditorProps {
  interventionId: string;
  initialNotes: string | null;
  onSave: (id: string, notes: string) => void;
}

const NotesEditor = ({ interventionId, initialNotes, onSave }: NotesEditorProps) => {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(initialNotes ?? "");
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);
  const [saving, setSaving] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSave = async () => {
    if (draft === (initialNotes ?? "")) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await updateInterventionNotes(interventionId, draft);
      onSave(interventionId, draft);
      setSavedAt(new Date());
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setDraft(initialNotes ?? "");
      setEditing(false);
    }
  };

  React.useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  const displayNotes = draft || initialNotes;

  if (editing) {
    return (
      <div className="mt-2">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="Add a note... (Enter to save, Shift+Enter for newline)"
          className="w-full text-[12px] text-neutral-700 border border-teal-400 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-200 resize-none bg-teal-50/30 placeholder:text-neutral-400"
        />
        <div className="flex items-center gap-2 mt-1">
          {saving ? (
            <span className="text-[11px] text-neutral-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving…
            </span>
          ) : (
            <span className="text-[11px] text-neutral-400">Enter to save · Esc to cancel</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="mt-2 flex items-start gap-1.5 w-full text-left group"
    >
      <MessageSquare className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 mt-0.5 group-hover:text-teal-500" />
      {displayNotes ? (
        <span className="text-[12px] text-neutral-600 group-hover:text-teal-700 line-clamp-2">
          {displayNotes}
          {savedAt && (
            <span className="ml-1.5 text-[11px] text-neutral-400">
              · saved {savedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
        </span>
      ) : (
        <span className="text-[12px] text-neutral-400 group-hover:text-teal-600 italic">
          Add a note…
        </span>
      )}
    </button>
  );
};

// ============================================
// STATUS ACTION BUTTONS
// ============================================

interface StatusActionsProps {
  status: InterventionStatus;
  onStatusChange: (newStatus: InterventionStatus) => void;
  disabled: boolean;
}

const StatusActions = ({ status, onStatusChange, disabled }: StatusActionsProps) => {
  if (status === "recommended") {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onStatusChange("planned")}
          disabled={disabled}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-600 text-neutral-0 text-[12px] font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Check className="w-3 h-3" />
          Accept
        </button>
        <button
          onClick={() => onStatusChange("dismissed")}
          disabled={disabled}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-neutral-200 text-neutral-500 text-[12px] font-medium hover:border-neutral-300 hover:text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <X className="w-3 h-3" />
          Dismiss
        </button>
      </div>
    );
  }

  if (status === "planned") {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onStatusChange("in_progress")}
          disabled={disabled}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary-500 text-neutral-0 text-[12px] font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Check className="w-3 h-3" />
          Start
        </button>
        <button
          onClick={() => onStatusChange("dismissed")}
          disabled={disabled}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md border border-neutral-200 text-neutral-500 text-[12px] font-medium hover:border-neutral-300 hover:text-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <X className="w-3 h-3" />
          Dismiss
        </button>
      </div>
    );
  }

  if (status === "in_progress") {
    return (
      <button
        onClick={() => onStatusChange("completed")}
        disabled={disabled}
        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-teal-600 text-neutral-0 text-[12px] font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Check className="w-3 h-3" />
        Mark complete
      </button>
    );
  }

  return null;
};

// ============================================
// STATUS PILL
// ============================================

const STATUS_PILL: Record<InterventionStatus, { label: string; className: string }> = {
  recommended: { label: "Recommended", className: "bg-primary-100 text-primary-700" },
  planned: { label: "Planned", className: "bg-amber-100 text-amber-700" },
  in_progress: { label: "In progress", className: "bg-teal-100 text-teal-700" },
  completed: { label: "Completed", className: "bg-neutral-100 text-neutral-500" },
  expired: { label: "Expired", className: "bg-neutral-100 text-neutral-500" },
  dismissed: { label: "Dismissed", className: "bg-neutral-100 text-neutral-400" },
};

const StatusPill = ({ status }: { status: InterventionStatus }) => {
  const { label, className } = STATUS_PILL[status] ?? STATUS_PILL.recommended;
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-medium", className)}>
      {label}
    </span>
  );
};

// ============================================
// INTERVENTION CARD
// ============================================

interface InterventionCardProps {
  intervention: InterventionRow;
  student: StudentRow;
  campusName: string;
  onStatusChange: (id: string, newStatus: InterventionStatus) => void;
  onNotesSaved: (id: string, notes: string) => void;
  isPending: boolean;
}

const InterventionCard = ({
  intervention,
  student,
  campusName,
  onStatusChange,
  onNotesSaved,
  isPending,
}: InterventionCardProps) => {
  const days = intervention.due_date ? daysUntil(intervention.due_date) : null;
  const isUrgent = days !== null && days <= 14;
  const isOverdue = days !== null && days < 0;
  const isDismissed = intervention.status === "dismissed";
  const initials = (student.last_name[0] ?? "") + (student.first_name[0] ?? "");
  const pathwayLabel = intervention.pathway_type
    ? (PATHWAY_LABEL[intervention.pathway_type] ?? intervention.pathway_type)
    : null;

  return (
    <div
      className={cn(
        "bg-neutral-0 border rounded-lg p-4 transition-opacity",
        isDismissed ? "border-neutral-200 opacity-60" : "border-neutral-200",
        isOverdue && !isDismissed && "border-l-4 border-l-error"
      )}
    >
      {/* Card header */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Link href={`/pathways/students/${student.id}?from=interventions`} className="flex-shrink-0">
          <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center hover:ring-2 hover:ring-teal-300 transition-all">
            <span className="text-[12px] font-semibold text-teal-700 uppercase">{initials}</span>
          </div>
        </Link>

        {/* Student info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/pathways/students/${student.id}?from=interventions`}
              className="text-[14px] font-semibold text-neutral-900 hover:text-teal-700 transition-colors"
            >
              {student.last_name}, {student.first_name}
            </Link>
            <CCMRBadge readiness={student.ccmr_readiness} />
            <StatusPill status={intervention.status} />
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            <span className="text-[12px] text-neutral-500">{campusName}</span>
            {pathwayLabel && (
              <>
                <span className="text-neutral-300">·</span>
                <span className="text-[12px] text-neutral-500">{pathwayLabel}</span>
              </>
            )}
            <span className="text-neutral-300">·</span>
            <span className="text-[11px] text-neutral-400">#{student.tsds_id}</span>
          </div>
        </div>

        {/* Due date + priority */}
        <div className="flex-shrink-0 text-right">
          {intervention.due_date && (
            <div className="flex items-center gap-1 justify-end">
              {isUrgent && (
                <CalendarClock
                  className={cn(
                    "w-3.5 h-3.5",
                    isOverdue ? "text-error" : "text-warning-dark"
                  )}
                />
              )}
              <span
                className={cn(
                  "text-[12px] font-medium",
                  isOverdue
                    ? "text-error"
                    : isUrgent
                    ? "text-warning-dark"
                    : "text-neutral-500"
                )}
              >
                {isOverdue
                  ? `${Math.abs(days!)}d overdue`
                  : `Due ${formatShortDate(intervention.due_date)}`}
              </span>
            </div>
          )}
          {intervention.priority && (
            <span className="text-[11px] text-neutral-400">
              Priority {intervention.priority}
            </span>
          )}
        </div>
      </div>

      {/* Intervention content */}
      <div className="mt-3 pl-12">
        <p className="text-[13px] font-medium text-neutral-900">{intervention.title}</p>
        {intervention.description && (
          <p className="text-[12px] text-neutral-500 mt-0.5 leading-relaxed">
            {intervention.description}
          </p>
        )}

        {/* Notes editor */}
        {!isDismissed && (
          <NotesEditor
            interventionId={intervention.id}
            initialNotes={intervention.notes}
            onSave={onNotesSaved}
          />
        )}

        {/* Action buttons */}
        {!isDismissed && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
            <Link
              href={`/pathways/students/${student.id}?from=interventions`}
              className="text-[12px] font-medium text-primary-500 hover:text-primary-600 transition-colors"
            >
              View student profile →
            </Link>
            <StatusActions
              status={intervention.status}
              onStatusChange={(newStatus) => onStatusChange(intervention.id, newStatus)}
              disabled={isPending}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// INTERVENTION LIST
// ============================================

interface InterventionListProps {
  rows: { intervention: InterventionRow; student: StudentRow; campusName: string }[];
  onStatusChange: (id: string, newStatus: InterventionStatus) => void;
  onNotesSaved: (id: string, notes: string) => void;
  isPending: boolean;
}

const InterventionList = ({
  rows,
  onStatusChange,
  onNotesSaved,
  isPending,
}: InterventionListProps) => {
  const [page, setPage] = React.useState(1);

  React.useEffect(() => setPage(1), [rows.length]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (rows.length === 0) {
    return (
      <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-12 text-center">
        <p className="text-[14px] font-medium text-neutral-600">
          No interventions match the current filters.
        </p>
        <p className="text-[13px] text-neutral-400 mt-1">
          Try adjusting campus, pathway, or status filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pageRows.map(({ intervention, student, campusName }) => (
        <InterventionCard
          key={intervention.id}
          intervention={intervention}
          student={student}
          campusName={campusName}
          onStatusChange={onStatusChange}
          onNotesSaved={onNotesSaved}
          isPending={isPending}
        />
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-[13px] text-neutral-500">
            Showing{" "}
            <span className="font-medium">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)}
            </span>{" "}
            of <span className="font-medium">{rows.length}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded border border-neutral-200 text-[13px] hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Prev
            </button>
            <span className="text-[13px] text-neutral-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded border border-neutral-200 text-[13px] hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
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
  const [showDismissed, setShowDismissed] = React.useState(false);
  const [pathwayFilter, setPathwayFilter] = React.useState<PathwayFilter>("all");
  const [filters, setFilters] = React.useState<Filters>({
    campusId: "",
    pathway: "all",
    status: "all",
    search: "",
  });
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [refreshMsg, setRefreshMsg] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  const handlePathwayCard = (p: PathwayFilter) => {
    setPathwayFilter(p);
    setFilters((f) => ({ ...f, pathway: p }));
  };

  const handleFilterChange = (f: Filters) => {
    setFilters(f);
    setPathwayFilter(f.pathway);
  };

  // Lookup maps
  const studentById = React.useMemo(
    () => new Map(students.map((s) => [s.id, s])),
    [students]
  );
  const campusById = React.useMemo(
    () => new Map(campuses.map((c) => [c.id, c.name])),
    [campuses]
  );

  // Summary counts (only active interventions)
  const active = interventions.filter(
    (i) => i.status === "recommended" || i.status === "planned" || i.status === "in_progress"
  );
  const ibcCount         = active.filter((i) => isIBC(i.pathway_type)).length;
  const collegePrepCount = active.filter((i) => isCollegePrep(i.pathway_type)).length;
  const tsiCount         = active.filter((i) => isTSI(i.pathway_type)).length;

  const atRiskCount = [...new Set(
    active
      .filter((i) => studentById.get(i.student_id)?.ccmr_readiness === "at_risk")
      .map((i) => i.student_id)
  )].length;

  // Filtered rows
  const filteredRows = React.useMemo(() => {
    const searchLower = filters.search.toLowerCase();

    return interventions
      .filter((iv) => {
        const student = studentById.get(iv.student_id);
        if (!student) return false;

        // Hide dismissed unless toggle is on
        if (iv.status === "dismissed" && !showDismissed) return false;

        if (filters.campusId && student.campus_id !== filters.campusId) return false;
        if (filters.status !== "all" && iv.status !== filters.status) return false;

        if (filters.pathway !== "all") {
          const pt = iv.pathway_type;
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
        // Dismissed to the end
        if (a.status === "dismissed" && b.status !== "dismissed") return 1;
        if (b.status === "dismissed" && a.status !== "dismissed") return -1;
        const pa = a.priority ?? 99;
        const pb = b.priority ?? 99;
        if (pa !== pb) return pa - pb;
        const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return da - db;
      })
      .map((iv) => ({
        intervention: iv,
        student: studentById.get(iv.student_id)!,
        campusName: campusById.get(studentById.get(iv.student_id)?.campus_id ?? "") ?? "—",
      }));
  }, [interventions, filters, showDismissed, studentById, campusById]);

  const handleStatusChange = (id: string, newStatus: InterventionStatus) => {
    // Optimistic update
    setInterventions((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: newStatus } : i
      )
    );

    startTransition(async () => {
      try {
        await updateInterventionStatus(id, newStatus);
      } catch {
        setInterventions(initialInterventions);
      }
    });
  };

  const handleNotesSaved = (id: string, notes: string) => {
    setInterventions((prev) =>
      prev.map((i) => (i.id === id ? { ...i, notes: notes || null } : i))
    );
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshMsg(null);
    try {
      const { count } = await refreshRecommendations();
      setRefreshMsg(`Generated ${count} new recommendation${count !== 1 ? "s" : ""}.`);
      // Reload the page to show new interventions
      window.location.reload();
    } catch (e) {
      setRefreshMsg("Failed to refresh. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const dismissedCount = interventions.filter((i) => i.status === "dismissed").length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-neutral-900">Interventions</h1>
          <p className="text-[14px] text-neutral-600 mt-1">
            Counselor action list — at-risk seniors grouped by CCMR pathway
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {refreshMsg && (
            <span className="text-[13px] text-neutral-500">{refreshMsg}</span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-neutral-0 border border-neutral-200 text-[13px] font-medium text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
            Refresh recommendations
          </button>
        </div>
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
      <FilterBar
        campuses={campuses}
        filters={filters}
        showDismissed={showDismissed}
        onChange={handleFilterChange}
        onToggleDismissed={() => setShowDismissed((v) => !v)}
      />

      {/* Dismissed count hint */}
      {dismissedCount > 0 && !showDismissed && (
        <p className="text-[12px] text-neutral-400 -mt-3">
          {dismissedCount} dismissed intervention{dismissedCount !== 1 ? "s" : ""} hidden.{" "}
          <button
            onClick={() => setShowDismissed(true)}
            className="underline hover:text-neutral-600"
          >
            Show
          </button>
        </p>
      )}

      {/* Intervention list */}
      <div className={cn("transition-opacity duration-150", isPending && "opacity-60")}>
        <InterventionList
          rows={filteredRows}
          onStatusChange={handleStatusChange}
          onNotesSaved={handleNotesSaved}
          isPending={isPending}
        />
      </div>
    </div>
  );
};

export default InterventionsPage;
