import { MetaWithTotal, useQuery } from "common-ui";
import { Group } from "../../types/user-api";

/**
 * Meta key set on the User API's list responses when the API applies the filters 
 * (fiql and simple filters), sorts and pagination itself.
 */
export const SERVER_SIDE_FILTERING_META_KEY = "serverSideFiltering";

type UserApiListMeta = MetaWithTotal & {
  [SERVER_SIDE_FILTERING_META_KEY]?: boolean;
};

/**
 * Detects whether the User API filters, sorts and paginates its lists server-side, or whether
 * those params have to be handled client-side.
 *
 * The check is a minimal group list request: the newer User API flags its list responses with
 * `meta.serverSideFiltering`. 
 * 
 * Without the flag (or if the request fails), the list pages load
 * the whole list once and filter it in-memory.
 */
export function useUserApiFilteringSupport() {
  const { response, error, loading } = useQuery<Group[], UserApiListMeta>({
    path: "user-api/group",
    page: { limit: 1, offset: 0 }
  });

  const resolved = !loading && (response !== undefined || error !== undefined);

  return {
    /** True until the check has completed (successfully or not). */
    loading: !resolved,
    /** True when the User API applies filters, sorts and pagination server-side. */
    serverSideFiltering:
      response?.meta?.[SERVER_SIDE_FILTERING_META_KEY] === true
  };
}
