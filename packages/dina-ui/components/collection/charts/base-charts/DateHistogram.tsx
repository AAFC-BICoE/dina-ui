import { ReactNode, useEffect, useId, useState } from "react";
import { useApiClient, Tooltip } from "common-ui";
import ReactECharts from "echarts-for-react";
import { Dropdown, DropdownButton, Card } from "react-bootstrap";
import _ from "lodash";
import { Utils } from "@react-awesome-query-builder/ui";
import { useDinaIntl } from "../../../../intl/dina-ui-intl";

export type HistogramInterval = "hour" | "day" | "month" | "year";

interface DateHistogramPreset {
  key: string;
  label: ReactNode;
  interval: HistogramInterval;
  format: string;
  getDates: () => { start?: string; end?: string };
}

interface DateHistogramPresetLabels {
  last24Hours: ReactNode;
  last7Days: ReactNode;
  last30Days: ReactNode;
  last3Months: ReactNode;
  last6Months: ReactNode;
  thisYear: ReactNode;
  lastYear: ReactNode;
  allTime: ReactNode;
}

function createDateHistogramPresets(
  labels: DateHistogramPresetLabels
): DateHistogramPreset[] {
  return [
    {
      key: "last-24-hours",
      label: labels.last24Hours,
      interval: "hour",
      format: "yyyy-MM-dd HH:00",
      getDates: () => {
        const now = new Date();
        const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        return { start: start.toISOString(), end: now.toISOString() };
      }
    },
    {
      key: "last-7-days",
      label: labels.last7Days,
      interval: "day",
      format: "yyyy-MM-dd",
      getDates: () => {
        const now = new Date();
        const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
          start: start.toISOString().split("T")[0],
          end: now.toISOString().split("T")[0]
        };
      }
    },
    {
      key: "last-30-days",
      label: labels.last30Days,
      interval: "day",
      format: "yyyy-MM-dd",
      getDates: () => {
        const now = new Date();
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return {
          start: start.toISOString().split("T")[0],
          end: now.toISOString().split("T")[0]
        };
      }
    },
    {
      key: "last-3-months",
      label: labels.last3Months,
      interval: "day",
      format: "yyyy-MM-dd",
      getDates: () => {
        const now = new Date();
        const start = new Date(
          now.getFullYear(),
          now.getMonth() - 3,
          now.getDate()
        );
        return {
          start: start.toISOString().split("T")[0],
          end: now.toISOString().split("T")[0]
        };
      }
    },
    {
      key: "last-6-months",
      label: labels.last6Months,
      interval: "month",
      format: "yyyy-MM",
      getDates: () => {
        const now = new Date();
        const start = new Date(
          now.getFullYear(),
          now.getMonth() - 6,
          now.getDate()
        );
        return {
          start: start.toISOString().split("T")[0],
          end: now.toISOString().split("T")[0]
        };
      }
    },
    {
      key: "this-year",
      label: labels.thisYear,
      interval: "month",
      format: "yyyy-MM",
      getDates: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        return {
          start: start.toISOString().split("T")[0],
          end: now.toISOString().split("T")[0]
        };
      }
    },
    {
      key: "last-year",
      label: labels.lastYear,
      interval: "month",
      format: "yyyy-MM",
      getDates: () => {
        const now = new Date();
        const start = new Date(
          now.getFullYear() - 1,
          now.getMonth(),
          now.getDate()
        );
        return {
          start: start.toISOString().split("T")[0],
          end: now.toISOString().split("T")[0]
        };
      }
    },
    {
      key: "all-time-month",
      label: labels.allTime,
      interval: "month",
      format: "yyyy-MM",
      getDates: () => ({ start: undefined, end: undefined })
    },
    {
      key: "all-time-year",
      label: labels.allTime,
      interval: "year",
      format: "yyyy",
      getDates: () => ({ start: undefined, end: undefined })
    }
  ];
}

