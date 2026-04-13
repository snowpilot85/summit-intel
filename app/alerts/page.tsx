"use client";

import * as React from "react";
import { DSMAppShell, DSMMobileNavBar } from "@/components/dsm/app-shell";
import { AlertsCenter } from "@/components/dsm/alerts-center";

export default function AlertsPage() {
  const [activeNav, setActiveNav] = React.useState("alerts");
  const [activeNavItem, setActiveNavItem] = React.useState("alerts");

  return (
    <>
      <DSMAppShell
        headerProps={{
          userName: "Sarah Mitchell",
          userRole: "District Success Manager",
          districtCount: 12,
          notificationCount: 3,
          currentPage: "Alerts & Notifications",
          activeNav: activeNav,
          onNavChange: setActiveNav,
        }}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Alerts & Notifications" },
        ]}
        activeNavItem={activeNavItem}
        onNavItemChange={setActiveNavItem}
        showWelcomePanel={false}
      >
        <AlertsCenter />
      </DSMAppShell>

      {/* Mobile Bottom Navigation */}
      <DSMMobileNavBar
        activeItem={activeNavItem}
        onItemChange={setActiveNavItem}
      />
    </>
  );
}
