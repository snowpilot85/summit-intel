'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  breadcrumbs?: Breadcrumb[];
  /** Optional back link rendered as a chevron-left affordance at the start of the row. */
  backHref?: string;
  /** Optional right-aligned slot, inline with the breadcrumb (filters, action buttons, etc.). */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Slim contextual band that sits below <SiteHeader />.
 *
 * Breadcrumb-only — page titles live in the page's own content H1.
 * Inactive crumbs render in `text-secondary`, the current page in `text-primary`.
 *
 * Example:
 *   <PageHeader
 *     breadcrumbs={[
 *       { label: 'Summit Insights', href: '/pathways' },
 *       { label: 'Students' },
 *     ]}
 *   />
 */
export function PageHeader({
  breadcrumbs,
  backHref,
  actions,
  className,
}: PageHeaderProps) {
  const hasCrumbs = breadcrumbs && breadcrumbs.length > 0;

  return (
    <div
      className={cn(
        'w-full border-b border-neutral-300 bg-white',
        className
      )}
    >
      <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-3 px-6 py-3">
        <div className="flex min-w-0 items-center gap-3">
          {backHref && (
            <Link
              href={backHref}
              aria-label="Back"
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-neutral-100 hover:text-text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}

          {hasCrumbs && (
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-2 text-[13px]"
            >
              {breadcrumbs!.map((crumb, i) => {
                const isLast = i === breadcrumbs!.length - 1;
                return (
                  <span
                    key={`${crumb.label}-${i}`}
                    className="flex items-center gap-2"
                  >
                    {crumb.href && !isLast ? (
                      <Link
                        href={crumb.href}
                        className="text-text-secondary transition-colors hover:text-text-primary"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        className={cn(
                          isLast
                            ? 'font-medium text-text-primary'
                            : 'text-text-secondary'
                        )}
                        aria-current={isLast ? 'page' : undefined}
                      >
                        {crumb.label}
                      </span>
                    )}
                    {!isLast && (
                      <span className="text-neutral-300">/</span>
                    )}
                  </span>
                );
              })}
            </nav>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-3">{actions}</div>
        )}
      </div>
    </div>
  );
}