interface DateHistogramProps {
  /** Optional Elasticsearch query used as the starting point for the chart query. */
  inputQuery?: any;
  /** Elasticsearch index name to query for histogram buckets. */
  indexName: string;
  /** Document path of the date field used for the histogram aggregation. */
  dateFieldPath: string;
  /** Query-builder field path used when adding a filter from the chart. */
  queryBuilderFieldPath: string;
  /** Renders the chart title for the active histogram interval. */
  renderTitle: (interval: HistogramInterval) => ReactNode;
  /** Enables the add-filter action for the chart. */
  addFilter?: boolean;
  /** Setter for the query-builder tree when adding a filter from the chart. */
  setQueryBuilderTree?: any;
  /** Current query-builder tree used when adding a filter from the chart. */
  queryBuilderTree?: any;
  /** Setter for the submitted query-builder tree when adding a filter from the chart. */
  setSubmittedQueryBuilderTree?: any;
  /** Optional nested query configuration for date fields inside nested documents. */
  nestedQuery?: {
    /** Nested document path used in the Elasticsearch query. */
    path: string;
    /** Optional nested type field used to narrow the nested aggregation. */
    typeField?: string;
    /** Optional nested type value used with the nested type field. */
    typeValue?: string;
  };
  /** Label shown in the chart legend and axis for the series. */
  seriesName?: string;
  /** Base color used for the histogram bars or line series. */
  seriesColor?: string;
  /** Emphasis color used when the series is highlighted. */
  seriesEmphasisColor?: string;
  /** Optional DOM id for the preset dropdown button. */
  dropdownId?: string;
  /** Optional DOM id for the add-filter tooltip trigger. */
  tooltipId?: string;
  /** Labels for the dropdown section headings. */
  menuSectionLabels: {
    /** Section label for real-time presets. */
    realTime: ReactNode;
    /** Section label for day-based presets. */
    byDay: ReactNode;
    /** Section label for month-based presets. */
    byMonth: ReactNode;
    /** Section label for year-based presets. */
    byYear: ReactNode;
  };
  /** Empty-state text shown when the chart has no data. */
  emptyStateLabel?: ReactNode;
}

/**
 * Date histogram chart with preset date ranges and optional query-builder filtering.
 */
