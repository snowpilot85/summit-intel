"use client";

import Link from "next/link";
import Image from "next/image";
import { Building2, Plus, ChevronRight } from "lucide-react";
import { selectDistrict } from "@/app/pathways/actions";

interface District {
  id: string;
  name: string;
  tea_district_id: string | null;
  esc_region: number | null;
}

interface DistrictPickerProps {
  districts: District[];
  userName: string;
}

export function DistrictPicker({ districts, userName }: DistrictPickerProps) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-primary-500 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/images/summit-k12-logo-white.png"
            alt="Summit K12"
            width={120}
            height={32}
            className="h-7 w-auto"
            priority
          />
          <span className="text-[20px] font-semibold text-teal-300">Readiness</span>
        </div>
        <span className="text-[13px] text-white/70">{userName} · Super Admin</span>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-[26px] font-semibold text-neutral-900">Select a district</h1>
          <p className="text-[14px] text-neutral-500 mt-1">
            Choose a district to view its CCMR dashboard.
          </p>
        </div>

        {districts.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl p-10 text-center">
            <Building2 className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <p className="text-[15px] font-medium text-neutral-700 mb-1">No districts yet</p>
            <p className="text-[13px] text-neutral-500 mb-5">
              Set up your first district to get started.
            </p>
            <Link
              href="/admin/setup"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white text-[13px] font-semibold rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Set up a district
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {districts.map((district) => (
              <button
                key={district.id}
                onClick={() => selectDistrict(district.id)}
                className="w-full flex items-center justify-between bg-white border border-neutral-200 rounded-xl px-5 py-4 hover:border-primary-300 hover:shadow-sm transition-all group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-neutral-900">{district.name}</p>
                    <p className="text-[12px] text-neutral-500 mt-0.5">
                      {[
                        district.tea_district_id && `TEA ID: ${district.tea_district_id}`,
                        district.esc_region && `ESC Region ${district.esc_region}`,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "No additional info"}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-500 transition-colors" />
              </button>
            ))}

            <div className="pt-4 border-t border-neutral-200 mt-4">
              <Link
                href="/admin/setup"
                className="inline-flex items-center gap-2 text-[13px] font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Set up a new district
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
