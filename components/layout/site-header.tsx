'use client';

import Link from 'next/link';
import { Bell, ChevronDown } from 'lucide-react';
import { SummitLogo } from '@/components/brand/summit-logo';

interface SiteHeaderProps {
  /**
   * Right-of-logo slot, anchored toward the bell/profile cluster.
   * Used for global context controls (e.g. <DistrictYearSelector />).
   */
  actions?: React.ReactNode;
  user?: {
    name: string;
    role?: string;
    avatarUrl?: string;
  };
  hasNotifications?: boolean;
  onProfileClick?: () => void;
  onNotificationsClick?: () => void;
}

/**
 * Top white header shell — Summit K12 brand pattern.
 * Pairs with <PageHeader /> for the blue contextual band below it.
 *
 * Layout: logo (left) · actions (right-aligned, before bell) · bell · profile.
 * The center nav was removed — the left nav rail in <PathwaysAppShell />
 * is the source of truth for in-app navigation.
 */
export function SiteHeader({
  actions,
  user = { name: 'Welcome Back', role: 'Admin' },
  hasNotifications = false,
  onProfileClick,
  onNotificationsClick,
}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-300 bg-white">
      <div className="mx-auto flex h-16 max-w-[1680px] items-center justify-between gap-4 px-6">
        {/* Logo — wide horizontal asset, allowed to claim its intrinsic width */}
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center"
          aria-label="Summit Insights home"
        >
          <SummitLogo />
        </Link>

        {/* Right cluster: actions + bell + profile */}
        <div className="flex shrink-0 items-center gap-3">
          {actions && (
            <div className="mr-1 flex items-center gap-3">{actions}</div>
          )}

          <button
            type="button"
            onClick={onNotificationsClick}
            className="relative rounded-full p-2 text-text-secondary transition-colors hover:bg-neutral-100 hover:text-text-primary"
            aria-label={
              hasNotifications ? 'Notifications (unread)' : 'Notifications'
            }
          >
            <Bell className="h-5 w-5" />
            {hasNotifications && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-status-error ring-2 ring-white" />
            )}
          </button>

          <div
            className="h-8 w-px bg-neutral-300"
            aria-hidden="true"
          />

          <button
            type="button"
            onClick={onProfileClick}
            className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-neutral-100"
          >
            <div className="h-9 w-9 overflow-hidden rounded-full bg-brand-blue-light ring-1 ring-neutral-300">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[12px] font-bold text-primary-500">
                  {initials(user.name)}
                </div>
              )}
            </div>
            <div className="hidden text-left sm:block">
              <div className="text-[12px] leading-tight text-text-secondary">
                {user.name}
              </div>
              {user.role && (
                <div className="text-[14px] font-bold leading-tight text-text-primary">
                  {user.role}
                </div>
              )}
            </div>
            <ChevronDown className="h-4 w-4 text-text-secondary" />
          </button>
        </div>
      </div>
    </header>
  );
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