export default function DateHistogram({
  inputQuery,
  indexName,
  dateFieldPath,
  queryBuilderFieldPath,
  renderTitle,
  addFilter,
  setQueryBuilderTree,
  queryBuilderTree,
  setSubmittedQueryBuilderTree,
  nestedQuery,
  seriesName = "Sample Count",
  seriesColor = "#5470c6",
  seriesEmphasisColor = "#3b5998",
  dropdownId,
  tooltipId,
  menuSectionLabels,
  emptyStateLabel = "No data"
}: DateHistogramProps) {
  const { apiClient } = useApiClient();
  const { formatMessage } = useDinaIntl();
  const idBase = useId();
  const resolvedDropdownId = dropdownId || `${idBase}-date-preset-dropdown`;
  const resolvedTooltipId = tooltipId || `${idBase}-add-filter-tooltip`;

  const defaultPresetKey = "all-time-year";

  const datePresets = createDateHistogramPresets({
    last24Hours: formatMessage("last24hours"),
    last7Days: formatMessage("last7days"),
    last30Days: formatMessage("last30days"),
    last3Months: formatMessage("last3months"),
    last6Months: formatMessage("last6months"),
    thisYear: formatMessage("thisYear"),
    lastYear: formatMessage("lastYear"),
    allTime: formatMessage("allTime")
  });

  const initialPreset =
    datePresets.find((preset) => preset.key === defaultPresetKey) ||
    datePresets[0];

  const [interval, setInterval] = useState(initialPreset.interval);
  const [format, setFormat] = useState(initialPreset.format);
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>(
    initialPreset.getDates()
  );
  const [selectedPreset, setSelectedPreset] = useState(defaultPresetKey);
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>(
    []
  );

  const getDateRangeFilter = () => {
    if (!dateRange.start && !dateRange.end) {
      return undefined;
    }

    const rangeFilter: any = {
      range: {
        [dateFieldPath]: {}
      }
    };

    if (dateRange.start) {
      rangeFilter.range[dateFieldPath].gte = dateRange.start;
    }
    if (dateRange.end) {
      rangeFilter.range[dateFieldPath].lte = dateRange.end;
    }

    return rangeFilter;
  };

  const addClickToQuery = (params: { name: string }) => {
    if (!queryBuilderTree || !setQueryBuilderTree) return;

    const jsonTree = _.cloneDeep(Utils.getTree(queryBuilderTree));

    const createDateRule = (
      selectedPresetKey: string,
      dateStr: string
    ): any => {
      const preset = datePresets.find(
        (presetItem) => presetItem.key === selectedPresetKey
      );

      if (preset?.interval === "day" || preset?.interval === "hour") {
        const dateArr = dateStr.split("-");
        const year = parseInt(dateArr[0], 10);
        const month = parseInt(dateArr[1], 10) - 1;
        const day = parseInt(dateArr[2], 10);
        const date = new Date(year, month, day).toISOString().split("T")[0];

        return {
          id: Utils.uuid(),
          type: "rule",
          properties: {
            field: queryBuilderFieldPath,
            operator: "equals",
            value: [date],
            valueSrc: ["value"],
            valueType: ["date"],
            valueError: [],
            fieldError: undefined,
            fieldSrc: "field"
          }
        };
      }

      if (preset?.interval === "month") {
        const dateArr = dateStr.split("-");
        const year = parseInt(dateArr[0], 10);
        const month = parseInt(dateArr[1], 10) - 1;
        const start = new Date(year, month, 1).toISOString().split("T")[0];
        const end = new Date(year, month + 1, 0).toISOString().split("T")[0];

        return {
          id: Utils.uuid(),
          type: "rule",
          properties: {
            field: queryBuilderFieldPath,
            operator: "between",
            value: [`{ "low": "${start}", "high": "${end}" }`],
            valueSrc: ["value"],
            valueType: ["date"],
            valueError: [],
            fieldError: undefined,
            fieldSrc: "field"
          }
        };
      }

      const year = parseInt(dateStr, 10);
      const start = new Date(year, 0, 1).toISOString().split("T")[0];
      const end = new Date(year, 11, 31).toISOString().split("T")[0];

      return {
        id: Utils.uuid(),
        type: "rule",
        properties: {
          field: queryBuilderFieldPath,
          operator: "between",
          value: [`{ "low": "${start}", "high": "${end}" }`],
          valueSrc: ["value"],
          valueType: ["date"],
          valueError: [],
          fieldError: undefined,
          fieldSrc: "field"
        }
      };
    };

    const dateRule = createDateRule(selectedPreset, params.name);

    if (!jsonTree.children1) {
      jsonTree.children1 = [dateRule as any];
    } else {
      jsonTree.children1 = [...jsonTree.children1, dateRule] as any;
    }

    const newTree = Utils.loadTree(jsonTree);
    setQueryBuilderTree(newTree);
    setSubmittedQueryBuilderTree(newTree);
  };

  const buildQuery = () => {
    const query = inputQuery
      ? _.cloneDeep(inputQuery)
      : {
          bool: {
            must: []
          }
        };

    if (!query.bool) {
      query.bool = { must: [] };
    }
    if (!Array.isArray(query.bool.must)) {
      query.bool.must = [];
    }

    const rangeFilter = getDateRangeFilter();

    if (nestedQuery) {
      const nestedDateFilter: any = {
        nested: {
          path: nestedQuery.path,
          query: {
            bool: {
              must: []
            }
          }
        }
      };

      if (nestedQuery.typeField && nestedQuery.typeValue !== undefined) {
        nestedDateFilter.nested.query.bool.must.push({
          term: {
            [`${nestedQuery.path}.${nestedQuery.typeField}`]:
              nestedQuery.typeValue
          }
        });
      }

      if (rangeFilter) {
        nestedDateFilter.nested.query.bool.must.push(rangeFilter);
      }

      query.bool.must.push(nestedDateFilter);
    } else if (rangeFilter) {
      query.bool.must.push(rangeFilter);
    }

    const histogramAgg = {
      date_histogram: {
        field: dateFieldPath,
        calendar_interval: interval,
        format,
        order: { _key: "asc" }
      }
    };

    return nestedQuery
      ? {
          size: 0,
          query,
          aggs: {
            by_date: {
              nested: { path: "included" },
              aggs: nestedQuery.typeField
                ? {
                    filtered_by_type: {
                      filter: {
                        term: {
                          [`${nestedQuery.path}.${nestedQuery.typeField}`]:
                            nestedQuery.typeValue
                        }
                      },
                      aggs: {
                        date_histogram_agg: histogramAgg
                      }
                    }
                  }
                : {
                    date_histogram_agg: histogramAgg
                  }
            }
          }
        }
      : {
          size: 0,
          query,
          aggs: {
            by_date: histogramAgg
          }
        };
  };

  const getAggregationKey = (aggName: string, responseData: any): string => {
    if (responseData.aggregations[aggName]) {
      return aggName;
    }
    if (responseData.aggregations[`sterms#${aggName}`]) {
      return `sterms#${aggName}`;
    }

    for (const key of Object.keys(responseData.aggregations)) {
      if (key.endsWith(aggName)) {
        return key;
      }
    }

    return aggName;
  };

  const getBuckets = (responseData: any) => {
    if (!nestedQuery) {
      const aggKey = getAggregationKey("by_date", responseData);
      return responseData.aggregations[aggKey]?.buckets ?? [];
    }

    const nestedAgg = responseData.aggregations["nested#by_date"];

    if (nestedQuery.typeField) {
      return (
        nestedAgg?.["filter#filtered_by_type"]?.[
          "date_histogram#date_histogram_agg"
        ]?.buckets ?? []
      );
    }

    return nestedAgg?.["date_histogram#date_histogram_agg"]?.buckets ?? [];
  };

  const fetchData = async () => {
    const query = buildQuery();

    try {
      const response = await apiClient.axios.post(
        "search-api/search-ws/search",
        query,
        { params: { indexName } }
      );

      if (response.data.aggregations) {
        const buckets = getBuckets(response.data);
        setChartData(
          buckets.map((bucket: any) => ({
            name: bucket.key_as_string,
            value: bucket.doc_count
          }))
        );
      }
    } catch (error: any) {
      console.error(JSON.stringify(error));
      setChartData([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, [inputQuery, interval, format, dateRange, apiClient, indexName]);

  const handlePresetSelect = (key: string | null) => {
    if (!key) {
      return;
    }

    const preset = datePresets.find((presetItem) => presetItem.key === key);
    if (!preset) {
      return;
    }

    setSelectedPreset(key);
    setDateRange(preset.getDates());
    setInterval(preset.interval);
    setFormat(preset.format);
  };

  const getOptimalXAxisConfig = () => {
    const dataLength = chartData.length;

    if (dataLength === 0) {
      return {
        interval: 0,
        rotate: 0,
        fontSize: 11
      };
    }

    if (dataLength <= 7) {
      return {
        interval: 0,
        rotate: 0,
        fontSize: 12,
        margin: 10,
        color: "#666"
      };
    }

    if (dataLength <= 15) {
      return {
        interval: 0,
        rotate: 30,
        fontSize: 11,
        margin: 15,
        color: "#666",
        hideOverlap: false
      };
    }

    if (dataLength <= 31) {
      return {
        interval: 0,
        rotate: 45,
        fontSize: 10,
        margin: 20,
        overflow: "truncate",
        width: 80,
        hideOverlap: true,
        color: "#666"
      };
    }

    if (dataLength <= 60) {
      return {
        interval: "auto",
        rotate: 45,
        fontSize: 10,
        margin: 20,
        overflow: "truncate",
        width: 70,
        hideOverlap: true,
        color: "#666",
        showMaxLabel: true,
        showMinLabel: true
      };
    }

    return {
      interval: Math.floor(dataLength / 20),
      rotate: 45,
      fontSize: 9,
      margin: 20,
      overflow: "truncate",
      width: 60,
      hideOverlap: true,
      color: "#666",
      showMaxLabel: true,
      showMinLabel: true
    };
  };

  const options = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "shadow"
      },
      formatter: (params: any) => {
        const param = params[0];
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${
              param.name
            }</div>
            <div style="color: ${seriesColor};">
              Count: <strong>${param.value?.toLocaleString()}</strong>
            </div>
          </div>
        `;
      }
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: chartData.length > 15 ? "22%" : "15%",
      top: "10%",
      containLabel: true
    },
    xAxis: {
      type: "category",
      data: chartData.map((d) => d.name),
      axisLabel: {
        ...getOptimalXAxisConfig(),
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
      },
      axisTick: {
        alignWithLabel: true,
        lineStyle: {
          color: "#ddd"
        }
      },
      axisLine: {
        lineStyle: {
          color: "#e0e0e0"
        }
      }
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: {
        formatter: (value: number) => value.toLocaleString(),
        color: "#666",
        fontSize: 11
      },
      splitLine: {
        lineStyle: {
          type: "dashed",
          color: "#f0f0f0"
        }
      }
    },
    series: [
      {
        name: seriesName,
        type: "bar",
        data: chartData.map((d) => d.value),
        barMaxWidth: 50,
        itemStyle: {
          color: seriesColor,
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: seriesEmphasisColor,
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.2)"
          }
        }
      }
    ]
  };

  const currentPresetLabel =
    datePresets.find((preset) => preset.key === selectedPreset)?.label ||
    formatMessage("allTime");

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <strong className="d-block">
            {renderTitle(
              datePresets.find((preset) => preset.key === selectedPreset)
                ?.interval || "year"
            )}
            {addFilter && <Tooltip id={resolvedTooltipId} />}
          </strong>
        </div>
        <DropdownButton
          id={resolvedDropdownId}
          title={currentPresetLabel}
          onSelect={handlePresetSelect}
          variant="outline-primary"
          size="sm"
        >
          <Dropdown.Header>{menuSectionLabels.realTime}</Dropdown.Header>
          <Dropdown.Item
            eventKey="last-24-hours"
            active={selectedPreset === "last-24-hours"}
          >
            {datePresets.find((preset) => preset.key === "last-24-hours")
              ?.label || "Last 24 Hours"}
          </Dropdown.Item>

          <Dropdown.Divider />
          <Dropdown.Header>{menuSectionLabels.byDay}</Dropdown.Header>
          <Dropdown.Item
            eventKey="last-7-days"
            active={selectedPreset === "last-7-days"}
          >
            {formatMessage("last7days")}
          </Dropdown.Item>
          <Dropdown.Item
            eventKey="last-30-days"
            active={selectedPreset === "last-30-days"}
          >
            {formatMessage("last30days")}
          </Dropdown.Item>
          <Dropdown.Item
            eventKey="last-3-months"
            active={selectedPreset === "last-3-months"}
          >
            {formatMessage("last3months")}
          </Dropdown.Item>

          <Dropdown.Divider />
          <Dropdown.Header>{menuSectionLabels.byMonth}</Dropdown.Header>
          <Dropdown.Item
            eventKey="last-6-months"
            active={selectedPreset === "last-6-months"}
          >
            {formatMessage("last6months")}
          </Dropdown.Item>
          <Dropdown.Item
            eventKey="this-year"
            active={selectedPreset === "this-year"}
          >
            {formatMessage("thisYear")}
          </Dropdown.Item>
          <Dropdown.Item
            eventKey="last-year"
            active={selectedPreset === "last-year"}
          >
            {formatMessage("lastYear")}
          </Dropdown.Item>
          <Dropdown.Item
            eventKey="all-time-month"
            active={selectedPreset === "all-time-month"}
          >
            {formatMessage("allTime")}
          </Dropdown.Item>

          <Dropdown.Divider />
          <Dropdown.Header>{menuSectionLabels.byYear}</Dropdown.Header>
          <Dropdown.Item
            eventKey="all-time-year"
            active={selectedPreset === "all-time-year"}
          >
            {formatMessage("allTime")}
          </Dropdown.Item>
        </DropdownButton>
      </div>
      <Card>
        {chartData.length > 0 ? (
          <ReactECharts
            option={options}
            style={{ height: "400px", width: "100%" }}
            onEvents={addFilter ? { click: addClickToQuery } : {}}
          />
        ) : (
          <div
            style={{
              height: "400px",
              justifyContent: "center",
              alignItems: "center",
              display: "flex",
              color: "#999",
              fontSize: 18
            }}
          >
            {emptyStateLabel}
          </div>
        )}
      </Card>
    </div>
  );
}
