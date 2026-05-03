/**
 * TEA CCMR Rules — 2025 Accountability Manual
 * Source: 19 TAC §61.1028
 *
 * Used by the CCMR Rules reference page and the student profile indicator modal.
 */

import type { IndicatorType, IndicatorRow } from "@/types/database";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type CCMRCategory =
  | "college_readiness"
  | "college_prep_dual_credit"
  | "industry_career";

export type CCMRRule = {
  id: string;
  name: string;
  category: CCMRCategory;
  /** Human-readable qualification criteria (may use \n for multiple lines) */
  qualifies: string;
  dataSource: string;
  citation: string;
  /** All DB indicator types that map to this rule */
  indicatorTypes: IndicatorType[];
};

export type EvaluationLine = {
  label: string;
  value: string | null;    // null = no data
  threshold: string | null;
  met: boolean | null;     // null = no data to evaluate
};

// ─────────────────────────────────────────────
// TIERED METHODOLOGY (cohorts 2030+)
//
// Rules data for the CCMR Rules Reference page. Drives the binary
// vs. tiered toggle on /pathways/ccmr-rules. Tiered methodology is
// HB 2 (89th Tex. Leg., 2025), effective for the cohort entering
// 9th grade Fall 2026 / graduating 2030. See docs/methodology.md.
// ─────────────────────────────────────────────

export type TieredCategory = "college" | "career" | "military";
export type TieredLevel = "foundational" | "demonstrated" | "advanced";

export interface TieredPathwayRule {
  category: TieredCategory;
  /** Short human label, e.g. "TSI via SAT/ACT/TSIA". */
  label: string;
  /** Long-form description that earns this tier. */
  description: string;
}

export interface TieredLevelDefinition {
  level: TieredLevel;
  headline: string;
  description: string;
  pathways: TieredPathwayRule[];
}

export const TIERED_METHODOLOGY: {
  id: "tx_tiered_2030";
  displayName: string;
  applicability: string;
  scoringRule: string;
  criticalRules: string[];
  levels: TieredLevelDefinition[];
} = {
  id: "tx_tiered_2030",
  displayName: "TEA CCMR — Tiered (HB 2)",
  applicability:
    "Applies to graduating class 2030 and later (cohort entering 9th grade Fall 2026 onward).",
  scoringRule:
    "A student earns credit for the HIGHEST level achieved across all indicators. Foundational < Demonstrated < Advanced. The campus's CCMR raw score is the average of three percentages: % Foundational+, % Demonstrated+, and % Advanced — denominator is annual grads.",
  criticalRules: [
    "TSI Math + RLA gate (hard): a student missing either subject earns nothing from the TSI pathway. SAT Math passing alone does NOT satisfy TSI without an RLA component.",
    "CPC downgrade rule: if TSI is satisfied via an approved College Prep Course in either subject AND no tested pathway covers that subject, the TSI indicator caps at Foundational.",
    "Three CTE credentials are tracked separately and never conflated: IBC (industry-issued, district-reported, tiered 1/2/3), Level I Certificate (THECB), Level II Certificate (THECB).",
    "Same-tier-different-category does not stack — a student Advanced on a career indicator and Demonstrated on a college indicator gets credit for Advanced (career) only.",
  ],
  levels: [
    {
      level: "foundational",
      headline: "Foundational",
      description: "Lowest tier — represents baseline postsecondary preparation.",
      pathways: [
        {
          category: "college",
          label: "TSI via College Prep Course (CPC)",
          description:
            "TSI criteria met using an approved College Prep Course in either Math or RLA. Caps at Foundational regardless of any other TSI components.",
        },
        {
          category: "college",
          label: "Potential college credit (single threshold)",
          description:
            "≥ 1 AP exam pass, OR ≥ 1 IB exam pass, OR ≥ 3 SCH OnRamps, OR ≥ 3 SCH dual credit.",
        },
        {
          category: "career",
          label: "CTE Completer + Tier 3 IBC",
          description:
            "Coherent CTE sequence completed with a Tier 3 industry-based certification.",
        },
        {
          category: "military",
          label: "JROTC + AFQT 31–49",
          description: "JROTC sequence completed with AFQT score in the 31–49 range.",
        },
      ],
    },
    {
      level: "demonstrated",
      headline: "Demonstrated",
      description: "Middle tier — measurable evidence of postsecondary readiness.",
      pathways: [
        {
          category: "college",
          label: "TSI via SAT / ACT / TSIA (Math + RLA)",
          description:
            "Both Math and RLA subjects satisfied through SAT, ACT, or TSIA — no CPC downgrade.",
        },
        {
          category: "career",
          label: "CTE Completer + Tier 2 IBC",
          description:
            "Coherent CTE sequence completed with a Tier 2 industry-based certification.",
        },
        {
          category: "college",
          label: "SpEd Advanced Diploma",
          description: "Special education student earns the Advanced High School Diploma.",
        },
        {
          category: "career",
          label: "Workforce Ready IEP Diploma",
          description: "IEP-aligned workforce-ready diploma.",
        },
        {
          category: "military",
          label: "JROTC + AFQT 50–64",
          description: "JROTC sequence completed with AFQT score in the 50–64 range.",
        },
      ],
    },
    {
      level: "advanced",
      headline: "Advanced",
      description: "Highest tier — strongest evidence of postsecondary readiness.",
      pathways: [
        {
          category: "college",
          label: "Associate Degree",
          description:
            "Associate degree earned from a Texas public institution while enrolled in high school.",
        },
        {
          category: "college",
          label: "TSI tested + potential college credit",
          description:
            "TSI satisfied via SAT/ACT/TSIA AND meets a potential college credit threshold (AP / IB / OnRamps 3+ / dual credit 3+).",
        },
        {
          category: "career",
          label: "Level I or Level II Certificate",
          description: "THECB-recognized Level I or Level II workforce certificate.",
        },
        {
          category: "career",
          label: "CTE Completer + Tier 1 IBC",
          description:
            "Coherent CTE sequence completed with a Tier 1 industry-based certification.",
        },
        {
          category: "military",
          label: "Military Enlistment",
          description: "Confirmed post-graduation enlistment in any branch of the U.S. Armed Forces.",
        },
        {
          category: "military",
          label: "JROTC + AFQT 65+",
          description: "JROTC sequence completed with AFQT score 65 or higher.",
        },
      ],
    },
  ],
};

