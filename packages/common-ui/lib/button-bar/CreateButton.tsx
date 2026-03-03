import Link from "next/link";
import React from "react";
import { CommonMessage } from "../../lib/intl/common-ui-intl";
import { FaPlus } from "react-icons/fa";

interface CreateButtonProps {
  // The link type for where to redirect the user. Gets appended with "/" + entityLink + "/edit/".
  entityLink: string;

  // Optional message key for the button text. If not provided, defaults to "createNew".
  messageKey?: string;

  extraCssClasses?: string;
}

/**
 * Create Button which is commonly used in the button bar.
 */
export function CreateButton({
  entityLink,
  messageKey,
  extraCssClasses = "ms-auto"
}: CreateButtonProps) {
  return (
    <Link
      href={`${entityLink}/edit`}
      className={`btn btn-primary ${extraCssClasses}`}
    >
      <FaPlus className="me-2" />
      <CommonMessage id={(messageKey as any) ?? "createNew"} />
    </Link>
  );
}
