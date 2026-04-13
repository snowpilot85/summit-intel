import { Metadata } from "next";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { InterventionsPage } from "@/components/pathways/interventions";

export const metadata: Metadata = {
  title: "Interventions | Summit Pathways",
  description: "CCMR intervention pathways sorted by potential impact",
};

export default function Page() {
  return (
    <PathwaysAppShell
      breadcrumbs={[
        { label: "Summit Pathways", href: "/pathways" },
        { label: "Interventions" },
      ]}
      activeNavItem="interventions"
    >
      <InterventionsPage />
    </PathwaysAppShell>
  );
}
