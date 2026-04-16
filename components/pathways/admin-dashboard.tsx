import type {
  AdminDashboardData,
  CampusPathwayStat,
  SubgroupPathwayStat,
  ClusterEnrollmentStat,
  CredentialAttainmentSummary,
} from "@/lib/db/admin";

// ============================================================
// ATTAINMENT CARDS
// ============================================================

function AttainmentCards({ attainment, totalStudents912 }: { attainment: CredentialAttainmentSummary; totalStudents912: number }) {
  const cards = [
    {
      label: "Students in Pathways",
      value: attainment.totalPathwayStudents.toLocaleString(),
      sub: `${totalStudents912 > 0 ? Math.round((attainment.totalPathwayStudents / totalStudents912) * 100) : 0}% of gr. 9-12`,
      color: "border-primary-500",
      textColor: "text-primary-600",
    },
    {
      label: "Credentials Earned",
      value: attainment.credentialsEarned.toLocaleString(),
      sub: `${attainment.totalPathwayStudents > 0 ? Math.round((attainment.credentialsEarned / attainment.totalPathwayStudents) * 100) : 0}% completion rate`,
      color: "border-teal-500",
      textColor: "text-teal-600",
    },
    {
      label: "IBCs Earned",
      value: attainment.ibcEarned.toLocaleString(),
      sub: "Industry-based credentials",
      color: "border-purple-500",
      textColor: "text-purple-600",
    },
    {
      label: "Dual Credit Students",
      value: attainment.dualCreditStudents.toLocaleString(),
      sub: "At least one dual credit indicator met",
      color: "border-amber-500",
      textColor: "text-amber-600",
    },
  ];

  return (
    <section aria-labelledby="attainment-heading">
      <h2 id="attainment-heading" className="text-[18px] font-semibold text-neutral-900 mb-4">
        Credential Attainment
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`bg-neutral-0 rounded-lg border border-neutral-200 border-l-4 ${c.color} p-4`}
          >
            <p className="text-[12px] font-medium text-neutral-500 uppercase tracking-wide mb-1">{c.label}</p>
            <p className={`text-[28px] font-bold ${c.textColor} leading-tight`}>{c.value}</p>
            <p className="text-[12px] text-neutral-500 mt-1">{c.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================
// CAMPUS TABLE
// ============================================================

function CampusTable({ campusStats }: { campusStats: CampusPathwayStat[] }) {
  const sorted = [...campusStats].sort((a, b) => b.pathwayRate - a.pathwayRate);

  function RateBar({ value }: { value: number }) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-neutral-100 rounded-full h-1.5 min-w-[60px]">
          <div
            className="bg-teal-500 h-1.5 rounded-full"
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="text-[13px] font-medium text-neutral-700 w-9 text-right">{value}%</span>
      </div>
    );
  }

  return (
    <section aria-labelledby="campus-heading">
      <h2 id="campus-heading" className="text-[18px] font-semibold text-neutral-900 mb-4">
        Pathway Completion by Campus
      </h2>
      <div className="bg-neutral-0 rounded-lg border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">Campus</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">Students (9-12)</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">With Pathway</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">Credentials</th>
                <th className="px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide min-w-[160px]">Pathway Rate</th>
                <th className="px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide min-w-[160px]">Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr
                  key={row.campusId}
                  className={`border-b border-neutral-100 ${i % 2 === 0 ? "" : "bg-neutral-50/50"} hover:bg-teal-50/30 transition-colors`}
                >
                  <td className="px-4 py-3 font-medium text-neutral-900">{row.campusName}</td>
                  <td className="px-4 py-3 text-right text-neutral-600">{row.totalStudents.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-neutral-600">{row.studentsWithPathways.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-neutral-600">{row.credentialsEarned.toLocaleString()}</td>
                  <td className="px-4 py-3"><RateBar value={row.pathwayRate} /></td>
                  <td className="px-4 py-3"><RateBar value={row.completionRate} /></td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-neutral-400">No campus data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// EQUITY TABLE
// ============================================================

function EquityTable({ subgroupStats }: { subgroupStats: SubgroupPathwayStat[] }) {
  const allRow = subgroupStats.find((s) => s.key === "all");

  return (
    <section aria-labelledby="equity-heading">
      <h2 id="equity-heading" className="text-[18px] font-semibold text-neutral-900 mb-4">
        Equity Breakdown by Student Group
      </h2>
      <div className="bg-neutral-0 rounded-lg border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">Student Group</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">Total</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">With Pathway</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">Credentials</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">Pathway Rate</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">Completion Rate</th>
                <th className="text-right px-4 py-3 text-[12px] font-semibold text-neutral-500 uppercase tracking-wide">Gap vs All</th>
              </tr>
            </thead>
            <tbody>
              {subgroupStats.map((row, i) => {
                const gap = allRow && row.key !== "all" ? row.pathwayRate - allRow.pathwayRate : null;
                const isAll = row.key === "all";
                return (
                  <tr
                    key={row.key}
                    className={`border-b border-neutral-100 ${isAll ? "bg-neutral-50 font-semibold" : i % 2 === 0 ? "" : "bg-neutral-50/50"}`}
                  >
                    <td className="px-4 py-3 text-neutral-900">{row.label}</td>
                    <td className="px-4 py-3 text-right text-neutral-600">{row.totalStudents.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-neutral-600">{row.studentsWithPathways.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-neutral-600">{row.credentialsEarned.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-neutral-700">{row.pathwayRate}%</td>
                    <td className="px-4 py-3 text-right text-neutral-700">{row.completionRate}%</td>
                    <td className="px-4 py-3 text-right">
                      {gap === null ? (
                        <span className="text-neutral-400">—</span>
                      ) : gap < 0 ? (
                        <span className="text-red-600 font-medium">{gap}pp</span>
                      ) : gap > 0 ? (
                        <span className="text-teal-600 font-medium">+{gap}pp</span>
                      ) : (
                        <span className="text-neutral-400">0pp</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[11px] text-neutral-400 mt-2">Gap = subgroup pathway rate minus All Students rate. Negative values indicate an equity gap.</p>
    </section>
  );
}

// ============================================================
// CLUSTER CHART
// ============================================================

function ClusterChart({ clusterStats }: { clusterStats: ClusterEnrollmentStat[] }) {
  const max = clusterStats.length > 0 ? clusterStats[0].enrolled : 1;

  return (
    <section aria-labelledby="cluster-heading">
      <h2 id="cluster-heading" className="text-[18px] font-semibold text-neutral-900 mb-4">
        Career Cluster Distribution
      </h2>
      <div className="bg-neutral-0 rounded-lg border border-neutral-200 p-5">
        {clusterStats.length === 0 ? (
          <p className="text-neutral-400 text-[13px]">No cluster data available.</p>
        ) : (
          <div className="space-y-3">
            {clusterStats.map((row) => {
              const barWidth = max > 0 ? Math.round((row.enrolled / max) * 100) : 0;
              const credPct = row.enrolled > 0 ? Math.round((row.credentialsEarned / row.enrolled) * 100) : 0;
              return (
                <div key={row.clusterCode} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-medium text-neutral-800 truncate max-w-[240px]" title={row.clusterName}>
                      {row.clusterName}
                    </span>
                    <div className="flex items-center gap-3 text-[12px] text-neutral-500 flex-shrink-0 ml-4">
                      <span>{row.enrolled.toLocaleString()} enrolled</span>
                      <span className="text-teal-600 font-medium">{credPct}% earned</span>
                    </div>
                  </div>
                  <div className="h-5 bg-neutral-100 rounded-md overflow-hidden relative">
                    <div
                      className="h-full bg-primary-400 rounded-md transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                    {row.enrolled > 0 && (
                      <div
                        className="absolute top-0 left-0 h-full bg-teal-500 rounded-md"
                        style={{ width: `${Math.round((row.credentialsEarned / max) * 100)}%` }}
                        title={`${row.credentialsEarned} credentials earned`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-100">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-primary-400" />
                <span className="text-[11px] text-neutral-500">Enrolled</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm bg-teal-500" />
                <span className="text-[11px] text-neutral-500">Credentials earned</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ============================================================
// ROOT COMPONENT
// ============================================================

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  return (
    <div className="space-y-8">
      <AttainmentCards attainment={data.attainment} totalStudents912={data.totalStudents912} />
      <CampusTable campusStats={data.campusStats} />
      <EquityTable subgroupStats={data.subgroupStats} />
      <ClusterChart clusterStats={data.clusterStats} />
    </div>
  );
}
