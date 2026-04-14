import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { DataUploadPage } from "@/components/pathways/data-upload";
import { getUserContext } from "@/lib/db/users";
import type { DataUploadRow } from "@/types/database";

export const metadata: Metadata = {
  title: "Data Upload | Summit Pathways",
  description: "Upload CCMR tracker files and student data",
};

function formatRole(role: string): string {
  return role.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const userCtx = await getUserContext(supabase);
  if (!userCtx) redirect("/login");

  const { districtId, profile, districtName, schoolYearLabel } = userCtx;

  const { data: uploads } = await supabase
    .from("data_uploads")
    .select("*")
    .eq("district_id", districtId)
    .order("created_at", { ascending: false })
    .limit(100);

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
        { label: "Data Upload" },
      ]}
      activeNavItem="data-upload"
    >
      <DataUploadPage
        districtId={districtId}
        initialUploads={(uploads ?? []) as DataUploadRow[]}
      />
    </PathwaysAppShell>
  );
}
