import Link from "next/link";
import React from "react";

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
      <a className="btn btn-primary">Edit</a>
    </Link>
  );
}
