"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Languages,
  TrendingUp,
  Users,
  Award,
  BookOpen,
  Briefcase,
  GraduationCap,
  CheckCircle2,
  Clock,
  Star,
} from "lucide-react";
import type { ClusterDetail, ClusterExplorerData, ProgramDetail, CredentialDetail, LaborMarketDetail } from "@/lib/db/clusters";

/* ============================================================
   Career Cluster Explorer
   ============================================================ */

// ── Cluster color palette ──────────────────────────────────────

type ClusterTheme = {
  card: string;       // card background + border
  icon: string;       // icon circle background
  iconText: string;   // icon text/color
  badge: string;      // code badge
  accent: string;     // accent bar
};

const CLUSTER_THEMES: Record<string, ClusterTheme> = {
  HLTH: { card: "border-teal-200 hover:border-teal-400",   icon: "bg-teal-500",    iconText: "text-white", badge: "bg-teal-100 text-teal-700",   accent: "bg-teal-500" },
  INFO: { card: "border-blue-200 hover:border-blue-400",   icon: "bg-blue-500",    iconText: "text-white", badge: "bg-blue-100 text-blue-700",   accent: "bg-blue-500" },
  MANU: { card: "border-orange-200 hover:border-orange-400", icon: "bg-orange-500", iconText: "text-white", badge: "bg-orange-100 text-orange-700", accent: "bg-orange-500" },
  BUSI: { card: "border-purple-200 hover:border-purple-400", icon: "bg-purple-500", iconText: "text-white", badge: "bg-purple-100 text-purple-700", accent: "bg-purple-500" },
  LAWS: { card: "border-red-200 hover:border-red-400",     icon: "bg-red-500",     iconText: "text-white", badge: "bg-red-100 text-red-700",     accent: "bg-red-500" },
  ARCH: { card: "border-amber-200 hover:border-amber-400", icon: "bg-amber-500",   iconText: "text-white", badge: "bg-amber-100 text-amber-700", accent: "bg-amber-500" },
  TRAN: { card: "border-slate-200 hover:border-slate-400", icon: "bg-slate-500",   iconText: "text-white", badge: "bg-slate-100 text-slate-700", accent: "bg-slate-500" },
  HOSP: { card: "border-yellow-200 hover:border-yellow-400", icon: "bg-yellow-500", iconText: "text-white", badge: "bg-yellow-100 text-yellow-700", accent: "bg-yellow-500" },
  HUMS: { card: "border-pink-200 hover:border-pink-400",   icon: "bg-pink-500",    iconText: "text-white", badge: "bg-pink-100 text-pink-700",   accent: "bg-pink-500" },
  AGRI: { card: "border-green-200 hover:border-green-400", icon: "bg-green-600",   iconText: "text-white", badge: "bg-green-100 text-green-700", accent: "bg-green-600" },
  ARTS: { card: "border-violet-200 hover:border-violet-400", icon: "bg-violet-500", iconText: "text-white", badge: "bg-violet-100 text-violet-700", accent: "bg-violet-500" },
  EDUC: { card: "border-indigo-200 hover:border-indigo-400", icon: "bg-indigo-500", iconText: "text-white", badge: "bg-indigo-100 text-indigo-700", accent: "bg-indigo-500" },
  FINA: { card: "border-emerald-200 hover:border-emerald-400", icon: "bg-emerald-600", iconText: "text-white", badge: "bg-emerald-100 text-emerald-700", accent: "bg-emerald-600" },
  GOVT: { card: "border-gray-200 hover:border-gray-400",   icon: "bg-gray-600",    iconText: "text-white", badge: "bg-gray-100 text-gray-700",   accent: "bg-gray-600" },
  MKTG: { card: "border-rose-200 hover:border-rose-400",   icon: "bg-rose-500",    iconText: "text-white", badge: "bg-rose-100 text-rose-700",   accent: "bg-rose-500" },
  STEM: { card: "border-cyan-200 hover:border-cyan-400",   icon: "bg-cyan-500",    iconText: "text-white", badge: "bg-cyan-100 text-cyan-700",   accent: "bg-cyan-500" },
};

const DEFAULT_THEME: ClusterTheme = {
  card: "border-neutral-200 hover:border-neutral-400",
  icon: "bg-neutral-500",
  iconText: "text-white",
  badge: "bg-neutral-100 text-neutral-700",
  accent: "bg-neutral-500",
};

