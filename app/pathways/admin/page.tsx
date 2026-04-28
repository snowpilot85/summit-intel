import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { AdminDashboard } from "@/components/pathways/admin-dashboard";
import { PageHeader } from "@/components/layout/page-header";
import { getAdminDashboard } from "@/lib/db/admin";
import { getUserContext } from "@/lib/db/users";

export const metadata: Metadata = {
  title: "District Admin | Summit Insights",
  description: "District-wide CTE pathway outcomes and equity dashboard",
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const userCtx = await getUserContext(supabase);
  if (!userCtx) redirect("/login");

  const { districtId, profile } = userCtx;
  if (!districtId) redirect("/pathways");
  const isSuperAdmin = profile.role === "super_admin";
  const queryClient = isSuperAdmin ? createAdminClient() : supabase;

  const data = await getAdminDashboard(queryClient, districtId);

  return (
    <>
      <PageHeader
        title="District Admin"
        breadcrumbs={[
          { label: "Summit Insights", href: "/pathways" },
          { label: "District Admin" },
        ]}
      />
      <PathwaysAppShell
        activeNavItem="admin"
        isSuperAdmin={isSuperAdmin}
        hasCCMR={userCtx.hasCCMR}
      >
        <p className="mb-6 text-[14px] text-neutral-500">
          CTE pathway outcomes across your district.
        </p>
        <AdminDashboard data={data} />
      </PathwaysAppShell>
    </>
  );
}
