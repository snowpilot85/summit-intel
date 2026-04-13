"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  ChevronDown,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";

/* ============================================
   A-F Accountability Impact Simulator
   Standalone page with TEA formula implementation
   ============================================ */

// ============================================
// TYPES
// ============================================

interface Campus {
  id: string;
  name: string;
  ccmrRaw: number;
  staarRaw: number;
  gradRate: number;
  growthPartARaw: number;
  closingGapsRaw: number;
  edPercent: number;
}

interface CalculationResult {
  staarScaled: number;
  staarLetter: string;
  ccmrScaled: number;
  ccmrLetter: string;
  gradScaled: number;
  gradLetter: string;
  domain1: number;
  domain1Letter: string;
  partAScaled: number;
  partALetter: string;
  partBScaled: number;
  partBLetter: string;
  domain2: number;
  domain2Letter: string;
  betterDomain: number;
  betterDomainLabel: string;
  domain3: number;
  domain3Letter: string;
  overall: number;
  overallLetter: string;
}

// ============================================
// MOCK DATA
// ============================================

const campuses: Campus[] = [
  { id: "edinburg-north", name: "Edinburg North H S", ccmrRaw: 72, staarRaw: 36, gradRate: 94.2, growthPartARaw: 78, closingGapsRaw: 62, edPercent: 67.9 },
  { id: "economedes", name: "Economedes H S", ccmrRaw: 75, staarRaw: 42, gradRate: 95.1, growthPartARaw: 80, closingGapsRaw: 58, edPercent: 71.2 },
  { id: "vela", name: "Vela H S", ccmrRaw: 69, staarRaw: 38, gradRate: 93.5, growthPartARaw: 76, closingGapsRaw: 55, edPercent: 64.3 },
  { id: "edinburg", name: "Edinburg H S", ccmrRaw: 64, staarRaw: 34, gradRate: 92.8, growthPartARaw: 74, closingGapsRaw: 52, edPercent: 72.5 },
];

// ============================================
// TEA SCALING FORMULAS (from accountability manual)
// ============================================

const CUT_POINTS = {
  staar: { a: 60, b: 53, c: 41, d: 35 },
  ccmr: { a: 88, b: 78, c: 64, d: 51 },
  growthPartA: { a: 85, b: 74, c: 68, d: 62 },
  closingGaps: { a: 74, b: 62, c: 48, d: 37 },
};

function scaleScore(raw: number, cutPoints: { a: number; b: number; c: number; d: number }): number {
  const { a, b, c, d } = cutPoints;
  
  if (raw >= a) {
    // A range: 90-100
    return Math.round(90 + 10 * (raw - a) / (100 - a));
  } else if (raw >= b) {
    // B range: 80-89
    return Math.round(80 + 9 * (raw - b) / (a - b));
  } else if (raw >= c) {
    // C range: 70-79
    return Math.round(70 + 9 * (raw - c) / (b - c));
  } else if (raw >= d) {
    // D range: 60-69
    return Math.round(60 + 9 * (raw - d) / (c - d));
  } else {
    // F range: below 60
    return Math.max(0, Math.round(59 * raw / d));
  }
}

function scaleGradRate(rate: number): number {
  if (rate >= 98) return 95;
  if (rate >= 97) return 85;
  if (rate >= 96) return 80;
  if (rate >= 95) return 75;
  if (rate >= 94) return 70;
  if (rate >= 91) return 65;
  if (rate >= 88) return 60;
  if (rate >= 72) return 55;
  if (rate >= 50) return 50;
  return 40;
}

function letterGrade(scaled: number): string {
  if (scaled >= 90) return "A";
  if (scaled >= 80) return "B";
  if (scaled >= 70) return "C";
  if (scaled >= 60) return "D";
  return "F";
}

