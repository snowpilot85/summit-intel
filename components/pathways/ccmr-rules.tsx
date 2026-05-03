"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Briefcase,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import {
  BINARY_METHODOLOGY_META,
  CCMR_RULES,
  TIERED_METHODOLOGY,
  getRulesByCategory,
  type CCMRRule,
  type TieredCategory,
  type TieredLevelDefinition,
  type TieredPathwayRule,
} from "@/lib/ccmr-rules";

/* ============================================
   CCMR Rules Reference Page
   Renders both methodologies (binary ≤ 2029, tiered ≥ 2030).
   ============================================ */

type MethodologyTab = "binary" | "tiered";

// ─────────────────────────────────────────────
// METHODOLOGY TAB BAR
// ─────────────────────────────────────────────

const MethodologyTabs = ({
  active,
  onChange,
}: {
  active: MethodologyTab;
  onChange: (t: MethodologyTab) => void;
}) => {
  const tabs: { id: MethodologyTab; label: string; sub: string }[] = [
    { id: "binary", label: "Binary", sub: "Class of 2029 & earlier" },
    { id: "tiered", label: "Tiered (HB 2)", sub: "Class of 2030 & later" },
  ];
  return (
    <div className="inline-flex rounded-lg border border-neutral-200 bg-neutral-0 overflow-hidden">
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "px-5 py-3 text-left transition-colors border-r last:border-r-0 border-neutral-200",
              isActive
                ? "bg-primary-500 text-neutral-0"
                : "bg-neutral-0 text-neutral-700 hover:bg-neutral-50"
            )}
          >
            <span className="block text-[14px] font-semibold">{tab.label}</span>
            <span className={cn("block text-[11px] mt-0.5", isActive ? "text-neutral-0/80" : "text-neutral-500")}>
              {tab.sub}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────
// BINARY (existing rules)
// ─────────────────────────────────────────────

const BINARY_CRITICAL_RULES = [
  "A student must graduate for CCMR to count — meeting indicators without graduating does not produce a CCMR outcome.",
  "CCMR is calculated on graduating seniors only — underclassmen indicator data is tracked but does not affect accountability until graduation.",
  "Meeting one indicator is sufficient — additional indicators beyond the first provide no extra credit in the accountability calculation.",
  "Data is frozen as of the PEIMS June submission — indicators earned after that deadline do not count toward the current cohort.",
];

const CriticalRulesCallout = ({ items, title }: { items: string[]; title: string }) => (
  <div className="bg-warning-light border border-warning rounded-lg p-5">
    <div className="flex items-start gap-3 mb-4">
      <AlertTriangle className="w-5 h-5 text-warning-dark flex-shrink-0 mt-0.5" />
      <div>
        <h2 className="text-[15px] font-semibold text-warning-dark">{title}</h2>
        <p className="text-[12px] text-warning-dark/80 mt-0.5">
          These conditions affect whether indicators count toward TEA accountability.
        </p>
      </div>
    </div>
    <ul className="space-y-2.5 ml-8">
      {items.map((rule, i) => (
        <li key={i} className="flex items-start gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-warning-dark mt-1.5 flex-shrink-0" />
          <p className="text-[13px] text-warning-dark">{rule}</p>
        </li>
      ))}
    </ul>
  </div>
);

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

type BinarySectionConfig = {
  id: "college_readiness" | "college_prep_dual_credit" | "industry_career";
  label: string;
  icon: React.ElementType;
  accent: string;
  count: number;
};

