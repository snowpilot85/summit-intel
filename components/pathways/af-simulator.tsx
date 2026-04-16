"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import {
  simulate,
  letterGrade,
  type SimulatorInput,
  type SimulatorResult,
} from "@/lib/tea-accountability";
import type { CampusCCMRSummaryRow, CampusRow } from "@/types/database";

/* ============================================
   Summit Pathways — A-F Accountability Simulator
   TEA 2025 Chapter 5 math, live slider updates
   ============================================ */

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(n: number, total: number): number {
  return total === 0 ? 0 : (n / total) * 100;
}

function fmt1(n: number): string {
  return n.toFixed(1);
}

function gradeColor(g: string): string {
  switch (g) {
    case "A": return "bg-green-500 text-white";
    case "B": return "bg-teal-500 text-white";
    case "C": return "bg-amber-400 text-white";
    case "D": return "bg-orange-500 text-white";
    default:  return "bg-red-500 text-white";
  }
}

function gradeRing(g: string): string {
  switch (g) {
    case "A": return "ring-green-200 bg-green-50 text-green-800";
    case "B": return "ring-teal-200 bg-teal-50 text-teal-800";
    case "C": return "ring-amber-200 bg-amber-50 text-amber-800";
    case "D": return "ring-orange-200 bg-orange-50 text-orange-800";
    default:  return "ring-red-200 bg-red-50 text-red-800";
  }
}

function Delta({ a, b, suffix = "" }: { a: number; b: number; suffix?: string }) {
  const d = Math.round(b - a);
  if (d === 0) return <span className="text-neutral-400">—</span>;
  return (
    <span className={d > 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
      {d > 0 ? "+" : ""}
      {d}
      {suffix}
    </span>
  );
}

function DeltaPct({ a, b }: { a: number; b: number }) {
  const d = b - a;
  if (Math.abs(d) < 0.05) return <span className="text-neutral-400">—</span>;
  return (
    <span className={d > 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
      {d > 0 ? "+" : ""}
      {fmt1(d)}%
    </span>
  );
}

interface SummaryLike {
  campus_id: string;
  campus_name: string;
  total_seniors: number;
  ccmr_met: number;
  at_risk: number;
  almost: number;
  econ_total: number;
  missing_ed_forms: number;
}

function aggregateSummaries(rows: CampusCCMRSummaryRow[]): SummaryLike {
  return {
    campus_id: "__district__",
    campus_name: "District Overview",
    total_seniors:    rows.reduce((s, r) => s + r.total_seniors, 0),
    ccmr_met:         rows.reduce((s, r) => s + r.ccmr_met, 0),
    at_risk:          rows.reduce((s, r) => s + r.at_risk, 0),
    almost:           rows.reduce((s, r) => s + r.almost, 0),
    econ_total:       rows.reduce((s, r) => s + r.econ_total, 0),
    missing_ed_forms: rows.reduce((s, r) => s + r.missing_ed_forms, 0),
  };
}

// ── Slider ────────────────────────────────────────────────────────────────────

interface SliderProps {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  accentClass?: string;
}

function Slider({ label, value, max, onChange, disabled, accentClass = "accent-primary-500" }: SliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[13px] font-medium text-neutral-700">{label}</span>
        <span className="text-[13px] font-semibold text-neutral-900 tabular-nums">
          {value} / {max}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        disabled={disabled || max === 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn("w-full h-2 rounded-full cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed", accentClass)}
      />
    </div>
  );
}

// ── Number input ──────────────────────────────────────────────────────────────

interface NumInputProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  suffix?: string;
  onChange: (v: number) => void;
  hint?: string;
}

function NumInput({ label, value, min = 0, max = 100, suffix, onChange, hint }: NumInputProps) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-neutral-600 mb-1">
        {label}
        {hint && (
          <span className="ml-1 text-neutral-400" title={hint}>
            <Info className="inline w-3 h-3" />
          </span>
        )}
      </label>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const v = Math.min(max, Math.max(min, Number(e.target.value) || 0));
            onChange(v);
          }}
          className="w-20 px-2 py-1.5 text-[13px] border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
        {suffix && <span className="text-[12px] text-neutral-500">{suffix}</span>}
      </div>
    </div>
  );
}

// ── Grade badge ───────────────────────────────────────────────────────────────

interface GradeBadgeProps {
  grade: string;
  score: number;
  size?: "sm" | "lg";
  animated?: boolean;
}

