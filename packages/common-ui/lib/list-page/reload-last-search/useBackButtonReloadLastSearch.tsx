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
 * @param disabled boolean to deactivate the back button intercept.
 */
export function useBackButtonReloadLastSearch(disabled: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (disabled) return;

    router.beforePopState(({ as }) => {
      if (as !== router.asPath) {
        // The user is going to a different path than the current page, check if the new path is
        // going to a list page.
        // `/collection/material-sample/list` becomes `list`
        const urlWithoutEntity = as.slice(as.lastIndexOf("/") + 1, as.length);

        if (urlWithoutEntity.includes("list")) {
          if (!urlWithoutEntity.includes("reloadLastSearch")) {
            const newUrl = as + "?reloadLastSearch";
            router.push(newUrl);
            return false;
          }
        }

        // Add the url param to the end.
      }
      return true;
    });

    return () => {
      router.beforePopState(() => true);
    };
  }, [router]);
}
