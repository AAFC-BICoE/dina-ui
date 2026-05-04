import { QueryPageTabProps } from "../QueryPage";
import React from "react";
import { KitsuResource } from "kitsu";
import DigitalizationDateChart from "../../../../dina-ui/components/collection/charts/DigitalizationDateChart";
export function ObjectStoreVisualizationTab<TData extends KitsuResource>({
  query,
  queryBuilderTree,
  setQueryBuilderTree,
  setSubmittedQueryBuilderTree
}: QueryPageTabProps<TData>) {
  const queryParams = query.query;
  return (
    <div>
      <div className="row mt-3 mb-3">
        <div className="col-md-6">
          <DigitalizationDateChart
            inputQuery={queryParams}
            queryBuilderTree={queryBuilderTree}
            setQueryBuilderTree={setQueryBuilderTree}
            addFilter={true}
            setSubmittedQueryBuilderTree={setSubmittedQueryBuilderTree}
          />
        </div>
      </div>
    </div>
  );
}
