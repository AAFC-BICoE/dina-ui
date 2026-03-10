import { useEffect, useState } from "react";
import { useApiClient } from "common-ui";
import ReactECharts from "echarts-for-react";
import { DinaMessage } from "../../../intl/dina-ui-intl";
import { Dropdown, DropdownButton } from "react-bootstrap";

interface RecordsAddedChartProps {
  inputQuery?: any;
}

export default function RecordsAddedChart({
  inputQuery
}: RecordsAddedChartProps) {
  const { apiClient } = useApiClient();

  const [interval, setInterval] = useState("month");
  const [format, setFormat] = useState("yyyy-MM");
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>(
    {}
  );
  const [selectedPreset, setSelectedPreset] = useState("all-time");

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
      interval: "week",
      format: "yyyy-ww",
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
      key: "all-time",
      label: "All Time",
      interval: "year",
      format: "yyyy",
      getDates: () => ({
        start: undefined,
        end: undefined
      })
    }
  ];

  const buildQuery = () => {
    const query = inputQuery ?? {
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
              Count: <strong>${param.value.toLocaleString()}</strong>
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

  return chartData.length != 0 ? (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <strong className="d-block mb-1">
            <DinaMessage id="collectionRecordAddedChartTitle" />
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
            <DinaMessage id="dateRangeHeaderRecent" />
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

          <Dropdown.Divider />
          <Dropdown.Header>
            <DinaMessage id="dateRangeHeaderByMonth" />
          </Dropdown.Header>
          <Dropdown.Item
            eventKey="last-3-months"
            active={selectedPreset === "last-3-months"}
          >
            <DinaMessage id="dateRangeLast3MonthsDropdown" />
          </Dropdown.Item>
          <Dropdown.Item
            eventKey="last-6-months"
            active={selectedPreset === "last-6-months"}
          >
            <DinaMessage id="dateRangeLast6MonthsDropdown" />
          </Dropdown.Item>

          <Dropdown.Divider />
          <Dropdown.Header>
            <DinaMessage id="dateRangeHeaderByYear" />
          </Dropdown.Header>
          <Dropdown.Item
            eventKey="year-to-date"
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

          <Dropdown.Divider />
          <Dropdown.Item
            eventKey="all-time"
            active={selectedPreset === "all-time"}
          >
            <DinaMessage id="dateRangeAllTimeDropdown" />
          </Dropdown.Item>
        </DropdownButton>
      </div>

      <ReactECharts
        option={options}
        style={{ height: "400px", width: "100%" }}
      />
    </div>
  ) : null;
}
