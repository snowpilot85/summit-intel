import { notFound } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { PathwaysStudentProfile } from "@/components/pathways/student-profile";
import { getStudentById } from "@/lib/db/students";
import { getStudentIndicators } from "@/lib/db/indicators";
import { getInterventions } from "@/lib/db/interventions";

const DISTRICT_ID = "a0000001-0000-0000-0000-000000000001";

export default async function PathwaysStudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [student, indicators, interventions, schoolYear] = await Promise.all([
    getStudentById(supabase, id),
    getStudentIndicators(supabase, id),
    getInterventions(supabase, DISTRICT_ID, { studentId: id }),
    supabase
      .from("school_years")
      .select("graduation_date")
      .eq("district_id", DISTRICT_ID)
      .eq("is_current", true)
      .single(),
  ]);

  if (!student) notFound();

  // Fetch campus name using the student's campus_id
  const { data: campus } = await supabase
    .from("campuses")
    .select("name")
    .eq("id", student.campus_id)
    .single();

  const campusName = campus?.name ?? "Unknown campus";
  const graduationDate = schoolYear.data?.graduation_date ?? null;
  const studentName = `${student.first_name} ${student.last_name}`;

  return (
    <PathwaysAppShell
      headerProps={{
        userName: "Sarah Chen",
        userRole: "CCMR Coordinator",
        districtName: "Edinburg CISD",
        schoolYear: "2025-26",
        notificationCount: 3,
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
