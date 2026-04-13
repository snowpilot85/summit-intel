import { Metadata } from "next";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { DataUploadPage } from "@/components/pathways/data-upload";

export const metadata: Metadata = {
  title: "Data Upload | Summit Pathways",
  description: "Upload CCMR tracker data and student records",
};

export default function Page() {
  return (
    <PathwaysAppShell
      breadcrumbs={[
        { label: "Summit Pathways", href: "/pathways" },
        { label: "Data Upload" },
      ]}
      activeNavItem="data-upload"
    >
      <DataUploadPage />
    </PathwaysAppShell>
  );
}
