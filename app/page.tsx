"use client";

import * as React from "react";
import { DSMAppShell, DSMMobileNavBar } from "@/components/dsm/app-shell";
import { DistrictPortfolio } from "@/components/dsm/district-portfolio";

export default function DSMDashboard() {
  const [activeNav, setActiveNav] = React.useState("dashboard");
  const [activeNavItem, setActiveNavItem] = React.useState("overview");

  return (
    <>
      <DSMAppShell
        headerProps={{
          userName: "Sarah Mitchell",
          userRole: "District Success Manager",
          districtCount: 12,
          notificationCount: 3,
          currentPage: "District Portfolio",
          activeNav: activeNav,
          onNavChange: setActiveNav,
        }}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "DSM Dashboard" },
        ]}
        activeNavItem={activeNavItem}
        onNavItemChange={setActiveNavItem}
        showWelcomePanel={true}
        welcomePanelProps={{
          userName: "Sarah",
          highRiskCount: 3,
        }}
      >
        <DistrictPortfolio />
      </DSMAppShell>

      {/* Mobile Bottom Navigation */}
      <DSMMobileNavBar
        activeItem={activeNavItem}
        onItemChange={setActiveNavItem}
      />
    </>
  );
}
