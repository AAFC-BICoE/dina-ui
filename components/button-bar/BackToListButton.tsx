import Link from "next/link";
import React from "react";

interface BackToListButtonProps {
  /** The link type for where to redirect the user. Gets appended with "/" + entityLink + "/list/". */
  entityLink: string;
}

/**
 * Back to List Button which is commonly used in the button bar.
 */
export function BackToListButton({ entityLink }: BackToListButtonProps) {
  return (
    <Link href={`/${entityLink}/list`}>
      <a className="btn btn-outline-secondary">Back to List</a>
    </Link>
  );
}