function GradeBadge({ grade, score, size = "sm", animated = false }: GradeBadgeProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        animated && "transition-all duration-300"
      )}
    >
      <div
        className={cn(
          "rounded-xl font-bold tabular-nums flex items-center justify-center",
          gradeColor(grade),
          size === "lg" ? "w-16 h-16 text-4xl" : "w-9 h-9 text-lg"
        )}
      >
        {grade}
      </div>
      <div>
        <div className={cn("font-semibold tabular-nums text-neutral-900", size === "lg" ? "text-xl" : "text-[14px]")}>
          {score}
        </div>
        <div className="text-[11px] text-neutral-500">pts</div>
      </div>
    </div>
  );
}

// ── Comparison table ──────────────────────────────────────────────────────────

interface CompareRowProps {
  label: string;
  current: React.ReactNode;
  projected: React.ReactNode;
  delta: React.ReactNode;
  highlight?: boolean;
  indent?: boolean;
}

function CompareRow({ label, current, projected, delta, highlight, indent }: CompareRowProps) {
  return (
    <tr className={cn(highlight && "bg-neutral-50 font-semibold")}>
      <td className={cn("py-2 pr-3 text-[13px] text-neutral-600", indent && "pl-4")}>
        {label}
      </td>
      <td className="py-2 pr-3 text-[13px] text-neutral-900 tabular-nums text-right">{current}</td>
      <td className="py-2 pr-3 text-[13px] text-neutral-900 tabular-nums text-right">{projected}</td>
      <td className="py-2 text-[13px] text-right tabular-nums">{delta}</td>
    </tr>
  );
}

