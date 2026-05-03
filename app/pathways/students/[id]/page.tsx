import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { PathwaysStudentProfile } from "@/components/pathways/student-profile";
import { PageHeader } from "@/components/layout/page-header";
import { getStudentById } from "@/lib/db/students";
import { getStudentIndicators } from "@/lib/db/indicators";
import { getInterventions } from "@/lib/db/interventions";
import { getUserContext } from "@/lib/db/users";
import type { CcmrIndicatorResultRow, WorkBasedLearningRow } from "@/types/database";

export type CredentialProgressItem = {
  credentialId: string;
  name: string;
  issuingBody: string | null;
  isCcmrEligible: boolean;
  isCapstone: boolean;
  sequenceOrder: number;
  typicalGrade: number | null;
  passingScore: string | null;
  examWindowNotes: string | null;
  status: "earned" | "in_progress" | "not_started";
  notes: string | null;
};

export default async function PathwaysStudentProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const [{ id }, { from }] = await Promise.all([params, searchParams]);
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const userCtx = await getUserContext(supabase);
  if (!userCtx) redirect("/login");

  const { districtId, profile, graduationDate } = userCtx;
  if (!districtId) redirect("/pathways");
  const isSuperAdmin = profile.role === "super_admin";
  const queryClient = isSuperAdmin ? createAdminClient() : supabase;

  const [student, indicators, interventions] = await Promise.all([
    getStudentById(queryClient, id),
    getStudentIndicators(queryClient, id),
    getInterventions(queryClient, districtId, { studentId: id }),
  ]);

  if (!student) notFound();

  // Fetch campus and full pathway row (including program_id and credential_id for progress tracking)
  const [{ data: campus }, { data: pathwayRow }] = await Promise.all([
    queryClient.from("campuses").select("name").eq("id", student.campus_id).single(),
    queryClient
      .from("student_pathways")
      .select("enrollment_status, credential_earned, credential_id, program_id, state_career_clusters(name, code), programs_of_study(name, code)")
      .eq("student_id", id)
      .maybeSingle(),
  ]);

  const campusName = campus?.name ?? "Unknown campus";

  type ClusterShape = { name: string; code: string };
  type ProgramShape = { name: string; code: string };
  const cluster = pathwayRow?.state_career_clusters as ClusterShape | null | undefined;
  const program = pathwayRow?.programs_of_study as ProgramShape | null | undefined;
  const pathway = pathwayRow && cluster && program ? {
    clusterName: cluster.name,
    clusterCode: cluster.code,
    programName: program.name,
    enrollmentStatus: pathwayRow.enrollment_status as string,
    credentialEarned: pathwayRow.credential_earned,
  } : null;

  // Fetch credential progress (pathway_credentials → state_credential_catalog)
  // and work-based learning in parallel
  const programId = (pathwayRow as { program_id?: string } | null)?.program_id ?? null;
  const studentCredentialId = (pathwayRow as { credential_id?: string | null } | null)?.credential_id ?? null;
  const studentCredentialEarned = pathwayRow?.credential_earned ?? false;
  const enrollmentStatus = pathwayRow?.enrollment_status ?? "enrolled";

  type CredentialCatalogShape = {
    id: string;
    name: string;
    issuing_body: string | null;
    passing_score: string | null;
    exam_window_notes: string | null;
    is_ccmr_eligible: boolean;
  };
  type PathwayCredentialShape = {
    id: string;
    credential_id: string;
    is_capstone: boolean;
    sequence_order: number;
    typical_grade: number | null;
    notes: string | null;
    state_credential_catalog: CredentialCatalogShape | null;
  };

  const [credentialResult, wblResult, tieredResult] = await Promise.all([
    programId
      ? (queryClient as ReturnType<typeof createAdminClient>)
          .from("pathway_credentials")
          .select("id, credential_id, is_capstone, sequence_order, typical_grade, notes, state_credential_catalog(id, name, issuing_body, passing_score, exam_window_notes, is_ccmr_eligible)")
          .eq("program_id", programId)
          .order("sequence_order", { ascending: true })
      : Promise.resolve({ data: [] as PathwayCredentialShape[] }),
    queryClient
      .from("work_based_learning")
      .select("*")
      .eq("student_id", id)
      .order("start_date", { ascending: false }),
    // Phase 1 CCMR: per-indicator tier results. Empty until the
    // recompute service has run for this student. The component
    // gracefully falls back to a "not yet computed" state.
    queryClient
      .from("ccmr_indicator_results")
      .select("*")
      .eq("student_id", id),
  ]);

  const tieredIndicatorResults = (tieredResult.data ?? []) as CcmrIndicatorResultRow[];

  // Build credential progress items
  const credentialProgress: CredentialProgressItem[] = (
    (credentialResult.data ?? []) as unknown as PathwayCredentialShape[]
  ).map((pc) => {
    const cat = pc.state_credential_catalog;
    let status: CredentialProgressItem["status"] = "not_started";
    if (pc.credential_id === studentCredentialId && studentCredentialEarned) {
      status = "earned";
    } else if (pc.credential_id === studentCredentialId && enrollmentStatus === "enrolled") {
      status = "in_progress";
    }
    return {
      credentialId: pc.credential_id,
      name: cat?.name ?? "Unknown credential",
      issuingBody: cat?.issuing_body ?? null,
      isCcmrEligible: cat?.is_ccmr_eligible ?? false,
      isCapstone: pc.is_capstone,
      sequenceOrder: pc.sequence_order,
      typicalGrade: pc.typical_grade,
      passingScore: cat?.passing_score ?? null,
      examWindowNotes: cat?.exam_window_notes ?? null,
      status,
      notes: pc.notes,
    };
  });

  const wblRecords = (wblResult.data ?? []) as WorkBasedLearningRow[];
  const studentName = `${student.first_name} ${student.last_name}`;

  const breadcrumbs =
    from === "interventions"
      ? [
          { label: "Summit Insights", href: "/pathways" },
          { label: "Interventions", href: "/pathways/interventions" },
          { label: studentName },
        ]
      : [
          { label: "Summit Insights", href: "/pathways" },
          { label: "Students", href: "/pathways/students" },
          { label: studentName },
        ];

  const backHref =
    from === "interventions" ? "/pathways/interventions" : "/pathways/students";

  return (
    <>
      <PageHeader
        title={studentName}
        breadcrumbs={breadcrumbs}
        backHref={backHref}
      />
      <PathwaysAppShell
        activeNavItem={from === "interventions" ? "interventions" : "students"}
        isSuperAdmin={isSuperAdmin}
        hasCCMR={userCtx.hasCCMR}
      >
        <PathwaysStudentProfile
          student={student}
          indicators={indicators}
          tieredIndicatorResults={tieredIndicatorResults}
          interventions={interventions}
          campusName={campusName}
          graduationDate={graduationDate}
          pathway={pathway}
          credentialProgress={credentialProgress}
          wblRecords={wblRecords}
          from={from}
          hasCCMR={userCtx.hasCCMR}
        />
      </PathwaysAppShell>
    </>
  );
}
