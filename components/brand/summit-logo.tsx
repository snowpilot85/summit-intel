import Image from 'next/image';
import { cn } from '@/lib/utils';

interface SummitLogoProps {
  className?: string;
  /**
   * @deprecated No-op. Retained for API compatibility with the previous
   * recreated SVG version of this component. The official asset bakes in
   * the wordmark, so this flag has no effect.
   */
  showWordmark?: boolean;
  /**
   * @deprecated No-op. Retained for API compatibility with the previous
   * recreated SVG version of this component. The asset is fixed and the
   * product name (INSIGHTS) cannot be overridden.
   */
  productName?: string;
}

/**
 * Summit Insights logo — official Summit K12 horizontal asset.
 *
 * Sourced from `/images/summit_insights_logo_horizontal.png`. Intrinsic
 * size 4235×801 (~5.29:1); rendered at h-10 in the header.
 *
 * The `showWordmark` and `productName` props are accepted for backwards
 * compatibility but have no effect — the PNG includes both the mountain
 * mark and the "SUMMIT INSIGHTS / CCMR" wordmark. They will be removed
 * once no callers pass them.
 */
export function SummitLogo({
  className,
  showWordmark,
  productName,
}: SummitLogoProps) {
  void showWordmark;
  void productName;
  return (
    <Image
      src="/images/summit_insights_logo_horizontal.png"
      alt="Summit Insights"
      width={212}
      height={40}
      priority
      className={cn('h-10 w-auto', className)}
    />
  );
}
