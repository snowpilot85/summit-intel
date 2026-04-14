"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Download,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  Minus,
  ChevronDown,
} from "lucide-react";
import { fetchGroupData } from "@/app/pathways/actions";
import type {
  DashboardSummary,
  IndicatorCount,
  SubgroupFilter,
} from "@/lib/db/dashboard";
import type { CampusCCMRSummaryRow, SnapshotRow, IndicatorType } from "@/types/database";

/* ============================================
   Summit Pathways Dashboard
   District-wide CCMR Overview
   ============================================ */

// ============================================
// PROPS
// ============================================

interface PathwaysDashboardProps {
  districtId: string;
  initialSummary: DashboardSummary;
  initialCampusSummaries: CampusCCMRSummaryRow[];
  initialSnapshots: SnapshotRow[];
  initialIndicators: IndicatorCount[];
}

// ============================================
// UI TYPES (mapped from DB types)
// ============================================

type StudentGroup = "all" | "eb" | "econ" | "sped" | "custom";

interface SummaryMetrics {
  total912: number;
  seniors: number;
  ccmrMet: number;
  ccmrPercent: number;
  onTrack: number;
  onTrackTotal: number;
  onTrackPercent: number;
  atRiskSeniors: number;
}

interface IndicatorData {
  name: string;
  count: number;
  percent: number;
}

interface CampusData {
  name: string;
  seniors: number;
  ccmrMet: number;
  rate: number;
  trend: number;
  atRisk: number;
}

interface YearTrendData {
  year: string;
  grads: number;
  ccmrMet: number;
  rate: number;
  vsDistrict: string;
  isProjection?: boolean;
}

// ============================================
// INDICATOR DISPLAY NAMES
// ============================================

const INDICATOR_LABELS: Partial<Record<IndicatorType, string>> = {
  ibc: "Industry-based certification (IBC)",
  dual_credit_any: "Dual credit course",
  dual_credit_ela: "Dual credit ELA",
  dual_credit_math: "Dual credit Math",
  tsi_reading: "TSI college ready (Reading)",
  tsi_math: "TSI college ready (Math)",
  college_prep_ela: "College prep ELA",
  college_prep_math: "College prep Math",
  ap_exam: "AP/IB exam score of 3+",
  ib_exam: "IB exam",
  sat_reading: "SAT college ready (R&W)",
  sat_math: "SAT college ready (Math)",
  act_reading: "ACT college ready (English)",
  act_math: "ACT college ready (Math)",
  military_enlistment: "Military enlistment",
  onramps: "OnRamps course",
  associate_degree: "Associate degree",
  level_i_ii_certificate: "Level I/II certificate",
  iep_completion: "IEP completion (SPED pathway)",
  sped_advanced_degree: "Advanced degree (SPED pathway)",
};

// ============================================
// DATA MAPPING HELPERS
// ============================================

function mapIndicators(raw: IndicatorCount[]): IndicatorData[] {
  const maxCount = Math.max(...raw.map((r) => r.count), 1);
  return raw.map((r) => ({
    name: INDICATOR_LABELS[r.indicator_type] ?? r.indicator_type,
    count: r.count,
    percent: Math.round((r.count / maxCount) * 100),
  }));
}

function mapCampuses(
  rows: CampusCCMRSummaryRow[],
  subgroup: SubgroupFilter
): CampusData[] {
  // Take the most recent graduation year per campus
  const latestByName = new Map<string, CampusCCMRSummaryRow>();
  for (const row of rows) {
    const existing = latestByName.get(row.campus_name);
    if (!existing || row.graduation_year > existing.graduation_year) {
      latestByName.set(row.campus_name, row);
    }
  }

  return Array.from(latestByName.values()).map((row) => {
    if (subgroup === "eb") {
      return {
        name: row.campus_name,
        seniors: row.eb_total,
        ccmrMet: row.eb_met,
        rate: Math.round(row.eb_rate ?? 0),
        trend: 0,
        atRisk: 0,
      };
    }
    if (subgroup === "econ") {
      const rate =
        row.econ_total > 0
          ? Math.round((row.econ_met / row.econ_total) * 100)
          : 0;
      return {
        name: row.campus_name,
        seniors: row.econ_total,
        ccmrMet: row.econ_met,
        rate,
        trend: 0,
        atRisk: 0,
      };
    }
    // "all" and "sped" — use overall (sped not in view)
    return {
      name: row.campus_name,
      seniors: row.total_seniors,
      ccmrMet: row.ccmr_met,
      rate: Math.round(row.ccmr_rate),
      trend: 0,
      atRisk: row.at_risk,
    };
  });
}

