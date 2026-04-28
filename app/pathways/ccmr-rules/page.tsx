import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { CCMRRulesPage } from "@/components/pathways/ccmr-rules";
import { PageHeader } from "@/components/layout/page-header";
import { getUserContext } from "@/lib/db/users";

export const metadata: Metadata = {
  title: "CCMR Rules Reference | Summit Insights",
  description: "How Texas CCMR indicators are calculated — TEA 2025 Accountability Manual",
};

export default async function CCMRRulesServerPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const userCtx = await getUserContext(supabase);
  if (!userCtx) redirect("/login");

  const { districtId, profile } = userCtx;
  if (!districtId) redirect("/pathways");

  // This page is only meaningful for TX / CCMR districts
  if (!userCtx.hasCCMR) redirect("/pathways");

  const isSuperAdmin = profile.role === "super_admin";

  return (
    <>
      <PageHeader
        title="CCMR Rules"
        breadcrumbs={[
          { label: "Summit Insights", href: "/pathways" },
          { label: "CCMR Rules" },
        ]}
      />
      <PathwaysAppShell
        activeNavItem="ccmr-rules"
        isSuperAdmin={isSuperAdmin}
        hasCCMR={userCtx.hasCCMR}
      >
        <CCMRRulesPage />
      </PathwaysAppShell>
    </>
  );
}
