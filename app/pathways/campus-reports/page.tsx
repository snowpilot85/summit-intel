import { Metadata } from "next";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { CampusReportsPage } from "@/components/pathways/campus-reports";

export const metadata: Metadata = {
  title: "Campus Reports | Summit Pathways",
  description: "CCMR breakdown by campus with action plans",
};

export default function Page() {
  return (
    <PathwaysAppShell
      breadcrumbs={[
        { label: "Summit Pathways", href: "/pathways" },
        { label: "Campus Reports" },
      ]}
      activeNavItem="campus-reports"
    >
      <CampusReportsPage />
    </PathwaysAppShell>
  );
}