function mapSnapshots(
  rows: SnapshotRow[],
  subgroup: SubgroupFilter,
  currentYear: number
): YearTrendData[] {
  return rows.map((row) => {
    const isProjection = row.graduation_year >= currentYear;
    const base = {
      year: `Class of ${row.graduation_year}`,
      isProjection,
      vsDistrict: "—",
    };

    if (subgroup === "eb") {
      const rate = Math.round(row.eb_rate ?? 0);
      const districtRate = Math.round(row.ccmr_rate);
      const gap = rate - districtRate;
      return {
        ...base,
        grads: row.eb_total,
        ccmrMet: row.eb_met_count,
        rate,
        vsDistrict: gap > 0 ? `+${gap}%` : `${gap}%`,
      };
    }
    if (subgroup === "econ") {
      const rate = Math.round(row.econ_disadv_rate ?? 0);
      const districtRate = Math.round(row.ccmr_rate);
      const gap = rate - districtRate;
      return {
        ...base,
        grads: row.econ_disadv_total,
        ccmrMet: row.econ_disadv_met,
        rate,
        vsDistrict: gap > 0 ? `+${gap}%` : `${gap}%`,
      };
    }
    if (subgroup === "sped") {
      const rate = Math.round(row.sped_rate ?? 0);
      const districtRate = Math.round(row.ccmr_rate);
      const gap = rate - districtRate;
      return {
        ...base,
        grads: row.sped_total,
        ccmrMet: row.sped_met_count,
        rate,
        vsDistrict: gap > 0 ? `+${gap}%` : `${gap}%`,
      };
    }
    // all
    return {
      ...base,
      grads: row.total_graduates,
      ccmrMet: row.ccmr_met_count,
      rate: Math.round(row.ccmr_rate),
    };
  });
}

// ============================================
// STUDENT GROUP FILTER TABS
// ============================================

interface StudentGroupTabsProps {
  activeGroup: StudentGroup;
  onGroupChange: (group: StudentGroup) => void;
  isLoading?: boolean;
}

const StudentGroupTabs = ({
  activeGroup,
  onGroupChange,
  isLoading,
}: StudentGroupTabsProps) => {
  const groups: { id: StudentGroup; label: string }[] = [
    { id: "all", label: "All students" },
    { id: "eb", label: "EB students" },
    { id: "econ", label: "Econ disadvantaged" },
    { id: "sped", label: "Special education" },
    { id: "custom", label: "Custom filter" },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg w-fit">
      {groups.map((group) => (
        <button
          key={group.id}
          onClick={() => onGroupChange(group.id)}
          disabled={isLoading}
          className={cn(
            "px-4 py-2 text-[13px] font-medium rounded-md transition-all duration-200",
            activeGroup === group.id
              ? "bg-neutral-0 text-neutral-900 shadow-sm"
              : "text-neutral-600 hover:text-neutral-900"
          )}
        >
          {group.label}
        </button>
      ))}
    </div>
  );
};

// ============================================
// COMPARISON BANNER
// ============================================

interface ComparisonBannerProps {
  text: string;
  gap: number;
  isLargestGap?: boolean;
}

const ComparisonBanner = ({ text, gap, isLargestGap }: ComparisonBannerProps) => {
  return (
    <div
      className={cn(
        "px-4 py-3 rounded-lg border transition-all duration-300",
        isLargestGap
          ? "bg-error-light border-error/30"
          : "bg-warning-light border-warning/30"
      )}
    >
      <p className="text-[13px] font-medium">
        <span className={isLargestGap ? "text-error-dark" : "text-warning-dark"}>
          {text}
        </span>
        {" — "}
        <span className="text-error font-bold">{gap} point gap</span>
        {isLargestGap && (
          <span className="ml-2 text-[11px] px-2 py-0.5 bg-error text-neutral-0 rounded font-bold uppercase">
            Largest gap
          </span>
        )}
      </p>
    </div>
  );
};

