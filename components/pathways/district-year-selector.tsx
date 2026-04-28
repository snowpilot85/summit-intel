"use client";

import { ArrowLeftRight } from "lucide-react";
import { clearDistrict } from "@/app/pathways/actions";

interface DistrictYearSelectorProps {
  districtName: string;
  schoolYearLabel: string;
  isSuperAdmin?: boolean;
}

/**
 * Compact district + school-year chip that drops into <PageHeader actions>.
 * Extracted from the old PathwaysHeader (the only piece of it worth keeping).
 *
 * The chip is currently informational. School year is read-only — the only
 * interactive affordance is the super-admin "switch district" button, which
 * clears the sa_district cookie and bounces back to the district picker.
 * If a real year selector ships later, this is the place to grow it.
 */
export function DistrictYearSelector({
  districtName,
  schoolYearLabel,
  isSuperAdmin = false,
}: DistrictYearSelectorProps) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-brand-blue-light px-3 py-1.5 text-primary-500 ring-1 ring-primary-100">
      <span className="text-[13px] font-medium">{districtName}</span>
      <span className="text-[11px] text-primary-300">|</span>
      <span className="text-[12px] text-primary-600">{schoolYearLabel}</span>
      {isSuperAdmin && (
        <button
          type="button"
          onClick={() => clearDistrict()}
          title="Switch district"
          aria-label="Switch district"
          className="ml-1 rounded p-0.5 text-primary-500 transition-colors hover:bg-primary-100"
        >
          <ArrowLeftRight className="h-3.5 w-3.5 opacity-80 hover:opacity-100" />
        </button>
      )}
    </div>
  );
}
