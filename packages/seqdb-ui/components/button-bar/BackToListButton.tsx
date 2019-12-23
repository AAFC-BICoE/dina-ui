import Link from "next/link";
import React from "react";
import { SeqdbMessage } from "../../intl/seqdb-intl";

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
      <a className="btn btn-outline-secondary">
        <SeqdbMessage id="backToListButtonText" />
      </a>
    </Link>
  );
}
