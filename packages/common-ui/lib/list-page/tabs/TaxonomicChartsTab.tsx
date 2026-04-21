import { QueryPageTabProps } from "../QueryPage";
import React from "react";
import { KitsuResource } from "kitsu";
import TaxonomicDetChart from "dina-ui/components/collection/charts/taxonomy/TaxonomicDetChart";
import Drilldown from "dina-ui/components/collection/charts/TaxonomicDrilldown";

export function TaxonomicChartsTab<TData extends KitsuResource>({
  query
}: QueryPageTabProps<TData>) {
  const queryParams = query.query;
  return (
    <div>
      <div className="row">
        <TaxonomicDetChart query={queryParams} />
      </div>
      <div className="row">
        <Drilldown query={queryParams} />
      </div>
    </div>
  );
}
