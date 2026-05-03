import { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { PathwaysAppShell } from "@/components/pathways/app-shell"
import { OutcomesBonusCalculator } from "@/components/pathways/outcomes-bonus"
import { PageHeader } from "@/components/layout/page-header"
import { getUserContext } from "@/lib/db/users"
import type { CcmrObDataRow } from "@/types/database"

export const metadata: Metadata = {
  title: "CCMR Outcomes Bonus Calculator | Summit Insights",
  description:
    "Model CCMR Outcomes Bonus earnings vs. funding left on the table for any Texas district",
}

export const dynamic = "force-dynamic"

type DistrictListItem = Pick<
  CcmrObDataRow,
  "cdn" | "district_name" | "total_earned" | "total_left_on_table"
>

export default async function OutcomesBonusPage({
  searchParams,
}: {
  searchParams: Promise<{ cdn?: string }>
}) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const userCtx = await getUserContext(supabase)
  if (!userCtx) redirect("/login")

  const { districtId, profile } = userCtx
  if (!districtId) redirect("/pathways")
  if (!userCtx.hasCCMR) redirect("/pathways")

  const isSuperAdmin = profile.role === "super_admin"
  const queryClient = isSuperAdmin ? createAdminClient() : supabase

  const params = await searchParams
  const selectedCdn = params.cdn

  const [districtListResult, selectedDistrictResult] = await Promise.all([
    queryClient
      .from("ccmr_ob_data")
      .select("cdn, district_name, total_earned, total_left_on_table")
      .order("district_name", { ascending: true }),
    selectedCdn
      ? queryClient.from("ccmr_ob_data").select("*").eq("cdn", selectedCdn).single()
      : Promise.resolve({ data: null, error: null }),
  ])

  if (districtListResult.error) {
    console.error("[outcomes-bonus] district list query failed:", districtListResult.error)
    throw new Error(`ccmr_ob_data list query failed: ${districtListResult.error.message}`)
  }

  console.log(
    `[outcomes-bonus] role=${profile.role} fetched ${districtListResult.data?.length ?? 0} districts`,
  )

  const districts = (districtListResult.data ?? []) as DistrictListItem[]
  const selectedDistrict = (selectedDistrictResult.data ?? null) as CcmrObDataRow | null
  const selectionMissing = Boolean(selectedCdn) && !selectedDistrict

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: "Summit Insights", href: "/pathways" },
          { label: "Outcomes Bonus" },
        ]}
      />
      <PathwaysAppShell
        activeNavItem="outcomes-bonus"
        isSuperAdmin={isSuperAdmin}
        hasCCMR={userCtx.hasCCMR}
      >
        <OutcomesBonusCalculator
          districts={districts}
          selectedDistrict={selectedDistrict}
          selectionMissing={selectionMissing}
        />
      </PathwaysAppShell>
    </>
  )
}
