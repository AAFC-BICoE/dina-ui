import { useAccount, useQuery } from "../../../common-ui/lib";
import { MaterialSample } from "../../types/collection-api";

export function useLastUsedCollection() {
  const { username } = useAccount();

  const { loading, response } = useQuery<MaterialSample[]>({
    path: "collection-api/material-sample",
    include: "collection",
    page: { limit: 1 },
    filter: { createdBy: { EQ: username } },
    sort: "-createdOn"
  });

  const lastUsedCollection = response?.data?.[0]?.collection ?? undefined;

  return { loading, lastUsedCollection };
}
