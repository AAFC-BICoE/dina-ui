import { FaArrowUpRightFromSquare } from "react-icons/fa6";
import Link, { LinkProps } from "next/link";
import React, { ReactNode } from "react";
import { useDinaIntl } from "@dina-ui/intl/dina-ui-intl";

interface ExternalLinkProps
  extends LinkProps,
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  children: ReactNode;
}

export function ExternalLink({
  href,
  children,
  ...linkProps
}: ExternalLinkProps) {
  const { messages } = useDinaIntl();

  return (
    <Link href={href} target="_blank" rel="noopener noreferrer" {...linkProps}>
      <span style={{ whiteSpace: "nowrap" }}>
        {children}
        <FaArrowUpRightFromSquare
          style={{ marginLeft: "0.3em" }}
          aria-label={messages["openInNewTab"]}
        />
      </span>
    </Link>
  );
}