function calculateRating(ccmrRate: number, edPercent: number, staarRaw: number, campus: Campus): CalculationResult {
  // Step 1: Scale each component
  const staarScaled = scaleScore(staarRaw, CUT_POINTS.staar);
  const ccmrScaled = scaleScore(ccmrRate, CUT_POINTS.ccmr);
  const gradScaled = scaleGradRate(campus.gradRate);
  
  // Step 2: Domain 1 = STAAR (40%) + CCMR (40%) + Grad Rate (20%)
  const domain1 = Math.round(staarScaled * 0.4 + ccmrScaled * 0.4 + gradScaled * 0.2);
  
  // Step 3: Domain 2 Part A (using fixed campus value)
  const partAScaled = scaleScore(campus.growthPartARaw, CUT_POINTS.growthPartA);
  
  // Step 4: Domain 2 Part B — affected by ED%
  // Higher ED% = lower cut scores = higher scaled score
  // Approximate: Part B CCMR scaled gets a bonus as ED% increases
  const edBonus = Math.max(0, (edPercent - campus.edPercent) * 0.3);
  const partBScaled = Math.min(89, Math.round(ccmrScaled + edBonus));
  
  // Step 5: Domain 2 = better of Part A or Part B
  const domain2 = Math.max(partAScaled, partBScaled);
  
  // Step 6: If either domain < 60, cap the better at 89
  let betterDomain = Math.max(domain1, domain2);
  if ((domain1 < 60 || domain2 < 60) && betterDomain > 89) {
    betterDomain = 89;
  }
  
  // Step 7: Domain 3 (fixed for demo)
  const domain3 = scaleScore(campus.closingGapsRaw, CUT_POINTS.closingGaps);
  
  // Step 8: Overall = better domain × 70% + domain 3 × 30%
  const overall = Math.round(betterDomain * 0.7 + domain3 * 0.3);
  
  return {
    staarScaled,
    staarLetter: letterGrade(staarScaled),
    ccmrScaled,
    ccmrLetter: letterGrade(ccmrScaled),
    gradScaled,
    gradLetter: letterGrade(gradScaled),
    domain1,
    domain1Letter: letterGrade(domain1),
    partAScaled,
    partALetter: letterGrade(partAScaled),
    partBScaled,
    partBLetter: letterGrade(partBScaled),
    domain2,
    domain2Letter: letterGrade(domain2),
    betterDomain,
    betterDomainLabel: domain2 >= domain1 ? "Domain 2" : "Domain 1",
    domain3,
    domain3Letter: letterGrade(domain3),
    overall,
    overallLetter: letterGrade(overall),
  };
}

// ============================================
// LETTER GRADE BADGE COLORS
// ============================================

const getGradeColors = (letter: string) => {
  switch (letter) {
    case "A":
      return { bg: "bg-[#E1F5EE]", text: "text-[#085041]", solid: "bg-teal-500" };
    case "B":
      return { bg: "bg-[#E6F1FB]", text: "text-[#0C447C]", solid: "bg-primary-500" };
    case "C":
      return { bg: "bg-[#FAEEDA]", text: "text-[#633806]", solid: "bg-warning" };
    case "D":
      return { bg: "bg-[#FCEBEB]", text: "text-[#791F1F]", solid: "bg-error" };
    default:
      return { bg: "bg-[#FCEBEB]", text: "text-[#791F1F]", solid: "bg-error" };
  }
};

// ============================================
// CAMPUS SELECTOR
// ============================================

interface CampusSelectorProps {
  selectedCampus: Campus;
  onCampusChange: (campus: Campus) => void;
}

