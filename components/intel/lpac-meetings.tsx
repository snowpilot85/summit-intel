"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { 
  Calendar,
  AlertCircle,
  Clock,
  Search,
  ChevronDown,
  Check,
  FileText,
  Download,
} from "lucide-react";

/* ============================================
   LPAC Meetings Page
   Summit Intel - Meeting Management
   ============================================ */

// ============================================
// TYPES
// ============================================

type MeetingType = "Initial" | "Annual Review" | "Reclassification" | "Monitoring Y1" | "Monitoring Y2" | "EOY Review";
type MeetingStatus = "Unscheduled" | "Scheduled" | "Open" | "Finalized" | "Overdue";

interface Meeting {
  id: string;
  studentName: string;
  studentId: string;
  school: string;
  grade: number;
  meetingType: MeetingType;
  status: MeetingStatus;
  deadline: string | null;
  daysOverdue?: number;
  signatures: {
    current: number;
    required: number;
  };
}

// ============================================
// MOCK DATA
// ============================================

const mockMeetings: Meeting[] = [
  {
    id: "m1",
    studentName: "Mia Carmen Ramirez",
    studentId: "155196",
    school: "Edinburg North H S",
    grade: 10,
    meetingType: "EOY Review",
    status: "Scheduled",
    deadline: "Jun 15, 2025",
    signatures: { current: 0, required: 4 },
  },
  {
    id: "m2",
    studentName: "Pedro Alvarez",
    studentId: "155301",
    school: "Edinburg North H S",
    grade: 3,
    meetingType: "Initial",
    status: "Overdue",
    deadline: "Oct 8, 2025",
    daysOverdue: 3,
    signatures: { current: 0, required: 4 },
  },
  {
    id: "m3",
    studentName: "Ana Lopez",
    studentId: "155215",
    school: "Edinburg North H S",
    grade: 9,
    meetingType: "Annual Review",
    status: "Open",
    deadline: "Jun 15, 2025",
    signatures: { current: 2, required: 4 },
  },
  {
    id: "m4",
    studentName: "Jose Garcia",
    studentId: "155201",
    school: "Edinburg North H S",
    grade: 11,
    meetingType: "Reclassification",
    status: "Finalized",
    deadline: null,
    signatures: { current: 4, required: 4 },
  },
  {
    id: "m5",
    studentName: "Carlos Martinez",
    studentId: "155220",
    school: "Edinburg H S",
    grade: 12,
    meetingType: "Reclassification",
    status: "Finalized",
    deadline: null,
    signatures: { current: 4, required: 4 },
  },
  {
    id: "m6",
    studentName: "Sofia Rodriguez",
    studentId: "155228",
    school: "Edinburg H S",
    grade: 10,
    meetingType: "EOY Review",
    status: "Scheduled",
    deadline: "Jun 15, 2025",
    signatures: { current: 0, required: 4 },
  },
  {
    id: "m7",
    studentName: "Maria Santos",
    studentId: "155245",
    school: "Edinburg North H S",
    grade: 7,
    meetingType: "Monitoring Y1",
    status: "Finalized",
    deadline: null,
    signatures: { current: 3, required: 3 },
  },
  {
    id: "m8",
    studentName: "Luis Hernandez",
    studentId: "155260",
    school: "Villarreal El",
    grade: 2,
    meetingType: "Initial",
    status: "Open",
    deadline: "Oct 12, 2025",
    signatures: { current: 1, required: 4 },
  },
];

// ============================================
// METRIC CARD
// ============================================

interface MetricCardProps {
  label: string;
  value: number;
  badge?: {
    text: string;
    variant: "warning" | "error" | "neutral";
  };
  icon: React.ReactNode;
}

