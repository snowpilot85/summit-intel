"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  CheckCircle2,
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

/* ============================================
   Summit Pathways Dashboard
   District-wide CCMR Overview
   ============================================ */

// ============================================
// DATA TYPES
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

interface InterventionData {
  title: string;
  studentCount: number;
  description: string;
  impact: string;
  pathway: string;
}

interface YearTrendData {
  year: string;
  grads: number;
  ccmrMet: number;
  rate: number;
  vsDistrict: string;
  isProjection?: boolean;
}

interface GroupData {
  summary: SummaryMetrics;
  indicators: IndicatorData[];
  campuses: CampusData[];
  interventions: InterventionData[];
  yearTrend: YearTrendData[];
  trendNote: string;
  comparisonBanner?: {
    text: string;
    gap: number;
    isLargestGap?: boolean;
  };
}

// ============================================
// DATA BY STUDENT GROUP
// ============================================

const dataByGroup: Record<StudentGroup, GroupData | null> = {
  all: {
    summary: {
      total912: 4847,
      seniors: 1203,
      ccmrMet: 842,
      ccmrPercent: 70,
      onTrack: 2418,
      onTrackTotal: 3644,
      onTrackPercent: 66,
      atRiskSeniors: 361,
    },
    indicators: [
      { name: "Industry-based certification (IBC)", count: 312, percent: 26 },
      { name: "Dual credit course", count: 267, percent: 22 },
      { name: "TSI college ready (ELA + Math)", count: 198, percent: 16 },
      { name: "College prep course completed", count: 156, percent: 13 },
      { name: "AP/IB exam score of 3+", count: 134, percent: 11 },
      { name: "SAT/ACT college ready", count: 112, percent: 9 },
      { name: "Military enlistment", count: 54, percent: 4 },
      { name: "OnRamps course", count: 43, percent: 4 },
      { name: "Associate degree", count: 28, percent: 2 },
      { name: "Level I/II certificate", count: 21, percent: 2 },
    ],
    campuses: [
      { name: "Economedes H S", seniors: 312, ccmrMet: 234, rate: 75, trend: 3, atRisk: 78 },
      { name: "Edinburg North H S", seniors: 342, ccmrMet: 246, rate: 72, trend: 2, atRisk: 96 },
      { name: "Vela H S", seniors: 261, ccmrMet: 179, rate: 69, trend: 0, atRisk: 82 },
      { name: "Edinburg H S", seniors: 288, ccmrMet: 183, rate: 64, trend: -2, atRisk: 105 },
    ],
    interventions: [
      { title: "Industry-based certification", studentCount: 134, description: "are enrolled in CTE courses with IBC-aligned certifications", impact: "Potential impact: +11% CCMR rate if all pass", pathway: "ibc" },
      { title: "College prep course completion", studentCount: 89, description: "are enrolled in college prep math or ELA", impact: "Potential impact: +7% CCMR rate", pathway: "college-prep" },
      { title: "TSI assessment", studentCount: 138, description: "have never attempted the TSIA", impact: "Potential impact: +11% CCMR rate (assuming 50% pass)", pathway: "tsi" },
    ],
    yearTrend: [
      { year: "Class of 2023", grads: 1156, ccmrMet: 786, rate: 68, vsDistrict: "—" },
      { year: "Class of 2024", grads: 1178, ccmrMet: 826, rate: 70, vsDistrict: "—" },
      { year: "Class of 2025", grads: 1190, ccmrMet: 857, rate: 72, vsDistrict: "—" },
      { year: "Class of 2026", grads: 1203, ccmrMet: 842, rate: 70, vsDistrict: "—", isProjection: true },
    ],
    trendNote: "District CCMR improved 4 pts over 3 years. Subgroup gaps continue to narrow.",
    comparisonBanner: undefined,
  },
  eb: {
    summary: {
      total912: 1890,
      seniors: 487,
      ccmrMet: 283,
      ccmrPercent: 58,
      onTrack: 812,
      onTrackTotal: 1403,
      onTrackPercent: 58,
      atRiskSeniors: 204,
    },
    indicators: [
      { name: "Industry-based certification (IBC)", count: 98, percent: 20 },
      { name: "Dual credit course", count: 72, percent: 15 },
      { name: "College prep course completed", count: 52, percent: 11 },
      { name: "TSI college ready (ELA + Math)", count: 45, percent: 9 },
      { name: "AP/IB exam score of 3+", count: 28, percent: 6 },
      { name: "SAT/ACT college ready", count: 19, percent: 4 },
      { name: "Military enlistment", count: 12, percent: 2 },
      { name: "OnRamps course", count: 8, percent: 2 },
      { name: "Level I/II certificate", count: 5, percent: 1 },
      { name: "Associate degree", count: 3, percent: 1 },
    ],
    campuses: [
      { name: "Economedes H S", seniors: 119, ccmrMet: 76, rate: 64, trend: 4, atRisk: 43 },
      { name: "Edinburg North H S", seniors: 144, ccmrMet: 87, rate: 60, trend: 2, atRisk: 57 },
      { name: "Vela H S", seniors: 91, ccmrMet: 49, rate: 54, trend: 0, atRisk: 42 },
      { name: "Edinburg H S", seniors: 133, ccmrMet: 71, rate: 53, trend: -1, atRisk: 62 },
    ],
    interventions: [
      { title: "Industry-based certification", studentCount: 54, description: "EB seniors in CTE courses with IBC alignment", impact: "Potential impact: +11% EB CCMR rate", pathway: "ibc" },
      { title: "College prep course completion", studentCount: 38, description: "EB seniors in college prep math or ELA", impact: "Potential impact: +8% EB CCMR rate", pathway: "college-prep" },
      { title: "TSI assessment", studentCount: 112, description: "EB seniors who have never attempted TSIA", impact: "Potential impact: +12% EB CCMR rate", pathway: "tsi" },
    ],
    yearTrend: [
      { year: "Class of 2023", grads: 445, ccmrMet: 227, rate: 51, vsDistrict: "-17%" },
      { year: "Class of 2024", grads: 462, ccmrMet: 254, rate: 55, vsDistrict: "-15%" },
      { year: "Class of 2025", grads: 478, ccmrMet: 277, rate: 58, vsDistrict: "-14%" },
      { year: "Class of 2026", grads: 487, ccmrMet: 283, rate: 58, vsDistrict: "-12%", isProjection: true },
    ],
    trendNote: "EB CCMR gap narrowing by ~1.5 pts/year. At current pace, parity in ~8 years.",
    comparisonBanner: {
      text: "EB CCMR rate: 58% vs. 70% district overall",
      gap: 12,
    },
  },
  econ: {
    summary: {
      total912: 3150,
      seniors: 782,
      ccmrMet: 508,
      ccmrPercent: 65,
      onTrack: 1540,
      onTrackTotal: 2368,
      onTrackPercent: 65,
      atRiskSeniors: 274,
    },
    indicators: [
      { name: "Industry-based certification (IBC)", count: 198, percent: 25 },
      { name: "Dual credit course", count: 156, percent: 20 },
      { name: "TSI college ready (ELA + Math)", count: 112, percent: 14 },
      { name: "College prep course completed", count: 98, percent: 13 },
      { name: "AP/IB exam score of 3+", count: 78, percent: 10 },
      { name: "SAT/ACT college ready", count: 62, percent: 8 },
      { name: "Military enlistment", count: 38, percent: 5 },
      { name: "OnRamps course", count: 28, percent: 4 },
      { name: "Associate degree", count: 18, percent: 2 },
      { name: "Level I/II certificate", count: 14, percent: 2 },
    ],
    campuses: [
      { name: "Economedes H S", seniors: 198, ccmrMet: 138, rate: 70, trend: 2, atRisk: 60 },
      { name: "Edinburg North H S", seniors: 224, ccmrMet: 147, rate: 66, trend: 1, atRisk: 77 },
      { name: "Vela H S", seniors: 165, ccmrMet: 105, rate: 64, trend: 0, atRisk: 60 },
      { name: "Edinburg H S", seniors: 195, ccmrMet: 118, rate: 61, trend: -1, atRisk: 77 },
    ],
    interventions: [
      { title: "Industry-based certification", studentCount: 98, description: "econ disadv seniors in CTE courses", impact: "Potential impact: +13% CCMR rate", pathway: "ibc" },
      { title: "College prep course completion", studentCount: 67, description: "econ disadv seniors in college prep", impact: "Potential impact: +9% CCMR rate", pathway: "college-prep" },
      { title: "TSI assessment", studentCount: 109, description: "econ disadv seniors never attempted TSIA", impact: "Potential impact: +14% CCMR rate", pathway: "tsi" },
    ],
    yearTrend: [
      { year: "Class of 2023", grads: 745, ccmrMet: 447, rate: 60, vsDistrict: "-8%" },
      { year: "Class of 2024", grads: 762, ccmrMet: 480, rate: 63, vsDistrict: "-7%" },
      { year: "Class of 2025", grads: 774, ccmrMet: 503, rate: 65, vsDistrict: "-7%" },
      { year: "Class of 2026", grads: 782, ccmrMet: 508, rate: 65, vsDistrict: "-5%", isProjection: true },
    ],
    trendNote: "Econ disadvantaged CCMR improved 5 pts over 3 years. Gap narrowing steadily.",
    comparisonBanner: {
      text: "Econ disadvantaged CCMR rate: 65% vs. 70% district overall",
      gap: 5,
    },
  },
  sped: {
    summary: {
      total912: 580,
      seniors: 148,
      ccmrMet: 74,
      ccmrPercent: 50,
      onTrack: 245,
      onTrackTotal: 432,
      onTrackPercent: 57,
      atRiskSeniors: 74,
    },
    indicators: [
      { name: "Industry-based certification (IBC)", count: 32, percent: 22 },
      { name: "College prep course completed", count: 18, percent: 12 },
      { name: "Dual credit course", count: 14, percent: 9 },
      { name: "TSI college ready (ELA + Math)", count: 8, percent: 5 },
      { name: "Military enlistment", count: 6, percent: 4 },
      { name: "Level I/II certificate", count: 5, percent: 3 },
      { name: "SAT/ACT college ready", count: 4, percent: 3 },
      { name: "AP/IB exam score of 3+", count: 3, percent: 2 },
      { name: "OnRamps course", count: 2, percent: 1 },
      { name: "Associate degree", count: 1, percent: 1 },
    ],
    campuses: [
      { name: "Economedes H S", seniors: 38, ccmrMet: 21, rate: 55, trend: 3, atRisk: 17 },
      { name: "Edinburg North H S", seniors: 42, ccmrMet: 22, rate: 52, trend: 1, atRisk: 20 },
      { name: "Vela H S", seniors: 32, ccmrMet: 15, rate: 47, trend: -1, atRisk: 17 },
      { name: "Edinburg H S", seniors: 36, ccmrMet: 16, rate: 44, trend: -2, atRisk: 20 },
    ],
    interventions: [
      { title: "Industry-based certification", studentCount: 28, description: "SPED seniors in CTE courses with IBC alignment", impact: "Potential impact: +19% SPED CCMR rate", pathway: "ibc" },
      { title: "College prep course completion", studentCount: 19, description: "SPED seniors in modified college prep", impact: "Potential impact: +13% SPED CCMR rate", pathway: "college-prep" },
      { title: "Level I/II certificate", studentCount: 27, description: "SPED seniors eligible for workforce certificates", impact: "Potential impact: +18% SPED CCMR rate", pathway: "certificate" },
    ],
    yearTrend: [
      { year: "Class of 2023", grads: 138, ccmrMet: 58, rate: 42, vsDistrict: "-26%" },
      { year: "Class of 2024", grads: 142, ccmrMet: 64, rate: 45, vsDistrict: "-25%" },
      { year: "Class of 2025", grads: 145, ccmrMet: 70, rate: 48, vsDistrict: "-24%" },
      { year: "Class of 2026", grads: 148, ccmrMet: 74, rate: 50, vsDistrict: "-20%", isProjection: true },
    ],
    trendNote: "Special education CCMR improved 8 pts over 3 years. IBC is the strongest pathway for this subgroup.",
    comparisonBanner: {
      text: "Special education CCMR rate: 50% vs. 70% district overall",
      gap: 20,
      isLargestGap: true,
    },
  },
  custom: null, // Custom filter shows placeholder UI
};

