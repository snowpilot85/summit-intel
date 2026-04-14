import { createAdminClient } from "@/utils/supabase/admin";
import { PathwaysAppShell } from "@/components/pathways/app-shell";
import { PathwaysStudents } from "@/components/pathways/students";
import { getStudents } from "@/lib/db/students";
import { getIndicatorsForStudents } from "@/lib/db/indicators";
import { getCampuses } from "@/lib/db/campuses";

const DISTRICT_ID = "a0000001-0000-0000-0000-000000000001";

export default async function PathwaysStudentsPage() {
  const supabase = createAdminClient();

  const [{ data: students, count }, campuses, schoolYear] = await Promise.all([
    getStudents(supabase, DISTRICT_ID, { pageSize: 50 }),
    getCampuses(supabase, DISTRICT_ID),
    supabase
      .from("school_years")
      .select("graduation_date")
      .eq("district_id", DISTRICT_ID)
      .eq("is_current", true)
      .single(),
  ]);

  const studentIds = students.map((s) => s.id);
  const indicators = await getIndicatorsForStudents(supabase, studentIds);

  const graduationDate = schoolYear.data?.graduation_date ?? null;

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
        { label: "Students" },
      ]}
      activeNavItem="students"
    >
      <PathwaysStudents
        districtId={DISTRICT_ID}
        initialStudents={students}
        initialCount={count}
        initialIndicators={indicators}
        campuses={campuses}
        graduationDate={graduationDate}
      />
    </PathwaysAppShell>
  );
}
