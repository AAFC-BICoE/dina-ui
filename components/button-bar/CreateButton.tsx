import Link from "next/link";
import React from "react";

interface CreateButtonProps {
  // The label added for the buttons text. Gets appended with "Create " + entityLabel.
  entityLabel: string;

  // The link type for where to redirect the user. Gets appended with "/" + entityLink + "/edit/".
  entityLink: string;
}

/**
 * Create Button which is commonly used in the button bar.
 */
export function CreateButton({ entityLabel, entityLink }: CreateButtonProps) {
  return (
    <Link href={`/${entityLink}/edit`}>
      <a className="btn btn-primary">Create {entityLabel}</a>
    </Link>
  );
}