function ScoreCell({ score, grade }: { score: number; grade: string }) {
  return (
    <span>
      {score}{" "}
      <span className={cn("text-[11px] font-semibold px-1 py-0.5 rounded", gradeRing(grade))}>
        {grade}
      </span>
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface AFSimulatorPageProps {
  summaries: CampusCCMRSummaryRow[];
  campuses: CampusRow[];
}

export function AFSimulatorPage({ summaries, campuses }: AFSimulatorPageProps) {
  // Filter to the most recent graduation year
  const years = summaries.map((s) => s.graduation_year);
  const maxYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear();
  const currentSummaries = summaries.filter((s) => s.graduation_year === maxYear);

  const districtAggregate = React.useMemo(
    () => aggregateSummaries(currentSummaries),
    [currentSummaries]
  );

  // ── State ──
  const defaultId = currentSummaries[0]?.campus_id ?? "__district__";
  const [selectedId, setSelectedId] = React.useState<string>(defaultId);
  const [ccmrAdd, setCcmrAdd]       = React.useState(0);
  const [edAdd, setEdAdd]           = React.useState(0);
  const [staarScaled, setStaarScaled]   = React.useState(70);
  const [partA, setPartA]               = React.useState(65);
  const [gradRateScaled, setGradRateScaled] = React.useState(82);
  const [ctgScaled, setCtgScaled]       = React.useState(70);
  const [advOpen, setAdvOpen]       = React.useState(false);
  const [gradeFlash, setGradeFlash] = React.useState(false);
  const prevGradeRef = React.useRef<string | null>(null);

  // Reset sliders when campus changes
  React.useEffect(() => {
    setCcmrAdd(0);
    setEdAdd(0);
  }, [selectedId]);

  // ── Selected data ──
  const selected: SummaryLike = React.useMemo(() => {
    if (selectedId === "__district__") return districtAggregate;
    const found = currentSummaries.find((s) => s.campus_id === selectedId);
    return found ?? districtAggregate;
  }, [selectedId, currentSummaries, districtAggregate]);

  const documentedED  = selected.econ_total - selected.missing_ed_forms;
  const sliderMaxCCMR = selected.at_risk + selected.almost;
  const sliderMaxED   = selected.missing_ed_forms;

  const sharedInput: Omit<SimulatorInput, "ccmrAdditions" | "edAdditions"> = {
    ccmrMet:              selected.ccmr_met,
    totalSeniors:         selected.total_seniors,
    documentedED,
    missingEdForms:       selected.missing_ed_forms,
    staarScaled,
    academicGrowthPartA:  partA,
    gradRateScaled,
    closingGapsScaled:    ctgScaled,
  };

  const current   = simulate({ ...sharedInput, ccmrAdditions: 0,       edAdditions: 0 });
  const projected = simulate({ ...sharedInput, ccmrAdditions: ccmrAdd, edAdditions: edAdd });

  // Grade change animation
  React.useEffect(() => {
    if (prevGradeRef.current !== null && prevGradeRef.current !== projected.grade) {
      setGradeFlash(true);
      const t = setTimeout(() => setGradeFlash(false), 1200);
      return () => clearTimeout(t);
    }
    prevGradeRef.current = projected.grade;
  }, [projected.grade]);

  // ── Action plan text ──
  const actions: string[] = [];
  if (ccmrAdd > 0) {
    const pathways = ["CTE certification or dual enrollment", "TSI or SAT/ACT attainment", "AP/IB exam passage"];
    actions.push(
      `Move ${ccmrAdd} at-risk senior${ccmrAdd === 1 ? "" : "s"} to CCMR-met via ${pathways[0]}, ${pathways[1]}, or ${pathways[2]}.`
    );
  }
  if (edAdd > 0) {
    actions.push(
      `Collect ${edAdd} outstanding ED documentation form${edAdd === 1 ? "" : "s"} from economically disadvantaged students.`
    );
  }
  const gradeChanged = current.grade !== projected.grade;

  // ── No data state ──
  if (currentSummaries.length === 0) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center">
        <p className="text-[15px] font-medium text-neutral-700">No campus summary data available.</p>
        <p className="text-[13px] text-neutral-500 mt-1">Upload student data to enable the simulator.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold text-neutral-900">A-F Accountability Simulator</h1>
          <p className="text-[13px] text-neutral-500 mt-0.5">
            Adjust sliders to project your campus rating using TEA&rsquo;s 2025 accountability formula.
          </p>
        </div>

        {/* Campus selector */}
        <div className="relative">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 text-[14px] font-medium border border-neutral-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-400 min-w-[220px]"
          >
            <option value="__district__">District Overview</option>
            {currentSummaries.map((s) => (
              <option key={s.campus_id} value={s.campus_id}>
                {s.campus_name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
        </div>
      </div>

      {/* ── Current state pills ── */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Seniors",    value: selected.total_seniors.toString() },
          { label: "CCMR Met",   value: `${selected.ccmr_met} (${fmt1(pct(selected.ccmr_met, selected.total_seniors))}%)` },
          { label: "At Risk",    value: selected.at_risk.toString() },
          { label: "Almost",     value: selected.almost.toString() },
          { label: "Econ Disadv",value: selected.econ_total.toString() },
          { label: "Missing ED", value: selected.missing_ed_forms.toString() },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-neutral-200 rounded-lg px-3 py-2">
            <div className="text-[11px] text-neutral-500 uppercase tracking-wide">{label}</div>
            <div className="text-[14px] font-semibold text-neutral-900 mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="grid lg:grid-cols-5 gap-5 items-start">
        {/* Left: Sliders */}
        <div className="lg:col-span-2 space-y-4">
          {/* CCMR Slider */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
            <div>
              <h2 className="text-[15px] font-semibold text-neutral-900">
                What if more students meet CCMR?
              </h2>
              <p className="text-[12px] text-neutral-500 mt-0.5">
                Drag to add students from the at-risk and almost groups.
              </p>
            </div>

            <Slider
              label="Additional students meeting CCMR"
              value={ccmrAdd}
              max={sliderMaxCCMR}
              onChange={setCcmrAdd}
              accentClass="accent-teal-600"
            />

            <div className="bg-teal-50 rounded-lg px-3 py-2.5 text-[12px] text-teal-800 space-y-0.5">
              <div>
                <span className="font-semibold">Projected:</span>{" "}
                {projected.ccmrMet} of {projected.totalSeniors} seniors meet CCMR
                {" "}→{" "}
                <span className="font-semibold">{fmt1(projected.ccmrRate)}%</span>
              </div>
              <div className="text-teal-600">
                Currently: {current.ccmrMet} of {current.totalSeniors} → {fmt1(current.ccmrRate)}%
              </div>
            </div>
          </div>

          {/* ED Slider */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4">
            <div>
              <h2 className="text-[15px] font-semibold text-neutral-900">
                What if we collect missing ED forms?
              </h2>
              <p className="text-[12px] text-neutral-500 mt-0.5">
                Documented econ-disadvantaged % shifts your Relative Performance cut points.
              </p>
            </div>

            <Slider
              label="Additional ED forms collected"
              value={edAdd}
              max={sliderMaxED}
              onChange={setEdAdd}
              disabled={sliderMaxED === 0}
              accentClass="accent-primary-500"
            />

            <div className="bg-primary-50 rounded-lg px-3 py-2.5 text-[12px] text-primary-800 space-y-0.5">
              <div>
                <span className="font-semibold">Projected documented ED%:</span>{" "}
                <span className="font-semibold">{fmt1(projected.edPct)}%</span>
              </div>
              <div className="text-primary-600">
                Currently: {fmt1(current.edPct)}%
              </div>
            </div>
          </div>

          {/* Advanced inputs */}
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setAdvOpen(!advOpen)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-[14px] font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              <span>Additional district inputs</span>
              {advOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {advOpen && (
              <div className="px-5 pb-5 border-t border-neutral-100">
                <p className="text-[12px] text-neutral-500 mt-3 mb-4">
                  Enter your district&rsquo;s known scores for a more accurate simulation. These don&rsquo;t change with the sliders above.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <NumInput
                    label="STAAR scaled score (0–100)"
                    value={staarScaled}
                    onChange={setStaarScaled}
                    hint="Scaled STAAR component score as shown on your TXSchools.gov accountability page"
                  />
                  <NumInput
                    label="Grad rate scaled score (0–100)"
                    value={gradRateScaled}
                    onChange={setGradRateScaled}
                    hint="Scaled graduation rate component score as shown on your TXSchools.gov accountability page"
                  />
                  <NumInput
                    label="Academic Growth scaled score (0–100)"
                    value={partA}
                    onChange={setPartA}
                    hint="School Progress Part A (Academic Growth) scaled score from your TXSchools.gov accountability page"
                  />
                  <NumInput
                    label="Closing the Gaps scaled score (0–100)"
                    value={ctgScaled}
                    onChange={setCtgScaled}
                    hint="Closing the Gaps domain scaled score from your TXSchools.gov accountability page"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-3 space-y-4">
          {/* Grade comparison banner */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5">
            <div className="flex items-center justify-around">
              <div className="text-center">
                <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-2">Current</p>
                <GradeBadge grade={current.grade} score={current.overall} size="lg" />
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="text-neutral-300 text-2xl">→</div>
                {gradeChanged && (
                  <span className="text-[11px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                    {current.grade} → {projected.grade}
                  </span>
                )}
              </div>

              <div className="text-center">
                <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide mb-2">Projected</p>
                <div
                  className={cn(
                    "transition-all duration-300",
                    gradeFlash && "scale-110 drop-shadow-lg"
                  )}
                >
                  <GradeBadge grade={projected.grade} score={projected.overall} size="lg" animated />
                </div>
              </div>
            </div>
          </div>

          {/* Comparison table */}
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-neutral-900">Score breakdown</h2>
              <span className="text-[11px] text-neutral-400">Updates in real time</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full px-5">
                <thead>
                  <tr className="border-b border-neutral-100">
                    <th className="px-5 py-2 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wide w-[180px]">
                      Metric
                    </th>
                    <th className="px-2 py-2 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">
                      Current
                    </th>
                    <th className="px-2 py-2 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">
                      Projected
                    </th>
                    <th className="px-5 py-2 text-right text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {/* Rates */}
                  <tr>
                    <td colSpan={4} className="px-5 pt-3 pb-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">
                      Input rates
                    </td>
                  </tr>
                  <CompareRow
                    label="CCMR Rate"
                    current={<>{fmt1(current.ccmrRate)}%</>}
                    projected={<>{fmt1(projected.ccmrRate)}%</>}
                    delta={<DeltaPct a={current.ccmrRate} b={projected.ccmrRate} />}
                    indent
                  />
                  <CompareRow
                    label="Documented ED%"
                    current={<>{fmt1(current.edPct)}%</>}
                    projected={<>{fmt1(projected.edPct)}%</>}
                    delta={<DeltaPct a={current.edPct} b={projected.edPct} />}
                    indent
                  />

                  {/* Student Achievement */}
                  <tr>
                    <td colSpan={4} className="px-5 pt-3 pb-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">
                      Student Achievement domain (SA)
                    </td>
                  </tr>
                  <CompareRow
                    label="CCMR scaled"
                    current={current.ccmrScaled}
                    projected={projected.ccmrScaled}
                    delta={<Delta a={current.ccmrScaled} b={projected.ccmrScaled} />}
                    indent
                  />
                  <CompareRow
                    label="STAAR scaled"
                    current={current.staarScaled}
                    projected={projected.staarScaled}
                    delta={<Delta a={current.staarScaled} b={projected.staarScaled} />}
                    indent
                  />
                  <CompareRow
                    label="Grad rate scaled"
                    current={current.gradRateScaled}
                    projected={projected.gradRateScaled}
                    delta={<Delta a={current.gradRateScaled} b={projected.gradRateScaled} />}
                    indent
                  />
                  <CompareRow
                    label="Student Achievement"
                    current={<ScoreCell score={current.studentAchievement} grade={letterGrade(current.studentAchievement)} />}
                    projected={<ScoreCell score={projected.studentAchievement} grade={letterGrade(projected.studentAchievement)} />}
                    delta={<Delta a={current.studentAchievement} b={projected.studentAchievement} />}
                    highlight
                  />

                  {/* School Progress */}
                  <tr>
                    <td colSpan={4} className="px-5 pt-3 pb-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">
                      School Progress domain (SP)
                    </td>
                  </tr>
                  <CompareRow
                    label="Part A (Academic Growth)"
                    current={<ScoreCell score={current.partA} grade={letterGrade(current.partA)} />}
                    projected={<ScoreCell score={projected.partA} grade={letterGrade(projected.partA)} />}
                    delta={<Delta a={current.partA} b={projected.partA} />}
                    indent
                  />
                  <CompareRow
                    label="Part B (Relative Perf.)"
                    current={<ScoreCell score={current.partB} grade={letterGrade(current.partB)} />}
                    projected={<ScoreCell score={projected.partB} grade={letterGrade(projected.partB)} />}
                    delta={<Delta a={current.partB} b={projected.partB} />}
                    indent
                  />
                  <CompareRow
                    label="School Progress"
                    current={<ScoreCell score={current.schoolProgress} grade={letterGrade(current.schoolProgress)} />}
                    projected={<ScoreCell score={projected.schoolProgress} grade={letterGrade(projected.schoolProgress)} />}
                    delta={<Delta a={current.schoolProgress} b={projected.schoolProgress} />}
                    highlight
                  />

                  {/* Closing Gaps + Overall */}
                  <tr>
                    <td colSpan={4} className="px-5 pt-3 pb-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wide">
                      Overall
                    </td>
                  </tr>
                  <CompareRow
                    label="Closing the Gaps"
                    current={<ScoreCell score={current.closingGaps} grade={letterGrade(current.closingGaps)} />}
                    projected={<ScoreCell score={projected.closingGaps} grade={letterGrade(projected.closingGaps)} />}
                    delta={<Delta a={current.closingGaps} b={projected.closingGaps} />}
                    indent
                  />
                  <tr className="bg-neutral-900">
                    <td className="px-5 py-3 text-[13px] font-bold text-white rounded-bl-lg">Overall Rating</td>
                    <td className="px-2 py-3 text-right">
                      <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold text-[13px]", gradeRing(current.grade))}>
                        {current.overall} <span>{current.grade}</span>
                      </span>
                    </td>
                    <td className="px-2 py-3 text-right">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-bold text-[13px] transition-all duration-300",
                        gradeRing(projected.grade),
                        gradeFlash && "ring-2 scale-105"
                      )}>
                        {projected.overall} <span>{projected.grade}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right rounded-br-lg">
                      <Delta a={current.overall} b={projected.overall} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Formula notes */}
            <div className="px-5 py-3 border-t border-neutral-100 text-[11px] text-neutral-400 space-y-0.5">
              <p>SA = STAAR (40%) + CCMR (40%) + Grad Rate (20%)</p>
              <p>SP = better of Part A and Part B (capped at 89 if either &lt; 60)</p>
              <p>Overall = max(SA, SP) × 70% + Closing Gaps × 30%</p>
            </div>
          </div>

          {/* Action plan */}
          {actions.length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-xl p-5">
              <h2 className="text-[14px] font-semibold text-neutral-900 mb-3">How to get there</h2>
              <ul className="space-y-2">
                {actions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13px] text-neutral-700">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-teal-100 text-teal-700 text-[11px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    {a}
                  </li>
                ))}
                <li className="flex items-start gap-2.5 text-[13px] text-neutral-700 pt-1 border-t border-neutral-100 mt-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-[11px] font-bold flex items-center justify-center mt-0.5">
                    →
                  </span>
                  <span>
                    <span className="font-medium">Combined impact:</span>{" "}
                    Overall rating improves from{" "}
                    <span className={cn("font-bold px-1 py-0.5 rounded", gradeRing(current.grade))}>
                      {current.overall} ({current.grade})
                    </span>{" "}
                    to{" "}
                    <span className={cn("font-bold px-1 py-0.5 rounded", gradeRing(projected.grade))}>
                      {projected.overall} ({projected.grade})
                    </span>
                    {gradeChanged && (
                      <span className="ml-2 text-teal-600 font-semibold">
                        — letter grade improves!
                      </span>
                    )}
                  </span>
                </li>
              </ul>
            </div>
          )}

          {actions.length === 0 && (
            <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-xl px-5 py-4 text-[13px] text-neutral-500 text-center">
              Move the sliders above to generate your action plan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
