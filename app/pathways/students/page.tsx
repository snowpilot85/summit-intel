import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { PathwaysStudents } from "@/components/pathways/students";
import { getStudents } from "@/lib/db/students";
import { getIndicatorsForStudents } from "@/lib/db/indicators";
import { getCampuses } from "@/lib/db/campuses";
import { getUserContext } from "@/lib/db/users";
import type { StudentPathwayEntry } from "@/app/pathways/students/actions";

function formatRole(role: string): string {
  return role.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export type CareerClusterOption = { id: string; code: string; name: string };

export default async function PathwaysStudentsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const userCtx = await getUserContext(supabase);
  if (!userCtx) redirect("/login");

  const { districtId, profile, districtName, schoolYearLabel, graduationDate } = userCtx;
  if (!districtId) redirect("/pathways");
  const isSuperAdmin = profile.role === "super_admin";
  const queryClient = isSuperAdmin ? createAdminClient() : supabase;

  // Resolve district → state_id so we can load the right career clusters
  const { data: districtRow } = await queryClient
    .from("districts")
    .select("state_id")
    .eq("id", districtId)
    .single();
  const stateId = districtRow?.state_id ?? null;

  const [{ data: students, count }, campuses, careerClustersResult] = await Promise.all([
    getStudents(queryClient, districtId, { pageSize: 50 }),
    getCampuses(queryClient, districtId),
    stateId
      ? queryClient
          .from("state_career_clusters")
          .select("id, code, name")
          .eq("state_id", stateId)
          .order("name")
      : Promise.resolve({ data: [] }),
  ]);

  const careerClusters: CareerClusterOption[] = (careerClustersResult.data ?? []) as CareerClusterOption[];

  const studentIds = students.map((s) => s.id);
  const [indicators, pathwayRows] = await Promise.all([
    getIndicatorsForStudents(queryClient, studentIds),
    studentIds.length > 0
      ? queryClient
          .from("student_pathways")
          .select("student_id, credential_earned, enrollment_status, state_career_clusters(name, code)")
          .in("student_id", studentIds)
      : Promise.resolve({ data: [] }),
  ]);

  type ClusterShape = { name: string; code: string };
  const initialPathways: StudentPathwayEntry[] = (pathwayRows.data ?? []).map((r) => {
    const c = r.state_career_clusters as unknown as ClusterShape | null;
    return {
      student_id: r.student_id,
      cluster_name: c?.name ?? "",
      cluster_code: c?.code ?? "",
      credential_earned: r.credential_earned ?? false,
      enrollment_status: r.enrollment_status ?? "",
    };
  });

  return (
    <PathwaysAppShell
      headerProps={{
        userName: profile.full_name,
        userRole: formatRole(profile.role),
        districtName,
        schoolYear: schoolYearLabel,
        notificationCount: 0,
      }}
      breadcrumbs={[
        { label: "Summit Pathways", href: "/pathways" },
        { label: "Students" },
      ]}
      activeNavItem="students"
      isSuperAdmin={isSuperAdmin}
    >
      <PathwaysStudents
        districtId={districtId}
        initialStudents={students}
        initialCount={count}
        initialIndicators={indicators}
        initialPathways={initialPathways}
        campuses={campuses}
        careerClusters={careerClusters}
        graduationDate={graduationDate}
      />
    </PathwaysAppShell>
  );
}