// ============================================
// STUDENT GROUP FILTER TABS
// ============================================

interface StudentGroupTabsProps {
  activeGroup: StudentGroup;
  onGroupChange: (group: StudentGroup) => void;
}

const StudentGroupTabs = ({ activeGroup, onGroupChange }: StudentGroupTabsProps) => {
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
    <div className={cn(
      "px-4 py-3 rounded-lg border transition-all duration-300",
      isLargestGap 
        ? "bg-error-light border-error/30" 
        : "bg-warning-light border-warning/30"
    )}>
      <p className="text-[13px] font-medium">
        <span className={isLargestGap ? "text-error-dark" : "text-warning-dark"}>{text}</span>
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

const MetricCard = ({ label, value, detail, trend, color = "default", badge }: MetricCardProps) => {
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
        <p className={cn("text-[28px] font-bold transition-all duration-300", colorClasses[color])}>{value}</p>
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

const CCMRByIndicatorChart = ({ data, groupLabel }: { data: IndicatorData[]; groupLabel: string }) => {
  const maxCount = Math.max(...data.map((d) => d.count));

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-5">
      <h3 className="text-[16px] font-semibold text-neutral-900 mb-4">CCMR by indicator</h3>
      <div className="space-y-3">
        {data.map((indicator, idx) => (
          <div key={idx} className="flex items-center gap-3 transition-all duration-300">
            <p className="text-[12px] text-neutral-700 w-[200px] flex-shrink-0 truncate">
              {indicator.name}
            </p>
            <div className="flex-1 h-6 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(indicator.count / maxCount) * 100}%` }}
              />
            </div>
            <p className="text-[12px] font-medium text-neutral-700 w-[80px] text-right">
              {indicator.count} ({indicator.percent}%)
            </p>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-neutral-500 mt-4">
        Students may meet multiple indicators. {groupLabel !== "All students" && `Showing ${groupLabel.toLowerCase()} only.`}
      </p>
    </div>
  );
};

// ============================================
// CCMR BY CAMPUS TABLE
// ============================================

const CCMRByCampusTable = ({ data, groupLabel }: { data: CampusData[]; groupLabel: string }) => {
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
        CCMR by campus {groupLabel !== "All students" && <span className="text-neutral-500 font-normal">({groupLabel})</span>}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left text-[12px] font-semibold text-neutral-700 pb-3">Campus</th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">Seniors</th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">CCMR met</th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">Rate</th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">Trend</th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">At risk</th>
            </tr>
          </thead>
          <tbody>
            {data.map((campus, idx) => (
              <tr
                key={idx}
                className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 cursor-pointer transition-all duration-200"
              >
                <td className="py-3 text-[13px] font-medium text-neutral-900">{campus.name}</td>
                <td className="py-3 text-[13px] text-neutral-700 text-right">{campus.seniors}</td>
                <td className="py-3 text-[13px] text-neutral-700 text-right">{campus.ccmrMet}</td>
                <td className="py-3 text-right">
                  <span className={cn("px-2 py-0.5 text-[12px] font-medium rounded transition-all duration-300", getRateColor(campus.rate))}>
                    {campus.rate}%
                  </span>
                </td>
                <td className="py-3 text-right">
                  <span className={cn("flex items-center justify-end gap-1 text-[12px] font-medium", getTrendColor(campus.trend))}>
                    {getTrendIcon(campus.trend)}
                    {campus.trend > 0 ? "+" : ""}{campus.trend}%
                  </span>
                </td>
                <td className="py-3 text-[13px] text-error font-medium text-right">{campus.atRisk}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================
// INTERVENTION PATHWAY CARD
// ============================================

interface InterventionPathwayProps {
  title: string;
  studentCount: number;
  description: string;
  impact: string;
  href: string;
}

const InterventionPathwayCard = ({ title, studentCount, description, impact, href }: InterventionPathwayProps) => {
  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-5 transition-all duration-300">
      <h4 className="text-[14px] font-semibold text-neutral-900 mb-2">{title}</h4>
      <p className="text-[13px] text-neutral-600 mb-3">
        <span className="font-semibold text-neutral-900">{studentCount}</span> {description}
      </p>
      <p className="text-[12px] text-teal-600 font-medium mb-4">{impact}</p>
      <Link
        href={href}
        className="text-[13px] font-medium text-primary-500 hover:text-primary-600 flex items-center gap-1"
      >
        View {studentCount} students
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
};

// ============================================
// YEAR OVER YEAR TREND TABLE
// ============================================

const YearOverYearTable = ({ data, trendNote, groupLabel }: { data: YearTrendData[]; trendNote: string; groupLabel: string }) => {
  const isSubgroup = groupLabel !== "All students";

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-5">
      <h3 className="text-[16px] font-semibold text-neutral-900 mb-4">
        Year-over-year trend {isSubgroup && <span className="text-neutral-500 font-normal">({groupLabel})</span>}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left text-[12px] font-semibold text-neutral-700 pb-3">Graduating class</th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">{isSubgroup ? `${groupLabel} grads` : "Total grads"}</th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">CCMR met</th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">Rate</th>
              {isSubgroup && (
                <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">Vs. district</th>
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
                <td className={cn("py-3 text-[13px] text-neutral-900", row.isProjection && "font-medium")}>
                  {row.year}
                  {row.isProjection && <span className="text-neutral-500"> (proj)</span>}
                </td>
                <td className="py-3 text-[13px] text-neutral-700 text-right">{row.grads.toLocaleString()}</td>
                <td className="py-3 text-[13px] text-neutral-700 text-right">{row.ccmrMet.toLocaleString()}</td>
                <td className={cn("py-3 text-[13px] text-right font-medium", row.isProjection ? "text-neutral-900" : "text-neutral-700")}>
                  {row.rate}%
                </td>
                {isSubgroup && (
                  <td className="py-3 text-[13px] text-error font-medium text-right">{row.vsDistrict}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] text-teal-600 mt-4 flex items-center gap-1">
        <TrendingUp className="w-4 h-4" />
        {trendNote}
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
        <h3 className="text-[18px] font-semibold text-neutral-900 mb-2">Create a custom CCMR view</h3>
        <p className="text-[14px] text-neutral-600 mb-6">
          Select student groups and demographics to create a custom CCMR analysis.
        </p>
        
        <div className="grid grid-cols-2 gap-4 text-left">
          <div>
            <label className="block text-[12px] font-medium text-neutral-700 mb-1">Grade level</label>
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
            <label className="block text-[12px] font-medium text-neutral-700 mb-1">Campus</label>
            <div className="relative">
              <select className="w-full px-3 py-2 border border-neutral-200 rounded-md text-[13px] appearance-none bg-neutral-0">
                <option>All campuses</option>
                <option>Economedes H S</option>
                <option>Edinburg North H S</option>
                <option>Vela H S</option>
                <option>Edinburg H S</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-neutral-700 mb-1">Gender</label>
            <div className="relative">
              <select className="w-full px-3 py-2 border border-neutral-200 rounded-md text-[13px] appearance-none bg-neutral-0">
                <option>All</option>
                <option>Male</option>
                <option>Female</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-medium text-neutral-700 mb-1">Ethnicity</label>
            <div className="relative">
              <select className="w-full px-3 py-2 border border-neutral-200 rounded-md text-[13px] appearance-none bg-neutral-0">
                <option>All</option>
                <option>Hispanic/Latino</option>
                <option>White</option>
                <option>African American</option>
                <option>Asian</option>
                <option>Two or more</option>
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

export const PathwaysDashboard = () => {
  const [studentGroup, setStudentGroup] = React.useState<StudentGroup>("all");

  const groupLabels: Record<StudentGroup, string> = {
    all: "All students",
    eb: "EB students",
    econ: "Econ disadvantaged",
    sped: "Special education",
    custom: "Custom",
  };

  const currentData = dataByGroup[studentGroup];
  const groupLabel = groupLabels[studentGroup];

  // Custom filter shows placeholder
  if (studentGroup === "custom") {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-semibold text-neutral-900">CCMR Dashboard</h1>
            <p className="text-[14px] text-neutral-600 mt-1">
              District-wide college, career, and military readiness overview
            </p>
          </div>
        </div>

        {/* Student Group Filter Tabs */}
        <StudentGroupTabs activeGroup={studentGroup} onGroupChange={setStudentGroup} />

        {/* Custom Filter Placeholder */}
        <CustomFilterPlaceholder />
      </div>
    );
  }

  if (!currentData) return null;

  const { summary, indicators, campuses, interventions, yearTrend, trendNote, comparisonBanner } = currentData;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-semibold text-neutral-900">CCMR Dashboard</h1>
          <p className="text-[14px] text-neutral-600 mt-1">
            District-wide college, career, and military readiness overview
          </p>
        </div>
      </div>

      {/* Student Group Filter Tabs */}
      <StudentGroupTabs activeGroup={studentGroup} onGroupChange={setStudentGroup} />

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard
          label={`Total 9-12 ${groupLabel !== "All students" ? groupLabel.toLowerCase() : "students"}`}
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
          trend="vs. 70% district avg"
          color={summary.ccmrPercent >= 70 ? "blue" : summary.ccmrPercent >= 60 ? "amber" : "red"}
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
          trend="68 days to graduation"
          color="red"
          badge="ACTION NEEDED"
        />
      </div>

      {/* Comparison Banner (only for subgroups) */}
      {comparisonBanner && (
        <ComparisonBanner
          text={comparisonBanner.text}
          gap={comparisonBanner.gap}
          isLargestGap={comparisonBanner.isLargestGap}
        />
      )}

      {/* Two Column Layout: Indicators + Campus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CCMRByIndicatorChart data={indicators} groupLabel={groupLabel} />
        <CCMRByCampusTable data={campuses} groupLabel={groupLabel} />
      </div>

      {/* Intervention Pathways Section */}
      <div className="bg-warning-light border border-warning/30 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-6">
          <AlertCircle className="w-6 h-6 text-warning-dark flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[16px] font-semibold text-warning-dark">
              {summary.atRiskSeniors} {groupLabel !== "All students" ? groupLabel.toLowerCase() : "seniors"} have not met any CCMR indicator.
            </p>
            <p className="text-[14px] text-warning-dark/80 mt-1">
              {groupLabel !== "All students" 
                ? `This subgroup directly impacts your Domain 3 accountability ratings.`
                : `This directly impacts your Domain 1 and Domain 3 accountability ratings.`
              }
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {interventions.map((intervention, idx) => (
            <InterventionPathwayCard
              key={idx}
              title={intervention.title}
              studentCount={intervention.studentCount}
              description={intervention.description}
              impact={intervention.impact}
              href={`/pathways/interventions?pathway=${intervention.pathway}${studentGroup !== "all" ? `&group=${studentGroup}` : ""}`}
            />
          ))}
        </div>
      </div>

      {/* Year Over Year Trend */}
      <YearOverYearTable data={yearTrend} trendNote={trendNote} groupLabel={groupLabel} />

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-4">
        <button className="px-5 py-2.5 bg-teal-600 text-neutral-0 text-[14px] font-medium rounded-md hover:bg-teal-700 transition-colors">
          Generate {groupLabel !== "All students" ? groupLabel.toLowerCase() : "full"} CCMR report
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
