import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { AdminDashboard } from "@/components/pathways/admin-dashboard";
import { getAdminDashboard } from "@/lib/db/admin";
import { getUserContext } from "@/lib/db/users";

export const metadata: Metadata = {
  title: "District Admin | Summit Pathways",
  description: "District-wide CTE pathway outcomes and equity dashboard",
};

function formatRole(role: string): string {
  return role.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const userCtx = await getUserContext(supabase);
  if (!userCtx) redirect("/login");

  const { districtId, profile, districtName, schoolYearLabel } = userCtx;
  if (!districtId) redirect("/pathways");
  const isSuperAdmin = profile.role === "super_admin";
  const queryClient = isSuperAdmin ? createAdminClient() : supabase;

  const data = await getAdminDashboard(queryClient, districtId);

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
        { label: "Summit Pathways", href: "/pathways" },
        { label: "District Admin" },
      ]}
      activeNavItem="admin"
      isSuperAdmin={isSuperAdmin}
    >
      <div className="mb-6">
        <h1 className="text-[24px] font-bold text-neutral-900">District Admin View</h1>
        <p className="text-[14px] text-neutral-500 mt-1">
          CTE pathway outcomes across {districtName} — {schoolYearLabel}
        </p>
      </div>
      <AdminDashboard data={data} />
    </PathwaysAppShell>
  );
}
