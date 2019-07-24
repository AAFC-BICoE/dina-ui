import Link from "next/link";
import React from "react";

interface CancelButtonProps {
  /** If the id is set, it will return to the view. If it's not, it will return to the list. */
  entityId?: string | number;

  /** The link type for where to redirect the user. Gets appended with "/" + entityLink + "/edit/". */
  entityLink: string;
}

/**
 * Cancel Button which is commonly used in the button bar.
 */
export function CancelButton({ entityId, entityLink }: CancelButtonProps) {
  // When editing an existing entity, the link points to the entity details page.
  // When editing a new entity, the link points to the list page.
  const href = entityId
    ? `/${entityLink}/view?id=${entityId}`
    : `/${entityLink}/list`;

  return (
    <Link href={href}>
      <a className="btn btn-outline-secondary">Cancel</a>
    </Link>
  );
}
