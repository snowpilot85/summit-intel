import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getUserContext } from "@/lib/db/users";
import { AdminSetupForm } from "./setup-form";

export const metadata = {
  title: "District Setup | Summit Readiness Admin",
};

export default async function AdminSetupPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const userCtx = await getUserContext(supabase);

  if (!userCtx) redirect("/login");
  if (userCtx.profile.role !== "super_admin") redirect("/pathways");

  return <AdminSetupForm />;
}
