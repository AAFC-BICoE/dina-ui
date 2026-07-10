import { ExternalLink } from "common-ui";
import { ReactNode } from "react";

export interface BreadcrumbBannerItem {
  href?: string;
  label: ReactNode;
}

export interface BreadcrumbBannerProps {
  items: BreadcrumbBannerItem[];
}

/**
 * Reusable banner component that renders a breadcrumb path in a grey card.
 * Used for displaying ancestor hierarchies (e.g. material sample parents, storage unit ancestors).
 */
export function BreadcrumbBanner({ items }: BreadcrumbBannerProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="card well px-3 py-2 mb-3">
      <ol className="breadcrumb breadcrumb-slash mb-1">
        {items.map((item, index) => (
          <li className="breadcrumb-item" key={index}>
            {item.href ? (
              <ExternalLink href={item.href}>{item.label}</ExternalLink>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
