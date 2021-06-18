import Link from "next/link";
import React from "react";
import { CommonMessage } from "../intl/common-ui-intl";

interface BackButtonProps {
  /** If the id is set, it will return to the view. If it's not, it will return to the list. */
  entityId?: string;

  /** The link type for where to redirect the user. Gets appended with "/" + entityLink + "/edit/". */
  entityLink: string;

  /** Boolean to use to by pass the view page if there is none */
  byPassView?: boolean;

  className?: string;
}

/**
 * Cancel Button which is commonly used in the button bar.
 */
export function BackButton({
  entityId,
  entityLink,
  byPassView,
  className
}: BackButtonProps) {
  // When editing an existing entity, the link points to the entity details page.
  // When editing a new entity, the link points to the list page.
  // When placed in view page, will accept url to navigate to
  const { href, message } =
    byPassView || !entityId
      ? { href: `${entityLink}/list`, message: "backToList" as const }
      : {
          href: `${entityLink}/view?id=${entityId}`,
          message: "backToReadOnlyPage" as const
        };

  return (
    <Link href={href}>
      <a className={`my-auto ${className}`}>
        <CommonMessage id={message} />
      </a>
    </Link>
  );
}
