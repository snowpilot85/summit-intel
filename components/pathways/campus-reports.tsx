"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  ChevronDown,
  TrendingUp,
  AlertTriangle,
  FileText,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Gauge,
} from "lucide-react";
import { fetchCampusDetail } from "@/app/pathways/campus-reports/actions";
import type {
  CampusCCMRSummaryRow,
  CampusRow,
  InterventionRow,
  SnapshotRow,
} from "@/types/database";

/* ============================================
   Campus Reports — Principal's View
   ============================================ */

// ============================================
// HELPERS
// ============================================

function pct(n: number): string {
  return `${Math.round(n)}%`;
}

function ebPct(summary: CampusCCMRSummaryRow): number {
  return summary.total_seniors > 0
    ? Math.round((summary.eb_total / summary.total_seniors) * 100)
    : 0;
}

const PATHWAY_LABELS: Record<string, string> = {
  ibc: "Industry-based certification (IBC)",
  tsi_reading: "TSI Assessment",
  tsi_math: "TSI Assessment",
  tsi: "TSI Assessment",
  college_prep_ela: "College Prep ELA",
  college_prep_math: "College Prep Math",
  college_prep: "College Prep course",
};

function pathwayLabel(pt: string | null): string {
  return pt ? (PATHWAY_LABELS[pt] ?? pt) : "Other";
}

// ============================================
// CCMR RATE BADGE
// ============================================

const RateBadge = ({ rate }: { rate: number }) => {
  const rounded = Math.round(rate);
  const className =
    rounded >= 70
      ? "bg-teal-100 text-teal-700"
      : rounded >= 60
      ? "bg-amber-100 text-amber-700"
      : "bg-error-light text-error-dark";
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[12px] font-semibold", className)}>
      {rounded}%
    </span>
  );
};

// ============================================
// CAMPUS SELECTOR
// ============================================

interface CampusSelectorProps {
  campuses: CampusRow[];
  selectedId: string | null;
  summaries: CampusCCMRSummaryRow[];
  onChange: (id: string | null) => void;
}

