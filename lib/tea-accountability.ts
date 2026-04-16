/**
 * TEA A-F Accountability Scaling Math
 * Based on 2025 TEA Accountability Technical Guide, Chapter 5
 *
 * Pure TypeScript — no Supabase dependency, fully unit-testable.
 */

// ── Cut Points ───────────────────────────────────────────────────────────────

type Cuts = { A: number; B: number; C: number; D: number }

/** Table 5.1 — CCMR component (HS/K-12 Non-AEA) */
export const CCMR_CUTS: Cuts     = { A: 88, B: 78, C: 64, D: 51 }

/** Table 5.2 — Graduation Rate component (HS/K-12) */
export const GRAD_RATE_CUTS: Cuts = { A: 94, B: 90, C: 80, D: 70 }

/** STAAR All-Subjects performance component */
export const STAAR_CUTS: Cuts    = { A: 60, B: 53, C: 41, D: 35 }

// ── Core Scaling Formula ─────────────────────────────────────────────────────

/**
 * Applies TEA's band-based linear interpolation (Chapter 5).
 * Each letter-grade band maps to a 10-point scaled range (90-99, 80-89, 70-79, 60-69, 0-59).
 */
export function applyScaling(raw: number, cuts: Cuts): number {
  const { A, B, C, D } = cuts
  let scaled: number

  if (raw >= A) {
    scaled = 90 + 9 * (raw - A) / (100 - A)
  } else if (raw >= B) {
    scaled = 89 - 9 * ((A - 1) - raw) / ((A - 1) - B)
  } else if (raw >= C) {
    scaled = 79 - 9 * ((B - 1) - raw) / ((B - 1) - C)
  } else if (raw >= D) {
    scaled = 69 - 9 * ((C - 1) - raw) / ((C - 1) - D)
  } else {
    const denom = D - 1  // = (D-1) - 0
    scaled = denom === 0 ? 50 : 59 - 9 * ((D - 1) - raw) / denom
  }

  return Math.max(0, Math.min(100, Math.round(scaled)))
}

export const scaleCCMR     = (raw: number) => applyScaling(raw, CCMR_CUTS)
export const scaleGradRate = (raw: number) => applyScaling(raw, GRAD_RATE_CUTS)
export const scaleSTAAR    = (raw: number) => applyScaling(raw, STAAR_CUTS)

// ── Table 5.5 — Relative Performance, HS/K-12 CCMR Column ───────────────────

interface RPRow { edMin: number; edMax: number; A: number; B: number; C: number; D: number }

