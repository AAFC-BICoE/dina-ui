import { DinaMessage } from "../../../intl/dina-ui-intl";
import DateHistogram, { HistogramInterval } from "./base-charts/DateHistogram";

interface RecordsAddedChartProps {
  /** Optional Elasticsearch query used as the starting point for the chart query. */
  inputQuery?: any;
  /** Enables the add-filter action for the chart. */
  addFilter?: boolean;
  /** Setter for the query-builder tree when adding a filter from the chart. */
  setQueryBuilderTree?: any;
  /** Current query-builder tree used when adding a filter from the chart. */
  queryBuilderTree?: any;
  /** Setter for the submitted query-builder tree when adding a filter from the chart. */
  setSubmittedQueryBuilderTree?: any;
}

/**
 * Records added histogram chart with preset date ranges and optional query-builder filtering.
 */
export default function RecordsAddedChart({
  inputQuery,
  addFilter,
  setQueryBuilderTree,
  queryBuilderTree,
  setSubmittedQueryBuilderTree
}: RecordsAddedChartProps) {
  const renderTitle = (interval: HistogramInterval) => {
    switch (interval) {
      case "year":
        return <DinaMessage id="recordAddedChartTitleYear" />;
      case "month":
        return <DinaMessage id="recordAddedChartTitleMonth" />;
      case "day":
        return <DinaMessage id="recordAddedChartTitleDay" />;
      case "hour":
        return <DinaMessage id="recordAddedChartTitleHour" />;
      default:
        return <DinaMessage id="recordAddedChartTitle" />;
    }
  };

  return (
    <DateHistogram
      inputQuery={inputQuery}
      indexName={"dina_material_sample_index"}
      dateFieldPath="data.attributes.createdOn"
      queryBuilderFieldPath="data.attributes.createdOn"
      renderTitle={renderTitle}
      addFilter={addFilter}
      setQueryBuilderTree={setQueryBuilderTree}
      queryBuilderTree={queryBuilderTree}
      setSubmittedQueryBuilderTree={setSubmittedQueryBuilderTree}
      menuSectionLabels={{
        realTime: <DinaMessage id="dateRangeHeaderRealTime" />,
        byDay: <DinaMessage id="dateRangeHeaderByDay" />,
        byMonth: <DinaMessage id="dateRangeHeaderByMonth" />,
        byYear: <DinaMessage id="dateRangeHeaderByYear" />
      }}
      emptyStateLabel={<DinaMessage id="noData" />}
    />
  );
}
