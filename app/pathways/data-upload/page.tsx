import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { DataUploadPage } from "@/components/pathways/data-upload";
import { PageHeader } from "@/components/layout/page-header";
import { getUserContext } from "@/lib/db/users";
import type { DataUploadRow } from "@/types/database";

export const metadata: Metadata = {
  title: "Data Upload | Summit Insights",
  description: "Upload CCMR tracker files and student data",
};

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const userCtx = await getUserContext(supabase);
  if (!userCtx) redirect("/login");

  const { districtId, profile } = userCtx;
  if (!districtId) redirect("/pathways");
  const isSuperAdmin = profile.role === "super_admin";
  const queryClient = isSuperAdmin ? createAdminClient() : supabase;

  const { data: uploads } = await queryClient
    .from("data_uploads")
    .select("*")
    .eq("district_id", districtId)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <PageHeader
        title="Data Upload"
        breadcrumbs={[
          { label: "Summit Insights", href: "/pathways" },
          { label: "Data Upload" },
        ]}
      />
      <PathwaysAppShell
        activeNavItem="data-upload"
        isSuperAdmin={isSuperAdmin}
        hasCCMR={userCtx.hasCCMR}
      >
        <DataUploadPage
          districtId={districtId}
          initialUploads={(uploads ?? []) as DataUploadRow[]}
          hasCCMR={userCtx.hasCCMR}
        />
      </PathwaysAppShell>
    </>
  );
}