function getTheme(code: string): ClusterTheme {
  return CLUSTER_THEMES[code] ?? DEFAULT_THEME;
}

// ── Cluster initials (icon fallback) ──────────────────────────

function ClusterInitials({ code, theme }: { code: string; theme: ClusterTheme }) {
  return (
    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", theme.icon)}>
      <span className={cn("text-[13px] font-bold", theme.iconText)}>{code.slice(0, 2)}</span>
    </div>
  );
}

// ── Bilingual Asset Badge ──────────────────────────────────────

function BilingualBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-300">
      <Languages className="w-3 h-3" />
      Bilingual Asset Career
    </span>
  );
}

// ── Credential type label ──────────────────────────────────────

const CRED_TYPE_LABELS: Record<string, string> = {
  certification: "Certification",
  license: "License",
  associate_degree: "Associate Degree",
  level_i_certificate: "Level I Certificate",
  level_ii_certificate: "Level II Certificate",
  apprenticeship: "Apprenticeship",
  military_enlistment: "Military Enlistment",
  other: "Other",
};

function CredTypeBadge({ type }: { type: string }) {
  const isPostsec = type === "associate_degree" || type === "level_i_certificate" || type === "level_ii_certificate";
  return (
    <span className={cn(
      "inline-flex px-2 py-0.5 rounded text-[11px] font-medium",
      isPostsec ? "bg-indigo-50 text-indigo-700" : "bg-neutral-100 text-neutral-600"
    )}>
      {CRED_TYPE_LABELS[type] ?? type}
    </span>
  );
}

// ── Salary formatter ──────────────────────────────────────────

function fmtSalary(n: number | null): string {
  if (n == null) return "—";
  return `$${n.toLocaleString()}`;
}

function fmtNum(n: number | null): string {
  if (n == null) return "—";
  return n.toLocaleString();
}

// ── SECTION: Programs of Study ────────────────────────────────

