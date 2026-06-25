import { FaArrowUpRightFromSquare } from "react-icons/fa6";
import Link, { LinkProps } from "next/link";
import React, { ReactNode } from "react";

interface ExternalLinkProps
  extends LinkProps,
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  children: ReactNode;
  iconAriaLabel?: string;
}

export function ExternalLink({
  href,
  children,
  iconAriaLabel = "Opens in new tab",
  ...linkProps
}: ExternalLinkProps) {
  return (
    <Link href={href} target="_blank" rel="noopener noreferrer" {...linkProps}>
      <span style={{ whiteSpace: "nowrap" }}>
        {children}
        <FaArrowUpRightFromSquare
          style={{ marginLeft: "0.3em" }}
          aria-label={iconAriaLabel}
        />
      </span>
    </Link>
  );
}
