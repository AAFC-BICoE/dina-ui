import { QueryPageTabProps } from "../QueryPage";
import { KitsuResource } from "kitsu";
import TaxonomyTree from "../../classification/TaxonomyTree";

/**
 * Tab component that displays a taxonomy tree based on the material samples returned by the query.
 */
export function TaxonomyTreeTab<TData extends KitsuResource>({
  query
}: QueryPageTabProps<TData>) {
  const inputQuery = query.query;

  return <TaxonomyTree inputQuery={inputQuery} />;
}