function ProgramsSection({ programs }: { programs: ProgramDetail[] }) {
  if (programs.length === 0) {
    return <p className="text-[13px] text-neutral-400">No programs of study listed for this cluster.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {programs.map((p) => (
        <div key={p.id} className="border border-neutral-200 rounded-lg p-3 bg-neutral-50">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-[14px] font-semibold text-neutral-900">{p.name}</p>
            <span className="text-[11px] font-mono text-neutral-400 flex-shrink-0">{p.code}</span>
          </div>
          {p.description && (
            <p className="text-[12px] text-neutral-600 mb-2 leading-snug">{p.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {p.typicalDurationYears} yr{p.typicalDurationYears !== 1 ? "s" : ""}
            </span>
            {p.cipCode && (
              <span className="font-mono">CIP {p.cipCode}</span>
            )}
          </div>
          {p.credentials.length > 0 && (
            <div className="mt-2 pt-2 border-t border-neutral-200 flex flex-wrap gap-1">
              {p.credentials.map((cred) => (
                <span
                  key={cred.id}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium",
                    cred.isCapstone ? "bg-teal-50 text-teal-700 border border-teal-200" : "bg-neutral-100 text-neutral-600"
                  )}
                  title={cred.isCapstone ? "Capstone credential" : undefined}
                >
                  {cred.isCapstone && <Star className="w-2.5 h-2.5" />}
                  {cred.name}
                  {cred.typicalGrade && <span className="text-neutral-400">· Gr {cred.typicalGrade}</span>}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── SECTION: Credentials ──────────────────────────────────────

function CredentialsSection({ credentials }: { credentials: CredentialDetail[] }) {
  if (credentials.length === 0) {
    return <p className="text-[13px] text-neutral-400">No credentials listed for this cluster.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="bg-neutral-50 border-b border-neutral-200">
            <th className="text-left px-4 py-2.5 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">Credential</th>
            <th className="text-left px-4 py-2.5 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">Issuing Body</th>
            <th className="text-left px-4 py-2.5 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">Type</th>
            <th className="text-left px-4 py-2.5 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">Passing Score</th>
            <th className="text-left px-4 py-2.5 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">Exam Window</th>
            <th className="text-center px-4 py-2.5 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">CCMR</th>
          </tr>
        </thead>
        <tbody>
          {credentials.map((cred, i) => (
            <tr key={cred.id} className={i % 2 === 0 ? "" : "bg-neutral-50/50"}>
              <td className="px-4 py-2.5 font-medium text-neutral-900">{cred.name}</td>
              <td className="px-4 py-2.5 text-neutral-600">{cred.issuingBody ?? "—"}</td>
              <td className="px-4 py-2.5">
                <CredTypeBadge type={cred.credentialType} />
              </td>
              <td className="px-4 py-2.5 text-neutral-600">{cred.passingScore ?? "—"}</td>
              <td className="px-4 py-2.5 text-neutral-600 max-w-[200px] truncate" title={cred.examWindowNotes ?? undefined}>
                {cred.examWindowNotes ?? "—"}
              </td>
              <td className="px-4 py-2.5 text-center">
                {cred.isCcmrEligible ? (
                  <CheckCircle2 className="w-4 h-4 text-teal-500 mx-auto" />
                ) : (
                  <span className="text-neutral-300">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── SECTION: Labor Market ─────────────────────────────────────

function LaborMarketSection({ lmd, isBilingualAsset }: { lmd: LaborMarketDetail | null; isBilingualAsset: boolean }) {
  if (!lmd) {
    return <p className="text-[13px] text-neutral-400">No labor market data available for this cluster.</p>;
  }

  const growthPositive = (lmd.growthRatePct ?? 0) > 0;

  return (
    <div className="space-y-4">
      {/* Key stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Jobs", value: fmtNum(lmd.totalJobs) },
          { label: "Annual Openings", value: fmtNum(lmd.annualJobOpenings) },
          { label: "Median Salary", value: fmtSalary(lmd.medianAnnualSalary) },
          {
            label: "10-Year Growth",
            value: lmd.growthRatePct != null ? `${lmd.growthRatePct > 0 ? "+" : ""}${lmd.growthRatePct}%` : "—",
            highlight: growthPositive,
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
            <p className="text-[11px] text-neutral-500 uppercase tracking-wide font-medium mb-1">{stat.label}</p>
            <p className={cn("text-[20px] font-bold", stat.highlight ? "text-teal-600" : "text-neutral-800")}>
              {stat.highlight && <TrendingUp className="w-4 h-4 inline mr-1 mb-0.5" />}
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Salary range */}
      {(lmd.salaryEntryLevel || lmd.salaryExperienced) && (
        <div className="flex items-center gap-4 text-[13px] text-neutral-600">
          <span>Salary range:</span>
          <span className="font-medium">{fmtSalary(lmd.salaryEntryLevel)} entry</span>
          <span>→</span>
          <span className="font-medium">{fmtSalary(lmd.salaryExperienced)} experienced</span>
        </div>
      )}

      {/* Bilingual premium callout */}
      {isBilingualAsset && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <Languages className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-amber-800">Bilingual Premium Pay</p>
            <p className="text-[12px] text-amber-700 mt-0.5">
              Bilingual candidates in this cluster typically earn 5–15% above the median salary.
              Employers in Health Science, Law, Education, and Human Services actively recruit bilingual speakers to serve Spanish-speaking communities.
            </p>
          </div>
        </div>
      )}

      {/* Top occupations */}
      {lmd.topOccupations.length > 0 && (
        <div>
          <p className="text-[13px] font-semibold text-neutral-700 mb-2">Top Occupations</p>
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="text-left px-4 py-2 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">Occupation</th>
                  <th className="text-left px-4 py-2 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">SOC Code</th>
                  <th className="text-right px-4 py-2 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">Median Salary</th>
                  <th className="text-right px-4 py-2 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">Annual Openings</th>
                </tr>
              </thead>
              <tbody>
                {lmd.topOccupations.map((occ, i) => (
                  <tr key={occ.socCode + i} className={i % 2 === 0 ? "" : "bg-neutral-50/50"}>
                    <td className="px-4 py-2 text-neutral-900">{occ.title}</td>
                    <td className="px-4 py-2 font-mono text-neutral-500 text-[12px]">{occ.socCode}</td>
                    <td className="px-4 py-2 text-right text-neutral-700 font-medium">{fmtSalary(occ.medianSalary)}</td>
                    <td className="px-4 py-2 text-right text-neutral-600">{fmtNum(occ.annualOpenings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {lmd.dataSource && (
        <p className="text-[11px] text-neutral-400">Source: {lmd.dataSource} · {lmd.regionCode === "statewide" ? "Statewide" : lmd.regionCode} · {lmd.dataYear}</p>
      )}
    </div>
  );
}

// ── SECTION: Postsecondary Connections ────────────────────────

function PostsecondarySection({ programs }: { programs: ProgramDetail[] }) {
  // Derive postsecondary connections from programs with CIP codes and
  // credentials that are degrees/certificates.
  const connections: { programName: string; cipCode: string | null; pathways: string[] }[] = programs
    .filter((p) => p.cipCode || p.credentials.some((c) => ["associate_degree", "level_i_certificate", "level_ii_certificate"].includes(c.credentialType)))
    .map((p) => ({
      programName: p.name,
      cipCode: p.cipCode,
      pathways: p.credentials
        .filter((c) => ["associate_degree", "level_i_certificate", "level_ii_certificate"].includes(c.credentialType))
        .map((c) => c.name),
    }));

  // Always show a general note even if no specific records
  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <GraduationCap className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-indigo-800 mb-1">Articulation & Dual Credit Pathways</p>
            <p className="text-[12px] text-indigo-700 leading-relaxed">
              Many programs of study in this cluster have articulation agreements with community colleges and universities.
              Students who complete the program sequence may receive college credit, reducing time and cost to a degree.
              CIP codes below align with community college catalog numbers for seamless transfer.
            </p>
          </div>
        </div>
      </div>

      {connections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {connections.map((conn) => (
            <div key={conn.programName} className="border border-neutral-200 rounded-lg p-3 bg-neutral-50">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-[13px] font-semibold text-neutral-900">{conn.programName}</p>
                {conn.cipCode && (
                  <span className="text-[11px] font-mono bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded flex-shrink-0">
                    CIP {conn.cipCode}
                  </span>
                )}
              </div>
              {conn.pathways.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {conn.pathways.map((p) => (
                    <span key={p} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <GraduationCap className="w-2.5 h-2.5" />
                      {p}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[12px] text-neutral-500">Dual credit options available — contact your district CTE coordinator.</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-neutral-500">
          Contact your district CTE coordinator or the Texas Higher Education Coordinating Board (THECB) for articulation agreements specific to this cluster.
        </p>
      )}
    </div>
  );
}

// ── Detail Panel ──────────────────────────────────────────────

type DetailTab = "programs" | "credentials" | "labor" | "postsecondary";

function ClusterDetailPanel({ cluster }: { cluster: ClusterDetail }) {
  const [activeTab, setActiveTab] = React.useState<DetailTab>("programs");
  const theme = getTheme(cluster.code);

  const tabs: { id: DetailTab; label: string; icon: React.ElementType }[] = [
    { id: "programs", label: "Programs of Study", icon: BookOpen },
    { id: "credentials", label: "Credentials", icon: Award },
    { id: "labor", label: "Labor Market", icon: Briefcase },
    { id: "postsecondary", label: "Postsecondary", icon: GraduationCap },
  ];

  return (
    <div className="border-t border-neutral-200 bg-neutral-50">
      {/* Tab bar */}
      <div className="flex gap-1 px-5 pt-4 border-b border-neutral-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium rounded-t-md transition-colors border-b-2 -mb-px",
                isActive
                  ? `border-b-2 text-neutral-900 bg-neutral-0 border-b-${theme.accent.replace("bg-", "")}`
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id === "programs" && cluster.programs.length > 0 && (
                <span className="ml-1 text-[11px] bg-neutral-200 text-neutral-600 px-1.5 rounded-full">{cluster.programs.length}</span>
              )}
              {tab.id === "credentials" && cluster.credentials.length > 0 && (
                <span className="ml-1 text-[11px] bg-neutral-200 text-neutral-600 px-1.5 rounded-full">{cluster.credentials.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="p-5">
        {activeTab === "programs" && <ProgramsSection programs={cluster.programs} />}
        {activeTab === "credentials" && <CredentialsSection credentials={cluster.credentials} />}
        {activeTab === "labor" && <LaborMarketSection lmd={cluster.laborMarket} isBilingualAsset={cluster.isBilingualAsset} />}
        {activeTab === "postsecondary" && <PostsecondarySection programs={cluster.programs} />}
      </div>
    </div>
  );
}

// ── Cluster Card ──────────────────────────────────────────────

function ClusterCard({
  cluster,
  isExpanded,
  onToggle,
}: {
  cluster: ClusterDetail;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const theme = getTheme(cluster.code);

  return (
    <div
      className={cn(
        "bg-neutral-0 rounded-xl border-2 transition-all duration-200 overflow-hidden",
        isExpanded ? "border-neutral-400 shadow-md col-span-full" : theme.card,
        !isExpanded && "shadow-sm"
      )}
    >
      {/* Card header — always visible */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-500"
        aria-expanded={isExpanded}
      >
        <div className="flex items-start gap-3">
          {/* Left: icon + content */}
          <ClusterInitials code={cluster.code} theme={theme} />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-0.5">
                  <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded", theme.badge)}>
                    {cluster.code}
                  </span>
                  {cluster.isBilingualAsset && <BilingualBadge />}
                </div>
                <h3 className="text-[15px] font-semibold text-neutral-900 leading-snug">{cluster.name}</h3>
                {cluster.description && !isExpanded && (
                  <p className="text-[12px] text-neutral-500 mt-1 line-clamp-2">{cluster.description}</p>
                )}
              </div>

              {/* Expand icon */}
              <div className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-neutral-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-neutral-400" />
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-[12px] text-neutral-600">
                <Users className="w-3.5 h-3.5 text-neutral-400" />
                <span>{cluster.enrolled.toLocaleString()} enrolled</span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-neutral-600">
                <Award className="w-3.5 h-3.5 text-neutral-400" />
                <span>{cluster.credentialsEarned.toLocaleString()} credentials</span>
              </div>
              {cluster.laborMarket?.medianAnnualSalary && (
                <div className="flex items-center gap-1.5 text-[12px] text-neutral-600">
                  <TrendingUp className="w-3.5 h-3.5 text-neutral-400" />
                  <span>${(cluster.laborMarket.medianAnnualSalary / 1000).toFixed(0)}k median</span>
                </div>
              )}
              {cluster.programs.length > 0 && (
                <span className="text-[12px] text-neutral-500">
                  {cluster.programs.length} program{cluster.programs.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      {/* Expanded detail panel */}
      {isExpanded && <ClusterDetailPanel cluster={cluster} />}
    </div>
  );
}

// ── Summary bar ───────────────────────────────────────────────

function SummaryBar({ data }: { data: ClusterExplorerData }) {
  const withLmd = data.clusters.filter((c) => c.laborMarket).length;
  const bilingualCount = data.clusters.filter((c) => c.isBilingualAsset).length;
  const totalCreds = data.clusters.reduce((sum, c) => sum + c.credentials.length, 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {[
        { label: "Career Clusters", value: data.clusters.length },
        { label: "District Students Enrolled", value: data.totalDistrictEnrolled.toLocaleString() },
        { label: "Credentials Available", value: totalCreds },
        { label: "Bilingual Asset Clusters", value: bilingualCount, icon: Languages, highlight: true },
      ].map((s) => (
        <div key={s.label} className={cn("bg-neutral-0 rounded-lg border border-neutral-200 p-3", s.highlight && "border-amber-200 bg-amber-50")}>
          <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wide mb-1">{s.label}</p>
          <div className={cn("flex items-center gap-1.5 text-[22px] font-bold", s.highlight ? "text-amber-700" : "text-neutral-900")}>
            {s.icon && <Languages className="w-5 h-5" />}
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Root Component ────────────────────────────────────────────

export function ClusterExplorer({ data }: { data: ClusterExplorerData }) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  const filtered = data.clusters.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div>
      <SummaryBar data={data} />

      {/* Search */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clusters..."
            className="w-full bg-neutral-0 border border-neutral-200 rounded-md pl-3 pr-3 py-2 text-[13px] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        {expandedId && (
          <button
            onClick={() => setExpandedId(null)}
            className="text-[13px] text-neutral-500 hover:text-neutral-700 underline"
          >
            Collapse
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-min">
        {filtered.map((cluster) => (
          <ClusterCard
            key={cluster.id}
            cluster={cluster}
            isExpanded={expandedId === cluster.id}
            onToggle={() => toggle(cluster.id)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-neutral-400 text-[14px]">
            No clusters match &ldquo;{search}&rdquo;.
          </div>
        )}
      </div>
    </div>
  );
}
