import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { getUserContext } from '@/lib/db/users';
import { SiteHeaderClient } from '@/components/layout/site-header-client';

function formatRole(role: string): string {
  return role.split('_').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
}

export default async function PathwaysLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const userCtx = await getUserContext(supabase);

  // Pre-auth and pre-district-pick states still render the header chrome.
  // Pages handle their own auth redirects; the layout just picks safe defaults.
  const districtName = userCtx?.districtName ?? '';
  const schoolYearLabel = userCtx?.schoolYearLabel ?? '';
  const isSuperAdmin = userCtx?.profile.role === 'super_admin';
  const user = userCtx
    ? {
        name: userCtx.profile.full_name,
        role: formatRole(userCtx.profile.role),
      }
    : undefined;

  return (
    <>
      <SiteHeaderClient
        districtName={districtName}
        schoolYearLabel={schoolYearLabel}
        isSuperAdmin={isSuperAdmin}
        user={user}
      />
      {children}
    </>
  );
}
