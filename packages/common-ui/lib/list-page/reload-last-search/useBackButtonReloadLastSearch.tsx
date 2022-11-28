import { useRouter } from "next/router";
import { useEffect } from "react";

/**
 * Anywhere this hook is used, the back button is be intercepted and apply the `reloadLastSearch`
 * url param to the list page.
 *
 * This only works if the user going back to a listing page, any other pages it will not be applied.
 *
 * This hook is automatically applied when the back button has the reloadLastSearch prop being
 * used.
 *
 * This function is ignored by test coverage since it's been extracted to it's own function that
 * ignores most of the nextJS router functions. It's very hard to mock this but all of the
 * functionality we do want to test is in the backButtonAddReloadLastSearchParam function.
 *
 * @param disabled boolean to deactivate the back button intercept.
 */
/* istanbul ignore next */
export function useBackButtonReloadLastSearch(disabled: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (disabled) return;

    router.beforePopState(({ as }) => {
      return backButtonAddReloadLastSearchParam(
        router,
        as,
        router.asPath,
        disabled
      );
    });

    return () => {
      router.beforePopState(() => true);
    };
  }, [router]);
}

export function backButtonAddReloadLastSearchParam(
  router,
  newPath,
  previousPath,
  disabled
): boolean {
  if (disabled) return true;

  if (newPath !== previousPath) {
    // The user is going to a different path than the current page, check if the new path is
    // going to a list page.
    // `/collection/material-sample/list` becomes `list`
    const urlWithoutEntity = newPath.slice(
      newPath.lastIndexOf("/") + 1,
      newPath.length
    );

    if (urlWithoutEntity.includes("list")) {
      if (!urlWithoutEntity.includes("reloadLastSearch")) {
        let newUrl = newPath;
        if (urlWithoutEntity.includes("?")) {
          // URL params already exist, use & to indicate another url param.
          newUrl = newUrl + "&";
        } else {
          // URL params don't exist, using ? to start a url param.
          newUrl = newUrl + "?";
        }

        newUrl = newUrl + "reloadLastSearch";
        router.push(newUrl);
        return false;
      }
    }
  }
  return true;
}
