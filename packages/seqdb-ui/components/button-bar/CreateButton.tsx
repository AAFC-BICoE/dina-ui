import Link from "next/link";
import React from "react";
import { SeqdbMessage } from "../../intl/seqdb-intl";

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
      <a className="btn btn-primary">
        <SeqdbMessage id="createButtonText" />
      </a>
    </Link>
  );
}
