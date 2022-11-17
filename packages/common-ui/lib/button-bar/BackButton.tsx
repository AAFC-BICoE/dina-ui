import Link from "next/link";
import React from "react";
import { CommonMessage } from "../intl/common-ui-intl";
import { useBackButtonReloadLastSearch } from "../list-page/reload-last-search/useBackButtonReloadLastSearch";

interface BackButtonProps {
  /** If the id is set, it will return to the view. If it's not, it will return to the list. */
  entityId?: string;

  /** The link type for where to redirect the user. Gets appended with "/" + entityLink + "/edit/". */
  entityLink: string;

  /** Boolean to use to by pass the view page if there is none */
  byPassView?: boolean;

  className?: string;
  buttonMsg?: string;

  /** If going back to a query page, enable to to reload the last performed query. */
  reloadLastSearch?: boolean;
}

/**
 * Cancel Button which is commonly used in the button bar.
 */
export function BackButton({
  entityId,
  entityLink,
  byPassView,
  className,
  buttonMsg,
  reloadLastSearch
}: BackButtonProps) {
  // If reload last search is activated, intercept the back button of the browser to inject the param.
  useBackButtonReloadLastSearch(!reloadLastSearch);

  // When editing an existing entity, the link points to the entity details page.
  // When editing a new entity, the link points to the list page.
  // When placed in view page, will accept url to navigate to
  const { href, message } =
    byPassView || !entityId
      ? {
          href:
            entityLink +
            "/list" +
            (reloadLastSearch ? "?reloadLastSearch" : ""),
          message: "backToList" as const
        }
      : {
          href: `${entityLink}/view?id=${entityId}`,
          message: "backToReadOnlyPage" as const
        };

  return (
    <Link href={href}>
      <a className={`back-button my-auto ${className ? className : ""}`}>
        <CommonMessage id={(buttonMsg as any) ?? message} />
      </a>
    </Link>
  );
}
