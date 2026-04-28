"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import {
  Check,
  ChevronsUpDown,
  Info,
  X,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { formatCurrency } from "@/lib/format"
import {
  OB_AWARDS,
  OB_THRESHOLDS,
  projectGroupEarnings,
} from "@/lib/ccmr-outcomes-bonus"
import type { CcmrObDataRow } from "@/types/database"

// Update annually each August when TEA publishes the new Annual Graduates Early Counts.
const DATA_VINTAGE_LABEL = "2024"
const TEA_SOURCE_URL =
  "https://tea.texas.gov/texas-schools/accountability/academic-accountability/performance-reporting/performance-reporting-resources"

type DistrictListItem = Pick<
  CcmrObDataRow,
  "cdn" | "district_name" | "total_earned" | "total_left_on_table"
>

interface OutcomesBonusCalculatorProps {
  districts: DistrictListItem[]
  selectedDistrict: CcmrObDataRow | null
  selectionMissing: boolean
}

// ============================================================
// MAIN
// ============================================================

export function OutcomesBonusCalculator({
  districts,
  selectedDistrict,
  selectionMissing,
}: OutcomesBonusCalculatorProps) {
  const [bannerOpen, setBannerOpen] = React.useState(true)

  return (
    <div className="space-y-6">
      <Header />

      {bannerOpen && <SourceBanner onDismiss={() => setBannerOpen(false)} />}

      <DistrictSelector districts={districts} selectedDistrict={selectedDistrict} />

      {selectionMissing && <DistrictNotFound />}

      {!selectedDistrict && !selectionMissing && (
        <EmptyState districts={districts} />
      )}

      {selectedDistrict && <SelectedDistrictView district={selectedDistrict} />}
    </div>
  )
}

// ============================================================
// HEADER
// ============================================================

function Header() {
  return (
    <div>
      <h1 className="text-[24px] font-semibold text-neutral-900">
        CCMR Outcomes Bonus Calculator
      </h1>
      <p className="text-[14px] text-neutral-600 mt-1">
        Based on TEA&apos;s {DATA_VINTAGE_LABEL} Annual Graduates Early Counts.
        Updated annually each August.
      </p>
    </div>
  )
}

// ============================================================
// SOURCE BANNER
// ============================================================

function SourceBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-info-light border border-info/30 rounded-lg">
      <Info className="w-5 h-5 text-info-dark flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-info-dark">
          This calculator uses official TEA data from the {DATA_VINTAGE_LABEL} Annual
          Graduates CCMR OB Early Counts. Updated annually when TEA publishes new
          data each August.{" "}
          <a
            href={TEA_SOURCE_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium underline hover:no-underline"
          >
            View source
          </a>
        </p>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="p-1 rounded hover:bg-info/10 transition-colors text-info-dark"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// ============================================================
// DISTRICT SELECTOR (Popover + cmdk Command)
// ============================================================

function DistrictSelector({
  districts,
  selectedDistrict,
}: {
  districts: DistrictListItem[]
  selectedDistrict: CcmrObDataRow | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)

  function handleSelect(cdn: string) {
    setOpen(false)
    router.push(`${pathname}?cdn=${encodeURIComponent(cdn)}`)
  }

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-4">
      <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-2">
        Select Texas district
      </p>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between gap-3 px-3 py-2.5 border border-neutral-200 rounded-md bg-neutral-0 hover:bg-neutral-50 transition-colors text-left"
            aria-expanded={open}
          >
            <span
              className={cn(
                "text-[14px] truncate",
                selectedDistrict ? "text-neutral-900 font-medium" : "text-neutral-500"
              )}
            >
              {selectedDistrict
                ? selectedDistrict.district_name
                : "Search districts by name…"}
            </span>
            <ChevronsUpDown className="w-4 h-4 text-neutral-400 flex-shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-[var(--radix-popover-trigger-width)]"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Type district name…" />
            <CommandList>
              <CommandEmpty>No districts match that search.</CommandEmpty>
              <CommandGroup>
                {districts.map((d) => (
                  <CommandItem
                    key={d.cdn}
                    value={`${d.district_name} ${d.cdn}`}
                    onSelect={() => handleSelect(d.cdn)}
                  >
                    <Check
                      className={cn(
                        "w-4 h-4",
                        selectedDistrict?.cdn === d.cdn ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-neutral-900 truncate">
                        {d.district_name}
                      </p>
                      <p className="text-[11px] text-neutral-500 truncate">
                        CDN {d.cdn}
                      </p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedDistrict && (
        <div className="mt-4">
          <p className="text-[22px] font-semibold text-neutral-900 leading-tight">
            {selectedDistrict.district_name}
          </p>
          <p className="text-[13px] text-neutral-500 mt-0.5">
            {selectedDistrict.county ? `${selectedDistrict.county} County · ` : ""}
            {selectedDistrict.region ? `Region ${selectedDistrict.region} · ` : ""}
            CDN {selectedDistrict.cdn}
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================================
// EMPTY STATE
// ============================================================

function EmptyState({ districts }: { districts: DistrictListItem[] }) {
  const totalEarned = districts.reduce((s, d) => s + (d.total_earned ?? 0), 0)
  const totalLeft = districts.reduce(
    (s, d) => s + (d.total_left_on_table ?? 0),
    0
  )

  return (
    <div className="space-y-6">
      <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-10 text-center">
        <p className="text-[15px] text-neutral-700 font-medium">
          Select a Texas district above to see their CCMR Outcomes Bonus earnings
          and modeled scenarios.
        </p>
        <p className="text-[13px] text-neutral-500 mt-2">
          Searchable by district name, county, or CDN.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SampleStat
          label="Districts tracked"
          value={districts.length.toLocaleString()}
        />
        <SampleStat
          label="Total earned statewide"
          value={formatCurrency(totalEarned)}
          valueClass="text-success"
        />
        <SampleStat
          label="Left on the table"
          value={formatCurrency(totalLeft)}
          valueClass="text-error"
        />
      </div>
    </div>
  )
}

function SampleStat({
  label,
  value,
  valueClass,
}: {
  label: string
  value: string
  valueClass?: string
}) {
  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg p-5">
      <p className="text-[12px] text-neutral-500 uppercase tracking-wider">
        {label}
      </p>
      <p className={cn("text-[24px] font-bold text-neutral-900 mt-1", valueClass)}>
        {value}
      </p>
    </div>
  )
}

// ============================================================
// DISTRICT NOT FOUND
// ============================================================

function DistrictNotFound() {
  return (
    <div className="bg-neutral-0 border border-error/30 rounded-lg p-8 text-center">
      <AlertCircle className="w-10 h-10 text-error mx-auto mb-3" />
      <p className="text-[16px] font-semibold text-neutral-900">District not found</p>
      <p className="text-[13px] text-neutral-600 mt-1">
        That CDN isn&apos;t in our {DATA_VINTAGE_LABEL} dataset. Pick a district from
        the search above, or contact support if you believe this is an error.
      </p>
    </div>
  )
}

// ============================================================
// SELECTED DISTRICT VIEW
// ============================================================

function SelectedDistrictView({ district }: { district: CcmrObDataRow }) {
  return (
    <div className="space-y-6">
      <HeadlineCards district={district} />
      <BreakdownTable district={district} />
      <WhatIfPanel district={district} />
    </div>
  )
}

// ============================================================
// HEADLINE CARDS
// ============================================================

function HeadlineCards({ district }: { district: CcmrObDataRow }) {
  const totalAboveThreshold =
    (district.ed_above_threshold ?? 0) +
    (district.non_ed_above_threshold ?? 0) +
    (district.sped_above_threshold ?? 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-success-light border border-success/30 rounded-lg p-6">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-success-dark">
          Funding earned
        </p>
        <p className="text-[36px] md:text-[40px] font-bold text-success-dark mt-2 leading-none">
          {formatCurrency(district.total_earned)}
        </p>
        <p className="text-[13px] text-success-dark/80 mt-3">
          From {totalAboveThreshold.toLocaleString()} graduates above threshold across
          all groups
        </p>
      </div>

      <div className="bg-error-light border border-error/30 rounded-lg p-6">
        <p className="text-[11px] uppercase tracking-wider font-semibold text-error-dark">
          Left on the table
        </p>
        <p className="text-[36px] md:text-[40px] font-bold text-error-dark mt-2 leading-none">
          {formatCurrency(district.total_left_on_table)}
        </p>
        <p className="text-[13px] text-error-dark/80 mt-3">
          Maximum potential funding not yet realized
        </p>
      </div>
    </div>
  )
}

// ============================================================
// BREAKDOWN TABLE
// ============================================================

interface GroupRow {
  label: string
  grads: number | null
  metOb: number | null
  aboveThreshold: number | null
  earned: number
  thresholdPct: number
  award: number
  thresholdDisplay: "always" | "pct"
}

function BreakdownTable({ district }: { district: CcmrObDataRow }) {
  const rows: GroupRow[] = [
    {
      label: "Economically Disadvantaged",
      grads: district.ed_grads,
      metOb: district.ed_met_ob,
      aboveThreshold: district.ed_above_threshold,
      earned: district.ed_earned,
      thresholdPct: OB_THRESHOLDS.ED,
      award: OB_AWARDS.ED,
      thresholdDisplay: "pct",
    },
    {
      label: "Non-Economically Disadvantaged",
      grads: district.non_ed_grads,
      metOb: district.non_ed_met_ob,
      aboveThreshold: district.non_ed_above_threshold,
      earned: district.non_ed_earned,
      thresholdPct: OB_THRESHOLDS.NON_ED,
      award: OB_AWARDS.NON_ED,
      thresholdDisplay: "pct",
    },
    {
      label: "Special Education",
      grads: district.sped_grads,
      metOb: district.sped_met_ob,
      aboveThreshold: district.sped_above_threshold,
      earned: district.sped_earned,
      thresholdPct: OB_THRESHOLDS.SPED,
      award: OB_AWARDS.SPED,
      thresholdDisplay: "always",
    },
  ]

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200">
        <h2 className="text-[17px] font-semibold text-neutral-900">
          Group breakdown
        </h2>
        <p className="text-[13px] text-neutral-500 mt-0.5">
          ED earns ${OB_AWARDS.ED.toLocaleString()}/grad above threshold · Non-ED $
          {OB_AWARDS.NON_ED.toLocaleString()} · SPED $
          {OB_AWARDS.SPED.toLocaleString()}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="text-left text-[12px] font-semibold text-neutral-700 px-4 py-3">
                Group
              </th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 px-4 py-3">
                Total grads
              </th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 px-4 py-3">
                Met OB
              </th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 px-4 py-3">
                Threshold
              </th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 px-4 py-3">
                Above threshold
              </th>
              <th className="text-right text-[12px] font-semibold text-neutral-700 px-4 py-3">
                Earned
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <BreakdownRow key={row.label} row={row} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BreakdownRow({ row }: { row: GroupRow }) {
  const masked = row.grads === null || row.grads === 0
  const grads = row.grads ?? 0
  const metOb = row.metOb ?? 0
  const thresholdCount = Math.floor(grads * row.thresholdPct)
  const cleared = !masked && metOb >= thresholdCount

  let thresholdCell: React.ReactNode
  if (masked) {
    thresholdCell = <span className="text-neutral-400">—</span>
  } else if (row.thresholdDisplay === "always") {
    thresholdCell = (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-success-light text-success-dark text-[11px] font-semibold">
        —
      </span>
    )
  } else {
    thresholdCell = (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold",
          cleared
            ? "bg-success-light text-success-dark"
            : "bg-error-light text-error-dark"
        )}
      >
        {cleared ? "MET" : "BELOW"} {Math.round(row.thresholdPct * 100)}% (
        {thresholdCount.toLocaleString()})
      </span>
    )
  }

  return (
    <tr className="border-b border-neutral-100 last:border-0">
      <td className="px-4 py-3 text-[13px] font-medium text-neutral-900">
        {row.label}
      </td>
      <td className="px-4 py-3 text-right text-[13px] text-neutral-700">
        {masked ? "—" : grads.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-right text-[13px] text-neutral-700">
        {row.metOb === null ? "—" : metOb.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-right">{thresholdCell}</td>
      <td className="px-4 py-3 text-right text-[13px] text-neutral-700">
        {row.aboveThreshold === null
          ? "—"
          : row.aboveThreshold.toLocaleString()}
      </td>
      <td
        className={cn(
          "px-4 py-3 text-right text-[13px] font-semibold",
          row.earned > 0 ? "text-success" : "text-neutral-500"
        )}
      >
        {formatCurrency(row.earned)}
      </td>
    </tr>
  )
}

// ============================================================
// WHAT-IF PANEL
// ============================================================

interface WhatIfGroup {
  key: "ED" | "NON_ED" | "SPED"
  label: string
  grads: number | null
  metObCurrent: number | null
  earnedCurrent: number
  thresholdPct: number
  award: number
}

function WhatIfPanel({ district }: { district: CcmrObDataRow }) {
  const groups: WhatIfGroup[] = [
    {
      key: "ED",
      label: "Economically Disadvantaged",
      grads: district.ed_grads,
      metObCurrent: district.ed_met_ob,
      earnedCurrent: district.ed_earned,
      thresholdPct: OB_THRESHOLDS.ED,
      award: OB_AWARDS.ED,
    },
    {
      key: "NON_ED",
      label: "Non-Economically Disadvantaged",
      grads: district.non_ed_grads,
      metObCurrent: district.non_ed_met_ob,
      earnedCurrent: district.non_ed_earned,
      thresholdPct: OB_THRESHOLDS.NON_ED,
      award: OB_AWARDS.NON_ED,
    },
    {
      key: "SPED",
      label: "Special Education",
      grads: district.sped_grads,
      metObCurrent: district.sped_met_ob,
      earnedCurrent: district.sped_earned,
      thresholdPct: OB_THRESHOLDS.SPED,
      award: OB_AWARDS.SPED,
    },
  ]

  const [deltas, setDeltas] = React.useState<Record<string, number>>({
    ED: 0,
    NON_ED: 0,
    SPED: 0,
  })

  // Reset slider state when the district changes.
  React.useEffect(() => {
    setDeltas({ ED: 0, NON_ED: 0, SPED: 0 })
  }, [district.cdn])

  const totalAdditional = groups.reduce((sum, g) => {
    const delta = deltas[g.key] ?? 0
    if (g.grads === null || g.grads === 0 || delta === 0) return sum
    const projection = projectGroupEarnings(
      g.grads,
      g.metObCurrent ?? 0,
      g.earnedCurrent,
      delta,
      g.thresholdPct,
      g.award
    )
    return sum + projection.additionalUnlocked
  }, 0)

  return (
    <div className="bg-neutral-0 border border-neutral-200 rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200">
        <h2 className="text-[17px] font-semibold text-neutral-900">
          What if more students hit threshold?
        </h2>
        <p className="text-[13px] text-neutral-500 mt-0.5">
          Drag the sliders to model adding met-OB graduates in each group.
        </p>
      </div>

      <div className="p-6 space-y-6">
        {groups.map((g) => (
          <WhatIfSlider
            key={g.key}
            group={g}
            delta={deltas[g.key] ?? 0}
            onChange={(v) => setDeltas((d) => ({ ...d, [g.key]: v }))}
          />
        ))}
      </div>

      <div className="m-6 mt-0 p-5 bg-primary-800 rounded-lg flex items-start gap-3">
        <TrendingUp className="w-5 h-5 text-neutral-0 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-[12px] uppercase tracking-wider text-neutral-0/70 font-semibold">
            Total potential additional funding
          </p>
          <p className="text-[28px] md:text-[32px] font-bold text-neutral-0 mt-1 leading-none">
            {formatCurrency(totalAdditional)}
          </p>
          <p className="text-[12px] text-neutral-0/70 mt-2">
            Combined uplift if every modeled student clears CCMR OB criteria.
          </p>
        </div>
      </div>
    </div>
  )
}

function WhatIfSlider({
  group,
  delta,
  onChange,
}: {
  group: WhatIfGroup
  delta: number
  onChange: (v: number) => void
}) {
  const masked = group.grads === null || group.grads === 0
  const grads = group.grads ?? 0
  const metOb = group.metObCurrent ?? 0
  const headroom = Math.max(0, grads - metOb)

  if (masked) {
    return (
      <div className="opacity-60">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <p className="text-[14px] font-medium text-neutral-900">{group.label}</p>
          <span className="text-[12px] text-neutral-500">
            Data masked by TEA (group too small)
          </span>
        </div>
        <Slider value={[0]} min={0} max={1} disabled />
      </div>
    )
  }

  const projection = projectGroupEarnings(
    grads,
    metOb,
    group.earnedCurrent,
    delta,
    group.thresholdPct,
    group.award
  )

  const noHeadroom = headroom === 0

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <p className="text-[14px] font-medium text-neutral-900">
          If <span className="text-primary-600 font-semibold">{delta}</span> more{" "}
          {group.label.toLowerCase()} graduates met OB criteria…
        </p>
        <span className="text-[12px] text-neutral-500">
          max +{headroom.toLocaleString()}
        </span>
      </div>
      <Slider
        value={[delta]}
        min={0}
        max={Math.max(headroom, 1)}
        step={1}
        disabled={noHeadroom}
        onValueChange={([v]) => onChange(v ?? 0)}
      />
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
        <p className="text-[12px] text-neutral-500">
          Projected new earnings:{" "}
          <span className="font-semibold text-neutral-900">
            {formatCurrency(projection.earnedProjected)}
          </span>
        </p>
        <p className="text-[12px] text-success-dark font-semibold">
          + {formatCurrency(projection.additionalUnlocked)} unlocked
        </p>
      </div>
    </div>
  )
}
