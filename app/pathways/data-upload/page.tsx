import { Metadata } from "next";
import { createAdminClient } from "@/utils/supabase/admin";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { DataUploadPage } from "@/components/pathways/data-upload";
import type { DataUploadRow } from "@/types/database";

export const metadata: Metadata = {
  title: "Data Upload | Summit Pathways",
  description: "Upload CCMR tracker files and student data",
};

const DISTRICT_ID = "a0000001-0000-0000-0000-000000000001";

export default async function Page() {
  const supabase = createAdminClient();

  const { data: uploads } = await supabase
    .from("data_uploads")
    .select("*")
    .eq("district_id", DISTRICT_ID)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <PathwaysAppShell
      headerProps={{
        userName: "Sarah Chen",
        userRole: "CCMR Coordinator",
        districtName: "Edinburg CISD",
        schoolYear: "2025-26",
        notificationCount: 3,
      }}
      breadcrumbs={[
        { label: "Summit Pathways", href: "/pathways" },
        { label: "Data Upload" },
      ]}
      activeNavItem="data-upload"
    >
      <DataUploadPage
        districtId={DISTRICT_ID}
        initialUploads={(uploads ?? []) as DataUploadRow[]}
      />
    </PathwaysAppShell>
  );
}