const CampusSelector = ({ selectedCampus, onCampusChange }: CampusSelectorProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-4 p-4 bg-neutral-0 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
      >
        <div className="text-left">
          <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">Select a campus</p>
          <p className="text-[16px] font-semibold text-neutral-900">{selectedCampus.name}</p>
        </div>
        <ChevronDown className={cn("w-5 h-5 text-neutral-500 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-0 border border-neutral-200 rounded-lg shadow-lg z-50">
          {campuses.map((campus) => (
            <button
              key={campus.id}
              onClick={() => {
                onCampusChange(campus);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-0 first:rounded-t-lg last:rounded-b-lg text-left",
                selectedCampus.id === campus.id && "bg-teal-50"
              )}
            >
              <div>
                <p className="text-[14px] font-medium text-neutral-900">{campus.name}</p>
                <p className="text-[12px] text-neutral-500">
                  CCMR: {campus.ccmrRaw}% | STAAR: {campus.staarRaw} | Grad: {campus.gradRate}%
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// MAIN A-F SIMULATOR PAGE
// ============================================

export const AFSimulatorPage = () => {
  const [selectedCampus, setSelectedCampus] = React.useState<Campus>(campuses[0]);
  const [ccmrRate, setCcmrRate] = React.useState(selectedCampus.ccmrRaw);
  const [edPercent, setEdPercent] = React.useState(selectedCampus.edPercent);
  const [staarRaw, setStaarRaw] = React.useState(selectedCampus.staarRaw);

  // Reset sliders when campus changes
  React.useEffect(() => {
    setCcmrRate(selectedCampus.ccmrRaw);
    setEdPercent(selectedCampus.edPercent);
    setStaarRaw(selectedCampus.staarRaw);
  }, [selectedCampus]);

  const baseResult = calculateRating(selectedCampus.ccmrRaw, selectedCampus.edPercent, selectedCampus.staarRaw, selectedCampus);
  const projectedResult = calculateRating(ccmrRate, edPercent, staarRaw, selectedCampus);
  
  const overallChange = projectedResult.overall - baseResult.overall;
  const crossedToA = baseResult.overallLetter !== "A" && projectedResult.overallLetter === "A";
  const crossedToB = baseResult.overallLetter === "C" && projectedResult.overallLetter === "B";
  const dropped = projectedResult.overall < baseResult.overall;

  const baseColors = getGradeColors(baseResult.overallLetter);
  const projectedColors = getGradeColors(projectedResult.overallLetter);

  // Determine highest leverage move
  const getHighestLeverageMove = () => {
    // Calculate marginal impact of each lever
    const ccmrImpact = calculateRating(ccmrRate + 10, edPercent, staarRaw, selectedCampus).overall - projectedResult.overall;
    const edImpact = calculateRating(ccmrRate, Math.min(95, edPercent + 10), staarRaw, selectedCampus).overall - projectedResult.overall;
    const staarImpact = calculateRating(ccmrRate, edPercent, Math.min(80, staarRaw + 10), selectedCampus).overall - projectedResult.overall;
    
    if (edImpact >= ccmrImpact && edImpact >= staarImpact) {
      return "Collect ED forms (free) + improve CCMR by 10 points — could significantly boost your rating";
    } else if (ccmrImpact >= staarImpact) {
      return "Focus on IBC exam completion for CTE students — highest CCMR impact per effort";
    } else {
      return "Target STAAR intervention for students near proficiency threshold";
    }
  };

  return (
    <div className="space-y-6">
      {/* Campus Selector */}
      <CampusSelector 
        selectedCampus={selectedCampus} 
        onCampusChange={setSelectedCampus} 
      />

      {/* Main Simulator Card */}
      <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-teal-50 to-primary-50">
          <h2 className="text-[20px] font-bold text-neutral-900">A-F Accountability Impact Simulator</h2>
          <p className="text-[14px] text-neutral-600 mt-1">
            See how changes in CCMR flow through TEA&apos;s accountability formula to impact your A-F rating
          </p>
        </div>

        {/* Current Scores Table */}
        <div className="p-6 border-b border-neutral-200">
          <p className="text-[12px] font-semibold text-neutral-500 uppercase tracking-wider mb-4">
            {selectedCampus.name} — Current vs. Projected Accountability Scores
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left py-2 font-semibold text-neutral-700">Component</th>
                  <th className="text-right py-2 font-semibold text-neutral-700">Raw</th>
                  <th className="text-right py-2 font-semibold text-neutral-700">Current</th>
                  <th className="text-right py-2 font-semibold text-neutral-700">Projected</th>
                  <th className="text-right py-2 font-semibold text-neutral-700">Change</th>
                </tr>
              </thead>
              <tbody>
                {/* STAAR */}
                <tr className="border-b border-neutral-100">
                  <td className="py-2 text-neutral-700">Domain 1: STAAR</td>
                  <td className="py-2 text-right text-neutral-600">{staarRaw}</td>
                  <td className="py-2 text-right">
                    <span className={cn("px-2 py-0.5 text-[11px] font-semibold rounded", getGradeColors(baseResult.staarLetter).bg, getGradeColors(baseResult.staarLetter).text)}>
                      {baseResult.staarScaled} ({baseResult.staarLetter})
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <span className={cn("px-2 py-0.5 text-[11px] font-semibold rounded", getGradeColors(projectedResult.staarLetter).bg, getGradeColors(projectedResult.staarLetter).text)}>
                      {projectedResult.staarScaled} ({projectedResult.staarLetter})
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <span className={cn("text-[12px] font-semibold", projectedResult.staarScaled > baseResult.staarScaled ? "text-teal-600" : projectedResult.staarScaled < baseResult.staarScaled ? "text-error" : "text-neutral-400")}>
                      {projectedResult.staarScaled !== baseResult.staarScaled ? (projectedResult.staarScaled > baseResult.staarScaled ? "+" : "") + (projectedResult.staarScaled - baseResult.staarScaled) : "—"}
                    </span>
                  </td>
                </tr>
                {/* CCMR */}
                <tr className="border-b border-neutral-100">
                  <td className="py-2 text-neutral-700">Domain 1: CCMR</td>
                  <td className="py-2 text-right text-neutral-600">{ccmrRate}%</td>
                  <td className="py-2 text-right">
                    <span className={cn("px-2 py-0.5 text-[11px] font-semibold rounded", getGradeColors(baseResult.ccmrLetter).bg, getGradeColors(baseResult.ccmrLetter).text)}>
                      {baseResult.ccmrScaled} ({baseResult.ccmrLetter})
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <span className={cn("px-2 py-0.5 text-[11px] font-semibold rounded", getGradeColors(projectedResult.ccmrLetter).bg, getGradeColors(projectedResult.ccmrLetter).text)}>
                      {projectedResult.ccmrScaled} ({projectedResult.ccmrLetter})
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <span className={cn("text-[12px] font-semibold", projectedResult.ccmrScaled > baseResult.ccmrScaled ? "text-teal-600" : projectedResult.ccmrScaled < baseResult.ccmrScaled ? "text-error" : "text-neutral-400")}>
                      {projectedResult.ccmrScaled !== baseResult.ccmrScaled ? (projectedResult.ccmrScaled > baseResult.ccmrScaled ? "+" : "") + (projectedResult.ccmrScaled - baseResult.ccmrScaled) : "—"}
                    </span>
                  </td>
                </tr>
                {/* Graduation Rate */}
                <tr className="border-b border-neutral-100">
                  <td className="py-2 text-neutral-700">Domain 1: Graduation Rate</td>
                  <td className="py-2 text-right text-neutral-600">{selectedCampus.gradRate}%</td>
                  <td className="py-2 text-right">
                    <span className={cn("px-2 py-0.5 text-[11px] font-semibold rounded", getGradeColors(baseResult.gradLetter).bg, getGradeColors(baseResult.gradLetter).text)}>
                      {baseResult.gradScaled} ({baseResult.gradLetter})
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <span className={cn("px-2 py-0.5 text-[11px] font-semibold rounded", getGradeColors(projectedResult.gradLetter).bg, getGradeColors(projectedResult.gradLetter).text)}>
                      {projectedResult.gradScaled} ({projectedResult.gradLetter})
                    </span>
                  </td>
                  <td className="py-2 text-right text-neutral-400">—</td>
                </tr>
                {/* Domain 1 Total */}
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <td className="py-2 text-neutral-900 font-medium">Domain 1 weighted total</td>
                  <td className="py-2 text-right text-neutral-600">—</td>
                  <td className="py-2 text-right">
                    <span className={cn("px-2 py-0.5 text-[11px] font-semibold rounded", getGradeColors(baseResult.domain1Letter).bg, getGradeColors(baseResult.domain1Letter).text)}>
                      {baseResult.domain1} ({baseResult.domain1Letter})
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <span className={cn("px-2 py-0.5 text-[11px] font-semibold rounded", getGradeColors(projectedResult.domain1Letter).bg, getGradeColors(projectedResult.domain1Letter).text)}>
                      {projectedResult.domain1} ({projectedResult.domain1Letter})
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <span className={cn("text-[12px] font-semibold", projectedResult.domain1 > baseResult.domain1 ? "text-teal-600" : projectedResult.domain1 < baseResult.domain1 ? "text-error" : "text-neutral-400")}>
                      {projectedResult.domain1 !== baseResult.domain1 ? (projectedResult.domain1 > baseResult.domain1 ? "+" : "") + (projectedResult.domain1 - baseResult.domain1) : "—"}
                    </span>
                  </td>
                </tr>
                {/* Domain 2 Part A */}
                <tr className="border-b border-neutral-100">
                  <td className="py-2 text-neutral-700">Domain 2 Part A: Academic Growth</td>
                  <td className="py-2 text-right text-neutral-600">{selectedCampus.growthPartARaw}</td>
                  <td className="py-2 text-right">
                    <span className={cn("px-2 py-0.5 text-[11px] font-semibold rounded", getGradeColors(baseResult.partALetter).bg, getGradeColors(baseResult.partALetter).text)}>
                      {baseResult.partAScaled} ({baseResult.partALetter})
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <span className={cn("px-2 py-0.5 text-[11px] font-semibold rounded", getGradeColors(projectedResult.partALetter).bg, getGradeColors(projectedResult.partALetter).text)}>
                      {projectedResult.partAScaled} ({projectedResult.partALetter})
                    </span>
                  </td>
                  <td className="py-2 text-right text-neutral-400">—</td>
                </tr>
                {/* Domain 2 Part B */}
                <tr className="border-b border-neutral-100">
                  <td className="py-2 text-neutral-700">Domain 2 Part B: Relative Performance</td>
                  <td className="py-2 text-right text-neutral-600">—</td>
                  <td className="py-2 text-right">
                    <span className={cn("px-2 py-0.5 text-[11px] font-semibold rounded", getGradeColors(baseResult.partBLetter).bg, getGradeColors(baseResult.partBLetter).text)}>
                      {baseResult.partBScaled} ({baseResult.partBLetter})
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <span className={cn("px-2 py-0.5 text-[11px] font-semibold rounded", getGradeColors(projectedResult.partBLetter).bg, getGradeColors(projectedResult.partBLetter).text)}>
                      {projectedResult.partBScaled} ({projectedResult.partBLetter})
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <span className={cn("text-[12px] font-semibold", projectedResult.partBScaled > baseResult.partBScaled ? "text-teal-600" : projectedResult.partBScaled < baseResult.partBScaled ? "text-error" : "text-neutral-400")}>
                      {projectedResult.partBScaled !== baseResult.partBScaled ? (projectedResult.partBScaled > baseResult.partBScaled ? "+" : "") + (projectedResult.partBScaled - baseResult.partBScaled) : "—"}
                    </span>
                  </td>
                </tr>
                {/* Domain 2 Total */}
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <td className="py-2 text-neutral-900 font-medium">Domain 2 (better of A/B)</td>
                  <td className="py-2 text-right text-neutral-600">—</td>
                  <td className="py-2 text-right">
                    <span className={cn("px-2 py-0.5 text-[11px] font-semibold rounded", getGradeColors(baseResult.domain2Letter).bg, getGradeColors(baseResult.domain2Letter).text)}>
                      {baseResult.domain2} ({baseResult.domain2Letter})
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <span className={cn("px-2 py-0.5 text-[11px] font-semibold rounded", getGradeColors(projectedResult.domain2Letter).bg, getGradeColors(projectedResult.domain2Letter).text)}>
                      {projectedResult.domain2} ({projectedResult.domain2Letter})
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <span className={cn("text-[12px] font-semibold", projectedResult.domain2 > baseResult.domain2 ? "text-teal-600" : projectedResult.domain2 < baseResult.domain2 ? "text-error" : "text-neutral-400")}>
                      {projectedResult.domain2 !== baseResult.domain2 ? (projectedResult.domain2 > baseResult.domain2 ? "+" : "") + (projectedResult.domain2 - baseResult.domain2) : "—"}
                    </span>
                  </td>
                </tr>
                {/* Better Domain */}
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  <td className="py-2 text-neutral-900 font-medium">Better of Domain 1 or 2</td>
                  <td className="py-2 text-right text-neutral-600">—</td>
                  <td className="py-2 text-right text-neutral-900 font-semibold">{baseResult.betterDomain} ({baseResult.betterDomainLabel})</td>
                  <td className="py-2 text-right text-neutral-900 font-semibold">{projectedResult.betterDomain} ({projectedResult.betterDomainLabel})</td>
                  <td className="py-2 text-right">
                    <span className={cn("text-[12px] font-semibold", projectedResult.betterDomain > baseResult.betterDomain ? "text-teal-600" : projectedResult.betterDomain < baseResult.betterDomain ? "text-error" : "text-neutral-400")}>
                      {projectedResult.betterDomain !== baseResult.betterDomain ? (projectedResult.betterDomain > baseResult.betterDomain ? "+" : "") + (projectedResult.betterDomain - baseResult.betterDomain) : "—"}
                    </span>
                  </td>
                </tr>
                {/* Domain 3 */}
                <tr className="border-b border-neutral-100">
                  <td className="py-2 text-neutral-700">Domain 3: Closing the Gaps</td>
                  <td className="py-2 text-right text-neutral-600">{selectedCampus.closingGapsRaw}</td>
                  <td className="py-2 text-right">
                    <span className={cn("px-2 py-0.5 text-[11px] font-semibold rounded", getGradeColors(baseResult.domain3Letter).bg, getGradeColors(baseResult.domain3Letter).text)}>
                      {baseResult.domain3} ({baseResult.domain3Letter})
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    <span className={cn("px-2 py-0.5 text-[11px] font-semibold rounded", getGradeColors(projectedResult.domain3Letter).bg, getGradeColors(projectedResult.domain3Letter).text)}>
                      {projectedResult.domain3} ({projectedResult.domain3Letter})
                    </span>
                  </td>
                  <td className="py-2 text-right text-neutral-400">—</td>
                </tr>
                {/* Overall */}
                <tr className="bg-teal-50">
                  <td className="py-3 text-neutral-900 font-bold">Overall</td>
                  <td className="py-3 text-right text-neutral-600">—</td>
                  <td className="py-3 text-right">
                    <span className={cn("px-2.5 py-1 text-[12px] font-bold rounded text-neutral-0", baseColors.solid)}>
                      {baseResult.overall} ({baseResult.overallLetter})
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className={cn("px-2.5 py-1 text-[12px] font-bold rounded text-neutral-0", projectedColors.solid)}>
                      {projectedResult.overall} ({projectedResult.overallLetter})
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <span className={cn("text-[14px] font-bold", overallChange > 0 ? "text-teal-600" : overallChange < 0 ? "text-error" : "text-neutral-400")}>
                      {overallChange !== 0 ? (overallChange > 0 ? "+" : "") + overallChange : "—"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-neutral-500 mt-3">
            Formula: Overall = (Better of Domain 1 or 2) × 70% + Domain 3 × 30%
          </p>
        </div>

        {/* Simulator Controls */}
        <div className="p-6 space-y-8 border-b border-neutral-200">
          <p className="text-[14px] font-semibold text-neutral-900">Drag the sliders to see &quot;what if&quot; scenarios:</p>
          
          {/* CCMR Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[14px] font-medium text-neutral-900">What if your CCMR rate changes?</label>
              <span className="text-[14px]">
                {ccmrRate !== selectedCampus.ccmrRaw && (
                  <span className="text-neutral-500">{selectedCampus.ccmrRaw}% → </span>
                )}
                <span className="font-bold text-teal-600">{ccmrRate}%</span>
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              value={ccmrRate}
              onChange={(e) => setCcmrRate(Number(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
          
          {/* ED Rate Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-[14px] font-medium text-neutral-900">What if your ED form collection improves?</label>
                <p className="text-[12px] text-neutral-500 mt-0.5">Higher documented ED rate = lower CCMR cut scores for your campus</p>
              </div>
              <span className="text-[14px]">
                {edPercent !== selectedCampus.edPercent && (
                  <span className="text-neutral-500">{selectedCampus.edPercent}% → </span>
                )}
                <span className="font-bold text-teal-600">{edPercent.toFixed(1)}%</span>
              </span>
            </div>
            <input
              type="range"
              min="60"
              max="95"
              step="0.1"
              value={edPercent}
              onChange={(e) => setEdPercent(Number(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>60%</span>
              <span>77.5%</span>
              <span>95%</span>
            </div>
          </div>
          
          {/* STAAR Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[14px] font-medium text-neutral-900">What if STAAR performance improves?</label>
              <span className="text-[14px]">
                {staarRaw !== selectedCampus.staarRaw && (
                  <span className="text-neutral-500">{selectedCampus.staarRaw} → </span>
                )}
                <span className="font-bold text-teal-600">{staarRaw}</span>
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              value={staarRaw}
              onChange={(e) => setStaarRaw(Number(e.target.value))}
              className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
            <div className="flex justify-between text-[11px] text-neutral-500">
              <span>20</span>
              <span>50</span>
              <span>80</span>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="p-6">
          {/* Grade change alerts */}
          {crossedToA && (
            <div className="mb-6 p-4 bg-[#E1F5EE] border border-teal-300 rounded-lg">
              <p className="text-[15px] font-bold text-[#085041]">
                This scenario reaches an A rating!
              </p>
              <p className="text-[14px] text-[#085041]/80 mt-1">
                Your overall score moved from {baseResult.overall} ({baseResult.overallLetter}) to {projectedResult.overall} ({projectedResult.overallLetter}).
              </p>
            </div>
          )}
          {crossedToB && (
            <div className="mb-6 p-4 bg-[#E6F1FB] border border-primary-300 rounded-lg">
              <p className="text-[15px] font-bold text-[#0C447C]">
                Moving into B territory!
              </p>
              <p className="text-[14px] text-[#0C447C]/80 mt-1">
                Your overall score moved from {baseResult.overall} ({baseResult.overallLetter}) to {projectedResult.overall} ({projectedResult.overallLetter}).
              </p>
            </div>
          )}
          {dropped && !crossedToA && !crossedToB && (
            <div className="mb-6 p-4 bg-[#FAEEDA] border border-warning/50 rounded-lg">
              <p className="text-[15px] font-bold text-[#633806]">
                Rating would decrease
              </p>
              <p className="text-[14px] text-[#633806]/80 mt-1">
                Your overall score would drop from {baseResult.overall} to {projectedResult.overall}.
              </p>
            </div>
          )}

          {/* Projected Impact Card */}
          <div className={cn(
            "p-5 rounded-lg border-2 transition-colors duration-300",
            projectedColors.bg,
            projectedResult.overallLetter === "A" ? "border-teal-400" : 
            projectedResult.overallLetter === "B" ? "border-primary-300" : 
            projectedResult.overallLetter === "C" ? "border-warning/50" : "border-error/50"
          )}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[14px] font-semibold text-neutral-700">Projected Impact</p>
              <span className={cn(
                "px-4 py-2 text-[20px] font-bold rounded-lg transition-colors duration-300 text-neutral-0",
                projectedColors.solid
              )}>
                {projectedResult.overallLetter}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-3 bg-neutral-0/60 rounded-lg">
                <p className="text-[11px] text-neutral-600 mb-1">Domain 1</p>
                <p className="text-[18px] font-bold text-neutral-900">
                  {baseResult.domain1} → {projectedResult.domain1}
                  <span className={cn(
                    "text-[13px] font-semibold ml-2",
                    projectedResult.domain1 > baseResult.domain1 ? "text-teal-600" : 
                    projectedResult.domain1 < baseResult.domain1 ? "text-error" : "text-neutral-500"
                  )}>
                    ({projectedResult.domain1 > baseResult.domain1 ? "+" : ""}{projectedResult.domain1 - baseResult.domain1})
                  </span>
                </p>
              </div>
              <div className="p-3 bg-neutral-0/60 rounded-lg">
                <p className="text-[11px] text-neutral-600 mb-1">Domain 2</p>
                <p className="text-[18px] font-bold text-neutral-900">
                  {baseResult.domain2} → {projectedResult.domain2}
                  <span className={cn(
                    "text-[13px] font-semibold ml-2",
                    projectedResult.domain2 > baseResult.domain2 ? "text-teal-600" : 
                    projectedResult.domain2 < baseResult.domain2 ? "text-error" : "text-neutral-500"
                  )}>
                    ({projectedResult.domain2 > baseResult.domain2 ? "+" : ""}{projectedResult.domain2 - baseResult.domain2})
                  </span>
                </p>
              </div>
              <div className="p-3 bg-neutral-0/60 rounded-lg">
                <p className="text-[11px] text-neutral-600 mb-1">Overall</p>
                <p className="text-[18px] font-bold text-neutral-900">
                  {baseResult.overall} → {projectedResult.overall}
                  <span className={cn(
                    "text-[13px] font-semibold ml-2",
                    overallChange > 0 ? "text-teal-600" : overallChange < 0 ? "text-error" : "text-neutral-500"
                  )}>
                    ({overallChange > 0 ? "+" : ""}{overallChange} pts)
                  </span>
                </p>
              </div>
            </div>
            
            {(ccmrRate !== selectedCampus.ccmrRaw || edPercent !== selectedCampus.edPercent || staarRaw !== selectedCampus.staarRaw) && (
              <div className="p-3 bg-neutral-0/80 rounded-lg">
                <p className="text-[13px] font-semibold text-neutral-900 mb-2">Scenario Summary:</p>
                <ul className="text-[13px] text-neutral-700 space-y-1">
                  {ccmrRate !== selectedCampus.ccmrRaw && (
                    <li>CCMR: {selectedCampus.ccmrRaw}% → {ccmrRate}%</li>
                  )}
                  {edPercent !== selectedCampus.edPercent && (
                    <li>ED documentation: {selectedCampus.edPercent}% → {edPercent.toFixed(1)}%</li>
                  )}
                  {staarRaw !== selectedCampus.staarRaw && (
                    <li>STAAR raw score: {selectedCampus.staarRaw} → {staarRaw}</li>
                  )}
                </ul>
              </div>
            )}
          </div>
          
          {/* Highest leverage move */}
          <div className="mt-6 p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
            <p className="text-[13px] font-semibold text-neutral-900 mb-1">Your highest-leverage move:</p>
            <p className="text-[13px] text-neutral-700">
              {getHighestLeverageMove()}
            </p>
          </div>
          
          {/* Reset button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setCcmrRate(selectedCampus.ccmrRaw);
                setEdPercent(selectedCampus.edPercent);
                setStaarRaw(selectedCampus.staarRaw);
              }}
              className="px-4 py-2 text-[13px] font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
            >
              Reset to current values
            </button>
          </div>
        </div>
      </div>

      {/* Link back to Campus Reports */}
      <Link
        href="/pathways/campus-reports"
        className="block p-4 bg-neutral-0 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors group"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-medium text-neutral-900">View full campus reports</p>
            <p className="text-[13px] text-neutral-600">See detailed breakdowns, action plans, and student lists</p>
          </div>
          <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-500 transition-colors" />
        </div>
      </Link>
    </div>
  );
};

export default AFSimulatorPage;
