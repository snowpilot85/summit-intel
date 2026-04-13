"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { DSMAppShell, DSMMobileNavBar } from "@/components/dsm/app-shell";
import { DistrictDrilldown } from "@/components/dsm/district-drilldown";
import { mockDistricts } from "@/lib/mock-data";

export default function DistrictDetailPage() {
  const params = useParams();
  const districtId = params.id as string;

  const [activeNav, setActiveNav] = React.useState("districts");
  const [activeNavItem, setActiveNavItem] = React.useState("districts");

  // Find the district
  const district = mockDistricts.find((d) => d.id === districtId);

  if (!district) {
    return (
      <DSMAppShell
        headerProps={{
          userName: "Sarah Mitchell",
          userRole: "District Success Manager",
          districtCount: 12,
          notificationCount: 3,
          currentPage: "District Not Found",
          activeNav: activeNav,
          onNavChange: setActiveNav,
        }}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "District Portfolio", href: "/" },
          { label: "Not Found" },
        ]}
        activeNavItem={activeNavItem}
        onNavItemChange={setActiveNavItem}
        showWelcomePanel={false}
      >
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-[24px] font-semibold text-neutral-900 mb-2">District Not Found</h2>
          <p className="text-[14px] text-neutral-500">The district you are looking for does not exist.</p>
        </div>
      </DSMAppShell>
    );
  }

  return (
    <>
      <DSMAppShell
        headerProps={{
          userName: "Sarah Mitchell",
          userRole: "District Success Manager",
          districtCount: 12,
          notificationCount: 3,
          currentPage: district.name,
          activeNav: activeNav,
          onNavChange: setActiveNav,
        }}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "District Portfolio", href: "/" },
          { label: district.name },
        ]}
        activeNavItem={activeNavItem}
        onNavItemChange={setActiveNavItem}
        showWelcomePanel={false}
      >
        <DistrictDrilldown district={district} />
      </DSMAppShell>

      {/* Mobile Bottom Navigation */}
      <DSMMobileNavBar
        activeItem={activeNavItem}
        onItemChange={setActiveNavItem}
      />
    </>
  );
}
