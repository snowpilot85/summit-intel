'use client';

import { SiteHeader } from '@/components/layout/site-header';
import { DistrictYearSelector } from '@/components/pathways/district-year-selector';

interface SiteHeaderClientProps {
  districtName: string;
  schoolYearLabel: string;
  isSuperAdmin?: boolean;
  user?: {
    name: string;
    role?: string;
    avatarUrl?: string;
  };
  hasNotifications?: boolean;
}

/**
 * Client wrapper around <SiteHeader />. Owns rendering the global
 * <DistrictYearSelector /> in the header's actions slot so every page
 * inside /pathways/* picks it up automatically via app/pathways/layout.tsx.
 */
export function SiteHeaderClient({
  districtName,
  schoolYearLabel,
  isSuperAdmin,
  user,
  hasNotifications,
}: SiteHeaderClientProps) {
  return (
    <SiteHeader
      user={user}
      hasNotifications={hasNotifications}
      actions={
        <DistrictYearSelector
          districtName={districtName}
          schoolYearLabel={schoolYearLabel}
          isSuperAdmin={isSuperAdmin}
        />
      }
    />
  );
}
