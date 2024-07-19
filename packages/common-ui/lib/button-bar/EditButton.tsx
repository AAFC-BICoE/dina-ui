import Link from "next/link";
import React, { CSSProperties } from "react";
import { CommonMessage } from "../../lib/intl/common-ui-intl";
import classNames from "classnames";

interface EditButtonProps {
  /** The link type for where to redirect the user. Gets appended with "/" + entityLink + "/edit/". */
  entityLink: string;

  /** The id of the entity to edit. */
  entityId: string;

  className?: string;

  disabled?: boolean;

  style?: CSSProperties;

  onKeyUp?: React.KeyboardEventHandler<HTMLAnchorElement>;
  onMouseOver?: React.MouseEventHandler<HTMLAnchorElement>;
  onMouseOut?: React.MouseEventHandler<HTMLAnchorElement>;
  onBlur?: React.FocusEventHandler<HTMLAnchorElement>;
  ariaDescribedBy?: string;
}

/**
 * Edit Button which is commonly used in the button bar.
 */
export function EditButton({
  entityId,
  entityLink,
  className,
  disabled,
  style,
  onMouseOver,
  onMouseOut,
  onBlur,
  onKeyUp,
  ariaDescribedBy
}: EditButtonProps) {
  // Make sure the URL is prefixed with a forward slash e.g. loan-transaction -> /loan-transaction.
  const baseUrl = entityLink.replace(/^\/?/, "/");

  return (
    <Link
      href={`${baseUrl}/edit?id=${entityId}`}
      className={classNames("btn btn-primary", { disabled }, className)}
      style={{ paddingLeft: "15px", paddingRight: "15px", ...style }}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
      onBlur={onBlur}
      onKeyUp={onKeyUp}
      aria-describedby={ariaDescribedBy}
    >
      <CommonMessage id="editButtonText" />
    </Link>
  );
}
