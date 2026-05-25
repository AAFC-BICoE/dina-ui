import { useAccount, useQuery } from "common-ui";
import { MaterialSample } from "../../../types/collection-api";

export function useLastUsedCollection(disabled = false) {
  const { username } = useAccount();

  const { loading, response } = useQuery<MaterialSample[]>(
    {
      path: "collection-api/material-sample",
      include: "collection",
      page: { limit: 1 },
      filter: { createdBy: { EQ: username } },
      sort: "-createdOn"
    },
    { disabled }
  );

  const lastUsedCollection = disabled
    ? undefined
    : response?.data?.[0]?.collection ?? undefined;

  return { loading: disabled ? false : loading, lastUsedCollection };
}