export const RP_CCMR_LOOKUP: readonly RPRow[] = [
  { edMin: 0,    edMax: 5,   A: 94, B: 85, C: 79, D: 72 },
  { edMin: 5.1,  edMax: 6,   A: 94, B: 85, C: 78, D: 71 },
  { edMin: 6.1,  edMax: 7,   A: 93, B: 84, C: 78, D: 70 },
  { edMin: 7.1,  edMax: 8,   A: 93, B: 84, C: 77, D: 69 },
  { edMin: 8.1,  edMax: 9,   A: 93, B: 84, C: 76, D: 69 },
  { edMin: 9.1,  edMax: 10,  A: 93, B: 83, C: 76, D: 68 },
  { edMin: 10.1, edMax: 11,  A: 93, B: 83, C: 75, D: 67 },
  { edMin: 11.1, edMax: 12,  A: 93, B: 83, C: 75, D: 66 },
  { edMin: 12.1, edMax: 13,  A: 93, B: 82, C: 74, D: 66 },
  { edMin: 13.1, edMax: 14,  A: 93, B: 82, C: 74, D: 65 },
  { edMin: 14.1, edMax: 15,  A: 93, B: 82, C: 73, D: 64 },
  { edMin: 15.1, edMax: 16,  A: 93, B: 81, C: 73, D: 63 },
  { edMin: 16.1, edMax: 17,  A: 93, B: 81, C: 72, D: 63 },
  { edMin: 17.1, edMax: 18,  A: 93, B: 81, C: 72, D: 62 },
  { edMin: 18.1, edMax: 19,  A: 93, B: 81, C: 71, D: 61 },
  { edMin: 19.1, edMax: 20,  A: 93, B: 80, C: 71, D: 61 },
  { edMin: 20.1, edMax: 21,  A: 93, B: 80, C: 70, D: 60 },
  { edMin: 21.1, edMax: 22,  A: 93, B: 80, C: 70, D: 59 },
  { edMin: 22.1, edMax: 23,  A: 93, B: 80, C: 70, D: 59 },
  { edMin: 23.1, edMax: 24,  A: 93, B: 79, C: 69, D: 58 },
  { edMin: 24.1, edMax: 25,  A: 92, B: 79, C: 68, D: 57 },
  { edMin: 25.1, edMax: 26,  A: 92, B: 79, C: 67, D: 56 },
  { edMin: 26.1, edMax: 27,  A: 92, B: 79, C: 67, D: 55 },
  { edMin: 27.1, edMax: 28,  A: 92, B: 79, C: 67, D: 55 },
  { edMin: 28.1, edMax: 29,  A: 92, B: 78, C: 66, D: 54 },
  { edMin: 29.1, edMax: 30,  A: 92, B: 78, C: 66, D: 53 },
  { edMin: 30.1, edMax: 35,  A: 92, B: 78, C: 65, D: 52 },
  { edMin: 35.1, edMax: 40,  A: 91, B: 77, C: 63, D: 50 },
  { edMin: 40.1, edMax: 45,  A: 91, B: 76, C: 62, D: 49 },
  { edMin: 45.1, edMax: 50,  A: 91, B: 76, C: 62, D: 49 },
  { edMin: 50.1, edMax: 55,  A: 91, B: 76, C: 61, D: 48 },
  { edMin: 55.1, edMax: 60,  A: 91, B: 76, C: 61, D: 48 },
  { edMin: 60.1, edMax: 65,  A: 90, B: 76, C: 60, D: 47 },
  { edMin: 65.1, edMax: 70,  A: 90, B: 76, C: 60, D: 47 },
  { edMin: 70.1, edMax: 75,  A: 89, B: 75, C: 59, D: 46 },
  { edMin: 75.1, edMax: 80,  A: 89, B: 75, C: 59, D: 46 },
  { edMin: 80.1, edMax: 85,  A: 88, B: 75, C: 58, D: 45 },
  { edMin: 85.1, edMax: 90,  A: 88, B: 75, C: 58, D: 45 },
  { edMin: 90.1, edMax: 95,  A: 87, B: 75, C: 57, D: 44 },
  { edMin: 95.1, edMax: 100, A: 87, B: 75, C: 57, D: 44 },
]

/** Find the RP row for a given documented-ED percentage. */
export function getRPRow(edPct: number): RPRow {
  for (const row of RP_CCMR_LOOKUP) {
    if (edPct <= row.edMax) return row
  }
  return RP_CCMR_LOOKUP[RP_CCMR_LOOKUP.length - 1]
}

/**
 * Scales campus CCMR rate via the Relative Performance lookup (Table 5.5).
 * edPct = (documented econ-disadvantaged students / total seniors) × 100
 */
export function scaleRelativePerformance(ccmrPct: number, edPct: number): number {
  const row = getRPRow(edPct)
  return applyScaling(ccmrPct, { A: row.A, B: row.B, C: row.C, D: row.D })
}

// ── Domain Calculations ───────────────────────────────────────────────────────

/** Student Achievement = STAAR (40%) + CCMR (40%) + Grad Rate (20%) */
export function calcStudentAchievement(
  ccmrScaled: number,
  staarScaled: number,
  gradRateScaled: number,
): number {
  return Math.round(staarScaled * 0.4 + ccmrScaled * 0.4 + gradRateScaled * 0.2)
}

/**
 * School Progress = better of Part A (Academic Growth) and Part B (Relative Perf).
 * If either component < 60, the domain score is capped at 89.
 */
export function calcSchoolProgress(partA: number, partB: number): number {
  const better = Math.max(partA, partB)
  if (partA < 60 || partB < 60) return Math.min(better, 89)
  return better
}

