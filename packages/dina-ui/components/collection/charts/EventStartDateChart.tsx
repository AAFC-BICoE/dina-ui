import { DinaMessage } from "../../../intl/dina-ui-intl";
import DateHistogram, { HistogramInterval } from "./base-charts/DateHistogram";

interface EventStartDateChartProps {
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
 * Material sample record created date histogram chart with preset date ranges and optional query-builder filtering.
 */
export default function EventStartDateChart({
  inputQuery,
  addFilter,
  setQueryBuilderTree,
  queryBuilderTree,
  setSubmittedQueryBuilderTree
}: EventStartDateChartProps) {
  const renderTitle = (interval: HistogramInterval) => {
    switch (interval) {
      case "year":
        return <DinaMessage id="eventStartDateChartTitleYear" />;
      case "month":
        return <DinaMessage id="eventStartDateChartTitleMonth" />;
      case "day":
        return <DinaMessage id="eventStartDateChartTitleDay" />;
      case "hour":
        return <DinaMessage id="eventStartDateChartTitleHour" />;
      default:
        return <DinaMessage id="eventStartDateChartTitle" />;
    }
  };

  return (
    <DateHistogram
      inputQuery={inputQuery}
      indexName={"dina_material_sample_index"}
      dateFieldPath="included.attributes.startEventDateTime"
      queryBuilderFieldPath="collectingEvent.startEventDateTime"
      renderTitle={renderTitle}
      addFilter={addFilter}
      setQueryBuilderTree={setQueryBuilderTree}
      queryBuilderTree={queryBuilderTree}
      setSubmittedQueryBuilderTree={setSubmittedQueryBuilderTree}
      nestedQuery={{
        path: "included",
        typeField: "type",
        typeValue: "collecting-event"
      }}
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
