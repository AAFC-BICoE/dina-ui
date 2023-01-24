import Link from "next/link";
import React, { PropsWithChildren } from "react";
import { CommonMessage } from "../../lib/intl/common-ui-intl";

interface BackToListButtonProps {
  /** The link type for where to redirect the user. Gets appended with "/" + entityLink + "/list/". */
  entityLink: string;
  className?: string;
}

/**
 * Back to List Button which is commonly used in the button bar.
 */
export function BackToListButton({
  entityLink,
  className,
  children
}: PropsWithChildren<BackToListButtonProps>) {
  return (
    <Link href={`${entityLink}/list`}>
      <a className={`btn btn-secondary ${className}`}>
        {children || <CommonMessage id="backToList" />}
      </a>
    </Link>
  );
}