export const BINARY_METHODOLOGY_META = {
  id: "tx_binary" as const,
  displayName: "TEA CCMR — Binary (19 TAC §61.1028)",
  applicability:
    "Applies to graduating class 2029 and earlier. Each indicator is met or not met; meeting any one indicator counts as CCMR Met.",
};

// ─────────────────────────────────────────────
// RULES DATA
// ─────────────────────────────────────────────

export const CCMR_RULES: CCMRRule[] = [
  // ── College Readiness ──────────────────────────────────────────────────────
  {
    id: "tsi_ela",
    name: "TSI College Ready — ELA",
    category: "college_readiness",
    qualifies:
      "TSIA2 ELAR score ≥ 945, or TSIA2 Essay ≥ 5, or SAT EBRW ≥ 480, or ACT English + Reading composite ≥ 19, or STAAR English II score ≥ 4000",
    dataSource: "TSIA2 results file (TEA)",
    citation: "19 TAC §61.1028(b)(1)",
    indicatorTypes: ["tsi_reading"],
  },
  {
    id: "tsi_math",
    name: "TSI College Ready — Math",
    category: "college_readiness",
    qualifies:
      "TSIA2 Math score ≥ 950, or SAT Math ≥ 530, or ACT Math ≥ 19, or STAAR Algebra I score ≥ 4000",
    dataSource: "TSIA2 results file (TEA)",
    citation: "19 TAC §61.1028(b)(2)",
    indicatorTypes: ["tsi_math"],
  },
  {
    id: "sat",
    name: "SAT College Ready",
    category: "college_readiness",
    qualifies: "Evidence-Based Reading and Writing (EBRW) ≥ 480 AND Math ≥ 530",
    dataSource: "College Board score file",
    citation: "19 TAC §61.1028(b)(3)",
    indicatorTypes: ["sat_reading", "sat_math"],
  },
  {
    id: "act",
    name: "ACT College Ready",
    category: "college_readiness",
    qualifies:
      "English ≥ 19 AND Math ≥ 19 (section scores, not composite; both must be met in the same test administration)",
    dataSource: "ACT score file",
    citation: "19 TAC §61.1028(b)(4)",
    indicatorTypes: ["act_reading", "act_math"],
  },
  {
    id: "ap_exam",
    name: "AP Exam",
    category: "college_readiness",
    qualifies: "Score of 3 or higher on any College Board Advanced Placement exam",
    dataSource: "College Board AP score file",
    citation: "19 TAC §61.1028(b)(5)",
    indicatorTypes: ["ap_exam"],
  },
  {
    id: "ib_exam",
    name: "IB Exam",
    category: "college_readiness",
    qualifies: "Score of 4 or higher on any International Baccalaureate exam",
    dataSource: "IB score file",
    citation: "19 TAC §61.1028(b)(6)",
    indicatorTypes: ["ib_exam"],
  },

  // ── College Prep & Dual Credit ─────────────────────────────────────────────
  {
    id: "college_prep_ela",
    name: "College Prep Course — ELA",
    category: "college_prep_dual_credit",
    qualifies:
      "Complete a TEA-approved College Prep English course with a final course grade ≥ 70",
    dataSource: "PEIMS Fall Snapshot submission",
    citation: "19 TAC §61.1028(b)(7)",
    indicatorTypes: ["college_prep_ela"],
  },
  {
    id: "college_prep_math",
    name: "College Prep Course — Math",
    category: "college_prep_dual_credit",
    qualifies:
      "Complete a TEA-approved College Prep Math course with a final course grade ≥ 70",
    dataSource: "PEIMS Fall Snapshot submission",
    citation: "19 TAC §61.1028(b)(8)",
    indicatorTypes: ["college_prep_math"],
  },
  {
    id: "dual_credit_ela_math",
    name: "Dual Credit — ELA or Math",
    category: "college_prep_dual_credit",
    qualifies:
      "Complete a PEIMS-coded dual credit course in English Language Arts, Mathematics, or Social Science with a final grade ≥ 70",
    dataSource: "PEIMS / dual credit records",
    citation: "19 TAC §61.1028(b)(9)",
    indicatorTypes: ["dual_credit_ela", "dual_credit_math"],
  },
  {
    id: "dual_credit_9hr",
    name: "Dual Credit — 9+ Hours",
    category: "college_prep_dual_credit",
    qualifies:
      "Complete 9 or more dual credit semester hours across any subjects, each course with a final grade ≥ 70",
    dataSource: "PEIMS / dual credit records",
    citation: "19 TAC §61.1028(b)(10)",
    indicatorTypes: ["dual_credit_any"],
  },

  // ── Industry & Career ──────────────────────────────────────────────────────
  {
    id: "ibc",
    name: "Industry-Based Certification (IBC)",
    category: "industry_career",
    qualifies:
      "Earn a TEA-approved IBC from the state CTE credential catalog while enrolled in high school",
    dataSource: "CTE certification records / IBC data file",
    citation: "19 TAC §61.1028(b)(11)",
    indicatorTypes: ["ibc"],
  },
  {
    id: "associate_degree",
    name: "Associate Degree",
    category: "industry_career",
    qualifies: "Earn an associate degree from a Texas public institution while enrolled in high school",
    dataSource: "Dual enrollment transcript",
    citation: "19 TAC §61.1028(b)(12)",
    indicatorTypes: ["associate_degree"],
  },
  {
    id: "level_i_ii_cert",
    name: "Level I or II Certificate",
    category: "industry_career",
    qualifies:
      "Earn a THECB-recognized Level I or Level II workforce certificate while enrolled in high school",
    dataSource: "Dual enrollment transcript",
    citation: "19 TAC §61.1028(b)(13)",
    indicatorTypes: ["level_i_ii_certificate"],
  },
  {
    id: "onramps",
    name: "OnRamps Course",
    category: "industry_career",
    qualifies:
      "Complete a UT Austin OnRamps dual enrollment course with college credit awarded (grade ≥ 70)",
    dataSource: "OnRamps enrollment records",
    citation: "19 TAC §61.1028(b)(14)",
    indicatorTypes: ["onramps"],
  },
  {
    id: "military_enlistment",
    name: "Military Enlistment",
    category: "industry_career",
    qualifies:
      "Confirmed post-graduation enlistment in any branch of the U.S. Armed Forces",
    dataSource: "Military enlistment verification document",
    citation: "19 TAC §61.1028(b)(15)",
    indicatorTypes: ["military_enlistment"],
  },
];