const MetricCard = ({ label, value, badge, icon }: MetricCardProps) => {
  const badgeColors = {
    warning: "bg-warning-light text-warning-dark",
    error: "bg-error-light text-error-dark",
    neutral: "bg-neutral-100 text-neutral-600",
  };

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-[13px] font-medium text-neutral-500 mb-1">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] font-semibold text-neutral-900 leading-none">
              {value.toLocaleString()}
            </span>
            {badge && (
              <span className={cn(
                "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full",
                badgeColors[badge.variant]
              )}>
                {badge.text}
              </span>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-500">
          {icon}
        </div>
      </div>
    </div>
  );
};

// ============================================
// STATUS BADGE
// ============================================

const StatusBadge = ({ status }: { status: MeetingStatus }) => {
  const styles = {
    Unscheduled: "bg-neutral-100 text-neutral-600",
    Scheduled: "bg-warning-light text-warning-dark",
    Open: "bg-info-light text-info-dark",
    Finalized: "bg-teal-100 text-teal-700",
    Overdue: "bg-error-light text-error-dark",
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-1 text-[12px] font-medium rounded-full",
      styles[status]
    )}>
      {status}
    </span>
  );
};

// ============================================
// FILTER BAR
// ============================================

type MeetingFilter = "All" | "Initial" | "Annual Review" | "Reclassification" | "Monitoring";