/**
 * Overall rating with TEA's 3-Fs and 3-Ds safety rules.
 * Overall = max(Student Achievement, School Progress) × 0.70 + CTG × 0.30
 */
export function calcOverall(
  studentAchievement: number,
  schoolProgress: number,
  closingGaps: number,
  partA: number,
  partB: number,
): number {
  const betterDomain = Math.max(studentAchievement, schoolProgress)
  let overall = Math.round(betterDomain * 0.70 + closingGaps * 0.30)

  // 3 Fs: if 3 of 4 areas (SA, Part A, Part B, CTG) < 60 → cap at 59
  const areas = [studentAchievement, partA, partB, closingGaps]
  if (areas.filter(a => a < 60).length >= 3) return Math.min(overall, 59)

  // 3 Ds: if 3 of 4 areas < 70 and SA < 70 → cap at 69
  if (areas.filter(a => a < 70).length >= 3 && studentAchievement < 70) {
    return Math.min(overall, 69)
  }

  return overall
}

export function letterGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  if (score >= 60) return 'D'
  return 'F'
}

// ── Full Simulation ───────────────────────────────────────────────────────────

export interface SimulatorInput {
  /** From campus summary DB data */
  ccmrMet: number
  totalSeniors: number
  /** Students who ARE econ-disadvantaged AND have ED form collected */
  documentedED: number
  /** Upper bound for the ED slider (students needing forms) */
  missingEdForms: number
  /** CCMR slider: how many additional students meet CCMR */
  ccmrAdditions: number
  /** ED slider: how many additional ED forms collected */
  edAdditions: number
  /**
   * Already-scaled scores as shown on TXSchools.gov (0-100).
   * These are passed directly into domain calculations — no further scaling applied.
   */
  staarScaled: number          // STAAR scaled score from TEA report
  academicGrowthPartA: number  // Academic Growth (Part A) scaled score
  gradRateScaled: number       // Graduation Rate scaled score
  closingGapsScaled: number    // Closing the Gaps scaled score
}

export interface SimulatorResult {
  ccmrMet: number
  totalSeniors: number
  ccmrRate: number
  edPct: number
  ccmrScaled: number
  staarScaled: number
  gradRateScaled: number
  partA: number
  partB: number
  studentAchievement: number
  schoolProgress: number
  closingGaps: number
  overall: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
}

export function simulate(input: SimulatorInput): SimulatorResult {
  const {
    ccmrMet, totalSeniors, documentedED, missingEdForms,
    ccmrAdditions, edAdditions,
    staarScaled, academicGrowthPartA, gradRateScaled, closingGapsScaled,
  } = input

  if (totalSeniors === 0) {
    return {
      ccmrMet: 0, totalSeniors: 0, ccmrRate: 0, edPct: 0,
      ccmrScaled: 0, staarScaled, gradRateScaled,
      partA: academicGrowthPartA, partB: 0,
      studentAchievement: 0, schoolProgress: 0,
      closingGaps: closingGapsScaled, overall: 0, grade: 'F',
    }
  }

  const adjCCMRMet = Math.min(totalSeniors, ccmrMet + ccmrAdditions)
  const adjDocED   = Math.min(documentedED + missingEdForms, documentedED + edAdditions)

  const ccmrRate = (adjCCMRMet / totalSeniors) * 100
  const edPct    = (adjDocED   / totalSeniors) * 100

  const ccmrScaled = scaleCCMR(ccmrRate)
  const partA      = academicGrowthPartA
  const partB      = scaleRelativePerformance(ccmrRate, edPct)

  const studentAchievement = calcStudentAchievement(ccmrScaled, staarScaled, gradRateScaled)
  const schoolProgress     = calcSchoolProgress(partA, partB)
  const overall            = calcOverall(studentAchievement, schoolProgress, closingGapsScaled, partA, partB)

  return {
    ccmrMet: adjCCMRMet,
    totalSeniors,
    ccmrRate,
    edPct,
    ccmrScaled,
    staarScaled,
    gradRateScaled,
    partA,
    partB,
    studentAchievement,
    schoolProgress,
    closingGaps: closingGapsScaled,
    overall,
    grade: letterGrade(overall),
  }
}