// ─────────────────────────────────────────────
// LOOKUP HELPERS
// ─────────────────────────────────────────────

/** Map from IndicatorType → CCMRRule for fast modal lookups */
export const INDICATOR_TYPE_TO_RULE: Map<IndicatorType, CCMRRule> = new Map(
  CCMR_RULES.flatMap((rule) => rule.indicatorTypes.map((t) => [t, rule]))
);

export function getRuleForIndicatorType(type: IndicatorType): CCMRRule | null {
  return INDICATOR_TYPE_TO_RULE.get(type) ?? null;
}

export function getRulesByCategory(category: CCMRCategory): CCMRRule[] {
  return CCMR_RULES.filter((r) => r.category === category);
}

// ─────────────────────────────────────────────
// STUDENT EVALUATION BUILDER
// ─────────────────────────────────────────────

/**
 * Given a rule and the student's indicator rows for that rule,
 * return a list of evaluation lines to display in the modal.
 */
export function buildStudentEvaluation(
  rule: CCMRRule,
  byType: Map<IndicatorType, IndicatorRow>
): EvaluationLine[] {
  const lines: EvaluationLine[] = [];

  switch (rule.id) {
    case "sat": {
      const ebrw = byType.get("sat_reading");
      const math = byType.get("sat_math");
      lines.push({
        label: "EBRW",
        value: ebrw?.score != null ? String(ebrw.score) : null,
        threshold: "480",
        met: ebrw ? ebrw.score != null ? ebrw.score >= 480 : ebrw.status === "met" : null,
      });
      lines.push({
        label: "Math",
        value: math?.score != null ? String(math.score) : null,
        threshold: "530",
        met: math ? math.score != null ? math.score >= 530 : math.status === "met" : null,
      });
      break;
    }
    case "act": {
      const eng = byType.get("act_reading");
      const math = byType.get("act_math");
      lines.push({
        label: "English",
        value: eng?.score != null ? String(eng.score) : null,
        threshold: "19",
        met: eng ? eng.score != null ? eng.score >= 19 : eng.status === "met" : null,
      });
      lines.push({
        label: "Math",
        value: math?.score != null ? String(math.score) : null,
        threshold: "19",
        met: math ? math.score != null ? math.score >= 19 : math.status === "met" : null,
      });
      break;
    }
    case "tsi_ela": {
      const row = byType.get("tsi_reading");
      lines.push({
        label: "TSIA2 ELAR",
        value: row?.score != null ? String(row.score) : null,
        threshold: "945",
        met: row ? row.score != null ? row.score >= 945 : row.status === "met" : null,
      });
      break;
    }
    case "tsi_math": {
      const row = byType.get("tsi_math");
      lines.push({
        label: "TSIA2 Math",
        value: row?.score != null ? String(row.score) : null,
        threshold: "950",
        met: row ? row.score != null ? row.score >= 950 : row.status === "met" : null,
      });
      break;
    }
    case "ap_exam": {
      const row = byType.get("ap_exam");
      lines.push({
        label: "AP score",
        value: row?.score != null ? String(row.score) : null,
        threshold: "3",
        met: row ? row.score != null ? row.score >= 3 : row.status === "met" : null,
      });
      break;
    }
    case "ib_exam": {
      const row = byType.get("ib_exam");
      lines.push({
        label: "IB score",
        value: row?.score != null ? String(row.score) : null,
        threshold: "4",
        met: row ? row.score != null ? row.score >= 4 : row.status === "met" : null,
      });
      break;
    }
    // Course-grade based indicators
    default: {
      const type = rule.indicatorTypes[0];
      const row = type ? byType.get(type) : undefined;
      if (rule.indicatorTypes.length > 1) {
        // dual_credit_ela_math — show whichever sub-indicators exist
        for (const t of rule.indicatorTypes) {
          const r = byType.get(t);
          const label = t === "dual_credit_ela" ? "Dual Credit ELA" : "Dual Credit Math";
          lines.push({
            label,
            value: r?.course_grade ?? (r?.score != null ? `${r.score}` : null),
            threshold: "70",
            met: r ? r.course_grade
              ? parseFloat(r.course_grade) >= 70
              : r.status === "met"
            : null,
          });
        }
      } else if (row) {
        lines.push({
          label: rule.name,
          value: row.course_grade ?? (row.score != null ? `${row.score}` : null),
          threshold: row.threshold != null ? String(row.threshold) : null,
          met: row.status === "met",
        });
      } else {
        lines.push({ label: rule.name, value: null, threshold: null, met: null });
      }
      break;
    }
  }

  return lines;
}