const BINARY_SECTIONS: BinarySectionConfig[] = [
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

const BinarySection = ({ section }: { section: BinarySectionConfig }) => {
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

const BinaryView = () => (
  <div className="space-y-6">
    <div className="flex flex-wrap gap-4 px-5 py-3 bg-neutral-50 border border-neutral-200 rounded-lg">
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="w-4 h-4 text-teal-600" />
        <span className="text-[13px] text-neutral-700">
          <span className="font-semibold">{CCMR_RULES.length}</span> total indicators
        </span>
      </div>
      {BINARY_SECTIONS.map((s) => (
        <div key={s.id} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-neutral-300" />
          <span className="text-[13px] text-neutral-600">
            {s.label}: <span className="font-medium">{s.count}</span>
          </span>
        </div>
      ))}
      <div className="ml-auto">
        <span className="text-[12px] text-neutral-400">
          {BINARY_METHODOLOGY_META.applicability}
        </span>
      </div>
    </div>

    <CriticalRulesCallout
      title="Critical rules — read before interpreting results"
      items={BINARY_CRITICAL_RULES}
    />

    {BINARY_SECTIONS.map((section) => (
      <BinarySection key={section.id} section={section} />
    ))}
  </div>
);

// ─────────────────────────────────────────────
// TIERED VIEW (HB 2)
// ─────────────────────────────────────────────

const CATEGORY_META: Record<TieredCategory, { label: string; icon: React.ElementType; accent: string }> = {
  college: {
    label: "College",
    icon: BookOpen,
    accent: "text-primary-600 border-primary-200 bg-primary-50",
  },
  career: {
    label: "Career",
    icon: Briefcase,
    accent: "text-orange-700 border-orange-200 bg-orange-50",
  },
  military: {
    label: "Military",
    icon: ShieldCheck,
    accent: "text-teal-700 border-teal-200 bg-teal-50",
  },
};

const LEVEL_THEME: Record<TieredLevelDefinition["level"], { headerBg: string; pillBg: string; pillText: string }> = {
  foundational: {
    headerBg: "bg-success-light",
    pillBg: "bg-success-light",
    pillText: "text-success-dark",
  },
  demonstrated: {
    headerBg: "bg-success/20",
    pillBg: "bg-success",
    pillText: "text-neutral-0",
  },
  advanced: {
    headerBg: "bg-success-dark/15",
    pillBg: "bg-success-dark",
    pillText: "text-neutral-0",
  },
};

const TieredPathwayCard = ({ pathway }: { pathway: TieredPathwayRule }) => {
  const meta = CATEGORY_META[pathway.category];
  const Icon = meta.icon;
  return (
    <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-0">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-3.5 h-3.5 text-neutral-500" />
        <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
          {meta.label}
        </span>
      </div>
      <h4 className="text-[14px] font-semibold text-neutral-900 mb-1">{pathway.label}</h4>
      <p className="text-[13px] text-neutral-700">{pathway.description}</p>
    </div>
  );
};

const TieredLevelSection = ({ level }: { level: TieredLevelDefinition }) => {
  const theme = LEVEL_THEME[level.level];
  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <div className={cn("px-5 py-4 border-b border-neutral-200", theme.headerBg)}>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide",
              theme.pillBg,
              theme.pillText
            )}
          >
            {level.headline}
          </span>
          <p className="text-[13px] text-neutral-700">{level.description}</p>
        </div>
      </div>
      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {level.pathways.map((p, i) => (
          <TieredPathwayCard key={`${level.level}-${i}`} pathway={p} />
        ))}
      </div>
    </div>
  );
};

const TieredView = () => (
  <div className="space-y-6">
    <div className="flex flex-wrap gap-4 px-5 py-3 bg-neutral-50 border border-neutral-200 rounded-lg">
      <div className="flex items-center gap-1.5">
        <CheckCircle2 className="w-4 h-4 text-success" />
        <span className="text-[13px] text-neutral-700">
          <span className="font-semibold">3 tiers</span> · highest level wins
        </span>
      </div>
      {(["college", "career", "military"] as TieredCategory[]).map((cat) => (
        <div key={cat} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-neutral-300" />
          <span className="text-[13px] text-neutral-600">{CATEGORY_META[cat].label}</span>
        </div>
      ))}
      <div className="ml-auto">
        <span className="text-[12px] text-neutral-400">
          {TIERED_METHODOLOGY.applicability}
        </span>
      </div>
    </div>

    <div className="bg-info-light border border-info/30 rounded-lg p-5">
      <div className="flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-info-dark flex-shrink-0 mt-0.5" />
        <div>
          <h2 className="text-[15px] font-semibold text-info-dark">
            Scoring rule — three-percentage formula
          </h2>
          <p className="text-[13px] text-info-dark/85 mt-1">
            {TIERED_METHODOLOGY.scoringRule}
          </p>
        </div>
      </div>
    </div>

    <CriticalRulesCallout
      title="Critical rules — Math+RLA gate, CPC downgrade, and CTE credential separation"
      items={TIERED_METHODOLOGY.criticalRules}
    />

    <div className="space-y-4">
      {TIERED_METHODOLOGY.levels.map((level) => (
        <TieredLevelSection key={level.level} level={level} />
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export function CCMRRulesPage() {
  const [active, setActive] = React.useState<MethodologyTab>("binary");

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-[24px] font-semibold text-neutral-900">CCMR Rules Reference</h1>
        <p className="text-[14px] text-neutral-600 mt-1">
          Texas CCMR rules. Two methodologies coexist — binary for graduating
          class 2029 and earlier, tiered (HB 2) for 2030 and later.
        </p>
      </div>

      <MethodologyTabs active={active} onChange={setActive} />

      {active === "binary" ? <BinaryView /> : <TieredView />}
    </div>
  );
}
