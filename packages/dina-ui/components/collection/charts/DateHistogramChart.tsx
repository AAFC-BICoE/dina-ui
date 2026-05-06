import { useEffect, useState } from "react";
import { useApiClient, Tooltip } from "common-ui";
import ReactECharts from "echarts-for-react";
import { DinaMessage, useDinaIntl } from "../../../intl/dina-ui-intl";
import { Dropdown, DropdownButton, Card } from "react-bootstrap";
import _ from "lodash";
import { Utils } from "@react-awesome-query-builder/ui";

interface NestedConfig {
  /** The path for the nested query/aggregation (e.g. "included") */
  path: string;
  /** Field for the type filter (e.g. "included.type") */
  typeField: string;
  /** Value for the type filter (e.g. "collecting-event") */
  typeValue: string;
}

export interface DateHistogramChartProps {
  /**
   * The query object from the parent component, used as the base query for fetching data for
   * the chart. The component will add additional filters based on the selected date range preset
   * to this input query when fetching data.
   */
  inputQuery?: any;

  /**
   * Whether to add a filter to the parent query when clicking on a bar in the chart.
   */
  addFilter?: boolean;

  /** queryBuilderTree state setter from the parent component, needed to add filter on bar click */
  setQueryBuilderTree?: any;

  /** queryBuilderTree state value from the parent component, needed to add filter on bar click */
  queryBuilderTree?: any;

  /** submittedQueryBuilderTree state setter from the parent component, needed to add filter on bar click */
  setSubmittedQueryBuilderTree?: any;

  /** The Elasticsearch field path to aggregate on (e.g. "data.attributes.createdOn") */
  field: string;

  /**
   * The field name to inject into the query builder tree when a bar is clicked
   * (e.g. "data.attributes.createdOn" or "collectingEvent.startEventDateTime")
   */
  queryBuilderField: string;

  /** Default calendar interval. Defaults to "year". */
  defaultInterval?: string;

  /** Default date format. Defaults to "yyyy". */
  defaultFormat?: string;

  /** Default preset key. Defaults to "all-time-year". */
  defaultPreset?: string;

  /**
   * Returns a ReactNode to render as the chart title for the given interval string.
   * Called with the current interval (e.g. "year", "month", "day", "hour").
   */
  getChartTitle: (interval: string) => React.ReactNode;

  /**
   * When provided, wraps the date filter and aggregation in a nested Elasticsearch context.
   * Use this when the target field lives inside a nested object (e.g. collecting events in
   * the "included" path).
   */
  nested?: NestedConfig;
}

/**
 * DateHistogramChart component.
 *
 * Generic reusable histogram for any date field. Handles both flat and nested Elasticsearch
 * query/aggregation structures. Supports date range presets and click-to-filter integration
 * with a Query Builder UI.
 */