// ============================================
// METRIC CARDS
// ============================================

interface MetricCardProps {
  label: string;
  value: string;
  detail?: string;
  trend?: string;
  color?: "default" | "blue" | "teal" | "red" | "amber";
  badge?: string;
}

const MetricCard = ({
  label,
  value,
  detail,
  trend,
  color = "default",
  badge,
}: MetricCardProps) => {
  const colorClasses = {
    default: "text-neutral-900",
    blue: "text-primary-500",
    teal: "text-teal-600",
    red: "text-error",
    amber: "text-warning-dark",
  };

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-5 transition-all duration-300">
      <p className="text-[12px] text-neutral-500 font-medium mb-2">{label}</p>
      <div className="flex items-baseline gap-2">
        <p
          className={cn(
            "text-[28px] font-bold transition-all duration-300",
            colorClasses[color]
          )}
        >
          {value}
        </p>
        {badge && (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-error text-neutral-0 rounded">
            {badge}
          </span>
        )}
      </div>
      {detail && <p className="text-[12px] text-neutral-500 mt-1">{detail}</p>}
      {trend && <p className="text-[12px] text-neutral-500 mt-1">{trend}</p>}
    </div>
  );
};

// ============================================
// CCMR BY INDICATOR CHART
// ============================================

const CCMRByIndicatorChart = ({
  data,
  groupLabel,
}: {
  data: IndicatorData[];
  groupLabel: string;
}) => {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-5">
      <h3 className="text-[16px] font-semibold text-neutral-900 mb-4">
        CCMR by indicator
      </h3>
      {data.length === 0 ? (
        <p className="text-[13px] text-neutral-500 py-4 text-center">
          No indicator data available.
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((indicator, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 transition-all duration-300"
            >
              <p className="text-[12px] text-neutral-700 w-[200px] flex-shrink-0 truncate">
                {indicator.name}
              </p>
              <div className="flex-1 h-6 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${(indicator.count / maxCount) * 100}%`,
                  }}
                />
              </div>
              <p className="text-[12px] font-medium text-neutral-700 w-[80px] text-right">
                {indicator.count.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
      <p className="text-[11px] text-neutral-500 mt-4">
        Students who have met each indicator (seniors only).{" "}
        {groupLabel !== "All students" &&
          "Indicator counts reflect all seniors — filter by subgroup in a future update."}
      </p>
    </div>
  );
};

// ============================================
// CCMR BY CAMPUS TABLE
// ============================================

const CCMRByCampusTable = ({
  data,
  groupLabel,
}: {
  data: CampusData[];
  groupLabel: string;
}) => {
  const getRateColor = (rate: number) => {
    if (rate >= 70) return "bg-teal-100 text-teal-700";
    if (rate >= 60) return "bg-warning-light text-warning-dark";
    return "bg-error-light text-error-dark";
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUp className="w-3 h-3 text-teal-600" />;
    if (trend < 0) return <ArrowDown className="w-3 h-3 text-error" />;
    return <Minus className="w-3 h-3 text-neutral-400" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return "text-teal-600";
    if (trend < 0) return "text-error";
    return "text-neutral-500";
  };

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-5">
      <h3 className="text-[16px] font-semibold text-neutral-900 mb-4">
        CCMR by campus{" "}
        {groupLabel !== "All students" && (
          <span className="text-neutral-500 font-normal">({groupLabel})</span>
        )}
      </h3>
      {data.length === 0 ? (
        <p className="text-[13px] text-neutral-500 py-4 text-center">
          No campus data available.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left text-[12px] font-semibold text-neutral-700 pb-3">
                  Campus
                </th>
                <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">
                  Seniors
                </th>
                <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">
                  CCMR met
                </th>
                <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">
                  Rate
                </th>
                <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">
                  At risk
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((campus, idx) => (
                <tr
                  key={idx}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 cursor-pointer transition-all duration-200"
                >
                  <td className="py-3 text-[13px] font-medium text-neutral-900">
                    {campus.name}
                  </td>
                  <td className="py-3 text-[13px] text-neutral-700 text-right">
                    {campus.seniors}
                  </td>
                  <td className="py-3 text-[13px] text-neutral-700 text-right">
                    {campus.ccmrMet}
                  </td>
                  <td className="py-3 text-right">
                    <span
                      className={cn(
                        "px-2 py-0.5 text-[12px] font-medium rounded transition-all duration-300",
                        getRateColor(campus.rate)
                      )}
                    >
                      {campus.rate}%
                    </span>
                  </td>
                  <td className="py-3 text-[13px] text-error font-medium text-right">
                    {campus.atRisk > 0 ? campus.atRisk : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ============================================
// YEAR OVER YEAR TREND TABLE
// ============================================

const YearOverYearTable = ({
  data,
  groupLabel,
}: {
  data: YearTrendData[];
  groupLabel: string;
}) => {
  const isSubgroup = groupLabel !== "All students";

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-5">
      <h3 className="text-[16px] font-semibold text-neutral-900 mb-4">
        Year-over-year trend{" "}
        {isSubgroup && (
          <span className="text-neutral-500 font-normal">({groupLabel})</span>
        )}
      </h3>
      {data.length === 0 ? (
        <p className="text-[13px] text-neutral-500 py-4 text-center">
          No historical data available.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left text-[12px] font-semibold text-neutral-700 pb-3">
                  Graduating class
                </th>
                <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">
                  {isSubgroup ? `${groupLabel} grads` : "Total grads"}
                </th>
                <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">
                  CCMR met
                </th>
                <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">
                  Rate
                </th>
                {isSubgroup && (
                  <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">
                    Vs. district
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={idx}
                  className={cn(
                    "border-b border-neutral-100 last:border-0 transition-all duration-200",
                    row.isProjection && "bg-neutral-50"
                  )}
                >
                  <td
                    className={cn(
                      "py-3 text-[13px] text-neutral-900",
                      row.isProjection && "font-medium"
                    )}
                  >
                    {row.year}
                    {row.isProjection && (
                      <span className="text-neutral-500"> (proj)</span>
                    )}
                  </td>
                  <td className="py-3 text-[13px] text-neutral-700 text-right">
                    {row.grads.toLocaleString()}
                  </td>
                  <td className="py-3 text-[13px] text-neutral-700 text-right">
                    {row.ccmrMet.toLocaleString()}
                  </td>
                  <td
                    className={cn(
                      "py-3 text-[13px] text-right font-medium",
                      row.isProjection ? "text-neutral-900" : "text-neutral-700"
                    )}
                  >
                    {row.rate}%
                  </td>
                  {isSubgroup && (
                    <td className="py-3 text-[13px] text-error font-medium text-right">
                      {row.vsDistrict}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[12px] text-teal-600 mt-4 flex items-center gap-1">
        <TrendingUp className="w-4 h-4" />
        Historical CCMR performance — most recent year may be a projection.
      </p>
    </div>
  );
};

// ============================================
// CUSTOM FILTER PLACEHOLDER
// ============================================

const CustomFilterPlaceholder = () => {
  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-8 text-center">
      <div className="max-w-md mx-auto">
        <Users className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
        <h3 className="text-[18px] font-semibold text-neutral-900 mb-2">
          Create a custom CCMR view
        </h3>
        <p className="text-[14px] text-neutral-600 mb-6">
          Select student groups and demographics to create a custom CCMR
          analysis.
        </p>

        <div className="grid grid-cols-2 gap-4 text-left">
          <div>
            <label className="block text-[12px] font-medium text-neutral-700 mb-1">
              Grade level
            </label>
            <div className="relative">
              <select className="w-full px-3 py-2 border border-neutral-200 rounded-md text-[13px] appearance-none bg-neutral-0">
                <option>All grades (9-12)</option>
                <option>Grade 9</option>
                <option>Grade 10</option>
                <option>Grade 11</option>
                <option>Grade 12</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-neutral-700 mb-1">
              Campus
            </label>
            <div className="relative">
              <select className="w-full px-3 py-2 border border-neutral-200 rounded-md text-[13px] appearance-none bg-neutral-0">
                <option>All campuses</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <button className="mt-6 px-5 py-2.5 bg-teal-600 text-neutral-0 text-[14px] font-medium rounded-md hover:bg-teal-700 transition-colors">
          Apply filters
        </button>
      </div>
    </div>
  );
};

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

export const PathwaysDashboard = ({
  districtId,
  initialSummary,
  initialCampusSummaries,
  initialSnapshots,
  initialIndicators,
}: PathwaysDashboardProps) => {
  const [studentGroup, setStudentGroup] = React.useState<StudentGroup>("all");
  const [isLoading, setIsLoading] = React.useState(false);
  const [summary, setSummary] = React.useState<DashboardSummary>(initialSummary);
  const [campusSummaries, setCampusSummaries] =
    React.useState<CampusCCMRSummaryRow[]>(initialCampusSummaries);
  const [snapshots, setSnapshots] =
    React.useState<SnapshotRow[]>(initialSnapshots);
  const [indicators] =
    React.useState<IndicatorCount[]>(initialIndicators);
  // Keep overall CCMR % for subgroup gap calculation
  const allStudentsCcmrPercent = React.useRef(initialSummary.ccmrPercent);

  const groupLabels: Record<StudentGroup, string> = {
    all: "All students",
    eb: "EB students",
    econ: "Econ disadvantaged",
    sped: "Special education",
    custom: "Custom",
  };

  const handleGroupChange = React.useCallback(
    async (group: StudentGroup) => {
      setStudentGroup(group);
      if (group === "custom") return;

      const subgroup = group as SubgroupFilter;
      setIsLoading(true);
      try {
        const { summary: newSummary, campusSummaries: newCampuses, snapshots: newSnapshots } =
          await fetchGroupData(districtId, subgroup);
        if (group === "all") {
          allStudentsCcmrPercent.current = newSummary.ccmrPercent;
        }
        setSummary(newSummary);
        setCampusSummaries(newCampuses);
        setSnapshots(newSnapshots);
      } catch (err) {
        console.error("Failed to load group data:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [districtId]
  );

  const groupLabel = groupLabels[studentGroup];
  const subgroup =
    studentGroup === "custom" ? "all" : (studentGroup as SubgroupFilter);

  const indicatorData = mapIndicators(indicators);
  const campusData = mapCampuses(campusSummaries, subgroup);

  // Determine current graduation year for projection flag (most recent snapshot year)
  const currentGradYear = React.useMemo(() => {
    if (snapshots.length === 0) return new Date().getFullYear();
    return Math.max(...snapshots.map((s) => s.graduation_year));
  }, [snapshots]);

  const yearTrendData = mapSnapshots(snapshots, subgroup, currentGradYear);

  // Comparison banner for subgroups
  const comparisonBanner = React.useMemo(() => {
    if (studentGroup === "all" || studentGroup === "custom") return null;
    const gap = allStudentsCcmrPercent.current - summary.ccmrPercent;
    if (gap <= 0) return null;
    return {
      text: `${groupLabel} CCMR rate: ${summary.ccmrPercent}% vs. ${allStudentsCcmrPercent.current}% district overall`,
      gap,
      isLargestGap: gap >= 15,
    };
  }, [studentGroup, summary.ccmrPercent, groupLabel]);

  if (studentGroup === "custom") {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-semibold text-neutral-900">
              CCMR Dashboard
            </h1>
            <p className="text-[14px] text-neutral-600 mt-1">
              District-wide college, career, and military readiness overview
            </p>
          </div>
        </div>
        <StudentGroupTabs
          activeGroup={studentGroup}
          onGroupChange={handleGroupChange}
        />
        <CustomFilterPlaceholder />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", isLoading && "opacity-70 pointer-events-none")}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-neutral-900">
            CCMR Dashboard
          </h1>
          <p className="text-[14px] text-neutral-600 mt-1">
            District-wide college, career, and military readiness overview
          </p>
        </div>
        {isLoading && (
          <p className="text-[13px] text-neutral-500 animate-pulse">
            Loading…
          </p>
        )}
      </div>

      {/* Student Group Filter Tabs */}
      <StudentGroupTabs
        activeGroup={studentGroup}
        onGroupChange={handleGroupChange}
        isLoading={isLoading}
      />

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          label={`Total 9-12 ${
            groupLabel !== "All students"
              ? groupLabel.toLowerCase()
              : "students"
          }`}
          value={summary.total912.toLocaleString()}
          detail="All campuses"
        />
        <MetricCard
          label="Seniors (Class of 2026)"
          value={summary.seniors.toLocaleString()}
          detail="Graduating this year"
        />
        <MetricCard
          label="CCMR met (seniors)"
          value={`${summary.ccmrPercent}%`}
          detail={`${summary.ccmrMet.toLocaleString()} students`}
          color={
            summary.ccmrPercent >= 70
              ? "blue"
              : summary.ccmrPercent >= 60
              ? "amber"
              : "red"
          }
        />
        <MetricCard
          label="On track (grades 9-11)"
          value={`${summary.onTrackPercent}%`}
          detail={`${summary.onTrack.toLocaleString()} / ${summary.onTrackTotal.toLocaleString()}`}
          trend="Met 1+ indicator so far"
          color="teal"
        />
        <MetricCard
          label="At risk seniors"
          value={summary.atRiskSeniors.toLocaleString()}
          detail="No indicator met"
          color="red"
          badge={summary.atRiskSeniors > 0 ? "ACTION NEEDED" : undefined}
        />
      </div>

      {/* Comparison Banner (only for subgroups with a gap) */}
      {comparisonBanner && (
        <ComparisonBanner
          text={comparisonBanner.text}
          gap={comparisonBanner.gap}
          isLargestGap={comparisonBanner.isLargestGap}
        />
      )}

      {/* Two Column Layout: Indicators + Campus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CCMRByIndicatorChart data={indicatorData} groupLabel={groupLabel} />
        <CCMRByCampusTable data={campusData} groupLabel={groupLabel} />
      </div>

      {/* At-Risk Alert Section */}
      {summary.atRiskSeniors > 0 && (
        <div className="bg-warning-light border border-warning/30 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-warning-dark flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[16px] font-semibold text-warning-dark">
                {summary.atRiskSeniors}{" "}
                {groupLabel !== "All students"
                  ? groupLabel.toLowerCase()
                  : "seniors"}{" "}
                have not met any CCMR indicator.
              </p>
              <p className="text-[14px] text-warning-dark/80 mt-1">
                {groupLabel !== "All students"
                  ? "This subgroup directly impacts your Domain 3 accountability ratings."
                  : "This directly impacts your Domain 1 and Domain 3 accountability ratings."}
              </p>
              <Link
                href={`/pathways/students?readiness=at_risk&gradeLevel=12${
                  studentGroup !== "all" ? `&group=${studentGroup}` : ""
                }`}
                className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-warning-dark underline underline-offset-2"
              >
                View at-risk students
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Year Over Year Trend */}
      <YearOverYearTable
        data={yearTrendData}
        groupLabel={groupLabel}
      />

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-4">
        <button className="px-5 py-2.5 bg-teal-600 text-neutral-0 text-[14px] font-medium rounded-md hover:bg-teal-700 transition-colors">
          Generate{" "}
          {groupLabel !== "All students" ? groupLabel.toLowerCase() : "full"}{" "}
          CCMR report
        </button>
        <button className="px-5 py-2.5 border border-neutral-200 text-neutral-700 text-[14px] font-medium rounded-md hover:bg-neutral-50 transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export data
        </button>
        <a
          href="https://tea.texas.gov/reports-and-data/school-performance/accountability-research/accountability-reports"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[14px] font-medium text-primary-500 hover:text-primary-600 flex items-center gap-1"
        >
          View TEA CCMR Tracker
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
