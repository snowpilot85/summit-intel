import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getUserContext } from "@/lib/db/users";
import { getCampusSummaries, getCampuses } from "@/lib/db/campuses";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { AFSimulatorPage } from "@/components/pathways/af-simulator";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "A-F Simulator | Summit Insights",
  description: "Simulate TEA A-F accountability scores with real campus data",
};

export default async function SimulatorPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const userCtx = await getUserContext(supabase);
  if (!userCtx) redirect("/login");

  const { districtId, profile } = userCtx;
  if (!districtId) redirect("/pathways");
  const isSuperAdmin = profile.role === "super_admin";
  const queryClient = isSuperAdmin ? createAdminClient() : supabase;

  const [summaries, campuses] = await Promise.all([
    getCampusSummaries(queryClient, districtId),
    getCampuses(queryClient, districtId),
  ]);

  return (
    <>
      <PageHeader
        title="A-F Simulator (TX)"
        breadcrumbs={[
          { label: "Summit Insights", href: "/pathways" },
          { label: "A-F Simulator (TX)" },
        ]}
      />
      <PathwaysAppShell
        activeNavItem="simulator"
        isSuperAdmin={isSuperAdmin}
        hasCCMR={userCtx.hasCCMR}
      >
        <AFSimulatorPage summaries={summaries} campuses={campuses} />
      </PathwaysAppShell>
    </>
  );
}
