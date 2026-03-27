import { QueryPageTabProps } from "../QueryPage";
import React from "react";
import { KitsuResource } from "kitsu";
import SampleTypeChart from "../../../../dina-ui/components/collection/charts/SampleTypeChart";
import RecordsAddedChart from "../../../../dina-ui/components/collection/charts/RecordsAddedChart";
import RelatedObjectTypeChart from "../../../../dina-ui/components/collection/charts/RelatedObjectTypeChart";

export function MaterialSampleVisualizationTab<TData extends KitsuResource>({
  query
}: QueryPageTabProps<TData>) {
  const queryParams = query.query;
  return (
    <div>
      <div className="row">
        <div className="col-md-6">
          <SampleTypeChart query={queryParams} />
        </div>
        <div className="col-md-6">
          <RecordsAddedChart inputQuery={queryParams} />
        </div>
      </div>
      <div className="row mt-3 mb-3">
        <div className="col-md-6">
          <RelatedObjectTypeChart query={queryParams} />
        </div>
      </div>
    </div>
  );
}
