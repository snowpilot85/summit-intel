import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { ClusterExplorer } from "@/components/pathways/cluster-explorer";
import { getClusterExplorer } from "@/lib/db/clusters";
import { getUserContext } from "@/lib/db/users";

export const metadata: Metadata = {
  title: "Career Cluster Explorer | Summit Insights",
  description: "Browse all 16 career clusters, programs of study, credentials, and labor market data",
};

function formatRole(role: string): string {
  return role.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export default async function ClustersPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const userCtx = await getUserContext(supabase);
  if (!userCtx) redirect("/login");

  const { districtId, profile, districtName, schoolYearLabel } = userCtx;
  if (!districtId) redirect("/pathways");
  const isSuperAdmin = profile.role === "super_admin";
  const queryClient = isSuperAdmin ? createAdminClient() : supabase;

  const data = await getClusterExplorer(queryClient, districtId);

  return (
    <PathwaysAppShell
      headerProps={{
        userName: profile.full_name,
        userRole: formatRole(profile.role),
        districtName,
        schoolYear: schoolYearLabel,
        notificationCount: 0,
        isSuperAdmin,
      }}
      breadcrumbs={[
        { label: "Summit Insights", href: "/pathways" },
        { label: "Cluster Explorer" },
      ]}
      activeNavItem="clusters"
      isSuperAdmin={isSuperAdmin}
      hasCCMR={userCtx.hasCCMR}
    >
      <div className="mb-6">
        <h1 className="text-[24px] font-bold text-neutral-900">Career Cluster Explorer</h1>
        <p className="text-[14px] text-neutral-500 mt-1">
          Browse all career clusters available in your district — programs, credentials, and labor market data.
        </p>
      </div>
      <ClusterExplorer
        data={data}
        hasCCMR={userCtx.hasCCMR}
        accountabilitySystem={userCtx.accountabilitySystem}
      />
    </PathwaysAppShell>
  );
}
