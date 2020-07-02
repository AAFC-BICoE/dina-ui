import Link from "next/link";
import React from "react";
import { CommonMessage } from "../../lib/intl/common-ui-intl";

interface CancelButtonProps {
  /** If the id is set, it will return to the view. If it's not, it will return to the list. */
  entityId?: string;

  /** The link type for where to redirect the user. Gets appended with "/" + entityLink + "/edit/". */
  entityLink: string;

  /** Boolean to use to by pass the view page if there is none */
  byPassView?: boolean;
}

/**
 * Cancel Button which is commonly used in the button bar.
 */
export function CancelButton({
  entityId,
  entityLink,
  byPassView
}: CancelButtonProps) {
  // When editing an existing entity, the link points to the entity details page.
  // When editing a new entity, the link points to the list page.
  const href = entityId
    ? byPassView
      ? `${entityLink}/list`
      : `${entityLink}/view?id=${entityId}`
    : `${entityLink}/list`;

  return (
    <Link href={href}>
      <a className="btn btn-outline-secondary">
        <CommonMessage id="cancelButtonText" />
      </a>
    </Link>
  );
}
