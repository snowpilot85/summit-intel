import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { PathwaysStudentProfile } from "@/components/pathways/student-profile";
import { getStudentById } from "@/lib/db/students";
import { getStudentIndicators } from "@/lib/db/indicators";
import { getInterventions } from "@/lib/db/interventions";
import { getUserContext } from "@/lib/db/users";

function formatRole(role: string): string {
  return role.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

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

  const { districtId, profile, districtName, schoolYearLabel, graduationDate } = userCtx;
  if (!districtId) redirect("/pathways");
  const isSuperAdmin = profile.role === "super_admin";
  const queryClient = isSuperAdmin ? createAdminClient() : supabase;

  const [student, indicators, interventions] = await Promise.all([
    getStudentById(queryClient, id),
    getStudentIndicators(queryClient, id),
    getInterventions(queryClient, districtId, { studentId: id }),
  ]);

  if (!student) notFound();

  const { data: campus } = await queryClient
    .from("campuses")
    .select("name")
    .eq("id", student.campus_id)
    .single();

  const campusName = campus?.name ?? "Unknown campus";
  const studentName = `${student.first_name} ${student.last_name}`;

  return (
    <PathwaysAppShell
      headerProps={{
        userName: profile.full_name,
        userRole: formatRole(profile.role),
        districtName,
        schoolYear: schoolYearLabel,
        notificationCount: 0,
      }}
      breadcrumbs={
        from === "interventions"
          ? [
              { label: "Summit Pathways", href: "/pathways" },
              { label: "Interventions", href: "/pathways/interventions" },
              { label: studentName },
            ]
          : [
              { label: "Summit Pathways", href: "/pathways" },
              { label: "Students", href: "/pathways/students" },
              { label: studentName },
            ]
      }
      activeNavItem={from === "interventions" ? "interventions" : "students"}
      isSuperAdmin={isSuperAdmin}
    >
      <PathwaysStudentProfile
        student={student}
        indicators={indicators}
        interventions={interventions}
        campusName={campusName}
        graduationDate={graduationDate}
        from={from}
      />
    </PathwaysAppShell>
  );
}
