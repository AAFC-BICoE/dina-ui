import { DinaMessage } from "../../../intl/dina-ui-intl";
import DateHistogram, { HistogramInterval } from "./base-charts/DateHistogram";

interface DigitalizationDateChartProps {
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
 * Digitalization date histogram chart with preset date ranges and optional query-builder filtering.
 */
export default function DigitalizationDateChart({
  inputQuery,
  addFilter,
  setQueryBuilderTree,
  queryBuilderTree,
  setSubmittedQueryBuilderTree
}: DigitalizationDateChartProps) {
  const renderTitle = (interval: HistogramInterval) => {
    switch (interval) {
      case "year":
        return <DinaMessage id="digitalizationDateChartTitleYear" />;
      case "month":
        return <DinaMessage id="digitalizationDateChartTitleMonth" />;
      case "day":
        return <DinaMessage id="digitalizationDateChartTitleDay" />;
      case "hour":
        return <DinaMessage id="digitalizationDateChartTitleHour" />;
      default:
        return <DinaMessage id="digitalizationDateChartTitle" />;
    }
  };

  return (
    <DateHistogram
      inputQuery={inputQuery}
      indexName={"dina_object_store_index"}
      dateFieldPath="data.attributes.acDigitizationDate"
      queryBuilderFieldPath="data.attributes.acDigitizationDate"
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
