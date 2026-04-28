import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { ClusterExplorer } from "@/components/pathways/cluster-explorer";
import { PageHeader } from "@/components/layout/page-header";
import { getClusterExplorer } from "@/lib/db/clusters";
import { getUserContext } from "@/lib/db/users";

export const metadata: Metadata = {
  title: "Career Cluster Explorer | Summit Insights",
  description: "Browse all 16 career clusters, programs of study, credentials, and labor market data",
};

export default async function ClustersPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const userCtx = await getUserContext(supabase);
  if (!userCtx) redirect("/login");

  const { districtId, profile } = userCtx;
  if (!districtId) redirect("/pathways");
  const isSuperAdmin = profile.role === "super_admin";
  const queryClient = isSuperAdmin ? createAdminClient() : supabase;

  const data = await getClusterExplorer(queryClient, districtId);

  return (
    <>
      <PageHeader
        title="Career Cluster Explorer"
        breadcrumbs={[
          { label: "Summit Insights", href: "/pathways" },
          { label: "Cluster Explorer" },
        ]}
      />
      <PathwaysAppShell
        activeNavItem="clusters"
        isSuperAdmin={isSuperAdmin}
        hasCCMR={userCtx.hasCCMR}
      >
        <p className="mb-6 text-[14px] text-neutral-500">
          Browse all career clusters available in your district — programs, credentials, and labor market data.
        </p>
        <ClusterExplorer
          data={data}
          hasCCMR={userCtx.hasCCMR}
          accountabilitySystem={userCtx.accountabilitySystem}
        />
      </PathwaysAppShell>
    </>
  );
}
