"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronRight,
  AlertTriangle,
  Clock,
  FileWarning,
  Calendar,
  Bell,
  Building2,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import { DSMBadge, DSMCard, DSMInput, DSMSelect, DSMCheckbox, H2, H3, P2, P4 } from "./index";
import { mockDistricts, kpiSummary, type District } from "@/lib/mock-data";

// ============================================
// KPI CARD
// ============================================

interface KPICardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  status?: "normal" | "warning" | "danger";
  subtitle?: string;
}

const KPICard = ({ title, value, icon, status = "normal", subtitle }: KPICardProps) => {
  const statusStyles = {
    normal: "text-neutral-900",
    warning: "text-warning",
    danger: "text-error",
  };

  return (
    <DSMCard padding="md" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-neutral-500">{icon}</span>
        {status !== "normal" && (
          <DSMBadge variant="status" status={status === "danger" ? "error" : "warning"}>
            {status === "danger" ? "High" : "At Risk"}
          </DSMBadge>
        )}
      </div>
      <div>
        <p className={cn("text-[36px] font-semibold leading-tight", statusStyles[status])}>
          {value}
        </p>
        <p className="text-[13px] text-neutral-500 mt-1">{title}</p>
        {subtitle && <p className="text-[11px] text-neutral-400 mt-0.5">{subtitle}</p>}
      </div>
    </DSMCard>
  );
};

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
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary-50 text-primary-700 text-[13px] font-semibold">
      {phase}
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
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[13px] font-semibold", bgColor[status])}>
      {score}
    </span>
  );
};

// ============================================
// FILTER BAR
// ============================================

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  phaseFilter: string;
  onPhaseChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  alertsOnly: boolean;
  onAlertsOnlyChange: (value: boolean) => void;
}

const FilterBar = ({
  searchQuery,
  onSearchChange,
  phaseFilter,
  onPhaseChange,
  statusFilter,
  onStatusChange,
  alertsOnly,
  onAlertsOnlyChange,
}: FilterBarProps) => {
  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 bg-neutral-0 border border-neutral-200 rounded-lg">
      {/* Search */}
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search district..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-md border border-neutral-300 bg-neutral-0 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Phase Filter */}
      <div className="w-full lg:w-[140px]">
        <DSMSelect
          value={phaseFilter}
          onChange={(e) => onPhaseChange(e.target.value)}
          options={[
            { value: "all", label: "All Phases" },
            { value: "1", label: "Phase 1" },
            { value: "2", label: "Phase 2" },
            { value: "3", label: "Phase 3" },
            { value: "4", label: "Phase 4" },
            { value: "5", label: "Phase 5" },
          ]}
        />
      </div>

      {/* Status Filter */}
      <div className="w-full lg:w-[140px]">
        <DSMSelect
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          options={[
            { value: "all", label: "All Status" },
            { value: "red", label: "Red" },
            { value: "yellow", label: "Yellow" },
            { value: "green", label: "Green" },
            { value: "blue", label: "Complete" },
          ]}
        />
      </div>

      {/* Alerts Toggle */}
      <div className="flex items-center">
        <DSMCheckbox
          label="Active alerts only"
          checked={alertsOnly}
          onChange={(e) => onAlertsOnlyChange(e.target.checked)}
        />
      </div>
    </div>
  );
};

// ============================================
// DISTRICT TABLE
// ============================================

interface DistrictTableProps {
  districts: District[];
  sortColumn: string;
  sortDirection: "asc" | "desc";
  onSort: (column: string) => void;
}

