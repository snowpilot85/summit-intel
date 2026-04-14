import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
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
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const userCtx = await getUserContext(supabase);
  if (!userCtx) redirect("/login");

  const { districtId, profile, districtName, schoolYearLabel, graduationDate } = userCtx;

  const [student, indicators, interventions] = await Promise.all([
    getStudentById(supabase, id),
    getStudentIndicators(supabase, id),
    getInterventions(supabase, districtId, { studentId: id }),
  ]);

  if (!student) notFound();

  const { data: campus } = await supabase
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
      breadcrumbs={[
        { label: "Summit Pathways", href: "/pathways" },
        { label: "Students", href: "/pathways/students" },
        { label: studentName },
      ]}
      activeNavItem="students"
    >
      <PathwaysStudentProfile
        student={student}
        indicators={indicators}
        interventions={interventions}
        campusName={campusName}
        graduationDate={graduationDate}
      />
    </PathwaysAppShell>
  );
}
