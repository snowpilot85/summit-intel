"use client";

import * as React from "react";
import { DSMHeader, DSMBreadcrumbs, DSMNavRail, DSMMobileNavBar } from "@/components/dsm/app-shell";
import { DistrictList } from "@/components/dsm/district-list";

export default function DistrictsPage() {
  const [activeNavItem, setActiveNavItem] = React.useState("districts");

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Header */}
      <DSMHeader districtCount={11} />

      {/* Breadcrumbs */}
      <DSMBreadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "District Portfolio Management" },
        ]}
      />

      {/* Main Layout */}
      <div className="flex flex-1">
        {/* Nav Rail */}
        <DSMNavRail activeItem={activeNavItem} onItemChange={setActiveNavItem} />

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            <DistrictList />
          </div>
        </main>
      </div>

      {/* Mobile Nav */}
      <DSMMobileNavBar activeItem={activeNavItem} onItemChange={setActiveNavItem} />
    </div>
  );
}
