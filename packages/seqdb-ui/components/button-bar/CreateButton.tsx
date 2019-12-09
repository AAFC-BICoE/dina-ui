import Link from "next/link";
import React from "react";

interface CreateButtonProps {
  // The link type for where to redirect the user. Gets appended with "/" + entityLink + "/edit/".
  entityLink: string;
}

/**
 * Create Button which is commonly used in the button bar.
 */
export function CreateButton({ entityLink }: CreateButtonProps) {
  return (
    <Link href={`/${entityLink}/edit`}>
      <a className="btn btn-primary">Create New</a>
    </Link>
  );
}
