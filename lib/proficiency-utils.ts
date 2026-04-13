/**
 * Standardized TELPAS Proficiency Level Utilities
 * Consistent labels and colors across all Summit Intel screens
 */

// ============================================
// COLOR DEFINITIONS (exact hex values from spec)
// ============================================

export const PROFICIENCY_COLORS = {
  beginning: {
    bg: "#FCEBEB",
    text: "#791F1F",
    tailwind: "bg-[#FCEBEB] text-[#791F1F]",
  },
  intermediate: {
    bg: "#FAEEDA",
    text: "#633806",
    tailwind: "bg-[#FAEEDA] text-[#633806]",
  },
  advanced: {
    bg: "#E6F1FB",
    text: "#0C447C",
    tailwind: "bg-[#E6F1FB] text-[#0C447C]",
  },
  advancedHigh: {
    bg: "#E1F5EE",
    text: "#085041",
    tailwind: "bg-[#E1F5EE] text-[#085041]",
  },
} as const;

// ============================================
// LEVEL DETERMINATION
// ============================================

export type ProficiencyLevel = "beginning" | "intermediate" | "advanced" | "advancedHigh";

/**
 * Get proficiency level from a score (works for both integers 1-4 and decimals 1.0-4.0)
 */
export function getProficiencyLevel(score: number): ProficiencyLevel {
  if (score < 2) return "beginning";
  if (score < 3) return "intermediate";
  if (score < 4) return "advanced";
  return "advancedHigh";
}

/**
 * Get the integer level (1-4) from a score
 */
export function getIntegerLevel(score: number): 1 | 2 | 3 | 4 {
  if (score < 2) return 1;
  if (score < 3) return 2;
  if (score < 4) return 3;
  return 4;
}

// ============================================
// LABEL FORMATTING
// ============================================

export const LEVEL_NAMES = {
  beginning: "Beginning",
  intermediate: "Intermediate",
  advanced: "Advanced",
  advancedHigh: "Advanced High",
} as const;

export const LEVEL_ABBREVIATIONS = {
  beginning: "Beg",
  intermediate: "Int",
  advanced: "Adv",
  advancedHigh: "Adv High",
} as const;

/**
 * Get full label for TELPAS domain scores: "3 - Advanced"
 */
export function getFullLabel(score: number): string {
  const level = getProficiencyLevel(score);
  const intLevel = getIntegerLevel(score);
  return `${intLevel} - ${LEVEL_NAMES[level]}`;
}

/**
 * Get abbreviated label for TELPAS: "3-Adv"
 */
export function getAbbreviatedLabel(score: number): string {
  const level = getProficiencyLevel(score);
  const intLevel = getIntegerLevel(score);
  return `${intLevel}-${LEVEL_ABBREVIATIONS[level]}`;
}

/**
 * Get composite label for student list: "2 - Int"
 */
export function getCompositeLabel(score: number): string {
  const level = getProficiencyLevel(score);
  const intLevel = getIntegerLevel(score);
  return `${intLevel} - ${LEVEL_ABBREVIATIONS[level]}`;
}

// ============================================
// TAILWIND CLASS GETTERS
// ============================================

/**
 * Get Tailwind classes for proficiency pill/badge
 * Returns: "bg-[#FCEBEB] text-[#791F1F]" etc.
 */
export function getProficiencyClasses(score: number): string {
  const level = getProficiencyLevel(score);
  return PROFICIENCY_COLORS[level].tailwind;
}

/**
 * Get inline styles for proficiency pill/badge (if needed)
 */
export function getProficiencyStyles(score: number): { backgroundColor: string; color: string } {
  const level = getProficiencyLevel(score);
  return {
    backgroundColor: PROFICIENCY_COLORS[level].bg,
    color: PROFICIENCY_COLORS[level].text,
  };
}

// ============================================
// RECLASSIFICATION CRITERIA HELPERS
// ============================================

/**
 * Format domain name with threshold for reclassification criteria
 * Example: "Advanced (3)" or "Beginning (1)"
 */
export function formatCriteriaThreshold(levelName: string, level: number): string {
  return `${levelName} (${level})`;
}

/**
 * Check if a score meets Advanced High threshold (4)
 */
export function meetsAdvancedHighThreshold(score: number): boolean {
  return score >= 4;
}

/**
 * Check if a score meets Advanced threshold (3+)
 */
export function meetsAdvancedThreshold(score: number): boolean {
  return score >= 3;
}
