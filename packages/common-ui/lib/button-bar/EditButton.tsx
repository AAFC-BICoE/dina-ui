import Link from "next/link";
import React from "react";
import { CommonMessage } from "../../lib/intl/common-ui-intl";

interface EditButtonProps {
  /** The link type for where to redirect the user. Gets appended with "/" + entityLink + "/edit/". */
  entityLink: string;

  /** The id of the entity to edit. */
  entityId: string;
}

/**
 * Edit Button which is commonly used in the button bar.
 */
export function EditButton({ entityId, entityLink }: EditButtonProps) {
  return (
    <Link href={`/${entityLink}/edit?id=${entityId}`}>
      <a className="btn btn-primary">
        <CommonMessage id="editButtonText" />
      </a>
    </Link>
  );
}