const DistrictTable = ({ districts, sortColumn, sortDirection, onSort }: DistrictTableProps) => {
  const router = useRouter();
  
  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const SortableHeader = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <th
      className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600 cursor-pointer select-none hover:bg-neutral-100 transition-colors"
      onClick={() => onSort(column)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <SortIcon column={column} />
      </span>
    </th>
  );

  return (
    <div className="overflow-x-auto border border-neutral-200 rounded-lg">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-neutral-50 border-b border-neutral-200">
            <SortableHeader column="name">District</SortableHeader>
            <SortableHeader column="phase">Phase</SortableHeader>
            <SortableHeader column="riskScore">Risk Score</SortableHeader>
            <SortableHeader column="status">Status</SortableHeader>
            <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
              Top Risk Driver
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
              Secondary Driver
            </th>
            <SortableHeader column="daysLeft">Days Left</SortableHeader>
            <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
              Updated
            </th>
            <th className="px-4 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-neutral-600">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {districts.map((district) => (
            <tr 
              key={district.id}
              onClick={() => router.push(`/district/${district.id}`)}
              className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer group"
            >
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  {district.hasActiveAlerts && (
                    <span className="w-2 h-2 rounded-full bg-error flex-shrink-0" aria-label="Has active alerts" />
                  )}
                  <span className="text-[14px] font-medium text-neutral-900 group-hover:text-primary-500 transition-colors">
                    {district.name}
                  </span>
                </div>
              </td>
              <td className="px-4 py-4">
                <PhaseBadge phase={district.phase} />
              </td>
              <td className="px-4 py-4">
                <RiskScorePill score={district.riskScore} status={district.status} />
              </td>
              <td className="px-4 py-4">
                <StatusBadge status={district.status} />
              </td>
              <td className="px-4 py-4">
                <span className="text-[13px] text-neutral-700">{district.riskDriver1}</span>
              </td>
              <td className="px-4 py-4">
                <span className="text-[13px] text-neutral-600">{district.riskDriver2}</span>
              </td>
              <td className="px-4 py-4">
                {district.daysLeft !== null ? (
                  <span className={cn(
                    "text-[14px] font-semibold",
                    district.daysLeft <= 3 ? "text-error" : 
                    district.daysLeft <= 7 ? "text-warning" : "text-neutral-700"
                  )}>
                    {district.daysLeft}d
                  </span>
                ) : (
                  <span className="text-[13px] text-neutral-400">—</span>
                )}
              </td>
              <td className="px-4 py-4">
                <span className="text-[13px] text-neutral-500">{district.lastUpdated}</span>
              </td>
              <td className="px-4 py-4">
                <span className="inline-flex items-center gap-1 text-[13px] font-medium text-primary-500 group-hover:text-primary-600">
                  View
                  <ChevronRight className="w-4 h-4" />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================
// MAIN PORTFOLIO COMPONENT
// ============================================

export const DistrictPortfolio = () => {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [phaseFilter, setPhaseFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [alertsOnly, setAlertsOnly] = React.useState(false);
  const [sortColumn, setSortColumn] = React.useState("riskScore");
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("desc");

  // Filter districts
  const filteredDistricts = React.useMemo(() => {
    let result = [...mockDistricts];

    // Search filter
    if (searchQuery) {
      result = result.filter((d) =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Phase filter
    if (phaseFilter !== "all") {
      result = result.filter((d) => d.phase === parseInt(phaseFilter));
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((d) => d.status === statusFilter);
    }

    // Alerts filter
    if (alertsOnly) {
      result = result.filter((d) => d.hasActiveAlerts);
    }

    // Sort by status priority first, then by sort column
    const statusPriority = { red: 0, yellow: 1, green: 2, blue: 3 };
    
    result.sort((a, b) => {
      // Primary sort by status
      const statusDiff = statusPriority[a.status] - statusPriority[b.status];
      if (statusDiff !== 0) return statusDiff;

      // Secondary sort by selected column
      let comparison = 0;
      switch (sortColumn) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "phase":
          comparison = a.phase - b.phase;
          break;
        case "riskScore":
          comparison = b.riskScore - a.riskScore; // Higher risk first
          break;
        case "daysLeft":
          const aDays = a.daysLeft ?? 999;
          const bDays = b.daysLeft ?? 999;
          comparison = aDays - bDays; // Fewer days first
          break;
        default:
          comparison = b.riskScore - a.riskScore;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [searchQuery, phaseFilter, statusFilter, alertsOnly, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard
          title="High Risk Districts"
          value={kpiSummary.highRiskDistricts}
          icon={<AlertTriangle className="w-5 h-5" />}
          status={kpiSummary.highRiskDistricts > 0 ? "danger" : "normal"}
        />
        <KPICard
          title="Test Windows Closing"
          value={kpiSummary.testWindowsClosingSoon}
          icon={<Clock className="w-5 h-5" />}
          status={kpiSummary.testWindowsClosingSoon > 2 ? "warning" : "normal"}
          subtitle="Within 7 days"
        />
        <KPICard
          title="PLP At-Risk"
          value={kpiSummary.plpCompletionAtRisk}
          icon={<FileWarning className="w-5 h-5" />}
          status={kpiSummary.plpCompletionAtRisk > 0 ? "warning" : "normal"}
        />
        <KPICard
          title="PD Scheduling"
          value={kpiSummary.pdSchedulingAtRisk}
          icon={<Calendar className="w-5 h-5" />}
          status={kpiSummary.pdSchedulingAtRisk > 2 ? "warning" : "normal"}
          subtitle="Below 100%"
        />
        <KPICard
          title="Active Alerts"
          value={kpiSummary.activeAlerts}
          icon={<Bell className="w-5 h-5" />}
          status={kpiSummary.activeAlerts > 3 ? "danger" : kpiSummary.activeAlerts > 0 ? "warning" : "normal"}
        />
        <KPICard
          title="Total Districts"
          value={kpiSummary.totalDistricts}
          icon={<Building2 className="w-5 h-5" />}
        />
      </div>

      {/* District Portfolio Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <H2>District Portfolio — Sorted by Risk</H2>
          <P4 className="text-neutral-500">
            Showing {filteredDistricts.length} of {mockDistricts.length} districts
          </P4>
        </div>

        {/* Filter Bar */}
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          phaseFilter={phaseFilter}
          onPhaseChange={setPhaseFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          alertsOnly={alertsOnly}
          onAlertsOnlyChange={setAlertsOnly}
        />

        {/* District Table */}
        <DistrictTable
          districts={filteredDistricts}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </div>
    </div>
  );
};
