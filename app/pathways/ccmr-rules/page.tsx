import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { CCMRRulesPage } from "@/components/pathways/ccmr-rules";
import { getUserContext } from "@/lib/db/users";

export const metadata: Metadata = {
  title: "CCMR Rules Reference | Summit Insights",
  description: "How Texas CCMR indicators are calculated — TEA 2025 Accountability Manual",
};

function formatRole(role: string): string {
  return role.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export default async function CCMRRulesServerPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const userCtx = await getUserContext(supabase);
  if (!userCtx) redirect("/login");

  const { districtId, profile, districtName, schoolYearLabel } = userCtx;
  if (!districtId) redirect("/pathways");

  // This page is only meaningful for TX / CCMR districts
  if (!userCtx.hasCCMR) redirect("/pathways");

  const isSuperAdmin = profile.role === "super_admin";

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
        { label: "Summit Insights", href: "/pathways" },
        { label: "CCMR Rules" },
      ]}
      activeNavItem="ccmr-rules"
      isSuperAdmin={isSuperAdmin}
      hasCCMR={userCtx.hasCCMR}
    >
      <CCMRRulesPage />
    </PathwaysAppShell>
  );
}
