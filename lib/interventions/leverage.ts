/**
 * Distance-to-threshold (leverage) for an intervention.
 *
 * Pure: given an intervention and the student's indicator rows, returns the
 * smallest gap to a passing threshold across the indicators that intervention
 * could resolve. Returns null when the intervention isn't score-based
 * (IBC, credentials, course completion) — those rank below score-based ones
 * in the leverage sort.
 */

import type {
  IndicatorRow,
  IndicatorType,
  InterventionRow,
} from "@/types/database";

interface IndicatorThreshold {
  type: IndicatorType;
  /** Pretty short label used in the card UI */
  label: string;
  threshold: number;
  /** Unit shown after the number in the UI ("pts", "pt") */
  unit: string;
}

const SAT_EBRW: IndicatorThreshold = { type: "sat_reading", label: "SAT EBRW", threshold: 480, unit: "pt" };
const SAT_MATH: IndicatorThreshold = { type: "sat_math",    label: "SAT Math", threshold: 530, unit: "pt" };
const ACT_ENG:  IndicatorThreshold = { type: "act_reading", label: "ACT English", threshold: 19, unit: "pt" };
const ACT_MATH: IndicatorThreshold = { type: "act_math",    label: "ACT Math", threshold: 19, unit: "pt" };
const TSIA_ELAR:IndicatorThreshold = { type: "tsi_reading", label: "TSIA ELAR", threshold: 945, unit: "pt" };
const TSIA_MATH:IndicatorThreshold = { type: "tsi_math",    label: "TSIA Math", threshold: 950, unit: "pt" };
const AP_EXAM:  IndicatorThreshold = { type: "ap_exam",     label: "AP",  threshold: 3, unit: "pt" };
const IB_EXAM:  IndicatorThreshold = { type: "ib_exam",     label: "IB",  threshold: 4, unit: "pt" };

/**
 * Candidate indicator thresholds for each pathway_type. Order doesn't matter —
 * we always pick the *smallest* gap across candidates.
 */
const PATHWAY_CANDIDATES: Record<string, IndicatorThreshold[]> = {
  tsi_reading: [TSIA_ELAR, SAT_EBRW, ACT_ENG],
  tsi_math:    [TSIA_MATH, SAT_MATH, ACT_MATH],
  tsi:         [TSIA_ELAR, TSIA_MATH, SAT_EBRW, SAT_MATH, ACT_ENG, ACT_MATH],
  ap_exam:     [AP_EXAM],
  ib_exam:     [IB_EXAM],
};

export interface Leverage {
  /** Numeric gap (always > 0). */
  distance: number;
  /** Short human label for the assessment that drives the leverage. */
  assessmentLabel: string;
  /** Unit string, e.g. "pts". */
  unit: string;
  /** Indicator type that produced this leverage. */
  indicatorType: IndicatorType;
}

export function computeLeverage(
  intervention: Pick<InterventionRow, "pathway_type">,
  studentIndicators: IndicatorRow[],
): Leverage | null {
  const pt = intervention.pathway_type;
  if (!pt) return null;

  const candidates = PATHWAY_CANDIDATES[pt];
  if (!candidates) return null;

  let best: Leverage | null = null;
  for (const cand of candidates) {
    const row = studentIndicators.find((i) => i.indicator_type === cand.type);
    if (!row || row.score == null) continue;
    if (row.status === "met") continue;
    const gap = cand.threshold - row.score;
    if (gap <= 0) continue;
    if (best === null || gap < best.distance) {
      best = {
        distance: gap,
        assessmentLabel: cand.label,
        unit: cand.unit,
        indicatorType: cand.type,
      };
    }
  }
  return best;
}

/**
 * Build a per-student lookup from a flat indicator list. O(n) once at the
 * caller so leverage computation per card stays O(candidates).
 */
export function indexIndicatorsByStudent(
  indicators: IndicatorRow[],
): Map<string, IndicatorRow[]> {
  const byStudent = new Map<string, IndicatorRow[]>();
  for (const row of indicators) {
    const arr = byStudent.get(row.student_id) ?? [];
    arr.push(row);
    byStudent.set(row.student_id, arr);
  }
  return byStudent;
}

export function formatLeverage(lev: Leverage): string {
  const unit = lev.distance === 1 ? lev.unit : `${lev.unit}s`;
  return `${lev.assessmentLabel} · ${lev.distance} ${unit} from threshold`;
}
