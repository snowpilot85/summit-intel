"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Briefcase,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  CCMR_RULES,
  getRulesByCategory,
  type CCMRRule,
} from "@/lib/ccmr-rules";

/* ============================================
   CCMR Rules Reference Page
   ============================================ */

// ─────────────────────────────────────────────
// CRITICAL RULES CALLOUT
// ─────────────────────────────────────────────

const CRITICAL_RULES = [
  "A student must graduate for CCMR to count — meeting indicators without graduating does not produce a CCMR outcome.",
  "CCMR is calculated on graduating seniors only — underclassmen indicator data is tracked but does not affect accountability until graduation.",
  "Meeting one indicator is sufficient — additional indicators beyond the first provide no extra credit in the accountability calculation.",
  "Data is frozen as of the PEIMS June submission — indicators earned after that deadline do not count toward the current cohort.",
];

const CriticalRulesCallout = () => (
  <div className="bg-warning-light border border-warning rounded-lg p-5">
    <div className="flex items-start gap-3 mb-4">
      <AlertTriangle className="w-5 h-5 text-warning-dark flex-shrink-0 mt-0.5" />
      <div>
        <h2 className="text-[15px] font-semibold text-warning-dark">
          Critical rules — read before interpreting results
        </h2>
        <p className="text-[12px] text-warning-dark/80 mt-0.5">
          These conditions affect whether indicators count toward TEA accountability.
        </p>
      </div>
    </div>
    <ul className="space-y-2.5 ml-8">
      {CRITICAL_RULES.map((rule, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-warning-dark mt-1.5 flex-shrink-0" />
          <p className="text-[13px] text-warning-dark">{rule}</p>
        </li>
      ))}
    </ul>
  </div>
);

// ─────────────────────────────────────────────
// RULE CARD
// ─────────────────────────────────────────────

const RuleCard = ({ rule }: { rule: CCMRRule }) => (
  <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-0">
    <h3 className="text-[14px] font-semibold text-neutral-900 mb-3">{rule.name}</h3>
    <div className="space-y-2">
      <div>
        <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide block mb-0.5">
          What qualifies
        </span>
        <p className="text-[13px] text-neutral-700">{rule.qualifies}</p>
      </div>
      <div className="flex flex-wrap gap-4 pt-1">
        <div>
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide block mb-0.5">
            Data source
          </span>
          <p className="text-[12px] text-neutral-600">{rule.dataSource}</p>
        </div>
        <div>
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wide block mb-0.5">
            TEA citation
          </span>
          <p className="text-[12px] text-neutral-500 font-mono">{rule.citation}</p>
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// SECTION
// ─────────────────────────────────────────────

type SectionConfig = {
  id: "college_readiness" | "college_prep_dual_credit" | "industry_career";
  label: string;
  icon: React.ElementType;
  accent: string;
  count: number;
};

const SECTIONS: SectionConfig[] = [
  {
    id: "college_readiness",
    label: "College Readiness",
    icon: BookOpen,
    accent: "text-primary-600 border-primary-200 bg-primary-50",
    count: getRulesByCategory("college_readiness").length,
  },
  {
    id: "college_prep_dual_credit",
    label: "College Prep & Dual Credit",
    icon: GraduationCap,
    accent: "text-teal-700 border-teal-200 bg-teal-50",
    count: getRulesByCategory("college_prep_dual_credit").length,
  },
  {
    id: "industry_career",
    label: "Industry & Career",
    icon: Briefcase,
    accent: "text-orange-700 border-orange-200 bg-orange-50",
    count: getRulesByCategory("industry_career").length,
  },
];

const RulesSection = ({ section }: { section: SectionConfig }) => {
  const Icon = section.icon;
  const rules = getRulesByCategory(section.id);

  return (
    <div>
      <div className={cn("flex items-center gap-2.5 px-4 py-2.5 rounded-lg border mb-4", section.accent)}>
        <Icon className="w-4 h-4 flex-shrink-0" />
        <h2 className="text-[14px] font-semibold">{section.label}</h2>
        <span className="ml-auto text-[12px] font-medium opacity-70">
          {section.count} indicator{section.count !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {rules.map((rule) => (
          <RuleCard key={rule.id} rule={rule} />
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// SUMMARY BAR
// ─────────────────────────────────────────────

const SummaryBar = () => (
  <div className="flex flex-wrap gap-4 px-5 py-3 bg-neutral-50 border border-neutral-200 rounded-lg">
    <div className="flex items-center gap-1.5">
      <CheckCircle2 className="w-4 h-4 text-teal-600" />
      <span className="text-[13px] text-neutral-700">
        <span className="font-semibold">{CCMR_RULES.length}</span> total indicators
      </span>
    </div>
    {SECTIONS.map((s) => (
      <div key={s.id} className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-neutral-300" />
        <span className="text-[13px] text-neutral-600">
          {s.label}: <span className="font-medium">{s.count}</span>
        </span>
      </div>
    ))}
    <div className="ml-auto">
      <span className="text-[12px] text-neutral-400">Source: TEA 2025 Accountability Manual · 19 TAC §61.1028</span>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export function CCMRRulesPage() {
  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-[24px] font-semibold text-neutral-900">CCMR Rules Reference</h1>
        <p className="text-[14px] text-neutral-600 mt-1">
          All 15 sub-indicators across 3 categories, sourced from the 2025 TEA Accountability Manual.
        </p>
      </div>

      {/* Summary */}
      <SummaryBar />

      {/* Critical rules */}
      <CriticalRulesCallout />

      {/* Three sections */}
      {SECTIONS.map((section) => (
        <RulesSection key={section.id} section={section} />
      ))}
    </div>
  );
}
