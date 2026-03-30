import { useEffect, useState } from "react";
import { useApiClient } from "common-ui";
import ReactECharts from "echarts-for-react";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { Dropdown, DropdownButton, Card } from "react-bootstrap";
import _ from "lodash";
import { Utils } from "@react-awesome-query-builder/ui";

interface RecordsAddedChartProps {
  /**
   * The query object from the parent component, used as the base query for fetching data for the chart. This allows the chart to reflect any filters applied in the parent component. The component will add additional filters based on the selected date range preset and bar clicks to this input query when fetching data.
   */
  inputQuery?: any;

  /**
   * Whether to add a filter to the parent query when clicking on a bar in the chart. If true, clicking a bar will add a filter for the corresponding date value to the query builder tree in the parent component. This requires passing down the queryBuilderTree and setQueryBuilderTree props as well.
   */
  addFilter?: boolean;

  /**
   * queryBuilderTree state setter from the parent component, needed to add filter on bar click
   */
  setQueryBuilderTree?: any;
  /**
   * queryBuilderTree state value from the parent component, needed to add filter on bar click
   */
  queryBuilderTree?: any;

  /**
   * submittedQueryBuilderTree state setter from the parent component, needed to add filter on bar click
   */
  setSubmittedQueryBuilderTree?: any;
}

/**
 * RecordsAddedChart component.
 *
 * Renders a chart displaying records added,
 * supporting custom input queries, additional filters,
 * and integration with a Query Builder UI.
 *
 * @param {Object} props - Component props.
 * @param {any} props.inputQuery - The query object from the parent component, used as the base query for fetching data for the chart. This allows the chart to reflect any filters applied in the parent component. The component will add additional filters based on the selected date range preset to this input query when fetching data.
 * @param {Function} props.addFilter - Whether to add a filter to the parent query when clicking on a bar in the chart. If true, clicking a bar will add a filter for the corresponding date value to the query builder tree in the parent component. This requires passing down the queryBuilderTree and setQueryBuilderTree props as well.
 * @param {Function} props.setQueryBuilderTree - queryBuilderTree state setter from the parent component, needed to add filter on bar click
 * @param {any} props.queryBuilderTree - queryBuilderTree state value from the parent component, needed to add filter on bar click
 * @param {Function} props.setSubmittedQueryBuilderTree - submittedQueryBuilderTree state setter from the parent component, needed to add filter on bar click
 * @returns {JSX.Element} The rendered chart component.
 */
export default function RecordsAddedChart({
  inputQuery,
  addFilter,
  setQueryBuilderTree,
  queryBuilderTree,
  setSubmittedQueryBuilderTree
}: RecordsAddedChartProps) {
  const { apiClient } = useApiClient();

  const [interval, setInterval] = useState("month");
  const [format, setFormat] = useState("yyyy-MM");
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>(
    {}
  );
  const [selectedPreset, setSelectedPreset] = useState("all-time-year");

  const datePresets = [
    {
      key: "last-24-hours",
      label: "Last 24 Hours",
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
      label: "Last 7 Days",
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
      label: "Last 30 Days",
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
      label: "Last 3 Months",
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
      label: "Last 6 Months",
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
      label: "This Year",
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
      label: "Last Year",
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
      label: "All Time",
      interval: "month",
      format: "yyyy-MM",
      getDates: () => ({
        start: undefined,
        end: undefined
      })
    },
    {
      key: "all-time-year",
      label: "All Time",
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

    /**
     * Helper function to create a rule based on the selected date preset and the clicked date value. It handles different intervals (hour, day, month, year) and constructs the appropriate rule for filtering the query.
     * @param selectedPreset selected date preset key
     * @param dateStr date string from the clicked bar (format depends on the preset's interval)
     * @returns new rule object to be added to the query builder tree
     */
    function createDateRule(selectedPreset: string, dateStr: string): any {
      // get the preset object based on the selected preset key
      const preset = datePresets.find((p) => p.key === selectedPreset);

      // For hour and day intervals, we can filter for an exact match on the createdOn field.
      // For month and year intervals, we filter on a range that covers the entire month or year.
      if (preset?.interval === "day" || preset?.interval === "hour") {
        const dateArr = dateStr.split("-");
        const year = parseInt(dateArr[0], 10);
        const month = parseInt(dateArr[1], 10) - 1;
        const day = parseInt(dateArr[2], 10);

        // Remove time component from date
        const date = new Date(year, month, day).toISOString().split("T")[0];
        return {
          id: Utils.uuid(),
          type: "rule",
          properties: {
            field: "data.attributes.createdOn",
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
            field: "data.attributes.createdOn",
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
            field: "data.attributes.createdOn",
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

    // queryTree should come with group filter already, create children1 just in case it doesn't.
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

    if (dateRange.start || dateRange.end) {
      const rangeFilter: any = {
        range: {
          "data.attributes.createdOn": {}
        }
      };

      if (dateRange.start) {
        rangeFilter.range["data.attributes.createdOn"].gte = dateRange.start;
      }
      if (dateRange.end) {
        rangeFilter.range["data.attributes.createdOn"].lte = dateRange.end;
      }

      query.bool.must.push(rangeFilter);
    }

    return {
      size: 0,
      query,
      aggs: {
        by_date: {
          date_histogram: {
            field: "data.attributes.createdOn",
            calendar_interval: interval,
            format: format,
            order: { _key: "asc" }
          }
        }
      }
    };
  };

  const getAggregationKey = (aggName: string, response: any): string => {
    if (response.aggregations[aggName]) {
      return aggName;
    }
    if (response.aggregations[`sterms#${aggName}`]) {
      return `sterms#${aggName}`;
    }

    for (const key of Object.keys(response.aggregations)) {
      if (key.endsWith(aggName)) {
        return key;
      }
    }

    return aggName;
  };

  async function fetchData() {
    const query = buildQuery();

    try {
      const response = await apiClient.axios.post(
        "search-api/search-ws/search",
        query,
        { params: { indexName: "dina_material_sample_index" } }
      );
      if (response.data.aggregations) {
        const aggKey = getAggregationKey("by_date", response.data);
        const buckets = response.data.aggregations[aggKey]?.buckets ?? [];

        setChartData(
          buckets.map((b) => ({ name: b.key_as_string, value: b.doc_count }))
        );
      }
    } catch (error: any) {
      console.error(JSON.stringify(error));
      setChartData([]);
      return;
    }
  }

  const [chartData, setChartData] = useState<{ name: string; value: number }[]>(
    []
  );

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
      // Very large datasets - show fewer labels
      return {
        interval: Math.floor(dataLength / 20), // ~20 labels max
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
        name: "Sample Count",
        type: "bar",
        data: chartData.map((d) => d.value),
        barMaxWidth: 50,
        itemStyle: {
          color: "#5470c6",
          borderRadius: [4, 4, 0, 0]
        },
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

  // Show different chart title based on the selected date preset's interval
  function chartTitle(format: string) {
    switch (format) {
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
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <strong className="d-block">
            {chartTitle(
              datePresets.find((p) => p.key === selectedPreset)?.interval || ""
            )}
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
