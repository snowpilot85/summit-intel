import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getUserContext } from "@/lib/db/users";
import { getCampusSummaries, getCampuses } from "@/lib/db/campuses";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { AFSimulatorPage } from "@/components/pathways/af-simulator";

export const metadata: Metadata = {
  title: "A-F Simulator | Summit Pathways",
  description: "Simulate TEA A-F accountability scores with real campus data",
};

function formatRole(role: string): string {
  return role.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export default async function SimulatorPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const userCtx = await getUserContext(supabase);
  if (!userCtx) redirect("/login");

  const { districtId, profile, districtName, schoolYearLabel } = userCtx;
  if (!districtId) redirect("/pathways");
  const isSuperAdmin = profile.role === "super_admin";
  const queryClient = isSuperAdmin ? createAdminClient() : supabase;

  const [summaries, campuses] = await Promise.all([
    getCampusSummaries(queryClient, districtId),
    getCampuses(queryClient, districtId),
  ]);

  return (
    <PathwaysAppShell
      headerProps={{
        userName: profile.full_name,
        userRole: formatRole(profile.role),
        districtName,
        schoolYear: schoolYearLabel,
        notificationCount: 0,
      }}
      breadcrumbs={[
        { label: "Summit Pathways", href: "/pathways" },
        { label: "A-F Simulator (TX)" },
      ]}
      activeNavItem="simulator"
      isSuperAdmin={isSuperAdmin}
      hasCCMR={userCtx.hasCCMR}
    >
      <AFSimulatorPage summaries={summaries} campuses={campuses} />
    </PathwaysAppShell>
  );
}
