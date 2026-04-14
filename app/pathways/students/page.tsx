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

function formatRole(role: string): string {
  return role.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

export default async function PathwaysStudentsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const userCtx = await getUserContext(supabase);
  if (!userCtx) redirect("/login");

  const { districtId, profile, districtName, schoolYearLabel, graduationDate } = userCtx;
  if (!districtId) redirect("/pathways");
  const isSuperAdmin = profile.role === "super_admin";
  const queryClient = isSuperAdmin ? createAdminClient() : supabase;

  const [{ data: students, count }, campuses] = await Promise.all([
    getStudents(queryClient, districtId, { pageSize: 50 }),
    getCampuses(queryClient, districtId),
  ]);

  const studentIds = students.map((s) => s.id);
  const indicators = await getIndicatorsForStudents(queryClient, studentIds);

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
        { label: "Summit Readiness", href: "/pathways" },
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
        campuses={campuses}
        graduationDate={graduationDate}
      />
    </PathwaysAppShell>
  );
}