export default function DateHistogramChart({
  inputQuery,
  addFilter,
  setQueryBuilderTree,
  queryBuilderTree,
  setSubmittedQueryBuilderTree,
  field,
  queryBuilderField,
  defaultInterval = "year",
  defaultFormat = "yyyy",
  defaultPreset = "all-time-year",
  getChartTitle,
  nested
}: DateHistogramChartProps) {
  const { apiClient } = useApiClient();

  const { formatMessage } = useDinaIntl();
  const [interval, setInterval] = useState(defaultInterval);
  const [format, setFormat] = useState(defaultFormat);
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>(
    {}
  );
  const [selectedPreset, setSelectedPreset] = useState(defaultPreset);

  const datePresets = [
    {
      key: "last-24-hours",
      label: formatMessage("last24hours"),
      interval: "hour",
      format: "yyyy-MM-dd HH:00",
      getDates: () => {
        const now = new Date();
        const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        return {
          start: start.toISOString(),
          end: now.toISOString()
        };
      }
    },
    {
      key: "last-7-days",
      label: formatMessage("last7days"),
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
      label: formatMessage("last30days"),
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
      label: formatMessage("last3months"),
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
      label: formatMessage("last6months"),
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
      label: formatMessage("thisYear"),
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
      label: formatMessage("lastYear"),
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
      label: formatMessage("allTime"),
      interval: "month",
      format: "yyyy-MM",
      getDates: () => ({
        start: undefined,
        end: undefined
      })
    },
    {
      key: "all-time-year",
      label: formatMessage("allTime"),
      interval: "year",
      format: "yyyy",
      getDates: () => ({
        start: undefined,
        end: undefined
      })
    }
  ];

  const addClickToQuery = (params: { name: string }) => {
    if (!queryBuilderTree || !setQueryBuilderTree) return;

    const jsonTree = _.cloneDeep(Utils.getTree(queryBuilderTree));

    function createDateRule(presetKey: string, dateStr: string): any {
      const preset = datePresets.find((p) => p.key === presetKey);

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
            field: queryBuilderField,
            operator: "equals",
            value: [date],
            valueSrc: ["value"],
            valueType: ["date"],
            valueError: [],
            fieldError: undefined,
            fieldSrc: "field"
          }
        };
      } else if (preset?.interval === "month") {
        const dateArr = dateStr.split("-");
        const year = parseInt(dateArr[0], 10);
        const month = parseInt(dateArr[1], 10) - 1;
        const start = new Date(year, month, 1).toISOString().split("T")[0];
        const end = new Date(year, month + 1, 0).toISOString().split("T")[0];
        return {
          id: Utils.uuid(),
          type: "rule",
          properties: {
            field: queryBuilderField,
            operator: "between",
            value: [`{ "low": "${start}", "high": "${end}" }`],
            valueSrc: ["value"],
            valueType: ["date"],
            valueError: [],
            fieldError: undefined,
            fieldSrc: "field"
          }
        };
      } else {
        const year = parseInt(dateStr, 10);
        const start = new Date(year, 0, 1).toISOString().split("T")[0];
        const end = new Date(year, 11, 31).toISOString().split("T")[0];
        return {
          id: Utils.uuid(),
          type: "rule",
          properties: {
            field: queryBuilderField,
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
    }

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
    const query = inputQuery ? _.cloneDeep(inputQuery) : { bool: { must: [] } };

    if (!query.bool.must) {
      query.bool.must = [];
    }

    if (nested) {
      // Nested query: wrap the type filter (and optional date range) in a nested context
      const nestedFilter: any = {
        nested: {
          path: nested.path,
          query: {
            bool: {
              must: [{ term: { [nested.typeField]: nested.typeValue } }]
            }
          }
        }
      };

      if (dateRange.start || dateRange.end) {
        const rangeFilter: any = { range: { [field]: {} } };
        if (dateRange.start) rangeFilter.range[field].gte = dateRange.start;
        if (dateRange.end) rangeFilter.range[field].lte = dateRange.end;
        nestedFilter.nested.query.bool.must.push(rangeFilter);
      }

      query.bool.must.push(nestedFilter);
    } else {
      // Flat query: add a simple date range filter
      if (dateRange.start || dateRange.end) {
        const rangeFilter: any = { range: { [field]: {} } };
        if (dateRange.start) rangeFilter.range[field].gte = dateRange.start;
        if (dateRange.end) rangeFilter.range[field].lte = dateRange.end;
        query.bool.must.push(rangeFilter);
      }
    }

    const aggs = nested
      ? {
          by_date: {
            nested: { path: nested.path },
            aggs: {
              filtered_by_type: {
                filter: { term: { [nested.typeField]: nested.typeValue } },
                aggs: {
                  date_histogram_agg: {
                    date_histogram: {
                      field,
                      calendar_interval: interval,
                      format,
                      order: { _key: "asc" }
                    }
                  }
                }
              }
            }
          }
        }
      : {
          by_date: {
            date_histogram: {
              field,
              calendar_interval: interval,
              format,
              order: { _key: "asc" }
            }
          }
        };

    return { size: 0, query, aggs };
  };

  /** Finds a key in an aggregation object, handling type-prefixed keys like nested#name */
  function findAggKey(obj: Record<string, any>, aggName: string): string {
    if (obj[aggName]) return aggName;
    const match = Object.keys(obj).find((k) => k.endsWith(`#${aggName}`));
    return match ?? aggName;
  }

  const [chartData, setChartData] = useState<{ name: string; value: number }[]>(
    []
  );

  async function fetchData() {
    const query = buildQuery();
    try {
      const response = await apiClient.axios.post(
        "search-api/search-ws/search",
        query,
        { params: { indexName: "dina_material_sample_index" } }
      );
      if (response.data.aggregations) {
        const aggs = response.data.aggregations;
        let buckets: any[];

        if (nested) {
          const byDateAgg = aggs[findAggKey(aggs, "by_date")];
          const filteredByType =
            byDateAgg?.[findAggKey(byDateAgg ?? {}, "filtered_by_type")];
          const histAgg =
            filteredByType?.[
              findAggKey(filteredByType ?? {}, "date_histogram_agg")
            ];
          buckets = histAgg?.buckets ?? [];
        } else {
          const byDate = aggs[findAggKey(aggs, "by_date")];
          buckets = byDate?.buckets ?? [];
        }

        setChartData(
          buckets.map((b) => ({ name: b.key_as_string, value: b.doc_count }))
        );
      }
    } catch (error: any) {
      console.error(JSON.stringify(error));
      setChartData([]);
    }
  }

  useEffect(() => {
    fetchData();
  }, [inputQuery, interval, format, dateRange, apiClient]);

  const handlePresetSelect = (key: string | null) => {
    if (key) {
      const preset = datePresets.find((p) => p.key === key);
      if (preset) {
        setSelectedPreset(key);
        setDateRange(preset.getDates());
        setInterval(preset.interval);
        setFormat(preset.format);
      }
    }
  };

  const getOptimalXAxisConfig = () => {
    const dataLength = chartData.length;

    if (dataLength === 0) {
      return { interval: 0, rotate: 0, fontSize: 11 };
    }
    if (dataLength <= 7) {
      return {
        interval: 0,
        rotate: 0,
        fontSize: 12,
        margin: 10,
        color: "#666"
      };
    } else if (dataLength <= 15) {
      return {
        interval: 0,
        rotate: 30,
        fontSize: 11,
        margin: 15,
        color: "#666",
        hideOverlap: false
      };
    } else if (dataLength <= 31) {
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
    } else if (dataLength <= 60) {
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
    } else {
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
    }
  };

  const options = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: any) => {
        const param = params[0];
        return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">${
              param.name
            }</div>
            <div style="color: #5470c6;">
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
      axisTick: { alignWithLabel: true, lineStyle: { color: "#ddd" } },
      axisLine: { lineStyle: { color: "#e0e0e0" } }
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: {
        formatter: (value: number) => value.toLocaleString(),
        color: "#666",
        fontSize: 11
      },
      splitLine: { lineStyle: { type: "dashed", color: "#f0f0f0" } }
    },
    series: [
      {
        name: "Sample Count",
        type: "bar",
        data: chartData.map((d) => d.value),
        barMaxWidth: 50,
        itemStyle: { color: "#5470c6", borderRadius: [4, 4, 0, 0] },
        emphasis: {
          itemStyle: {
            color: "#3b5998",
            shadowBlur: 10,
            shadowColor: "rgba(0, 0, 0, 0.2)"
          }
        }
      }
    ]
  };

  const currentPresetLabel =
    datePresets.find((p) => p.key === selectedPreset)?.label || "All Time";

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <strong className="d-block">
            {getChartTitle(
              datePresets.find((p) => p.key === selectedPreset)?.interval || ""
            )}
            {addFilter && <Tooltip id="addFilterTooltip" />}
          </strong>
        </div>
        <DropdownButton
          id="date-preset-dropdown"
          title={currentPresetLabel}
          onSelect={handlePresetSelect}
          variant="outline-primary"
          size="sm"
        >
          <Dropdown.Header>
            <DinaMessage id="dateRangeHeaderRealTime" />
          </Dropdown.Header>
          <Dropdown.Item
            eventKey="last-24-hours"
            active={selectedPreset === "last-24-hours"}
          >
            <DinaMessage id="dateRangeLast24HoursDropdown" />
          </Dropdown.Item>

          <Dropdown.Divider />
          <Dropdown.Header>
            <DinaMessage id="dateRangeHeaderByDay" />
          </Dropdown.Header>
          <Dropdown.Item
            eventKey="last-7-days"
            active={selectedPreset === "last-7-days"}
          >
            <DinaMessage id="dateRangeLast7DaysDropdown" />
          </Dropdown.Item>
          <Dropdown.Item
            eventKey="last-30-days"
            active={selectedPreset === "last-30-days"}
          >
            <DinaMessage id="dateRangeLast30DaysDropdown" />
          </Dropdown.Item>
          <Dropdown.Item
            eventKey="last-3-months"
            active={selectedPreset === "last-3-months"}
          >
            <DinaMessage id="dateRangeLast3MonthsDropdown" />
          </Dropdown.Item>

          <Dropdown.Divider />
          <Dropdown.Header>
            <DinaMessage id="dateRangeHeaderByMonth" />
          </Dropdown.Header>
          <Dropdown.Item
            eventKey="last-6-months"
            active={selectedPreset === "last-6-months"}
          >
            <DinaMessage id="dateRangeLast6MonthsDropdown" />
          </Dropdown.Item>
          <Dropdown.Item
            eventKey="this-year"
            active={selectedPreset === "this-year"}
          >
            <DinaMessage id="dateRangeThisYearDropdown" />
          </Dropdown.Item>
          <Dropdown.Item
            eventKey="last-year"
            active={selectedPreset === "last-year"}
          >
            <DinaMessage id="dateRangeLastYearDropdown" />
          </Dropdown.Item>
          <Dropdown.Item
            eventKey="all-time-month"
            active={selectedPreset === "all-time-month"}
          >
            <DinaMessage id="dateRangeAllTimeDropdown" />
          </Dropdown.Item>

          <Dropdown.Divider />
          <Dropdown.Header>
            <DinaMessage id="dateRangeHeaderByYear" />
          </Dropdown.Header>
          <Dropdown.Item
            eventKey="all-time-year"
            active={selectedPreset === "all-time-year"}
          >
            <DinaMessage id="dateRangeAllTimeDropdown" />
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
            <DinaMessage id="noData" />
          </div>
        )}
      </Card>
    </div>
  );
}