const CampusSelector = ({
  campuses,
  selectedId,
  summaries,
  onChange,
}: CampusSelectorProps) => {
  const [open, setOpen] = React.useState(false);
  const summaryById = new Map(summaries.map((s) => [s.campus_id, s]));
  const selected = selectedId ? campuses.find((c) => c.id === selectedId) : null;
  const selectedSummary = selectedId ? summaryById.get(selectedId) : null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 p-4 bg-neutral-0 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
      >
        <div className="text-left">
          <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">
            Viewing campus
          </p>
          <p className="text-[16px] font-semibold text-neutral-900">
            {selected?.name ?? "All campuses — district overview"}
          </p>
          {selectedSummary && (
            <p className="text-[13px] text-neutral-600">
              {selectedSummary.total_seniors} seniors ·{" "}
              {Math.round(selectedSummary.ccmr_rate)}% CCMR ·{" "}
              {selectedSummary.at_risk} at risk
            </p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-neutral-400 transition-transform flex-shrink-0",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-0 border border-neutral-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* All campuses option */}
          <button
            onClick={() => {
              onChange(null);
              setOpen(false);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 transition-colors text-left",
              !selectedId && "bg-teal-50"
            )}
          >
            <Building2 className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <div>
              <p className="text-[14px] font-medium text-neutral-900">
                All campuses — district overview
              </p>
              <p className="text-[12px] text-neutral-500">
                Compare all campuses side by side
              </p>
            </div>
          </button>

          {campuses.map((campus) => {
            const s = summaryById.get(campus.id);
            return (
              <button
                key={campus.id}
                onClick={() => {
                  onChange(campus.id);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 last:border-0 transition-colors",
                  selectedId === campus.id && "bg-teal-50"
                )}
              >
                <div className="text-left">
                  <p className="text-[14px] font-medium text-neutral-900">{campus.name}</p>
                  {s && (
                    <p className="text-[12px] text-neutral-500">
                      {s.total_seniors} seniors · {s.at_risk} at risk
                    </p>
                  )}
                </div>
                {s && <RateBadge rate={s.ccmr_rate} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================
// ALL-CAMPUSES COMPARISON TABLE
// ============================================

const ComparisonTable = ({
  summaries,
  onSelectCampus,
}: {
  summaries: CampusCCMRSummaryRow[];
  onSelectCampus: (id: string) => void;
}) => {
  const sorted = [...summaries].sort((a, b) => b.ccmr_rate - a.ccmr_rate);

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200">
        <h2 className="text-[17px] font-semibold text-neutral-900">Campus comparison</h2>
        <p className="text-[13px] text-neutral-500 mt-0.5">
          Current school year · Grade 12 seniors · Click a row to drill in
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="text-left text-[12px] font-semibold text-neutral-700 px-4 py-3">Campus</th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 px-4 py-3">Seniors</th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 px-4 py-3">CCMR met</th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 px-4 py-3">CCMR rate</th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 px-4 py-3">% EB</th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 px-4 py-3">EB rate</th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 px-4 py-3">At risk</th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 px-4 py-3">Missing ED forms</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[13px] text-neutral-500">
                  No campus data available for this school year.
                </td>
              </tr>
            ) : (
              sorted.map((s) => (
                <tr
                  key={s.campus_id}
                  onClick={() => onSelectCampus(s.campus_id)}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium text-neutral-900 group-hover:text-teal-700">
                        {s.campus_name}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-teal-500 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] text-neutral-700">
                    {s.total_seniors}
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] text-neutral-700">
                    {s.ccmr_met}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RateBadge rate={s.ccmr_rate} />
                  </td>
                  <td className="px-4 py-3 text-right text-[13px] text-neutral-600">
                    {pct(ebPct(s))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.eb_rate !== null ? (
                      <span
                        className={cn(
                          "text-[13px] font-medium",
                          s.eb_rate >= 70
                            ? "text-teal-600"
                            : s.eb_rate >= 60
                            ? "text-amber-600"
                            : "text-error"
                        )}
                      >
                        {Math.round(s.eb_rate)}%
                      </span>
                    ) : (
                      <span className="text-neutral-400 text-[13px]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={cn(
                        "text-[13px] font-medium",
                        s.at_risk > 20 ? "text-error" : s.at_risk > 10 ? "text-amber-600" : "text-neutral-700"
                      )}
                    >
                      {s.at_risk}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.missing_ed_forms > 0 ? (
                      <span className="text-[13px] font-medium text-warning-dark">
                        {s.missing_ed_forms}
                      </span>
                    ) : (
                      <span className="text-[13px] text-teal-600 font-medium">✓ Complete</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================
// SINGLE CAMPUS — SUMMARY CARDS
// ============================================

const StatCard = ({
  label,
  value,
  sub,
  valueClass,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClass?: string;
}) => (
  <div className="p-4 bg-neutral-50 rounded-lg">
    <p className="text-[12px] text-neutral-500 mb-1">{label}</p>
    <p className={cn("text-[22px] font-bold text-neutral-900", valueClass)}>{value}</p>
    {sub && <p className="text-[12px] text-neutral-500 mt-0.5">{sub}</p>}
  </div>
);

const CampusSummaryCards = ({ summary }: { summary: CampusCCMRSummaryRow }) => {
  const rate = Math.round(summary.ccmr_rate);
  const ebRate = summary.eb_rate !== null ? Math.round(summary.eb_rate) : null;
  const econRate =
    summary.econ_total > 0
      ? Math.round((summary.econ_met / summary.econ_total) * 100)
      : null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard label="Seniors" value={String(summary.total_seniors)} />
      <StatCard
        label="CCMR met"
        value={`${summary.ccmr_met}`}
        sub={`${rate}% rate`}
        valueClass={rate >= 70 ? "text-teal-600" : rate >= 60 ? "text-amber-600" : "text-error"}
      />
      <StatCard
        label="At risk"
        value={String(summary.at_risk)}
        sub="no indicator met"
        valueClass={summary.at_risk > 20 ? "text-error" : "text-neutral-900"}
      />
      <StatCard
        label="Almost"
        value={String(summary.almost)}
        sub="1 indicator close"
        valueClass="text-amber-600"
      />
      {ebRate !== null ? (
        <StatCard
          label="EB CCMR rate"
          value={`${ebRate}%`}
          sub={`${summary.eb_total} EB seniors`}
          valueClass={ebRate >= 70 ? "text-teal-600" : ebRate >= 60 ? "text-amber-600" : "text-error"}
        />
      ) : (
        <StatCard label="EB seniors" value={String(summary.eb_total)} sub="no rate data" />
      )}
      <StatCard
        label="Missing ED forms"
        value={String(summary.missing_ed_forms)}
        sub={`of ${summary.econ_total} econ disadv`}
        valueClass={summary.missing_ed_forms > 0 ? "text-warning-dark" : "text-teal-600"}
      />
    </div>
  );
};

// ============================================
// INTERVENTION ACTION PLAN
// ============================================

interface ActionItem {
  pathway: string;
  count: number;
  currentRate: number;
  projectedRate: number;
  delta: number;
}

function buildActionPlan(
  interventions: InterventionRow[],
  summary: CampusCCMRSummaryRow
): ActionItem[] {
  if (interventions.length === 0) return [];

  // Deduplicate by student_id per pathway_type
  const byPathway = new Map<string, Set<string>>();
  for (const i of interventions) {
    const key = i.pathway_type ?? "other";
    if (!byPathway.has(key)) byPathway.set(key, new Set());
    byPathway.get(key)!.add(i.student_id);
  }

  const seniors = summary.total_seniors;
  const currentMet = summary.ccmr_met;
  const currentRate = Math.round(summary.ccmr_rate);

  return Array.from(byPathway.entries())
    .map(([pathway, studentSet]) => {
      const count = studentSet.size;
      const projectedMet = currentMet + count;
      const projectedRate =
        seniors > 0 ? Math.round((projectedMet / seniors) * 100) : currentRate;
      return {
        pathway,
        count,
        currentRate,
        projectedRate,
        delta: projectedRate - currentRate,
      };
    })
    .filter((a) => a.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3);
}

const InterventionActionPlan = ({
  interventions,
  summary,
  campusName,
}: {
  interventions: InterventionRow[];
  summary: CampusCCMRSummaryRow;
  campusName: string;
}) => {
  const items = buildActionPlan(interventions, summary);

  if (items.length === 0) {
    return (
      <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
        <h2 className="text-[17px] font-semibold text-neutral-900 mb-3">
          Intervention action plan
        </h2>
        <p className="text-[13px] text-neutral-500">
          No active interventions recorded for this campus.{" "}
          <Link href="/pathways/interventions" className="text-primary-500 hover:underline">
            View all interventions
          </Link>
        </p>
      </div>
    );
  }

  const bestCase = Math.round(summary.ccmr_rate) + items.reduce((s, i) => s + i.delta, 0);

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-teal-100 bg-teal-50">
        <h2 className="text-[17px] font-semibold text-neutral-900">
          {campusName} — intervention action plan
        </h2>
        <p className="text-[13px] text-neutral-600 mt-1">
          Top {items.length} pathways ranked by projected CCMR impact
        </p>
      </div>
      <div className="p-6 space-y-4">
        {items.map((item, idx) => (
          <div key={item.pathway} className="flex gap-4 p-4 bg-neutral-50 rounded-lg">
            <span className="w-7 h-7 flex-shrink-0 bg-teal-600 text-neutral-0 text-[13px] font-bold rounded-full flex items-center justify-center mt-0.5">
              {idx + 1}
            </span>
            <div>
              <p className="text-[14px] font-medium text-neutral-900">
                Get {item.count} student{item.count !== 1 ? "s" : ""} to pass{" "}
                {pathwayLabel(item.pathway)} before graduation
              </p>
              <p className="text-[13px] text-teal-700 mt-1 font-medium">
                Campus CCMR: {item.currentRate}% → {item.projectedRate}%{" "}
                <span className="text-[12px] font-normal text-teal-600">
                  (+{item.delta} points if all succeed)
                </span>
              </p>
            </div>
          </div>
        ))}

        <div className="mt-2 p-4 bg-teal-50 border border-teal-200 rounded-lg">
          <p className="text-[13px] font-semibold text-teal-800">
            If all {items.length} actions succeed, {campusName} CCMR could reach{" "}
            <span className="text-teal-700">{Math.min(bestCase, 100)}%</span> (up from{" "}
            {Math.round(summary.ccmr_rate)}%).
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// ED FORM TRACKING
// ============================================

const EDFormTrackingCard = ({ summary }: { summary: CampusCCMRSummaryRow }) => {
  const total = summary.econ_total;
  const missing = summary.missing_ed_forms;
  const collected = total - missing;
  const collectedPct = total > 0 ? Math.round((collected / total) * 100) : 100;

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
      <div className="p-6 border-b border-neutral-200">
        <h2 className="text-[17px] font-semibold text-neutral-900">
          Economically disadvantaged documentation
        </h2>
        <p className="text-[13px] text-neutral-500 mt-1">
          ED form collection — hidden accountability lever
        </p>
        <p className="text-[12px] text-neutral-400 mt-0.5">
          Your documented ED% determines which scoring bracket TEA uses. Under-documenting means
          you&apos;re graded against a harder standard.
        </p>
      </div>

      <div className="p-6 border-b border-neutral-200">
        {/* Progress bar */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px] font-medium text-neutral-700">Form collection progress</span>
          <span className="text-[13px] font-semibold text-neutral-900">{collectedPct}%</span>
        </div>
        <div className="h-4 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              collectedPct === 100 ? "bg-teal-500" : "bg-teal-500"
            )}
            style={{ width: `${collectedPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[11px] text-teal-600">
            {collected.toLocaleString()} collected
          </span>
          {missing > 0 && (
            <span className="text-[11px] text-warning-dark">
              {missing.toLocaleString()} missing
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-5">
          <div className="text-center">
            <p className="text-[20px] font-bold text-neutral-900">{total}</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Econ disadvantaged students</p>
          </div>
          <div className="text-center">
            <p className="text-[20px] font-bold text-teal-600">{collected}</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">ED forms collected</p>
          </div>
          <div className="text-center">
            <p className={cn("text-[20px] font-bold", missing > 0 ? "text-warning-dark" : "text-teal-600")}>
              {missing}
            </p>
            <p className="text-[11px] text-neutral-500 mt-0.5">Missing forms</p>
          </div>
        </div>
      </div>

      {missing > 0 && (
        <div className="p-5 bg-warning-light flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning-dark flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-warning-dark">
              {missing} students are missing ED documentation.
            </p>
            <p className="text-[12px] text-warning-dark/80 mt-1">
              Collecting these forms could raise your documented ED% and lower your CCMR scoring
              threshold — potentially worth several accountability points at no instructional cost.
            </p>
          </div>
        </div>
      )}

      <div className="p-5 flex flex-wrap items-center gap-3">
        <Link
          href="/pathways/students"
          className="text-[13px] font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
        >
          <FileText className="w-4 h-4" />
          View students missing ED forms
        </Link>
      </div>
    </div>
  );
};

// ============================================
// CAMPUS YoY TREND
// ============================================

const CampusYoYTrend = ({ snapshots }: { snapshots: SnapshotRow[] }) => {
  if (snapshots.length === 0) {
    return (
      <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
        <h2 className="text-[17px] font-semibold text-neutral-900 mb-3">
          Campus year-over-year trend
        </h2>
        <p className="text-[13px] text-neutral-500 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Historical data not yet available for individual campuses.
        </p>
      </div>
    );
  }

  const sorted = [...snapshots].sort((a, b) => a.graduation_year - b.graduation_year);

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-6">
      <h2 className="text-[17px] font-semibold text-neutral-900 mb-4">
        Campus year-over-year trend
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left text-[12px] font-semibold text-neutral-700 pb-3">
                Graduating class
              </th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">
                Grads
              </th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">
                CCMR met
              </th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">
                Rate
              </th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 pb-3">
                EB rate
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((snap) => (
              <tr
                key={snap.graduation_year}
                className="border-b border-neutral-100 last:border-0"
              >
                <td className="py-3 text-[13px] text-neutral-900">
                  Class of {snap.graduation_year}
                </td>
                <td className="py-3 text-right text-[13px] text-neutral-700">
                  {snap.total_graduates.toLocaleString()}
                </td>
                <td className="py-3 text-right text-[13px] text-neutral-700">
                  {snap.ccmr_met_count.toLocaleString()}
                </td>
                <td className="py-3 text-right">
                  <RateBadge rate={snap.ccmr_rate} />
                </td>
                <td className="py-3 text-right text-[13px] text-neutral-700">
                  {snap.eb_rate !== null ? `${Math.round(snap.eb_rate)}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================
// SINGLE CAMPUS VIEW
// ============================================

interface SingleCampusViewProps {
  summary: CampusCCMRSummaryRow;
  campusName: string;
  snapshots: SnapshotRow[];
  interventions: InterventionRow[];
  isLoading: boolean;
}

const SingleCampusView = ({
  summary,
  campusName,
  snapshots,
  interventions,
  isLoading,
}: SingleCampusViewProps) => (
  <div
    className={cn(
      "space-y-6 transition-opacity duration-150",
      isLoading && "opacity-50 pointer-events-none"
    )}
  >
    {/* Campus name heading */}
    <div className="flex items-center gap-3">
      <Building2 className="w-6 h-6 text-teal-600" />
      <div>
        <h2 className="text-[20px] font-semibold text-neutral-900">{campusName}</h2>
        <p className="text-[13px] text-neutral-500">
          Class of {summary.graduation_year} · Grade 12 seniors
        </p>
      </div>
    </div>

    {/* Summary stats */}
    <CampusSummaryCards summary={summary} />

    {/* Action plan + ED forms side by side on large screens */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <InterventionActionPlan
        interventions={interventions}
        summary={summary}
        campusName={campusName}
      />
      <EDFormTrackingCard summary={summary} />
    </div>

    {/* YoY trend */}
    <CampusYoYTrend snapshots={snapshots} />

    {/* A-F Simulator link */}
    <Link
      href="/pathways/simulator"
      className="flex items-center justify-between p-5 bg-gradient-to-r from-teal-50 to-primary-50 border border-teal-200 rounded-lg hover:from-teal-100 hover:to-primary-100 transition-colors group"
    >
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Gauge className="w-5 h-5 text-neutral-0" />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-neutral-900">
            See how these changes impact your A-F rating
          </p>
          <p className="text-[13px] text-neutral-500 mt-0.5">
            Model scenarios with TEA&apos;s actual accountability formula
          </p>
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-teal-500 group-hover:translate-x-1 transition-transform flex-shrink-0" />
    </Link>
  </div>
);

// ============================================
// DISTRICT OVERVIEW
// ============================================

const DistrictOverview = ({
  summaries,
  onSelectCampus,
}: {
  summaries: CampusCCMRSummaryRow[];
  onSelectCampus: (id: string) => void;
}) => {
  const totals = summaries.reduce(
    (acc, s) => ({
      seniors: acc.seniors + s.total_seniors,
      met: acc.met + s.ccmr_met,
      atRisk: acc.atRisk + s.at_risk,
      missingForms: acc.missingForms + s.missing_ed_forms,
    }),
    { seniors: 0, met: 0, atRisk: 0, missingForms: 0 }
  );
  const districtRate =
    totals.seniors > 0 ? Math.round((totals.met / totals.seniors) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* District summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-neutral-400" />
            <p className="text-[12px] text-neutral-500">Total seniors</p>
          </div>
          <p className="text-[22px] font-bold text-neutral-900">
            {totals.seniors.toLocaleString()}
          </p>
        </div>
        <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-teal-500" />
            <p className="text-[12px] text-neutral-500">District CCMR rate</p>
          </div>
          <p
            className={cn(
              "text-[22px] font-bold",
              districtRate >= 70
                ? "text-teal-600"
                : districtRate >= 60
                ? "text-amber-600"
                : "text-error"
            )}
          >
            {districtRate}%
          </p>
        </div>
        <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-error" />
            <p className="text-[12px] text-neutral-500">At risk (district)</p>
          </div>
          <p className="text-[22px] font-bold text-error">{totals.atRisk}</p>
        </div>
        <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-warning-dark" />
            <p className="text-[12px] text-neutral-500">Missing ED forms</p>
          </div>
          <p
            className={cn(
              "text-[22px] font-bold",
              totals.missingForms > 0 ? "text-warning-dark" : "text-teal-600"
            )}
          >
            {totals.missingForms}
          </p>
        </div>
      </div>

      {/* Campus comparison table */}
      <ComparisonTable summaries={summaries} onSelectCampus={onSelectCampus} />
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export interface CampusReportsPageProps {
  summaries: CampusCCMRSummaryRow[];
  campuses: CampusRow[];
}

export const CampusReportsPage = ({ summaries, campuses }: CampusReportsPageProps) => {
  const [selectedCampusId, setSelectedCampusId] = React.useState<string | null>(null);
  const [snapshots, setSnapshots] = React.useState<SnapshotRow[]>([]);
  const [interventions, setInterventions] = React.useState<InterventionRow[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const summaryById = React.useMemo(
    () => new Map(summaries.map((s) => [s.campus_id, s])),
    [summaries]
  );
  const campusNameById = React.useMemo(
    () => new Map(campuses.map((c) => [c.id, c.name])),
    [campuses]
  );

  const handleCampusSelect = React.useCallback(
    async (id: string | null) => {
      setSelectedCampusId(id);
      if (!id) {
        setSnapshots([]);
        setInterventions([]);
        return;
      }
      setIsLoading(true);
      try {
        const { snapshots: s, interventions: i } = await fetchCampusDetail(id);
        setSnapshots(s);
        setInterventions(i);
      } catch (err) {
        console.error("Failed to load campus data:", err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const selectedSummary = selectedCampusId ? summaryById.get(selectedCampusId) : null;
  const selectedCampusName = selectedCampusId
    ? (campusNameById.get(selectedCampusId) ?? "Campus")
    : null;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-[24px] font-semibold text-neutral-900">Campus Reports</h1>
        <p className="text-[14px] text-neutral-600 mt-1">
          Campus-by-campus CCMR breakdown for principals and district leadership
        </p>
      </div>

      {/* Campus selector */}
      <CampusSelector
        campuses={campuses}
        selectedId={selectedCampusId}
        summaries={summaries}
        onChange={handleCampusSelect}
      />

      {/* Content */}
      {selectedCampusId && selectedSummary ? (
        <SingleCampusView
          summary={selectedSummary}
          campusName={selectedCampusName!}
          snapshots={snapshots}
          interventions={interventions}
          isLoading={isLoading}
        />
      ) : (
        <DistrictOverview summaries={summaries} onSelectCampus={handleCampusSelect} />
      )}
    </div>
  );
};

export default CampusReportsPage;
