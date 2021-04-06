import Link from "next/link";
import React from "react";
import { CommonMessage } from "../../lib/intl/common-ui-intl";

interface EditButtonProps {
  /** The link type for where to redirect the user. Gets appended with "/" + entityLink + "/edit/". */
  entityLink: string;

  /** The id of the entity to edit. */
  entityId: string;

  className?: string;
}

/**
 * Edit Button which is commonly used in the button bar.
 */
export function EditButton({
  entityId,
  entityLink,
  className
}: EditButtonProps) {
  return (
    <Link href={`/${entityLink}/edit?id=${entityId}`}>
      <a className={`btn btn-primary ${className}`} style={{ width: "10rem" }}>
        <CommonMessage id="editButtonText" />
      </a>
    </Link>
  );
}
