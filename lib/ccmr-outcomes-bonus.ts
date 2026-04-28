// CCMR Outcomes Bonus constants and projection math.
// Per HB 2 (89th Texas Legislature, 2025).
//
// A district must clear a per-group threshold (% of total grads) before any
// grads in that group count toward funding. Each grad above the threshold
// generates the full per-group award amount.

export const OB_AWARDS = { ED: 5000, NON_ED: 3000, SPED: 4000 } as const

export const OB_THRESHOLDS = { ED: 0.11, NON_ED: 0.24, SPED: 0 } as const

export interface ProjectedGroupEarnings {
  /** Number of grads needed to clear the threshold for this group. */
  thresholdCount: number
  /** Current met-OB grads + slider delta. */
  metObProjected: number
  /** Grads above the threshold under the projected scenario. */
  aboveThresholdProjected: number
  /** Projected funding (USD whole dollars) for this group. */
  earnedProjected: number
  /** Difference between projected and current earnings. */
  additionalUnlocked: number
}

// We Math.floor the threshold count because TEA's rule applies to discrete
// students — you can't clear "10.5 students worth of threshold." Above that
// integer count, every additional met-OB grad earns the full award.
export function projectGroupEarnings(
  totalGrads: number,
  metObCurrent: number,
  earnedCurrent: number,
  additionalMetOb: number,
  thresholdPct: number,
  award: number
): ProjectedGroupEarnings {
  const thresholdCount = Math.floor(totalGrads * thresholdPct)
  const metObProjected = metObCurrent + additionalMetOb
  const aboveThresholdProjected = Math.max(0, metObProjected - thresholdCount)
  const earnedProjected = aboveThresholdProjected * award
  const additionalUnlocked = Math.max(0, earnedProjected - earnedCurrent)

  return {
    thresholdCount,
    metObProjected,
    aboveThresholdProjected,
    earnedProjected,
    additionalUnlocked,
  }
}