interface FilterBarProps {
  activeFilter: MeetingFilter;
  onFilterChange: (filter: MeetingFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const FilterBar = ({ activeFilter, onFilterChange, searchQuery, onSearchChange }: FilterBarProps) => {
  const filters: MeetingFilter[] = ["All", "Initial", "Annual Review", "Reclassification", "Monitoring"];

  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
      {/* Toggle buttons */}
      <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={cn(
              "px-3 py-1.5 text-[13px] font-medium rounded-md transition-colors",
              activeFilter === filter
                ? "bg-neutral-0 text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            )}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Dropdowns */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <select className="appearance-none bg-neutral-0 border border-neutral-200 rounded-md pl-3 pr-8 py-2 text-[13px] text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option>All Schools</option>
            <option>Edinburg North H S</option>
            <option>Edinburg H S</option>
            <option>Villarreal El</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>

        <div className="relative">
          <select className="appearance-none bg-neutral-0 border border-neutral-200 rounded-md pl-3 pr-8 py-2 text-[13px] text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            <option>All Statuses</option>
            <option>Unscheduled</option>
            <option>Scheduled</option>
            <option>Open</option>
            <option>Finalized</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>

        <div className="relative">
          <input
            type="date"
            className="bg-neutral-0 border border-neutral-200 rounded-md px-3 py-2 text-[13px] text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Search */}
      <div className="relative flex-1 max-w-xs ml-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search by student name..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-[13px] bg-neutral-0 border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};

// ============================================
// MEETING TABLE
// ============================================

interface MeetingTableProps {
  meetings: Meeting[];
  selectedIds: string[];
  onSelectChange: (ids: string[]) => void;
}

const MeetingTable = ({ meetings, selectedIds, onSelectChange }: MeetingTableProps) => {
  const allSelected = meetings.length > 0 && selectedIds.length === meetings.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < meetings.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectChange([]);
    } else {
      onSelectChange(meetings.map((m) => m.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  return (
    <div className="overflow-x-auto border border-neutral-200 rounded-lg bg-neutral-0">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50">
            <th className="px-4 py-3 text-left w-10">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
              />
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-600 uppercase tracking-wide">
              Student
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-600 uppercase tracking-wide">
              School
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-600 uppercase tracking-wide">
              Grade
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-600 uppercase tracking-wide">
              Meeting Type
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-600 uppercase tracking-wide">
              Status
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-600 uppercase tracking-wide">
              Deadline
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-600 uppercase tracking-wide">
              Signatures
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold text-neutral-600 uppercase tracking-wide">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {meetings.map((meeting) => (
            <tr 
              key={meeting.id}
              className={cn(
                "border-b border-neutral-100 hover:bg-neutral-50 transition-colors",
                meeting.status === "Overdue" && "border-l-4 border-l-error"
              )}
            >
              <td className="px-4 py-4">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(meeting.id)}
                  onChange={() => handleSelectOne(meeting.id)}
                  className="w-4 h-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                />
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[12px] font-semibold text-primary-700">
                      {meeting.studentName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <Link 
                      href={`/intel/students/${meeting.studentId}`}
                      className="text-[14px] font-medium text-neutral-900 hover:text-primary-500 transition-colors"
                    >
                      {meeting.studentName}
                    </Link>
                    <p className="text-[12px] text-neutral-500">#{meeting.studentId}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-[13px] text-neutral-700">{meeting.school}</td>
              <td className="px-4 py-4 text-[13px] text-neutral-700">{meeting.grade}</td>
              <td className="px-4 py-4 text-[13px] text-neutral-700">{meeting.meetingType}</td>
              <td className="px-4 py-4">
                <StatusBadge status={meeting.status} />
              </td>
              <td className="px-4 py-4">
                {meeting.deadline ? (
                  <div>
                    <span className={cn(
                      "text-[13px]",
                      meeting.status === "Overdue" ? "text-error font-medium" : "text-neutral-700"
                    )}>
                      {meeting.deadline}
                    </span>
                    {meeting.daysOverdue && (
                      <p className="text-[11px] text-error font-medium">{meeting.daysOverdue} days overdue</p>
                    )}
                  </div>
                ) : (
                  <span className="text-[13px] text-neutral-400">—</span>
                )}
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-1">
                  <span className={cn(
                    "text-[13px] font-medium",
                    meeting.signatures.current === meeting.signatures.required
                      ? "text-teal-600"
                      : "text-neutral-700"
                  )}>
                    {meeting.signatures.current}/{meeting.signatures.required}
                  </span>
                  {meeting.signatures.current === meeting.signatures.required && (
                    <Check className="w-4 h-4 text-teal-600" />
                  )}
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  {meeting.status === "Finalized" ? (
                    <>
                      <Link 
                        href={`/intel/meetings/${meeting.id}`}
                        className="text-[13px] font-medium text-primary-500 hover:text-primary-600"
                      >
                        View
                      </Link>
                      <span className="text-neutral-300">·</span>
                      <Link 
                        href="#"
                        className="text-[13px] font-medium text-primary-500 hover:text-primary-600"
                      >
                        Report
                      </Link>
                    </>
                  ) : meeting.status === "Overdue" ? (
                    <>
                      <Link 
                        href={`/intel/meetings/${meeting.id}`}
                        className="text-[13px] font-medium text-primary-500 hover:text-primary-600"
                      >
                        Open
                      </Link>
                      <span className="text-neutral-300">·</span>
                      <span className="text-[13px] font-medium text-error">Urgent</span>
                    </>
                  ) : meeting.status === "Open" ? (
                    <>
                      <Link 
                        href={`/intel/meetings/${meeting.id}`}
                        className="text-[13px] font-medium text-primary-500 hover:text-primary-600"
                      >
                        Continue
                      </Link>
                      <span className="text-neutral-300">·</span>
                      <Link 
                        href={`/intel/meetings/${meeting.id}`}
                        className="text-[13px] font-medium text-primary-500 hover:text-primary-600"
                      >
                        View
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link 
                        href={`/intel/meetings/${meeting.id}`}
                        className="text-[13px] font-medium text-primary-500 hover:text-primary-600"
                      >
                        Open
                      </Link>
                      <span className="text-neutral-300">·</span>
                      <Link 
                        href={`/intel/meetings/${meeting.id}`}
                        className="text-[13px] font-medium text-primary-500 hover:text-primary-600"
                      >
                        View
                      </Link>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================
// BULK ACTIONS BAR
// ============================================

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
}

const BulkActionsBar = ({ selectedCount, onClear }: BulkActionsBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 lg:left-[200px] bg-neutral-900 text-neutral-0 py-3 px-6 flex items-center justify-between z-40">
      <div className="flex items-center gap-4">
        <span className="text-[14px] font-medium">
          {selectedCount} meeting{selectedCount !== 1 ? "s" : ""} selected
        </span>
        <button
          onClick={onClear}
          className="text-[13px] text-neutral-400 hover:text-neutral-0 transition-colors"
        >
          Clear selection
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button className="px-4 py-2 text-[13px] font-medium bg-neutral-700 hover:bg-neutral-600 rounded-md transition-colors">
          Schedule selected
        </button>
        <button className="px-4 py-2 text-[13px] font-medium bg-neutral-700 hover:bg-neutral-600 rounded-md transition-colors flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Generate reports
        </button>
        <button className="px-4 py-2 text-[13px] font-medium bg-neutral-700 hover:bg-neutral-600 rounded-md transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export to spreadsheet
        </button>
      </div>
    </div>
  );
};

// ============================================
// EMPTY STATE
// ============================================

interface EmptyStateProps {
  filterType: MeetingFilter;
}

const EmptyState = ({ filterType }: EmptyStateProps) => {
  if (filterType !== "Reclassification") return null;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 bg-neutral-0 border border-neutral-200 rounded-lg">
      <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
        <Calendar className="w-8 h-8 text-neutral-400" />
      </div>
      <h3 className="text-[18px] font-semibold text-neutral-900 mb-2">
        No reclassification meetings found
      </h3>
      <p className="text-[14px] text-neutral-500 text-center max-w-md mb-6">
        847 students are eligible for reclassification — would you like to bulk-schedule reclassification reviews?
      </p>
      <button className="px-6 py-2.5 bg-primary-500 text-neutral-0 text-[14px] font-medium rounded-md hover:bg-primary-600 transition-colors">
        Schedule all eligible
      </button>
    </div>
  );
};

// ============================================
// MAIN LPAC MEETINGS PAGE
// ============================================

export const LPACMeetings = () => {
  const [activeFilter, setActiveFilter] = React.useState<MeetingFilter>("All");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Filter meetings based on active filter and search
  const filteredMeetings = React.useMemo(() => {
    let filtered = mockMeetings;

    if (activeFilter !== "All") {
      if (activeFilter === "Monitoring") {
        filtered = filtered.filter((m) => 
          m.meetingType === "Monitoring Y1" || m.meetingType === "Monitoring Y2"
        );
      } else if (activeFilter === "Initial") {
        filtered = filtered.filter((m) => m.meetingType === "Initial");
      } else if (activeFilter === "Annual Review") {
        filtered = filtered.filter((m) => 
          m.meetingType === "Annual Review" || m.meetingType === "EOY Review"
        );
      } else if (activeFilter === "Reclassification") {
        filtered = filtered.filter((m) => m.meetingType === "Reclassification");
      }
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((m) =>
        m.studentName.toLowerCase().includes(query) ||
        m.studentId.includes(query)
      );
    }

    return filtered;
  }, [activeFilter, searchQuery]);

  // Show empty state for Reclassification when no results
  const showEmptyState = activeFilter === "Reclassification" && filteredMeetings.length === 0;

  return (
    <div className="space-y-6 pb-20">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Meetings this year"
          value={15525}
          icon={<Calendar className="w-5 h-5" />}
        />
        <MetricCard
          label="Pending action"
          value={6191}
          badge={{ text: "NEEDS REVIEW", variant: "warning" }}
          icon={<Clock className="w-5 h-5" />}
        />
        <MetricCard
          label="Overdue"
          value={23}
          badge={{ text: "OVERDUE", variant: "error" }}
          icon={<AlertCircle className="w-5 h-5" />}
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Meeting Table or Empty State */}
      {showEmptyState ? (
        <EmptyState filterType={activeFilter} />
      ) : (
        <MeetingTable
          meetings={filteredMeetings}
          selectedIds={selectedIds}
          onSelectChange={setSelectedIds}
        />
      )}

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
      />
    </div>
  );
};
